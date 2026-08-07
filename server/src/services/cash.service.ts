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
export async function getOrCreateRegister(tx: Prisma.TransactionClient, localId: string) {
  return tx.cashRegister.upsert({
    where: { localId },
    update: {},
    create: { localId },
  });
}

export async function getStatus(localId: string | null | undefined, userId: string) {
  if (!localId) return { currentBalance: 0, myOpenShift: null };
  const register = await getOrCreateRegister(prisma, localId);
  const myOpenShift = await prisma.cashShift.findFirst({
    where: { localId, openedById: userId, status: CashShiftStatus.OPEN },
    orderBy: { openedAt: "desc" },
    include: SHIFT_INCLUDE,
  });
  return { currentBalance: register.currentBalance, myOpenShift };
}

export async function openShift(localId: string | null | undefined, input: OpenShiftInput, userId: string) {
  if (!localId) throw ApiError.badRequest("Debe estar asociado a un local");
  const user = await prisma.user.findUnique({ where: { id: userId } });

  const shift = await prisma.$transaction(async (tx) => {
    const existing = await tx.cashShift.findFirst({
      where: { localId, openedById: userId, status: CashShiftStatus.OPEN },
    });
    if (existing) throw ApiError.conflict("Ya tienes un turno de caja abierto");

    const register = await getOrCreateRegister(tx, localId);
    const openingExpected = Number(register.currentBalance);
    const openingDiscrepancy = input.countedAmount - openingExpected;

    return tx.cashShift.create({
      data: {
        localId,
        openedById: userId,
        openingCounted: input.countedAmount,
        openingExpected,
        openingDiscrepancy,
        note: input.note || null,
      },
      include: SHIFT_INCLUDE,
    });
  });

  await createNotification(
    localId,
    NotificationType.SHIFT_OPEN,
    "Apertura de turno de caja",
    `${user?.name || "Un usuario"} ha abierto su turno de caja con $${input.countedAmount}.`,
    { shiftId: shift.id, userId, countedAmount: input.countedAmount },
  );

  return shift;
}

export async function closeShift(localId: string | null | undefined, shiftId: string, input: CloseShiftInput, requesterId: string, requesterRole: Role) {
  if (!localId) throw ApiError.badRequest("Debe estar asociado a un local");
  const user = await prisma.user.findUnique({ where: { id: requesterId } });

  const shift = await prisma.$transaction(async (tx) => {
    const target = await tx.cashShift.findFirst({ where: { id: shiftId, localId } });
    if (!target) throw ApiError.notFound("Turno no encontrado");
    if (target.status === CashShiftStatus.CLOSED) throw ApiError.badRequest("El turno ya está cerrado");
    if (target.openedById !== requesterId && requesterRole !== Role.ADMIN) {
      throw ApiError.forbidden("Solo el dueño del turno o un administrador pueden cerrarlo");
    }

    const register = await getOrCreateRegister(tx, localId);
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

  await createNotification(
    localId,
    NotificationType.SHIFT_CLOSE,
    "Cierre de turno de caja",
    `${user?.name || "Un usuario"} ha cerrado su turno de caja. Conteo: $${input.countedAmount}, esperado: $${shift.closingExpected}.`,
    { shiftId: shift.id, userId: requesterId, countedAmount: input.countedAmount },
  );

  return shift;
}

function buildShiftWhere(localId: string | null | undefined, query: ListShiftsQuery): Prisma.CashShiftWhereInput {
  const where: Prisma.CashShiftWhereInput = {
    ...(localId ? { localId } : {}),
  };
  if (query.userId) where.openedById = query.userId;
  if (query.status) where.status = query.status;
  if (query.from || query.to) {
    where.openedAt = {};
    if (query.from) where.openedAt.gte = new Date(query.from);
    if (query.to) where.openedAt.lte = new Date(query.to);
  }
  return where;
}

export async function listShifts(localId: string | null | undefined, query: ListShiftsQuery) {
  const where = buildShiftWhere(localId, query);
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

export async function createWithdrawal(localId: string | null | undefined, input: CreateWithdrawalInput, userId: string) {
  if (!localId) throw ApiError.badRequest("Debe estar asociado a un local");
  return prisma.$transaction(async (tx) => {
    const register = await getOrCreateRegister(tx, localId);

    const result = await tx.cashRegister.updateMany({
      where: { id: register.id, currentBalance: { gte: input.amount } },
      data: { currentBalance: { decrement: input.amount } },
    });
    if (result.count === 0) {
      const fresh = await tx.cashRegister.findUnique({ where: { id: register.id } });
      throw ApiError.badRequest(
        `Saldo insuficiente en caja. Disponible: ${fresh?.currentBalance ?? 0}, solicitado: ${input.amount}`,
      );
    }

    const fresh = await tx.cashRegister.findUnique({ where: { id: register.id } });
    const balanceAfter = Number(fresh!.currentBalance);
    const balanceBefore = balanceAfter + input.amount;

    return tx.cashMovement.create({
      data: {
        localId,
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

function buildMovementWhere(localId: string | null | undefined, query: ListCashMovementsQuery): Prisma.CashMovementWhereInput {
  const where: Prisma.CashMovementWhereInput = {
    ...(localId ? { localId } : {}),
  };
  if (query.type) where.type = query.type;
  if (query.userId) where.userId = query.userId;
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = new Date(query.from);
    if (query.to) where.createdAt.lte = new Date(query.to);
  }
  return where;
}

export async function listCashMovements(localId: string | null | undefined, query: ListCashMovementsQuery) {
  const where = buildMovementWhere(localId, query);
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

export async function listWithdrawals(localId: string | null | undefined, query: ListCashMovementsQuery) {
  return listCashMovements(localId, { ...query, type: "WITHDRAWAL" });
}

export async function getSummary(localId: string | null | undefined, query: CashSummaryQuery) {
  if (!localId) return { currentBalance: 0, salesInToday: 0, withdrawalsToday: 0 };
  const targetDate = query.date ? new Date(query.date) : new Date();
  const from = startOfDay(targetDate);
  const to = new Date(from);
  to.setHours(23, 59, 59, 999);

  const grouped = await prisma.cashMovement.groupBy({
    by: ["type"],
    where: { localId, createdAt: { gte: from, lte: to } },
    _sum: { amount: true },
  });

  const salesInToday = Number(grouped.find((g) => g.type === CashMovementType.SALE_IN)?._sum.amount ?? 0);
  const withdrawalsToday = Number(grouped.find((g) => g.type === CashMovementType.WITHDRAWAL)?._sum.amount ?? 0);
  const register = await getOrCreateRegister(prisma, localId);

  return {
    currentBalance: Number(register.currentBalance),
    salesInToday,
    withdrawalsToday,
  };
}
