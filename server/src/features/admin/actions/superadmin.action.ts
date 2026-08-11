import { prisma } from "../../../config/prisma";
import { ApiError } from "../../../utils/apiError";
import { parsePagination, paginatedResponse } from "../../../utils/pagination";
import { hashPassword } from "../../../utils/password";
import { Role } from "@prisma/client";


export type CreateLocalInput = {
  name: string;
  ownerEmail: string;
  adminPassword: string;
  planId: string;
};

export async function createLocal(input: CreateLocalInput) {
  const existingUser = await prisma.user.findUnique({ where: { email: input.ownerEmail } });
  if (existingUser) {
    throw ApiError.conflict("Ya existe un usuario registrado con ese email");
  }

  const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
  if (!plan) throw ApiError.badRequest("Plan no válido");

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (plan.isTrial ? plan.trialDays ?? 7 : 30));

  const passwordHash = await hashPassword(input.adminPassword);

  return prisma.$transaction(async (tx) => {
    const local = await tx.local.create({
      data: {
        name: input.name,
        ownerEmail: input.ownerEmail,
        planId: plan.id,
        isTrial: plan.isTrial,
        status: "ACTIVE",
        dueDate,
        monthlyPrice: plan.monthlyPrice,
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
    .filter((l) => l.isTrial || l.dueDate < now)
    .map((l) => {
      const isExpired = l.dueDate < now;
      let alertStatus: "TRIAL_ACTIVE" | "CONVERTED" | "SUSPENDED_EXPIRED" = "TRIAL_ACTIVE";

      if (l.status === "SUSPENDED") {
        alertStatus = "SUSPENDED_EXPIRED";
      } else if (!l.isTrial) {
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
      include: { plan: true },
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.local.count({ where }),
  ]);

  return paginatedResponse(items, total, pagination);
}

export async function enforceLocalPlanQuota(localId: string) {
  const local = await prisma.local.findUnique({ where: { id: localId }, include: { plan: true } });
  if (!local) return;

  const maxAdmins = local.plan.maxAdmins;
  const maxEmployees = local.plan.maxEmployees;

  const admins = await prisma.user.findMany({
    where: { localId, role: { in: ["ADMIN", "MANAGER"] } },
    orderBy: { createdAt: "asc" },
  });

  const employees = await prisma.user.findMany({
    where: { localId, role: "EMPLOYEE" },
    orderBy: { createdAt: "asc" },
  });

  for (let i = 0; i < admins.length; i++) {
    const shouldBeActive = i < maxAdmins;
    if (admins[i].isActive !== shouldBeActive) {
      await prisma.user.update({
        where: { id: admins[i].id },
        data: { isActive: shouldBeActive },
      });
    }
  }

  for (let i = 0; i < employees.length; i++) {
    const shouldBeActive = i < maxEmployees;
    if (employees[i].isActive !== shouldBeActive) {
      await prisma.user.update({
        where: { id: employees[i].id },
        data: { isActive: shouldBeActive },
      });
    }
  }
}

export async function updateLocalPlan(id: string, planId: string) {
  const local = await prisma.local.findUnique({ where: { id } });
  if (!local) throw ApiError.notFound("Local no encontrado");

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw ApiError.badRequest("Plan no válido");

  const updated = await prisma.local.update({
    where: { id },
    data: {
      planId: plan.id,
      isTrial: plan.isTrial,
      monthlyPrice: plan.monthlyPrice,
    },
    include: { plan: true },
  });

  await enforceLocalPlanQuota(id);
  return updated;
}

export async function updateLocalStatus(id: string, status: "ACTIVE" | "SUSPENDED" | "DUE_SOON") {
  const local = await prisma.local.findUnique({ where: { id } });
  if (!local) throw ApiError.notFound("Local no encontrado");

  const updated = await prisma.local.update({
    where: { id },
    data: { status },
  });

  if (status === "ACTIVE") {
    await enforceLocalPlanQuota(id);
  }
  return updated;
}


