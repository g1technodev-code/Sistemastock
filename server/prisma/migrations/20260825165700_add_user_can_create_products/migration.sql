-- AlterTable
ALTER TABLE "users" ADD COLUMN "canCreateProducts" BOOLEAN NOT NULL DEFAULT false;

-- Retrocompatibility: Set existing employees to canCreateProducts = true
UPDATE "users" SET "canCreateProducts" = true WHERE "role" = 'EMPLOYEE';
