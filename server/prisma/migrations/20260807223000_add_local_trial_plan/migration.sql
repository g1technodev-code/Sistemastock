-- AlterEnum
ALTER TYPE "PlanType" ADD VALUE 'TRIAL';

-- AlterTable
ALTER TABLE "locales" ADD COLUMN     "isTrial" BOOLEAN NOT NULL DEFAULT false;
