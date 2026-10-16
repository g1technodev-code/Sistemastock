-- El sistema pasa a ser solo para kioscos: se eliminan los rubros y el
-- catálogo global queda como un único catálogo compartido.

-- Antes de perder la relación, borrar del catálogo los productos de rubros que
-- no son kiosco (ej. Ferretería del seed). Solo si existe un rubro "kiosco",
-- para no vaciar el catálogo si no se identifica ninguno.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "rubros" WHERE "name" ILIKE '%kiosco%') THEN
    DELETE FROM "catalog_products"
    WHERE "rubroId" IN (SELECT "id" FROM "rubros" WHERE "name" NOT ILIKE '%kiosco%');
  END IF;
END $$;

-- DropForeignKey
ALTER TABLE "locales" DROP CONSTRAINT IF EXISTS "locales_rubroId_fkey";

-- DropForeignKey
ALTER TABLE "catalog_products" DROP CONSTRAINT IF EXISTS "catalog_products_rubroId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "locales_rubroId_idx";

-- DropIndex
DROP INDEX IF EXISTS "catalog_products_rubroId_idx";

-- AlterTable
ALTER TABLE "locales" DROP COLUMN IF EXISTS "rubroId";

-- AlterTable
ALTER TABLE "catalog_products" DROP COLUMN IF EXISTS "rubroId";

-- DropTable
DROP TABLE IF EXISTS "rubros";
