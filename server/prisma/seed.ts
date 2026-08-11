import "dotenv/config";
import { PrismaClient, Role, MovementType, LocalStatus } from "@prisma/client";
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
  { name: "Distribuidora Andina S.A.", contactName: "Carla Rojas", email: "ventas@andina.com", phone: "+54 11 4444 1111", address: "Av. Corrientes 1234, Buenos Aires", taxId: "30-50123456-7" },
  { name: "TecnoImport Argentina", contactName: "Jorge Medina", email: "contacto@tecnoimport.ar", phone: "+54 11 4444 2222", address: "Av. Cabildo 500, Buenos Aires", taxId: "30-50987654-3" },
  { name: "Suministros del Sur", contactName: "Ana Flores", email: "info@suministros-sur.com", phone: "+54 11 4444 3333", address: "Av. Belgrano 88, Rosario", taxId: "30-51234567-8" },
  { name: "Global Office Supplies", contactName: "Marco Vidal", email: "sales@globaloffice.ar", phone: "+54 11 4444 4444", address: "Av. Santa Fe 200, Córdoba", taxId: "30-51876543-2" },
  { name: "AgroFoods Argentina", contactName: "Lucía Chávez", email: "pedidos@agrofoods.ar", phone: "+54 11 4444 5555", address: "Av. Rivadavia 900, Mendoza", taxId: "30-52345678-9" },
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
  { sku: "ELE-001", name: "Mouse inalámbrico Logitech", categoryIndex: 0, supplierIndex: 1, unit: "unidad", costPrice: 15000, sellPrice: 28000, currentStock: 42, minStock: 15 },
  { sku: "ELE-002", name: "Teclado mecánico RGB", categoryIndex: 0, supplierIndex: 1, unit: "unidad", costPrice: 45000, sellPrice: 78000, currentStock: 8, minStock: 10 },
  { sku: "ELE-003", name: "Monitor LED 24 Full HD", categoryIndex: 0, supplierIndex: 1, unit: "unidad", costPrice: 180000, sellPrice: 270000, currentStock: 5, minStock: 6 },
  { sku: "ELE-004", name: "Cable HDMI 2m Trenzado", categoryIndex: 0, supplierIndex: 1, unit: "unidad", costPrice: 4500, sellPrice: 9500, currentStock: 120, minStock: 30 },
  { sku: "OFI-001", name: "Resma papel bond A4 75g", categoryIndex: 1, supplierIndex: 3, unit: "paquete", costPrice: 5200, sellPrice: 8900, currentStock: 60, minStock: 20 },
  { sku: "OFI-002", name: "Archivador de palanca Oficio", categoryIndex: 1, supplierIndex: 3, unit: "unidad", costPrice: 2400, sellPrice: 4800, currentStock: 3, minStock: 15 },
  { sku: "OFI-003", name: "Set de lapiceros Bic (12u)", categoryIndex: 1, supplierIndex: 3, unit: "caja", costPrice: 3800, sellPrice: 6500, currentStock: 34, minStock: 10 },
  { sku: "OFI-004", name: "Abrochadora industrial", categoryIndex: 1, supplierIndex: 3, unit: "unidad", costPrice: 12000, sellPrice: 21000, currentStock: 12, minStock: 8 },
  { sku: "LIM-001", name: "Detergente líquido 5L", categoryIndex: 2, supplierIndex: 2, unit: "bidón", costPrice: 8500, sellPrice: 14500, currentStock: 25, minStock: 10 },
  { sku: "LIM-002", name: "Guantes de látex (caja 100u)", categoryIndex: 2, supplierIndex: 2, unit: "caja", costPrice: 4500, sellPrice: 7900, currentStock: 4, minStock: 12 },
  { sku: "LIM-003", name: "Desinfectante en spray 400ml", categoryIndex: 2, supplierIndex: 2, unit: "unidad", costPrice: 2800, sellPrice: 4900, currentStock: 48, minStock: 15 },
  { sku: "ALI-001", name: "Café molido gourmet 500g", categoryIndex: 3, supplierIndex: 4, unit: "paquete", costPrice: 6500, sellPrice: 11200, currentStock: 30, minStock: 12 },
  { sku: "ALI-002", name: "Azúcar paquete 1kg", categoryIndex: 3, supplierIndex: 4, unit: "paquete", costPrice: 1200, sellPrice: 2100, currentStock: 2, minStock: 20 },
  { sku: "ALI-003", name: "Agua mineral (pack 12u)", categoryIndex: 3, supplierIndex: 4, unit: "pack", costPrice: 5800, sellPrice: 9800, currentStock: 55, minStock: 20 },
  { sku: "FER-001", name: "Taladro percutor 650W", categoryIndex: 4, supplierIndex: 0, unit: "unidad", costPrice: 65000, sellPrice: 110000, currentStock: 7, minStock: 5 },
  { sku: "FER-002", name: "Juego destornilladores (6u)", categoryIndex: 4, supplierIndex: 0, unit: "set", costPrice: 12000, sellPrice: 22000, currentStock: 18, minStock: 8 },
  { sku: "FER-003", name: "Cinta métrica 5m Stanley", categoryIndex: 4, supplierIndex: 0, unit: "unidad", costPrice: 3500, sellPrice: 6800, currentStock: 40, minStock: 15 },
  { sku: "FER-004", name: "Guantes de trabajo reforzados", categoryIndex: 4, supplierIndex: 0, unit: "par", costPrice: 2500, sellPrice: 4900, currentStock: 1, minStock: 10 },
];

async function main() {
  console.log("Seeding Kipo SaaS Multi-tenant database...");

  const passwordHash = await bcrypt.hash("Stockflow2026!", 10);
  const superadminPassword = await bcrypt.hash("KipoSuperadmin2026!", 10);

  // 1. Create SuperAdmin User
  await prisma.user.upsert({
    where: { email: "superadmin@kipo.com" },
    update: {},
    create: {
      name: "SuperAdmin Kipo",
      email: "superadmin@kipo.com",
      passwordHash: superadminPassword,
      role: Role.SUPERADMIN,
    },
  });

  // 2. Seed base Plans (same fixed ids the "dynamic_plans" migration backfills onto)
  await prisma.plan.upsert({
    where: { id: "plan-trial" },
    update: {},
    create: {
      id: "plan-trial",
      name: "Prueba Gratis",
      description: "Prueba gratuita de 7 días con acceso completo a las funciones básicas.",
      monthlyPrice: 0,
      maxAdmins: 1,
      maxEmployees: 3,
      isTrial: true,
      trialDays: 7,
      sortOrder: 0,
      features: ["Acceso completo por 7 días", "1 Administrador y 3 Empleados", "Sin necesidad de tarjeta de crédito"],
    },
  });
  const planBasico = await prisma.plan.upsert({
    where: { id: "plan-basico" },
    update: {},
    create: {
      id: "plan-basico",
      name: "Kipo Básico",
      description: "Ideal para gestionar el inventario del día a día y tener control claro de tus entradas y salidas.",
      monthlyPrice: 24900,
      maxAdmins: 1,
      maxEmployees: 3,
      sortOrder: 1,
      features: [
        "Incluye 1 Administrador y 3 Empleados",
        "Gestor de Productos y Categorías",
        "Registro de Proveedores",
        "Movimientos de stock básicos (Entradas/Salidas)",
        "Registro de Ventas y Compras",
        "Gestión básica de Clientes",
        "Soporte estándar por Email",
      ],
    },
  });
  const planPro = await prisma.plan.upsert({
    where: { id: "plan-pro" },
    update: {},
    create: {
      id: "plan-pro",
      name: "Kipo Pro",
      description: "La solución completa para maximizar ganancias, auditar caja y tomar decisiones basadas en datos reales.",
      monthlyPrice: 39900,
      maxAdmins: 2,
      maxEmployees: 6,
      isRecommended: true,
      sortOrder: 2,
      features: [
        "Incluye 2 Administradores y 6 Empleados",
        "Todo lo incluido en Kipo Básico",
        "Control de Inventario Físico (Auditorías y conteo rápido)",
        "Gestión y control de Caja diaria",
        "Módulo completo de Reportes e Historial",
        "Estadísticas avanzadas de rendimiento",
        "Análisis de Rentabilidad (Márgenes de ganancia e indicadores clave)",
        "Gestión multiusuario y asignación de roles",
        "Soporte prioritario 24/7",
      ],
    },
  });

  // 3. Create Demo Local (ID 1 / demo-local-1)
  const demoDueDate = new Date();
  demoDueDate.setDate(demoDueDate.getDate() + 30);

  const localDemo = await prisma.local.upsert({
    where: { id: "demo-local-1" },
    update: {
      status: LocalStatus.ACTIVE,
      dueDate: demoDueDate,
    },
    create: {
      id: "demo-local-1",
      name: "Kipo Demo Store (Local 1)",
      ownerEmail: "admin@stockflow.com",
      planId: planPro.id,
      status: LocalStatus.ACTIVE,
      dueDate: demoDueDate,
      monthlyPrice: 39900,
    },
  });

  // 4. Create Additional Sample Locales for SuperAdmin view
  const local2DueDate = new Date();
  local2DueDate.setDate(local2DueDate.getDate() + 15);
  await prisma.local.upsert({
    where: { id: "local-2-nordelta" },
    update: {},
    create: {
      id: "local-2-nordelta",
      name: "Ferretería Nordelta",
      ownerEmail: "contacto@nordeltaferro.com",
      planId: planBasico.id,
      status: LocalStatus.ACTIVE,
      dueDate: local2DueDate,
      monthlyPrice: 24900,
    },
  });

  const local3DueDate = new Date();
  local3DueDate.setDate(local3DueDate.getDate() - 2);
  await prisma.local.upsert({
    where: { id: "local-3-cordoba" },
    update: {},
    create: {
      id: "local-3-cordoba",
      name: "Market Córdoba Centro",
      ownerEmail: "gerencia@marketcordoba.com",
      planId: planPro.id,
      status: LocalStatus.SUSPENDED,
      dueDate: local3DueDate,
      monthlyPrice: 39900,
    },
  });

  // 4. Create Users for Local 1
  const admin = await prisma.user.upsert({
    where: { email: "admin@stockflow.com" },
    update: { localId: localDemo.id },
    create: {
      localId: localDemo.id,
      name: "Admin Principal (Local 1)",
      email: "admin@stockflow.com",
      passwordHash,
      role: Role.ADMIN,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@stockflow.com" },
    update: { localId: localDemo.id },
    create: {
      localId: localDemo.id,
      name: "Gestora de Inventario",
      email: "manager@stockflow.com",
      passwordHash,
      role: Role.MANAGER,
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: "empleado@stockflow.com" },
    update: { localId: localDemo.id },
    create: {
      localId: localDemo.id,
      name: "Empleado de Almacén",
      email: "empleado@stockflow.com",
      passwordHash,
      role: Role.EMPLOYEE,
    },
  });

  // 5. Create Categories for Local 1
  const categories = [];
  for (const c of CATEGORY_DATA) {
    const cat = await prisma.category.upsert({
      where: { localId_name: { localId: localDemo.id, name: c.name } },
      update: {},
      create: { ...c, localId: localDemo.id },
    });
    categories.push(cat);
  }

  // 6. Create Suppliers for Local 1
  const suppliers = [];
  for (const s of SUPPLIER_DATA) {
    const existing = await prisma.supplier.findFirst({
      where: { localId: localDemo.id, name: s.name },
    });
    suppliers.push(existing ?? (await prisma.supplier.create({ data: { ...s, localId: localDemo.id } })));
  }

  // 7. Create BusinessSettings for Local 1
  await prisma.businessSettings.upsert({
    where: { localId: localDemo.id },
    update: {},
    create: {
      localId: localDemo.id,
      businessName: "Kipo Demo Store S.A.S.",
      taxId: "30-71600112-9",
      address: "Av. Santa Fe 1500, Buenos Aires, Argentina",
      phone: "+54 11 5555 1234",
      email: "contacto@kipo.com.ar",
    },
  });

  // 8. Create CashRegister for Local 1
  await prisma.cashRegister.upsert({
    where: { localId: localDemo.id },
    update: {},
    create: {
      localId: localDemo.id,
      currentBalance: 125000,
    },
  });

  // 9. Create Products for Local 1
  const products = [];
  for (const p of PRODUCT_DATA) {
    const product = await prisma.product.upsert({
      where: { localId_sku: { localId: localDemo.id, sku: p.sku } },
      update: {},
      create: {
        localId: localDemo.id,
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

  // 10. Generate Fake 30-Day Movement History & Sales for Local 1
  const existingMovements = await prisma.stockMovement.count({ where: { localId: localDemo.id } });
  if (existingMovements === 0) {
    console.log("Generating 30-day movement & sales history for Local 1...");
    const authors = [admin.id, manager.id, employee.id];
    const now = Date.now();

    for (const product of products) {
      let runningStock = Math.max(product.currentStock - 40, 0);
      const numMovements = 6 + Math.floor(Math.random() * 6);

      for (let i = numMovements; i >= 1; i--) {
        const daysAgo = Math.floor((i / numMovements) * 29) + Math.floor(Math.random() * 2);
        const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
        const isLast = i === 1;
        const type: MovementType = isLast ? MovementType.IN : Math.random() > 0.35 ? MovementType.IN : MovementType.OUT;

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
            localId: localDemo.id,
            productId: product.id,
            type,
            quantity,
            quantityBefore,
            quantityAfter,
            unitCost: type === MovementType.IN ? product.costPrice : null,
            reason: type === MovementType.IN ? "Reposición de stock" : "Venta registrada",
            reference: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
            userId: authors[Math.floor(Math.random() * authors.length)],
            createdAt,
          },
        });
      }
    }
  }

  console.log("Seed completed successfully!");
  console.log("-----------------------------------------");
  console.log("SuperAdmin -> superadmin@kipo.com / KipoSuperadmin2026!");
  console.log("Local 1 Admin -> admin@stockflow.com / Stockflow2026!");
  console.log("Local 1 Manager -> manager@stockflow.com / Stockflow2026!");
  console.log("Local 1 Employee -> empleado@stockflow.com / Stockflow2026!");
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
