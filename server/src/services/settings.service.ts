import { prisma } from "../config/prisma";
import type { UpdateSettingsInput } from "../schemas/settings.schema";

const SETTINGS_ID = "singleton";

export async function getSettings() {
  const settings = await prisma.businessSettings.findUnique({ where: { id: SETTINGS_ID } });
  if (settings) return settings;
  return prisma.businessSettings.create({ data: { id: SETTINGS_ID } });
}

export async function updateSettings(input: UpdateSettingsInput) {
  return prisma.businessSettings.upsert({
    where: { id: SETTINGS_ID },
    update: { ...input, email: input.email || null },
    create: { id: SETTINGS_ID, ...input, email: input.email || null },
  });
}
