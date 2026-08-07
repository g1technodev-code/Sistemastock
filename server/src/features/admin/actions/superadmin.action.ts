import { prisma } from "../../../config/prisma";
import { ApiError } from "../../../utils/apiError";
import { parsePagination, paginatedResponse } from "../../../utils/pagination";
import { hashPassword } from "../../../utils/password";
import { PlanType, Role } from "@prisma/client";


export type CreateLocalInput = {
  name: string;
  ownerEmail: string;
  adminPassword: string;
  plan: "TRIAL" | "BASICO" | "PRO";
};

export async function createLocal(input: CreateLocalInput) {
  const existingUser = await prisma.user.findUnique({ where: { email: input.ownerEmail } });
  if (existingUser) {
    throw ApiError.conflict("Ya existe un usuario registrado con ese email");
  }

  const isTrial = input.plan === "TRIAL";
  const dueDate = new Date();
  if (isTrial) {
    dueDate.setDate(dueDate.getDate() + 7);
  } else {
    dueDate.setDate(dueDate.getDate() + 30);
  }

  const monthlyPrice = input.plan === "PRO" ? 39900 : input.plan === "BASICO" ? 24900 : 0;
  const passwordHash = await hashPassword(input.adminPassword);

  return prisma.$transaction(async (tx) => {
    const local = await tx.local.create({
      data: {
        name: input.name,
        ownerEmail: input.ownerEmail,
        plan: input.plan as PlanType,
        isTrial,
        status: "ACTIVE",
        dueDate,
        monthlyPrice,
      },
    });

    const adminUser = await tx.user.create({
      data: {
        localId: local.id,
        name: `Admin - ${input.name}`,
        email: input.ownerEmail,
        passwordHash,
        role: Role.ADMIN,
      },
    });

    await tx.businessSettings.create({
      data: {
        localId: local.id,
        businessName: input.name,
        email: input.ownerEmail,
      },
    });

    await tx.cashRegister.create({
      data: {
        localId: local.id,
        currentBalance: 0,
      },
    });

    return { local, adminUser };
  });
}

export async function getSuperAdminMetrics() {
  const [totalLocales, activeLocales, suspendedLocales, dueSoonLocales, locales] = await Promise.all([
    prisma.local.count(),
    prisma.local.count({ where: { status: "ACTIVE" } }),
    prisma.local.count({ where: { status: "SUSPENDED" } }),
    prisma.local.count({ where: { status: "DUE_SOON" } }),
    prisma.local.findMany({ select: { id: true, name: true, ownerEmail: true, plan: true, isTrial: true, status: true, dueDate: true, monthlyPrice: true } }),
  ]);

  const mrr = locales
    .filter((l) => l.status === "ACTIVE" || l.status === "DUE_SOON")
    .reduce((sum, l) => sum + Number(l.monthlyPrice), 0);

  const now = new Date();
  const conversionAlerts = locales
    .filter((l) => l.isTrial || l.plan === "TRIAL" || l.dueDate < now)
    .map((l) => {
      const isExpired = l.dueDate < now;
      let alertStatus: "TRIAL_ACTIVE" | "CONVERTED" | "SUSPENDED_EXPIRED" = "TRIAL_ACTIVE";

      if (l.status === "SUSPENDED") {
        alertStatus = "SUSPENDED_EXPIRED";
      } else if (!l.isTrial && l.plan !== "TRIAL") {
        alertStatus = "CONVERTED";
      } else if (isExpired) {
        alertStatus = "SUSPENDED_EXPIRED";
      }

      return {
        localId: l.id,
        name: l.name,
        ownerEmail: l.ownerEmail,
        plan: l.plan,
        isTrial: l.isTrial,
        status: l.status,
        dueDate: l.dueDate,
        alertStatus,
      };
    });

  return {
    metrics: {
      totalLocales,
      activeLocales,
      suspendedLocales,
      dueSoonLocales,
      mrr,
    },
    conversionAlerts,
  };
}

export async function listLocales(query: { page?: number; limit?: number; q?: string; status?: string }) {
  const pagination = parsePagination(query);
  const where: any = {};

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { ownerEmail: { contains: query.q, mode: "insensitive" } },
      { id: { contains: query.q, mode: "insensitive" } },
    ];
  }

  if (query.status) {
    where.status = query.status;
  }

  const [items, total] = await Promise.all([
    prisma.local.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.local.count({ where }),
  ]);

  return paginatedResponse(items, total, pagination);
}

export async function updateLocalStatus(id: string, status: "ACTIVE" | "SUSPENDED" | "DUE_SOON") {
  const local = await prisma.local.findUnique({ where: { id } });
  if (!local) throw ApiError.notFound("Local no encontrado");

  return prisma.local.update({
    where: { id },
    data: { status },
  });
}

