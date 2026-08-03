import { PrismaClient, Role, MovementType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CATEGORY_DATA = [
  { name: "Electrónica", description: "Dispositivos y componentes electrónicos", color: "#6366f1" },
  { name: "Oficina", description: "Suministros y papelería de oficina", color: "#0ea5e9" },
  { name: "Limpieza", description: "Productos de limpieza e higiene", color: "#22c55e" },
  { name: "Alimentación", description: "Productos alimenticios y bebidas", color: "#f59e0b" },
  { name: "Ferretería", description: "Herramientas y materiales de construcción", color: "#ef4444" },
];

const SUPPLIER_DATA = [
  { name: "Distribuidora Andina S.A.", contactName: "Carla Rojas", email: "ventas@andina.com", phone: "+51 987 111 222", address: "Av. Industrial 450, Lima", taxId: "20501234567" },
  { name: "TecnoImport Perú", contactName: "Jorge Medina", email: "contacto@tecnoimport.pe", phone: "+51 987 222 333", address: "Jr. Comercio 120, Lima", taxId: "20509876543" },
  { name: "Suministros del Norte", contactName: "Ana Flores", email: "info@suministrosnorte.com", phone: "+51 987 333 444", address: "Av. Chiclayo 88, Chiclayo", taxId: "20512345678" },
  { name: "Global Office Supplies", contactName: "Marco Vidal", email: "sales@globaloffice.com", phone: "+51 987 444 555", address: "Av. Larco 200, Lima", taxId: "20518765432" },
  { name: "AgroFoods S.R.L.", contactName: "Lucía Chávez", email: "pedidos@agrofoods.pe", phone: "+51 987 555 666", address: "Av. La Marina 900, Lima", taxId: "20523456789" },
];

type SeedProduct = {
  sku: string;
  name: string;
  categoryIndex: number;
  supplierIndex: number;
  unit: string;
  costPrice: number;
  sellPrice: number;
  currentStock: number;
  minStock: number;
};

const PRODUCT_DATA: SeedProduct[] = [
  { sku: "ELE-001", name: "Mouse inalámbrico", categoryIndex: 0, supplierIndex: 1, unit: "unidad", costPrice: 18, sellPrice: 32, currentStock: 42, minStock: 15 },
  { sku: "ELE-002", name: "Teclado mecánico", categoryIndex: 0, supplierIndex: 1, unit: "unidad", costPrice: 55, sellPrice: 95, currentStock: 8, minStock: 10 },
  { sku: "ELE-003", name: "Monitor LED 24\"", categoryIndex: 0, supplierIndex: 1, unit: "unidad", costPrice: 320, sellPrice: 480, currentStock: 5, minStock: 6 },
  { sku: "ELE-004", name: "Cable HDMI 2m", categoryIndex: 0, supplierIndex: 1, unit: "unidad", costPrice: 6, sellPrice: 15, currentStock: 120, minStock: 30 },
  { sku: "OFI-001", name: "Resma papel bond A4", categoryIndex: 1, supplierIndex: 3, unit: "paquete", costPrice: 12, sellPrice: 19, currentStock: 60, minStock: 20 },
  { sku: "OFI-002", name: "Archivador de palanca", categoryIndex: 1, supplierIndex: 3, unit: "unidad", costPrice: 4, sellPrice: 8, currentStock: 3, minStock: 15 },
  { sku: "OFI-003", name: "Set de lapiceros (12u)", categoryIndex: 1, supplierIndex: 3, unit: "caja", costPrice: 9, sellPrice: 16, currentStock: 34, minStock: 10 },
  { sku: "OFI-004", name: "Grapadora industrial", categoryIndex: 1, supplierIndex: 3, unit: "unidad", costPrice: 22, sellPrice: 38, currentStock: 12, minStock: 8 },
  { sku: "LIM-001", name: "Detergente líquido 5L", categoryIndex: 2, supplierIndex: 2, unit: "bidón", costPrice: 15, sellPrice: 26, currentStock: 25, minStock: 10 },
  { sku: "LIM-002", name: "Guantes de látex (caja 100u)", categoryIndex: 2, supplierIndex: 2, unit: "caja", costPrice: 8, sellPrice: 14, currentStock: 4, minStock: 12 },
  { sku: "LIM-003", name: "Desinfectante en spray", categoryIndex: 2, supplierIndex: 2, unit: "unidad", costPrice: 5, sellPrice: 11, currentStock: 48, minStock: 15 },
  { sku: "ALI-001", name: "Café molido 500g", categoryIndex: 3, supplierIndex: 4, unit: "paquete", costPrice: 10, sellPrice: 18, currentStock: 30, minStock: 12 },
  { sku: "ALI-002", name: "Azúcar rubia 1kg", categoryIndex: 3, supplierIndex: 4, unit: "paquete", costPrice: 3, sellPrice: 6, currentStock: 2, minStock: 20 },
  { sku: "ALI-003", name: "Agua mineral (paquete 12u)", categoryIndex: 3, supplierIndex: 4, unit: "paquete", costPrice: 9, sellPrice: 15, currentStock: 55, minStock: 20 },
  { sku: "FER-001", name: "Taladro percutor 650W", categoryIndex: 4, supplierIndex: 0, unit: "unidad", costPrice: 140, sellPrice: 210, currentStock: 7, minStock: 5 },
  { sku: "FER-002", name: "Juego de destornilladores", categoryIndex: 4, supplierIndex: 0, unit: "set", costPrice: 20, sellPrice: 35, currentStock: 18, minStock: 8 },
  { sku: "FER-003", name: "Cinta métrica 5m", categoryIndex: 4, supplierIndex: 0, unit: "unidad", costPrice: 4, sellPrice: 9, currentStock: 40, minStock: 15 },
  { sku: "FER-004", name: "Guantes de trabajo", categoryIndex: 4, supplierIndex: 0, unit: "par", costPrice: 6, sellPrice: 12, currentStock: 1, minStock: 10 },
];

async function main() {
  console.log("Seeding StockFlow database...");

  const passwordHash = await bcrypt.hash("Stockflow2026!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@stockflow.com" },
    update: {},
    create: { name: "Admin Principal", email: "admin@stockflow.com", passwordHash, role: Role.ADMIN },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@stockflow.com" },
    update: {},
    create: { name: "Gestora de Inventario", email: "manager@stockflow.com", passwordHash, role: Role.MANAGER },
  });

  const employee = await prisma.user.upsert({
    where: { email: "empleado@stockflow.com" },
    update: {},
    create: { name: "Empleado de Almacén", email: "empleado@stockflow.com", passwordHash, role: Role.EMPLOYEE },
  });

  const categories = [];
  for (const c of CATEGORY_DATA) {
    categories.push(await prisma.category.upsert({ where: { name: c.name }, update: {}, create: c }));
  }

  const suppliers = [];
  for (const s of SUPPLIER_DATA) {
    const existing = await prisma.supplier.findFirst({ where: { name: s.name } });
    suppliers.push(existing ?? (await prisma.supplier.create({ data: s })));
  }

  await prisma.businessSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      businessName: "StockFlow Demo S.A.C.",
      taxId: "20600112233",
      address: "Av. Principal 123, Lima, Perú",
      phone: "+51 987 000 111",
      email: "contacto@stockflowdemo.com",
      currency: "PEN",
    },
  });

  const products = [];
  for (const p of PRODUCT_DATA) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        costPrice: p.costPrice,
        sellPrice: p.sellPrice,
        currentStock: p.currentStock,
        minStock: p.minStock,
        categoryId: categories[p.categoryIndex].id,
        supplierId: suppliers[p.supplierIndex].id,
      },
    });
    products.push(product);
  }

  const existingMovements = await prisma.stockMovement.count();
  if (existingMovements === 0) {
    console.log("Generating 30-day movement history...");
    const authors = [admin.id, manager.id, employee.id];
    const now = Date.now();

    for (const product of products) {
      let runningStock = Math.max(product.currentStock - 40, 0);
      const numMovements = 6 + Math.floor(Math.random() * 6);

      for (let i = numMovements; i >= 1; i--) {
        const daysAgo = Math.floor((i / numMovements) * 29) + Math.floor(Math.random() * 2);
        const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
        const isLast = i === 1;
        const type: MovementType = isLast ? MovementType.IN : (Math.random() > 0.35 ? MovementType.IN : MovementType.OUT);

        let quantity = 3 + Math.floor(Math.random() * 15);
        if (type === MovementType.OUT) {
          quantity = Math.min(quantity, runningStock);
          if (quantity <= 0) continue;
        }
        const quantityBefore = runningStock;
        const quantityAfter = type === MovementType.OUT ? runningStock - quantity : runningStock + quantity;
        runningStock = quantityAfter;

        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            type,
            quantity,
            quantityBefore,
            quantityAfter,
            unitCost: type === MovementType.IN ? product.costPrice : null,
            reason: type === MovementType.IN ? "Reposición de stock" : "Venta / consumo interno",
            reference: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
            userId: authors[Math.floor(Math.random() * authors.length)],
            createdAt,
          },
        });
      }

      // Reconcile final stock to the product's declared currentStock via an adjustment if needed.
      if (runningStock !== product.currentStock) {
        const diff = product.currentStock - runningStock;
        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            type: MovementType.ADJUSTMENT,
            quantity: Math.abs(diff),
            quantityBefore: runningStock,
            quantityAfter: product.currentStock,
            reason: "Ajuste de inventario inicial (seed)",
            userId: admin.id,
            createdAt: new Date(now - 12 * 60 * 60 * 1000),
          },
        });
      }
    }
  }

  console.log("Seed completed.");
  console.log("Login de prueba -> admin@stockflow.com / manager@stockflow.com / empleado@stockflow.com");
  console.log("Password (todos): Stockflow2026!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
