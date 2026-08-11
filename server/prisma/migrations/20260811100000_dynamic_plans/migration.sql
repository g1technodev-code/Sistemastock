-- Replaces the fixed "PlanType" enum on locales with a relational "plans"
-- table that the SuperAdmin panel can manage (create/edit/deactivate/delete
-- plans with free-form name, price and limits).
--
-- Written by hand (not raw `prisma migrate diff`) because production already
-- has locales with a non-null "plan" enum column. Following the same safe
-- pattern as 20260807220000_add_multiempresa (see its header comment / the
-- Railway schema-drift incident in project memory): add the new column
-- nullable, backfill it, THEN enforce NOT NULL — never a direct rewrite that
-- could fail against a database that already has rows.

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "monthlyPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "maxAdmins" INTEGER NOT NULL DEFAULT 1,
    "maxEmployees" INTEGER NOT NULL DEFAULT 3,
    "isTrial" BOOLEAN NOT NULL DEFAULT false,
    "trialDays" INTEGER,
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- Seed the 3 plans that exist today, with fixed ids so existing locales can
-- be backfilled onto them below. No-op-shaped (ON CONFLICT DO NOTHING) so
-- this migration is safe to re-run / already-seeded environments.
INSERT INTO "plans" ("id", "name", "description", "monthlyPrice", "maxAdmins", "maxEmployees", "isTrial", "trialDays", "isRecommended", "isActive", "sortOrder", "features", "createdAt", "updatedAt")
VALUES
  ('plan-trial', 'Prueba Gratis', 'Prueba gratuita de 7 días con acceso completo a las funciones básicas.', 0, 1, 3, true, 7, false, true, 0,
    ARRAY['Acceso completo por 7 días', '1 Administrador y 3 Empleados', 'Sin necesidad de tarjeta de crédito'], now(), now()),
  ('plan-basico', 'Kipo Básico', 'Ideal para gestionar el inventario del día a día y tener control claro de tus entradas y salidas.', 24900, 1, 3, false, NULL, false, true, 1,
    ARRAY['Incluye 1 Administrador y 3 Empleados', 'Gestor de Productos y Categorías', 'Registro de Proveedores', 'Movimientos de stock básicos (Entradas/Salidas)', 'Registro de Ventas y Compras', 'Gestión básica de Clientes', 'Soporte estándar por Email'], now(), now()),
  ('plan-pro', 'Kipo Pro', 'La solución completa para maximizar ganancias, auditar caja y tomar decisiones basadas en datos reales.', 39900, 2, 6, false, NULL, true, true, 2,
    ARRAY['Incluye 2 Administradores y 6 Empleados', 'Todo lo incluido en Kipo Básico', 'Control de Inventario Físico (Auditorías y conteo rápido)', 'Gestión y control de Caja diaria', 'Módulo completo de Reportes e Historial', 'Estadísticas avanzadas de rendimiento', 'Análisis de Rentabilidad (Márgenes de ganancia e indicadores clave)', 'Gestión multiusuario y asignación de roles', 'Soporte prioritario 24/7'], now(), now())
ON CONFLICT ("id") DO NOTHING;

-- AlterTable: add planId nullable first so existing "locales" rows don't
-- violate NOT NULL, then backfill from the old enum column.
ALTER TABLE "locales" ADD COLUMN "planId" TEXT;

UPDATE "locales" SET "planId" = CASE "plan"
  WHEN 'TRIAL' THEN 'plan-trial'
  WHEN 'BASICO' THEN 'plan-basico'
  WHEN 'PRO' THEN 'plan-pro'
END
WHERE "planId" IS NULL;

ALTER TABLE "locales" ALTER COLUMN "planId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "locales_planId_idx" ON "locales"("planId");

-- AddForeignKey
ALTER TABLE "locales" ADD CONSTRAINT "locales_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop the old enum column and type, now fully replaced by the "plans" relation.
ALTER TABLE "locales" DROP COLUMN "plan";
DROP TYPE "PlanType";
