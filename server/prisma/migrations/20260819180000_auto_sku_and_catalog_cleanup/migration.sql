-- AlterTable
ALTER TABLE "catalog_products" DROP COLUMN "suggestedCategoryName",
DROP COLUMN "suggestedSku";

-- AlterTable
ALTER TABLE "locales" ADD COLUMN     "nextSkuNumber" INTEGER NOT NULL DEFAULT 1;

