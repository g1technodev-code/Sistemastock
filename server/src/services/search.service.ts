import { prisma } from "../config/prisma";

export async function globalSearch(q: string) {
  if (!q || q.trim().length < 2) {
    return { products: [], categories: [], suppliers: [] };
  }

  const [products, categories, suppliers] = await Promise.all([
    prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { barcode: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, sku: true, currentStock: true, minStock: true },
      take: 6,
    }),
    prisma.category.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true },
      take: 5,
    }),
    prisma.supplier.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true },
      take: 5,
    }),
  ]);

  return { products, categories, suppliers };
}
