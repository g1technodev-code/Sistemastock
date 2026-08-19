import { prisma } from "../../../config/prisma";
import { ApiError } from "../../../utils/apiError";
import { parsePagination, paginatedResponse } from "../../../utils/pagination";
import { hashPassword } from "../../../utils/password";
import { Role } from "@prisma/client";
import { revokeAllSessionsForUser } from "../../../services/auth.service";



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

      if (!shouldBeActive) {
        await revokeAllSessionsForUser(admins[i].id);
      }
    }
  }

  for (let i = 0; i < employees.length; i++) {
    const shouldBeActive = i < maxEmployees;
    if (employees[i].isActive !== shouldBeActive) {
      await prisma.user.update({
        where: { id: employees[i].id },
        data: { isActive: shouldBeActive },
      });

      if (!shouldBeActive) {
        await revokeAllSessionsForUser(employees[i].id);
      }
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

export async function deleteLocal(id: string) {
  const local = await prisma.local.findUnique({ where: { id } });
  if (!local) throw ApiError.notFound("Local no encontrado");

  return prisma.local.delete({ where: { id } });
}

export async function createAnnouncement(input: { title: string; message: string; type?: "INFO" | "WARNING" | "MAINTENANCE" }) {
  if (!input.title || !input.message) {
    throw ApiError.badRequest("El título y mensaje son requeridos");
  }
  return prisma.announcement.create({
    data: {
      title: input.title,
      message: input.message,
      type: input.type || "INFO",
    },
  });
}

export async function listAnnouncements() {
  return prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteAnnouncement(id: string) {
  const item = await prisma.announcement.findUnique({ where: { id } });
  if (!item) throw ApiError.notFound("Anuncio no encontrado");
  return prisma.announcement.delete({ where: { id } });
}

export async function getLatestAnnouncement() {
  return prisma.announcement.findFirst({
    orderBy: { createdAt: "desc" },
  });
}

export async function listSubscriptionPayments(query: { page?: number; limit?: number; search?: string; status?: string }) {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (query.status && query.status !== "ALL") {
    where.status = query.status;
  }

  if (query.search) {
    where.OR = [
      { local: { name: { contains: query.search, mode: "insensitive" } } },
      { mpPaymentId: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [items, total, monthlySum, activeLocales] = await Promise.all([
    prisma.subscriptionPayment.findMany({
      where,
      include: {
        local: { select: { id: true, name: true, ownerEmail: true } },
        plan: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.subscriptionPayment.count({ where }),
    prisma.subscriptionPayment.aggregate({
      _sum: { amount: true },
      where: {
        status: "APPROVED",
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.local.findMany({
      where: { status: { in: ["ACTIVE", "DUE_SOON"] } },
      select: { monthlyPrice: true },
    }),
  ]);

  const monthlyIncome = Number(monthlySum._sum.amount ?? 0);
  const estimatedMrr = activeLocales.reduce((acc: number, l: { monthlyPrice: any }) => acc + Number(l.monthlyPrice), 0);

  const totalPaymentsCount = await prisma.subscriptionPayment.count();
  const approvedPaymentsCount = await prisma.subscriptionPayment.count({ where: { status: "APPROVED" } });
  const successRate = totalPaymentsCount > 0 ? Math.round((approvedPaymentsCount / totalPaymentsCount) * 100) : 100;

  return {
    items: items.map((i: any) => ({
      ...i,
      amount: Number(i.amount),
    })),
    pagination: {

      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    metrics: {
      monthlyIncome,
      estimatedMrr,
      successRate,
    },
  };
}




