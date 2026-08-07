import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import type { UpdateSettingsInput } from "../schemas/settings.schema";


const SETTINGS_ID = "singleton";

export async function getSettings(localId: string | null | undefined) {
  if (!localId) return null;
  const settings = await prisma.businessSettings.findUnique({ where: { localId } });
  if (settings) return settings;
  return prisma.businessSettings.create({ data: { localId } });
}

export async function updateSettings(localId: string | null | undefined, input: UpdateSettingsInput) {
  if (!localId) throw ApiError.badRequest("Debe estar asociado a un local");
  return prisma.businessSettings.upsert({
    where: { localId },
    update: { ...input, email: input.email || null },
    create: { localId, ...input, email: input.email || null },
  });
}

