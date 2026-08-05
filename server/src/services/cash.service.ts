import { Prisma, CashMovementType, CashShiftStatus, Role, NotificationType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import { parsePagination, paginatedResponse } from "../utils/pagination";
import { createNotification } from "./notification.service";
import type {
  OpenShiftInput,
  CloseShiftInput,
  CreateWithdrawalInput,
  ListShiftsQuery,
  ListCashMovementsQuery,
  CashSummaryQuery,
} from "../schemas/cash.schema";

export const CASH_REGISTER_ID = "singleton";

const SHIFT_INCLUDE = {
  openedBy: { select: { id: true, name: true } },
  closedBy: { select: { id: true, name: true } },
};

const MOVEMENT_INCLUDE = {
  user: { select: { id: true, name: true } },
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Lazily creates the singleton cash register row, mirroring settings.service.getSettings. */
export async function getOrCreateRegister(tx: Prisma.TransactionClient) {
  return tx.cashRegister.upsert({
    where: { id: CASH_REGISTER_ID },
    update: {},
    create: { id: CASH_REGISTER_ID },
  });
}

export async function getStatus(userId: string) {
  const register = await getOrCreateRegister(prisma);
  const myOpenShift = await prisma.cashShift.findFirst({
    where: { openedById: userId, status: CashShiftStatus.OPEN },
    orderBy: { openedAt: "desc" },
    include: SHIFT_INCLUDE,
  });
  return { currentBalance: register.currentBalance, myOpenShift };
}

export async function openShift(input: OpenShiftInput, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  const shift = await prisma.$transaction(async (tx) => {
    const existing = await tx.cashShift.findFirst({
      where: { openedById: userId, status: CashShiftStatus.OPEN },
    });
    if (existing) throw ApiError.conflict("Ya tienes un turno de caja abierto");

    const register = await getOrCreateRegister(tx);
    const openingExpected = Number(register.currentBalance);
    const openingDiscrepancy = input.countedAmount - openingExpected;

    return tx.cashShift.create({
      data: {
        openedById: userId,
        openingCounted: input.countedAmount,
        openingExpected,
        openingDiscrepancy,
        note: input.note || null,
      },
      include: SHIFT_INCLUDE,
    });
  });

  // Notificación al administrador
  await createNotification(
    NotificationType.SHIFT_OPEN,
    "Apertura de turno de caja",
    `${user?.name || "Un usuario"} ha abierto su turno de caja con $${input.countedAmount}.`,
    { shiftId: shift.id, userId, countedAmount: input.countedAmount },
  );

  return shift;
}

export async function closeShift(shiftId: string, input: CloseShiftInput, requesterId: string, requesterRole: Role) {
  const user = await prisma.user.findUnique({ where: { id: requesterId } });

  const shift = await prisma.$transaction(async (tx) => {
    const target = await tx.cashShift.findUnique({ where: { id: shiftId } });
    if (!target) throw ApiError.notFound("Turno no encontrado");
    if (target.status === CashShiftStatus.CLOSED) throw ApiError.badRequest("El turno ya está cerrado");
    if (target.openedById !== requesterId && requesterRole !== Role.ADMIN) {
      throw ApiError.forbidden("Solo el dueño del turno o un administrador pueden cerrarlo");
    }

    const register = await getOrCreateRegister(tx);
    const closingExpected = Number(register.currentBalance);
    const closingDiscrepancy = input.countedAmount - closingExpected;

    return tx.cashShift.update({
      where: { id: shiftId },
      data: {
        status: CashShiftStatus.CLOSED,
        closedById: requesterId,
        closedAt: new Date(),
        closingCounted: input.countedAmount,
        closingExpected,
        closingDiscrepancy,
        note: input.note || target.note,
      },
      include: SHIFT_INCLUDE,
    });
  });

  // Notificación al administrador
  const discrepancyText = shift.closingDiscrepancy
    ? ` (Diferencia: $${Number(shift.closingDiscrepancy)})`
    : "";

  await createNotification(
    NotificationType.SHIFT_CLOSE,
    "Cierre de turno de caja",
    `${user?.name || "Un usuario"} ha cerrado el turno de caja. Conteo final: $${input.countedAmount}${discrepancyText}.`,
    { shiftId: shift.id, requesterId, countedAmount: input.countedAmount, discrepancy: shift.closingDiscrepancy },
  );

  return shift;
}

function buildShiftWhere(query: ListShiftsQuery): Prisma.CashShiftWhereInput {
  const where: Prisma.CashShiftWhereInput = {};
  if (query.userId) where.openedById = query.userId;
  if (query.status) where.status = query.status;
  if (query.from || query.to) {
    where.openedAt = {};
    if (query.from) where.openedAt.gte = new Date(query.from);
    if (query.to) where.openedAt.lte = new Date(query.to);
  }
  return where;
}

export async function listShifts(query: ListShiftsQuery) {
  const where = buildShiftWhere(query);
  const pagination = parsePagination(query);

  const [items, total] = await Promise.all([
    prisma.cashShift.findMany({
      where,
      include: SHIFT_INCLUDE,
      orderBy: { openedAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.cashShift.count({ where }),
  ]);

  return paginatedResponse(items, total, pagination);
}

export async function createWithdrawal(input: CreateWithdrawalInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    await getOrCreateRegister(tx);

    // Atomic conditional decrement — same pattern as stock.service.ts's OUT movement:
    // avoids the read-then-write race where two concurrent withdrawals could both pass
    // a stale balance check and drive the register negative.
    const result = await tx.cashRegister.updateMany({
      where: { id: CASH_REGISTER_ID, currentBalance: { gte: input.amount } },
      data: { currentBalance: { decrement: input.amount } },
    });
    if (result.count === 0) {
      const fresh = await tx.cashRegister.findUnique({ where: { id: CASH_REGISTER_ID } });
      throw ApiError.badRequest(
        `Saldo insuficiente en caja. Disponible: ${fresh?.currentBalance ?? 0}, solicitado: ${input.amount}`,
      );
    }

    const fresh = await tx.cashRegister.findUnique({ where: { id: CASH_REGISTER_ID } });
    const balanceAfter = Number(fresh!.currentBalance);
    const balanceBefore = balanceAfter + input.amount;

    return tx.cashMovement.create({
      data: {
        type: CashMovementType.WITHDRAWAL,
        amount: input.amount,
        balanceBefore,
        balanceAfter,
        userId,
        note: input.note,
      },
      include: MOVEMENT_INCLUDE,
    });
  });
}

function buildMovementWhere(query: ListCashMovementsQuery): Prisma.CashMovementWhereInput {
  const where: Prisma.CashMovementWhereInput = {};
  if (query.type) where.type = query.type;
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = new Date(query.from);
    if (query.to) where.createdAt.lte = new Date(query.to);
  }
  return where;
}

export async function listCashMovements(query: ListCashMovementsQuery) {
  const where = buildMovementWhere(query);
  const pagination = parsePagination(query);

  const [items, total] = await Promise.all([
    prisma.cashMovement.findMany({
      where,
      include: MOVEMENT_INCLUDE,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.cashMovement.count({ where }),
  ]);

  return paginatedResponse(items, total, pagination);
}

export async function listWithdrawals(query: ListCashMovementsQuery) {
  return listCashMovements({ ...query, type: "WITHDRAWAL" });
}

export async function getCashSummary(query: CashSummaryQuery) {
  const from = query.from ? new Date(query.from) : startOfDay(new Date());
  const to = query.to ? new Date(query.to) : new Date();

  const grouped = await prisma.cashMovement.groupBy({
    by: ["type"],
    where: { createdAt: { gte: from, lte: to } },
    _sum: { amount: true },
  });

  const salesInToday = Number(grouped.find((g) => g.type === CashMovementType.SALE_IN)?._sum.amount ?? 0);
  const withdrawalsToday = Number(grouped.find((g) => g.type === CashMovementType.WITHDRAWAL)?._sum.amount ?? 0);
  const register = await getOrCreateRegister(prisma);

  return {
    currentBalance: Number(register.currentBalance),
    salesInToday,
    withdrawalsToday,
  };
}
