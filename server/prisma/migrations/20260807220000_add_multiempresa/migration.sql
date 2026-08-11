-- Multi-tenant (multiempresa) migration.
--
-- Adds the Local (tenant) model and localId on every tenant-scoped table, plus
-- the SUPERADMIN role. Existing rows are backfilled into a single synthetic
-- "default" Local so this is safe to run against a database that already has
-- data (dev, or a fresh clone of the pre-multiempresa production dataset),
-- and a no-op-shaped script against an empty database.
--
-- This is written by hand (not the raw `prisma migrate diff` output) because
-- the required (`NOT NULL`) localId columns cannot be added directly to
-- tables that already have rows without a default value. See the "Railway
-- schema drift" incident: production ran `prisma db push --accept-data-loss`
-- as its prestart step for weeks without this migration existing, which
-- silently failed on every deploy since it couldn't add these NOT NULL
-- columns to non-empty tables, so Railway kept serving the pre-multiempresa
-- build. Production itself was already hand-migrated to this exact end state
-- via a manual backfill over a `railway connect` tunnel, then this file was
-- added and marked as applied there with `prisma migrate resolve --applied`
-- (see git history / project memory) instead of being re-run.

-- CreateEnum
CREATE TYPE "LocalStatus" AS ENUM ('ACTIVE', 'DUE_SOON', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('BASICO', 'PRO');

-- 'SUPERADMIN' is added to the "Role" enum by the preceding
-- 20260807215000_add_role_superadmin_value migration, in its own transaction
-- (Postgres forbids adding an enum value and using it in the same transaction,
-- and this migration's backfill below filters on 'SUPERADMIN').

-- CreateTable
CREATE TABLE "locales" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "plan" "PlanType" NOT NULL DEFAULT 'BASICO',
    "status" "LocalStatus" NOT NULL DEFAULT 'ACTIVE',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "monthlyPrice" DECIMAL(12,2) NOT NULL DEFAULT 24900,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locales_pkey" PRIMARY KEY ("id")
);

-- DropIndex (superseded by the composite localId+name / localId+sku uniques below)
DROP INDEX IF EXISTS "categories_name_key";
DROP INDEX IF EXISTS "products_sku_key";

-- AlterTable: add localId nullable first so existing rows don't violate NOT NULL
ALTER TABLE "users" ADD COLUMN "localId" TEXT;
ALTER TABLE "categories" ADD COLUMN "localId" TEXT;
ALTER TABLE "suppliers" ADD COLUMN "localId" TEXT;
ALTER TABLE "products" ADD COLUMN "localId" TEXT;
ALTER TABLE "stock_movements" ADD COLUMN "localId" TEXT;
ALTER TABLE "sales" ADD COLUMN "localId" TEXT;
ALTER TABLE "purchases" ADD COLUMN "localId" TEXT;
ALTER TABLE "inventory_counts" ADD COLUMN "localId" TEXT;
ALTER TABLE "cash_register" ADD COLUMN "localId" TEXT;
ALTER TABLE "cash_movements" ADD COLUMN "localId" TEXT;
ALTER TABLE "cash_shifts" ADD COLUMN "localId" TEXT;
ALTER TABLE "business_settings" ADD COLUMN "localId" TEXT;
ALTER TABLE "customers" ADD COLUMN "localId" TEXT;
ALTER TABLE "notifications" ADD COLUMN "localId" TEXT;

-- Backfill: create one default Local and attach every pre-existing row to it.
-- No-op on a fresh/empty database (the SELECTs and UPDATEs simply touch 0 rows).
INSERT INTO "locales" ("id", "name", "ownerEmail", "plan", "status", "dueDate", "monthlyPrice", "createdAt", "updatedAt")
SELECT
  'local-stockflow-demo',
  COALESCE((SELECT "businessName" FROM "business_settings" LIMIT 1), 'StockFlow Demo S.A.C.'),
  COALESCE((SELECT "email" FROM "users" WHERE "role" = 'ADMIN' ORDER BY "createdAt" ASC LIMIT 1), 'admin@stockflow.com'),
  'PRO',
  'ACTIVE',
  now() + interval '30 days',
  39900,
  now(),
  now()
WHERE EXISTS (SELECT 1 FROM "categories" LIMIT 1)
   OR EXISTS (SELECT 1 FROM "products" LIMIT 1)
   OR EXISTS (SELECT 1 FROM "users" LIMIT 1)
ON CONFLICT ("id") DO NOTHING;

UPDATE "users" SET "localId" = 'local-stockflow-demo' WHERE "localId" IS NULL AND "role" != 'SUPERADMIN';
UPDATE "categories" SET "localId" = 'local-stockflow-demo' WHERE "localId" IS NULL;
UPDATE "suppliers" SET "localId" = 'local-stockflow-demo' WHERE "localId" IS NULL;
UPDATE "products" SET "localId" = 'local-stockflow-demo' WHERE "localId" IS NULL;
UPDATE "stock_movements" SET "localId" = 'local-stockflow-demo' WHERE "localId" IS NULL;
UPDATE "sales" SET "localId" = 'local-stockflow-demo' WHERE "localId" IS NULL;
UPDATE "purchases" SET "localId" = 'local-stockflow-demo' WHERE "localId" IS NULL;
UPDATE "inventory_counts" SET "localId" = 'local-stockflow-demo' WHERE "localId" IS NULL;
UPDATE "cash_register" SET "localId" = 'local-stockflow-demo' WHERE "localId" IS NULL;
UPDATE "cash_movements" SET "localId" = 'local-stockflow-demo' WHERE "localId" IS NULL;
UPDATE "cash_shifts" SET "localId" = 'local-stockflow-demo' WHERE "localId" IS NULL;
UPDATE "business_settings" SET "localId" = 'local-stockflow-demo' WHERE "localId" IS NULL;
UPDATE "customers" SET "localId" = 'local-stockflow-demo' WHERE "localId" IS NULL;
UPDATE "notifications" SET "localId" = 'local-stockflow-demo' WHERE "localId" IS NULL;

-- AlterTable: now safe to enforce NOT NULL on the tenant-scoped tables
ALTER TABLE "categories" ALTER COLUMN "localId" SET NOT NULL;
ALTER TABLE "suppliers" ALTER COLUMN "localId" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "localId" SET NOT NULL;
ALTER TABLE "stock_movements" ALTER COLUMN "localId" SET NOT NULL;
ALTER TABLE "sales" ALTER COLUMN "localId" SET NOT NULL;
ALTER TABLE "purchases" ALTER COLUMN "localId" SET NOT NULL;
ALTER TABLE "inventory_counts" ALTER COLUMN "localId" SET NOT NULL;
ALTER TABLE "cash_register" ALTER COLUMN "localId" SET NOT NULL;
ALTER TABLE "cash_movements" ALTER COLUMN "localId" SET NOT NULL;
ALTER TABLE "cash_shifts" ALTER COLUMN "localId" SET NOT NULL;
ALTER TABLE "business_settings" ALTER COLUMN "localId" SET NOT NULL;
ALTER TABLE "customers" ALTER COLUMN "localId" SET NOT NULL;
ALTER TABLE "notifications" ALTER COLUMN "localId" SET NOT NULL;
-- users.localId stays nullable: SUPERADMIN users are global (no Local)

-- CreateIndex
CREATE INDEX "users_localId_idx" ON "users"("localId");
CREATE INDEX "categories_localId_idx" ON "categories"("localId");
CREATE UNIQUE INDEX "categories_localId_name_key" ON "categories"("localId", "name");
CREATE INDEX "suppliers_localId_idx" ON "suppliers"("localId");
CREATE INDEX "products_localId_idx" ON "products"("localId");
CREATE UNIQUE INDEX "products_localId_sku_key" ON "products"("localId", "sku");
CREATE INDEX "stock_movements_localId_idx" ON "stock_movements"("localId");
CREATE INDEX "sales_localId_idx" ON "sales"("localId");
CREATE INDEX "purchases_localId_idx" ON "purchases"("localId");
CREATE INDEX "inventory_counts_localId_idx" ON "inventory_counts"("localId");
CREATE UNIQUE INDEX "cash_register_localId_key" ON "cash_register"("localId");
CREATE INDEX "cash_register_localId_idx" ON "cash_register"("localId");
CREATE INDEX "cash_movements_localId_idx" ON "cash_movements"("localId");
CREATE INDEX "cash_shifts_localId_idx" ON "cash_shifts"("localId");
CREATE UNIQUE INDEX "business_settings_localId_key" ON "business_settings"("localId");
CREATE INDEX "customers_localId_idx" ON "customers"("localId");
CREATE INDEX "notifications_localId_idx" ON "notifications"("localId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "categories" ADD CONSTRAINT "categories_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales" ADD CONSTRAINT "sales_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_counts" ADD CONSTRAINT "inventory_counts_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cash_register" ADD CONSTRAINT "cash_register_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cash_movements" ADD CONSTRAINT "cash_movements_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cash_shifts" ADD CONSTRAINT "cash_shifts_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "business_settings" ADD CONSTRAINT "business_settings_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customers" ADD CONSTRAINT "customers_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
