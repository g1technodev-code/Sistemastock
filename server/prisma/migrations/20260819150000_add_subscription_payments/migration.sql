-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('APPROVED', 'PENDING', 'REJECTED', 'REFUNDED');

-- CreateTable
CREATE TABLE "subscription_payments" (
    "id" TEXT NOT NULL,
    "localId" TEXT NOT NULL,
    "planId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "status" "PaymentStatus" NOT NULL DEFAULT 'APPROVED',
    "mpPaymentId" TEXT,
    "mpMerchantOrderId" TEXT,
    "paymentMethod" TEXT DEFAULT 'MERCADO_PAGO',
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_payments_mpPaymentId_key" ON "subscription_payments"("mpPaymentId");

-- CreateIndex
CREATE INDEX "subscription_payments_localId_idx" ON "subscription_payments"("localId");

-- CreateIndex
CREATE INDEX "subscription_payments_status_idx" ON "subscription_payments"("status");

-- CreateIndex
CREATE INDEX "subscription_payments_createdAt_idx" ON "subscription_payments"("createdAt");

-- AddForeignKey
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_localId_fkey" FOREIGN KEY ("localId") REFERENCES "locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
