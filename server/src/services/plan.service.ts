import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import type { UpsertPlanInput } from "../schemas/plan.schema";

export async function listPlans(includeInactive = true) {
  return prisma.plan.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listPublicPlans() {
  return prisma.plan.findMany({
    where: { isActive: true, isTrial: false },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createPlan(input: UpsertPlanInput) {
  return prisma.plan.create({ data: input });
}

export async function updatePlan(id: string, input: UpsertPlanInput) {
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) throw ApiError.notFound("Plan no encontrado");
  return prisma.plan.update({ where: { id }, data: input });
}

export async function deletePlan(id: string) {
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) throw ApiError.notFound("Plan no encontrado");

  const localCount = await prisma.local.count({ where: { planId: id } });
  if (localCount > 0) {
    throw ApiError.conflict(
      `No se puede eliminar: ${localCount} local(es) están usando este plan. Desactívalo en su lugar.`,
    );
  }

  await prisma.plan.delete({ where: { id } });
}

export async function getMySubscription(localId: string) {
  const local = await prisma.local.findUnique({
    where: { id: localId },
    include: { plan: true },
  });

  if (!local) throw ApiError.notFound("Local no encontrado");

  const now = new Date();
  const dueDate = new Date(local.dueDate);
  const diffTime = dueDate.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return {
    localId: local.id,
    localName: local.name,
    planId: local.planId,
    planName: local.plan.name,
    isTrial: local.isTrial,
    status: local.status,
    dueDate: local.dueDate.toISOString(),
    monthlyPrice: Number(local.monthlyPrice),
    daysLeft,
    plan: local.plan,
  };
}

