-- Backfills a migration-history gap: the Customer / CustomerMovement / Notification
-- models (schema.prisma commit 5e754b2, "sales, customer management, and automated
-- stock/notification system") were built out against a database that had
-- `prisma db push` run directly, so no migration file was ever generated for them.
-- Environments that had `db push` run (Railway prod, per the add_multiempresa
-- migration's header comment) already have these tables/columns; a bare
-- `migrate deploy`-only environment does not. Every statement below is guarded
-- (IF NOT EXISTS / duplicate_object) so this is a no-op where the objects already
-- exist and only does real work where they're missing.
--
-- Must run before 20260807220000_add_multiempresa, which ALTERs "customers" and
-- "notifications" assuming they already exist.

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "CustomerMovementType" AS ENUM ('CHARGE', 'PAYMENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('LOW_STOCK', 'SHIFT_OPEN', 'SHIFT_CLOSE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterEnum
DO $$ BEGIN
  ALTER TYPE "PaymentMethod" ADD VALUE 'CUENTA_CORRIENTE';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN IF NOT EXISTS "customerId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "currentBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creditLimit" DECIMAL(12,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "customer_movements" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "CustomerMovementType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balanceBefore" DECIMAL(12,2) NOT NULL,
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "saleId" TEXT,
    "userId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "customer_movements_customerId_createdAt_idx" ON "customer_movements"("customerId", "createdAt");
CREATE INDEX IF NOT EXISTS "customer_movements_createdAt_idx" ON "customer_movements"("createdAt");
CREATE INDEX IF NOT EXISTS "notifications_createdAt_idx" ON "notifications"("createdAt");
CREATE INDEX IF NOT EXISTS "notifications_isRead_idx" ON "notifications"("isRead");
CREATE INDEX IF NOT EXISTS "sales_customerId_idx" ON "sales"("customerId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "sales" ADD CONSTRAINT "sales_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "customer_movements" ADD CONSTRAINT "customer_movements_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "customer_movements" ADD CONSTRAINT "customer_movements_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "customer_movements" ADD CONSTRAINT "customer_movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
