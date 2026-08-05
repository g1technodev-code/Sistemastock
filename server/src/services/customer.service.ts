import { Prisma, CustomerMovementType, CashMovementType, CashShiftStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import { parsePagination, paginatedResponse } from "../utils/pagination";
import { getOrCreateRegister, CASH_REGISTER_ID } from "./cash.service";
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  RegisterPaymentInput,
  ListCustomersQuery,
} from "../schemas/customer.schema";

const MOVEMENT_INCLUDE = {
  user: { select: { id: true, name: true } },
  sale: { select: { id: true, total: true, createdAt: true } },
};

export async function listCustomers(query: ListCustomersQuery) {
  const pagination = parsePagination(query);
  const where: Prisma.CustomerWhereInput = query.q
    ? {
        OR: [
          { name: { contains: query.q, mode: "insensitive" } },
          { taxId: { contains: query.q, mode: "insensitive" } },
          { phone: { contains: query.q, mode: "insensitive" } },
          { email: { contains: query.q, mode: "insensitive" } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return paginatedResponse(items, total, pagination);
}

export async function getCustomer(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      movements: {
        include: MOVEMENT_INCLUDE,
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });
  if (!customer) throw ApiError.notFound("Cliente no encontrado");
  return customer;
}

export async function createCustomer(input: CreateCustomerInput) {
  return prisma.customer.create({
    data: {
      name: input.name.trim(),
      taxId: input.taxId?.trim() || null,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      creditLimit: input.creditLimit ?? null,
    },
  });
}

export async function updateCustomer(id: string, input: UpdateCustomerInput) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw ApiError.notFound("Cliente no encontrado");

  return prisma.customer.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.taxId !== undefined ? { taxId: input.taxId?.trim() || null } : {}),
      ...(input.email !== undefined ? { email: input.email?.trim() || null } : {}),
      ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
      ...(input.address !== undefined ? { address: input.address?.trim() || null } : {}),
      ...(input.creditLimit !== undefined ? { creditLimit: input.creditLimit } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
}

export async function registerPayment(customerId: string, input: RegisterPaymentInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw ApiError.notFound("Cliente no encontrado");
    if (!customer.isActive) throw ApiError.badRequest("El cliente está inactivo");

    const balanceBefore = Number(customer.currentBalance);
    const balanceAfter = balanceBefore - input.amount;

    // Actualizamos el saldo del cliente
    await tx.customer.update({
      where: { id: customerId },
      data: { currentBalance: balanceAfter },
    });

    // Registramos el movimiento de pago
    const customerMovement = await tx.customerMovement.create({
      data: {
        customerId,
        type: CustomerMovementType.PAYMENT,
        amount: input.amount,
        balanceBefore,
        balanceAfter,
        userId,
        note: input.note || "Abono / Pago de cuenta corriente",
      },
      include: MOVEMENT_INCLUDE,
    });

    // Ingresamos el dinero abonado a la caja del negocio
    await getOrCreateRegister(tx);
    await tx.cashRegister.update({
      where: { id: CASH_REGISTER_ID },
      data: { currentBalance: { increment: input.amount } },
    });

    const freshRegister = await tx.cashRegister.findUnique({ where: { id: CASH_REGISTER_ID } });
    const cashBalanceAfter = Number(freshRegister!.currentBalance);
    const cashBalanceBefore = cashBalanceAfter - input.amount;

    await tx.cashMovement.create({
      data: {
        type: CashMovementType.SALE_IN,
        amount: input.amount,
        balanceBefore: cashBalanceBefore,
        balanceAfter: cashBalanceAfter,
        userId,
        note: `Abono de cuenta corriente de ${customer.name}`,
      },
    });

    return customerMovement;
  });
}
