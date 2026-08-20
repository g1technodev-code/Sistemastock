-- AlterTable
ALTER TABLE "locales" ADD COLUMN     "rubroId" TEXT;

-- CreateTable
CREATE TABLE "rubros" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rubros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_products" (
    "id" TEXT NOT NULL,
    "rubroId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "suggestedCategoryName" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'unidad',
    "suggestedCostPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "suggestedSellPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "barcode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rubros_name_key" ON "rubros"("name");

-- CreateIndex
CREATE INDEX "catalog_products_rubroId_idx" ON "catalog_products"("rubroId");

-- CreateIndex
CREATE INDEX "locales_rubroId_idx" ON "locales"("rubroId");

-- AddForeignKey
ALTER TABLE "locales" ADD CONSTRAINT "locales_rubroId_fkey" FOREIGN KEY ("rubroId") REFERENCES "rubros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_products" ADD CONSTRAINT "catalog_products_rubroId_fkey" FOREIGN KEY ("rubroId") REFERENCES "rubros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

