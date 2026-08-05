import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { api } from "./client";
import type { 
  Product, Category, DashboardSummary, AuthUser, Sale, Paginated,
  Supplier, CashShift, CashMovement, CashRegisterStatus, CashSummary,
  Purchase, InventoryCount, ManagedUser, BusinessSettings, StockMovement
} from "../lib/types";

// Helper para carga de estado
const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const saved = localStorage.getItem(`mock_${key}`);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = (key: string, value: any) => {
  try {
    localStorage.setItem(`mock_${key}`, JSON.stringify(value));
  } catch (e) {
    console.warn("No se pudo guardar en localStorage", e);
  }
};

export function setupMockServer() {
  console.log("🚀 MOCK SERVER INICIADO - Usando datos de prueba de Argentina completos");
  const mock = new MockAdapter(api, { delayResponse: 500 });
  const globalMock = new MockAdapter(axios, { delayResponse: 500 });

  // --- DATOS INICIALES ---
  const initialCategories: Category[] = [
    { id: "cat-1", name: "Almacén", description: "Productos de almacén en general", color: "#f59e0b", isActive: true, createdAt: new Date().toISOString() },
    { id: "cat-2", name: "Kiosco", description: "Golosinas y snacks", color: "#ec4899", isActive: true, createdAt: new Date().toISOString() },
    { id: "cat-3", name: "Bebidas", description: "Bebidas con y sin alcohol", color: "#3b82f6", isActive: true, createdAt: new Date().toISOString() }
  ];

  const initialSuppliers: Supplier[] = [
    { id: "sup-1", name: "Distribuidora del Sur", contactName: "Juan Pérez", email: "ventas@delsur.com.ar", phone: "11-4567-8901", address: "Av. Corrientes 1234, CABA", taxId: "30-12345678-9", notes: "Entrega martes y jueves", isActive: true, createdAt: new Date().toISOString() },
    { id: "sup-2", name: "Mayorista Makro", contactName: "María López", email: "mayorista@makro.com.ar", phone: "11-9876-5432", address: "Panamericana Km 30", taxId: "30-87654321-0", notes: "Buscar pedido los viernes", isActive: true, createdAt: new Date().toISOString() }
  ];

  const initialProducts: Product[] = [
    { id: "prod-1", sku: "YM-PLAY-1K", barcode: "7791234567890", name: "Yerba Mate Playadito 1kg", description: "Yerba con palo", unit: "unidad", costPrice: 2500, sellPrice: 3200, currentStock: 45, minStock: 10, imageUrl: null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), categoryId: "cat-1", supplierId: "sup-1", category: { id: "cat-1", name: "Almacén", color: "#f59e0b" }, supplier: { id: "sup-1", name: "Distribuidora del Sur" } },
    { id: "prod-2", sku: "ALF-JOR-CHO", barcode: "7790987654321", name: "Alfajor Jorgito Chocolate", description: "Alfajor de chocolate relleno", unit: "unidad", costPrice: 400, sellPrice: 800, currentStock: 120, minStock: 30, imageUrl: null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), categoryId: "cat-2", supplierId: "sup-1", category: { id: "cat-2", name: "Kiosco", color: "#ec4899" }, supplier: { id: "sup-1", name: "Distribuidora del Sur" } },
    { id: "prod-3", sku: "FER-BRAN-750", barcode: "7791122334455", name: "Fernet Branca 750ml", description: "Bebida alcohólica", unit: "unidad", costPrice: 6500, sellPrice: 8900, currentStock: 25, minStock: 12, imageUrl: null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), categoryId: "cat-3", supplierId: "sup-2", category: { id: "cat-3", name: "Bebidas", color: "#3b82f6" }, supplier: { id: "sup-2", name: "Mayorista Makro" } },
    { id: "prod-4", sku: "DDL-SER-400", barcode: "7795544332211", name: "Dulce de Leche La Serenísima 400g", description: "Estilo Colonial", unit: "unidad", costPrice: 1500, sellPrice: 2200, currentStock: 15, minStock: 20, imageUrl: null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), categoryId: "cat-1", supplierId: "sup-1", category: { id: "cat-1", name: "Almacén", color: "#f59e0b" }, supplier: { id: "sup-1", name: "Distribuidora del Sur" } }
  ];

  const initialSettings: BusinessSettings = {
    id: "settings-1",
    businessName: "Kiosco & Almacén Demo",
    taxId: "20-12345678-9",
    address: "Calle Falsa 123, Buenos Aires",
    phone: "11-4444-5555",
    email: "contacto@negociodemo.com.ar",
    logoUrl: null,
    updatedAt: new Date().toISOString()
  };

  const initialUsers: ManagedUser[] = [
    { id: "user-1", name: "Demo Admin", email: "demo@sistemastock.ar", role: "ADMIN", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: "user-2", name: "Cajero Turno Tarde", email: "cajero@sistemastock.ar", role: "EMPLOYEE", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ];

  const mockUser: AuthUser = { id: "user-1", name: "Demo Admin", email: "demo@sistemastock.ar", role: "ADMIN" };

  const initialShifts: CashShift[] = [
    {
      id: "shift-1",
      openedById: mockUser.id,
      openedBy: { id: mockUser.id, name: mockUser.name },
      openedAt: new Date().toISOString(),
      openingCounted: 10000,
      openingExpected: 10000,
      openingDiscrepancy: 0,
      closedById: null,
      closedBy: null,
      closedAt: null,
      closingCounted: null,
      closingExpected: null,
      closingDiscrepancy: null,
      status: "OPEN",
      note: "Turno mañana demo"
    }
  ];

  let db = {
    categories: loadFromStorage("categories", initialCategories) as Category[],
    suppliers: loadFromStorage("suppliers", initialSuppliers) as Supplier[],
    products: loadFromStorage("products", initialProducts) as Product[],
    sales: loadFromStorage("sales", []) as Sale[],
    shifts: loadFromStorage("shifts", initialShifts) as CashShift[],
    movements: loadFromStorage("movements", []) as CashMovement[],
    stockMovements: loadFromStorage("stockMovements", []) as StockMovement[],
    purchases: loadFromStorage("purchases", []) as Purchase[],
    inventoryCounts: loadFromStorage("inventoryCounts", []) as InventoryCount[],
    settings: loadFromStorage("settings", initialSettings) as BusinessSettings,
    users: loadFromStorage("users", initialUsers) as ManagedUser[],
  };

  const persist = () => {
    saveToStorage("categories", db.categories);
    saveToStorage("suppliers", db.suppliers);
    saveToStorage("products", db.products);
    saveToStorage("sales", db.sales);
    saveToStorage("shifts", db.shifts);
    saveToStorage("movements", db.movements);
    saveToStorage("stockMovements", db.stockMovements);
    saveToStorage("purchases", db.purchases);
    saveToStorage("inventoryCounts", db.inventoryCounts);
    saveToStorage("settings", db.settings);
    saveToStorage("users", db.users);
  };

  // ----- AUTH -----
  mock.onPost("/auth/login").reply(200, { accessToken: "mock-token", user: mockUser });
  mock.onPost("/auth/refresh").reply(200, { accessToken: "mock-token", user: mockUser });
  globalMock.onPost(/\/auth\/refresh/).reply(200, { accessToken: "mock-token", user: mockUser });
  mock.onGet("/auth/me").reply(200, { user: mockUser });
  mock.onPost("/auth/logout").reply(200, { success: true });

  // ----- DASHBOARD -----
  mock.onGet("/dashboard/summary").reply(200, {
    kpis: {
      totalProducts: db.products.length,
      totalStockValue: db.products.reduce((acc, p) => acc + (p.currentStock * p.costPrice), 0),
      lowStockCount: db.products.filter(p => p.currentStock <= p.minStock).length,
      movementsToday: db.stockMovements.length,
      salesToday: db.sales.length,
      cashBalance: db.shifts.find(s => s.status === "OPEN") ? 150000 : 0,
      profitToday: 25000,
      unitsSoldToday: 15,
      avgTicketToday: db.sales.length ? 5000 : 0,
      noMovementCount: 1
    },
    alerts: {
      lowStock: db.products.filter(p => p.currentStock <= p.minStock).map(p => ({ productId: p.id, name: p.name, sku: p.sku, currentStock: p.currentStock, minStock: p.minStock })),
      noMovement: [],
      noSupplier: db.products.filter(p => !p.supplierId).map(p => ({ productId: p.id, name: p.name, sku: p.sku }))
    },
    recentActivity: db.stockMovements.slice(0, 5)
  } as DashboardSummary);

  // ----- PRODUCTS -----
  mock.onGet(/\/products\/.+/).reply(config => {
    const id = config.url?.split("/").pop();
    const product = db.products.find(p => p.id === id);
    if (!product) return [404, { message: "Producto no encontrado" }];
    return [200, { product }];
  });

  mock.onGet("/products").reply(config => {
    const paginated: Paginated<Product> = {
      items: db.products,
      pagination: { page: 1, limit: 100, total: db.products.length, totalPages: 1 }
    };
    return [200, paginated];
  });

  mock.onPost("/products").reply(config => {
    const input = JSON.parse(config.data);
    const newProduct: Product = {
      ...input,
      id: `prod-${Date.now()}`,
      currentStock: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: db.categories.find(c => c.id === input.categoryId) || null,
      supplier: db.suppliers.find(s => s.id === input.supplierId) || null
    };
    db.products.push(newProduct);
    persist();
    return [201, { product: newProduct }];
  });

  // ----- CATEGORIES -----
  mock.onGet("/categories").reply(200, db.categories);

  // ----- SUPPLIERS -----
  mock.onGet("/suppliers").reply(200, { items: db.suppliers });
  mock.onPost("/suppliers").reply(config => {
    const input = JSON.parse(config.data);
    const newSupplier: Supplier = { ...input, id: `sup-${Date.now()}`, isActive: true, createdAt: new Date().toISOString() };
    db.suppliers.push(newSupplier);
    persist();
    return [201, { supplier: newSupplier }];
  });

  // ----- CASH (CAJA) -----
  mock.onGet("/cash/status").reply(() => {
    const currentShift = db.shifts.find(s => s.status === "OPEN") || null;
    return [200, { currentBalance: 150000, myOpenShift: currentShift } as CashRegisterStatus];
  });
  mock.onGet("/cash/summary").reply(200, { currentBalance: 150000, salesInToday: 25000, withdrawalsToday: 5000 } as CashSummary);
  mock.onGet("/cash/shifts").reply(200, { items: db.shifts, pagination: { page: 1, limit: 10, total: db.shifts.length, totalPages: 1 } });
  mock.onGet("/cash/movements").reply(200, { items: db.movements, pagination: { page: 1, limit: 10, total: db.movements.length, totalPages: 1 } });
  mock.onGet("/cash/withdrawals").reply(200, { items: db.movements.filter(m => m.type === "WITHDRAWAL"), pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } });
  
  mock.onPost("/cash/shifts/open").reply(config => {
    const input = JSON.parse(config.data);
    const newShift: CashShift = {
      id: `shift-${Date.now()}`,
      openedById: mockUser.id,
      openedBy: { id: mockUser.id, name: mockUser.name },
      openedAt: new Date().toISOString(),
      openingCounted: input.countedAmount,
      openingExpected: input.countedAmount,
      openingDiscrepancy: 0,
      closedById: null, closedBy: null, closedAt: null, closingCounted: null, closingExpected: null, closingDiscrepancy: null,
      status: "OPEN",
      note: input.note || null
    };
    db.shifts.unshift(newShift);
    persist();
    return [200, { shift: newShift }];
  });
  
  mock.onPost(/\/cash\/shifts\/.*\/close/).reply(config => {
    const shift = db.shifts.find(s => s.status === "OPEN");
    if(shift) shift.status = "CLOSED";
    persist();
    return [200, { shift }];
  });

  mock.onPost("/cash/withdrawals").reply(config => {
    const input = JSON.parse(config.data);
    const movement: CashMovement = {
      id: `mov-${Date.now()}`, type: "WITHDRAWAL", amount: input.amount, balanceBefore: 150000, balanceAfter: 150000 - input.amount,
      saleId: null, userId: mockUser.id, user: { id: mockUser.id, name: mockUser.name }, note: input.note, createdAt: new Date().toISOString()
    };
    db.movements.unshift(movement);
    persist();
    return [201, { movement }];
  });

  // ----- SALES -----
  mock.onGet("/sales").reply(200, { items: db.sales, pagination: { page: 1, limit: 100, total: db.sales.length, totalPages: 1 } });
  mock.onPost("/sales").reply(config => {
    const input = JSON.parse(config.data);
    const newSale: Sale = { ...input, id: `sale-${Date.now()}`, status: "COMPLETED", createdAt: new Date().toISOString(), user: mockUser };
    db.sales.unshift(newSale);
    persist();
    return [201, { sale: newSale }];
  });

  // ----- PURCHASES -----
  mock.onGet("/purchases").reply(200, { items: db.purchases, pagination: { page: 1, limit: 100, total: db.purchases.length, totalPages: 1 } });
  
  // ----- INVENTORY COUNTS -----
  mock.onGet("/inventory-counts").reply(200, { items: db.inventoryCounts, pagination: { page: 1, limit: 100, total: db.inventoryCounts.length, totalPages: 1 } });

  // ----- SETTINGS -----
  mock.onGet("/settings").reply(200, db.settings);
  mock.onPut("/settings").reply(config => {
    const input = JSON.parse(config.data);
    db.settings = { ...db.settings, ...input, updatedAt: new Date().toISOString() };
    persist();
    return [200, db.settings];
  });

  // ----- USERS -----
  mock.onGet(new RegExp(".*/users.*")).reply(200, { items: db.users, pagination: { page: 1, limit: 100, total: db.users.length, totalPages: 1 } });

  // ----- REPORTS -----
  mock.onGet(/\/reports\/stock-valuation/).reply(200, { rows: [], totals: { stockValue: 0, potentialRevenue: 0, units: 0 } });
  mock.onGet(/\/reports\/movements/).reply(200, { series: [], movements: [] });
  mock.onGet(/\/reports\/top-products/).reply(200, { items: [] });
  mock.onGet(/\/reports\/category-breakdown/).reply(200, { items: [] });
  mock.onGet(/\/reports\/sales-stats/).reply(200, {
    periods: { 
      today: { total: 0, count: 0, avgTicket: 0, profit: 0 },
      week: { total: 0, count: 0, avgTicket: 0, profit: 0 },
      month: { total: 0, count: 0, avgTicket: 0, profit: 0 },
      year: { total: 0, count: 0, avgTicket: 0, profit: 0 }
    },
    topProducts: [],
    topCategories: [],
    byEmployee: [],
    byPaymentMethod: []
  });
  mock.onGet(/\/reports\/profitability/).reply(200, {
    totals: { revenue: 0, cost: 0, grossProfit: 0, marginPercent: 0 },
    products: []
  });

  // ----- STOCK MOVEMENTS -----
  mock.onGet("/stock/movements").reply(200, { items: db.stockMovements, pagination: { page: 1, limit: 100, total: db.stockMovements.length, totalPages: 1 } });

  // ----- DEFAULT CATCH-ALL -----
  mock.onAny().reply(config => {
    console.warn(`[MOCK] Petición no interceptada: ${config.method?.toUpperCase()} ${config.url}`);
    // Respondemos success true para que la app no rompa con pantallas negras si falta algo
    return [200, { success: true, message: "Mock por defecto", items: [] }];
  });
}
