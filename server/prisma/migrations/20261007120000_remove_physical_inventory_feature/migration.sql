-- Physical inventory module removed: drop the feature flag and its marketing bullet from existing plans.
-- The inventory_counts tables are kept so historical counts are not lost.
UPDATE "plans" SET "enabledFeatures" = array_remove("enabledFeatures", 'PHYSICAL_INVENTORY');
UPDATE "plans" SET "features" = array_remove("features", 'Control de Inventario Físico (Auditorías y conteo rápido)');
