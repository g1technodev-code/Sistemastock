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
  canCreateProducts: true,
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
    const local = await prisma.local.findUnique({ where: { id: creatorLocalId }, include: { plan: true } });
    if (local) {
      const maxAdmins = local.plan.maxAdmins;
      const maxEmployees = local.plan.maxEmployees;

      if (input.role === "ADMIN" || input.role === "MANAGER") {
        const currentAdmins = await prisma.user.count({
          where: { localId: creatorLocalId, role: { in: ["ADMIN", "MANAGER"] }, isActive: true },
        });
        if (currentAdmins >= maxAdmins) {
          throw ApiError.forbidden(
            `Tu plan ${local.plan.name} permite un máximo de ${maxAdmins} Administrador(es). Actualiza tu plan para agregar más.`,
          );
        }
      } else if (input.role === "EMPLOYEE") {
        const currentEmployees = await prisma.user.count({
          where: { localId: creatorLocalId, role: "EMPLOYEE", isActive: true },
        });
        if (currentEmployees >= maxEmployees) {
          throw ApiError.forbidden(
            `Tu plan ${local.plan.name} permite un máximo de ${maxEmployees} Empleado(s). Actualiza tu plan para agregar más.`,
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
      canCreateProducts: input.canCreateProducts ?? false,
    },
    select: SELECT_FIELDS,
  });

}


export async function updateUser(
  creatorLocalId: string | null | undefined,
  id: string,
  input: UpdateUserInput,
  actingUserId: string,
  actingUserRole?: Role,
) {
  if (input.role === "SUPERADMIN" && actingUserRole !== "SUPERADMIN") {
    throw ApiError.forbidden("No tienes permisos para asignar el rol SuperAdmin");
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw ApiError.notFound("Usuario no encontrado");

  if (actingUserRole !== Role.SUPERADMIN && creatorLocalId && target.localId !== creatorLocalId) {
    throw ApiError.notFound("Usuario no encontrado");
  }

  if (id === actingUserId && (input.isActive === false || (input.role && input.role !== target.role))) {
    throw ApiError.badRequest("No puedes cambiar tu propio rol o desactivar tu propia cuenta");
  }

  if (input.isActive === true && target.isActive === false && target.localId) {
    const local = await prisma.local.findUnique({ where: { id: target.localId }, include: { plan: true } });
    if (local) {
      if (target.role === "ADMIN" || target.role === "MANAGER") {
        const activeAdmins = await prisma.user.count({
          where: { localId: target.localId, role: { in: ["ADMIN", "MANAGER"] }, isActive: true },
        });
        if (activeAdmins >= local.plan.maxAdmins) {
          throw ApiError.forbidden(
            `No puedes activar este usuario. Tu plan ${local.plan.name} permite un máximo de ${local.plan.maxAdmins} Administrador(es).`,
          );
        }
      } else if (target.role === "EMPLOYEE") {
        const activeEmployees = await prisma.user.count({
          where: { localId: target.localId, role: "EMPLOYEE", isActive: true },
        });
        if (activeEmployees >= local.plan.maxEmployees) {
          throw ApiError.forbidden(
            `No puedes activar este usuario. Tu plan ${local.plan.name} permite un máximo de ${local.plan.maxEmployees} Empleado(s).`,
          );
        }
      }
    }
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

export async function resetUserPassword(
  creatorLocalId: string | null | undefined,
  id: string,
  newPassword?: string,
  actingUserRole?: Role,
) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw ApiError.notFound("Usuario no encontrado");

  if (actingUserRole !== Role.SUPERADMIN && creatorLocalId && user.localId !== creatorLocalId) {
    throw ApiError.notFound("Usuario no encontrado");
  }

  const finalPassword = newPassword ?? generateTempPassword();
  const passwordHash = await hashPassword(finalPassword);

  await prisma.user.update({ where: { id }, data: { passwordHash } });
  await revokeAllSessionsForUser(id);

  return { temporaryPassword: finalPassword };
}
