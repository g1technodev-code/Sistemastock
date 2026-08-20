-- AlterTable
ALTER TABLE "catalog_products" DROP COLUMN "suggestedCostPrice",
DROP COLUMN "suggestedSellPrice",
ADD COLUMN     "suggestedSku" TEXT;

