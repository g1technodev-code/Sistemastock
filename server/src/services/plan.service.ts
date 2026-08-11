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
