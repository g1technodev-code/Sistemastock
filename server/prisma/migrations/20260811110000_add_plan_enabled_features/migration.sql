-- Adds real feature-gating codes to "plans", separate from the free-text "features"
-- column (which is marketing copy shown on the pricing page). "enabledFeatures"
-- holds a fixed set of codes (see server/src/constants/planFeatures.ts) checked by
-- the requireFeature() middleware to gate access to Caja, Compras, Inventario
-- Físico, Reportes/Estadísticas/Rentabilidad and Clientes per plan.

-- AlterTable
ALTER TABLE "plans" ADD COLUMN "enabledFeatures" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill the 3 seeded plans: Trial and Pro get full access, Básico gets the
-- subset already advertised in its "features" marketing copy (Ventas/Compras,
-- Clientes básico) but not Caja, Inventario Físico or Reportes/Rentabilidad.
UPDATE "plans" SET "enabledFeatures" = ARRAY['CASH_REGISTER', 'PURCHASES', 'PHYSICAL_INVENTORY', 'REPORTS', 'CUSTOMERS']
WHERE "id" IN ('plan-trial', 'plan-pro');

UPDATE "plans" SET "enabledFeatures" = ARRAY['PURCHASES', 'CUSTOMERS']
WHERE "id" = 'plan-basico';
