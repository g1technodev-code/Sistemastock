import { prisma } from "../../../config/prisma";
import { ApiError } from "../../../utils/apiError";
import { parsePagination, paginatedResponse } from "../../../utils/pagination";

export async function getSuperAdminMetrics() {
  const [totalLocales, activeLocales, suspendedLocales, dueSoonLocales, locales] = await Promise.all([
    prisma.local.count(),
    prisma.local.count({ where: { status: "ACTIVE" } }),
    prisma.local.count({ where: { status: "SUSPENDED" } }),
    prisma.local.count({ where: { status: "DUE_SOON" } }),
    prisma.local.findMany({ select: { monthlyPrice: true, status: true } }),
  ]);

  const mrr = locales
    .filter((l) => l.status === "ACTIVE" || l.status === "DUE_SOON")
    .reduce((sum, l) => sum + Number(l.monthlyPrice), 0);

  return {
    metrics: {
      totalLocales,
      activeLocales,
      suspendedLocales,
      dueSoonLocales,
      mrr,
    },
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
