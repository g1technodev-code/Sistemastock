import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import { hashPassword, generateTempPassword } from "../utils/password";
import { revokeAllSessionsForUser } from "./auth.service";
import type { CreateUserInput, UpdateUserInput } from "../schemas/user.schema";

import { parsePagination, paginatedResponse } from "../utils/pagination";

const SELECT_FIELDS = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export async function listUsers(localId: string | null | undefined, query: { page?: number; limit?: number; q?: string }) {
  const pagination = parsePagination(query);
  const where = {
    ...(localId ? { localId } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" as const } },
            { email: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: SELECT_FIELDS,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return paginatedResponse(items, total, pagination);
}

export async function createUser(creatorLocalId: string | null | undefined, input: CreateUserInput, actingUserRole?: Role) {
  if (input.role === "SUPERADMIN" && actingUserRole !== "SUPERADMIN") {
    throw ApiError.forbidden("No tienes permisos para asignar el rol SuperAdmin");
  }

  if (creatorLocalId) {
    const local = await prisma.local.findUnique({ where: { id: creatorLocalId } });
    if (local) {
      const isPro = local.plan === "PRO";
      const maxAdmins = isPro ? 2 : 1;
      const maxEmployees = isPro ? 6 : 3;

      if (input.role === "ADMIN" || input.role === "MANAGER") {
        const currentAdmins = await prisma.user.count({
          where: { localId: creatorLocalId, role: { in: ["ADMIN", "MANAGER"] }, isActive: true },
        });
        if (currentAdmins >= maxAdmins) {
          throw ApiError.forbidden(
            `Tu plan ${local.plan} permite un máximo de ${maxAdmins} Administrador(es). ${!isPro ? "Actualiza a Plan PRO para hasta 2 Administradores." : ""}`,
          );
        }
      } else if (input.role === "EMPLOYEE") {
        const currentEmployees = await prisma.user.count({
          where: { localId: creatorLocalId, role: "EMPLOYEE", isActive: true },
        });
        if (currentEmployees >= maxEmployees) {
          throw ApiError.forbidden(
            `Tu plan ${local.plan} permite un máximo de ${maxEmployees} Empleado(s). ${!isPro ? "Actualiza a Plan PRO para hasta 6 Empleados." : ""}`,
          );
        }
      }
    }
  }


  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict("Ya existe un usuario con ese email");

  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: {
      localId: creatorLocalId || null,
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    },
    select: SELECT_FIELDS,
  });
}


export async function updateUser(id: string, input: UpdateUserInput, actingUserId: string, actingUserRole?: Role) {
  if (input.role === "SUPERADMIN" && actingUserRole !== "SUPERADMIN") {
    throw ApiError.forbidden("No tienes permisos para asignar el rol SuperAdmin");
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw ApiError.notFound("Usuario no encontrado");

  if (id === actingUserId && (input.isActive === false || (input.role && input.role !== target.role))) {
    throw ApiError.badRequest("No puedes cambiar tu propio rol o desactivar tu propia cuenta");
  }

  const updated = await prisma.user.update({
    where: { id },
    data: input,
    select: SELECT_FIELDS,
  });


  if (input.isActive === false || (input.role && input.role !== target.role)) {
    await revokeAllSessionsForUser(id);
  }

  return updated;
}

export async function resetUserPassword(id: string, newPassword?: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound("Usuario no encontrado");

  const finalPassword = newPassword ?? generateTempPassword();
  const passwordHash = await hashPassword(finalPassword);

  await prisma.user.update({ where: { id }, data: { passwordHash } });
  await revokeAllSessionsForUser(id);

  return { temporaryPassword: finalPassword };
}
