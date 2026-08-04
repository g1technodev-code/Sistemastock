import MockAdapter from "axios-mock-adapter";
import { api } from "./client";
import type { Product, Category, DashboardSummary, AuthUser, Sale, Paginated } from "../lib/types";

// Base de datos en memoria (intentamos cargar de localStorage primero)
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
  console.log("🚀 MOCK SERVER INICIADO - Usando datos de prueba de Argentina");
  const mock = new MockAdapter(api, { delayResponse: 500 });

  // 1. Datos iniciales simulados (Argentina)
  const initialCategories: Category[] = [
    { id: "cat-1", name: "Almacén", description: "Productos de almacén en general", color: "#f59e0b", isActive: true, createdAt: new Date().toISOString() },
    { id: "cat-2", name: "Kiosco", description: "Golosinas y snacks", color: "#ec4899", isActive: true, createdAt: new Date().toISOString() },
    { id: "cat-3", name: "Bebidas", description: "Bebidas con y sin alcohol", color: "#3b82f6", isActive: true, createdAt: new Date().toISOString() }
  ];

  const initialProducts: Product[] = [
    { id: "prod-1", sku: "YM-PLAY-1K", barcode: "7791234567890", name: "Yerba Mate Playadito 1kg", description: "Yerba con palo", unit: "unidad", costPrice: 2500, sellPrice: 3200, currentStock: 45, minStock: 10, imageUrl: null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), categoryId: "cat-1", supplierId: null, category: { id: "cat-1", name: "Almacén", color: "#f59e0b" }, supplier: null },
    { id: "prod-2", sku: "ALF-JOR-CHO", barcode: "7790987654321", name: "Alfajor Jorgito Chocolate", description: "Alfajor de chocolate relleno", unit: "unidad", costPrice: 400, sellPrice: 800, currentStock: 120, minStock: 30, imageUrl: null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), categoryId: "cat-2", supplierId: null, category: { id: "cat-2", name: "Kiosco", color: "#ec4899" }, supplier: null },
    { id: "prod-3", sku: "FER-BRAN-750", barcode: "7791122334455", name: "Fernet Branca 750ml", description: "Bebida alcohólica", unit: "unidad", costPrice: 6500, sellPrice: 8900, currentStock: 25, minStock: 12, imageUrl: null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), categoryId: "cat-3", supplierId: null, category: { id: "cat-3", name: "Bebidas", color: "#3b82f6" }, supplier: null },
    { id: "prod-4", sku: "DDL-SER-400", barcode: "7795544332211", name: "Dulce de Leche La Serenísima 400g", description: "Estilo Colonial", unit: "unidad", costPrice: 1500, sellPrice: 2200, currentStock: 15, minStock: 20, imageUrl: null, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), categoryId: "cat-1", supplierId: null, category: { id: "cat-1", name: "Almacén", color: "#f59e0b" }, supplier: null }
  ];

  let db = {
    categories: loadFromStorage("categories", initialCategories) as Category[],
    products: loadFromStorage("products", initialProducts) as Product[],
    sales: loadFromStorage("sales", []) as Sale[],
  };

  const persist = () => {
    saveToStorage("categories", db.categories);
    saveToStorage("products", db.products);
    saveToStorage("sales", db.sales);
  };

  // ----- AUTH -----
  const mockUser: AuthUser = { id: "user-1", name: "Demo Admin", email: "demo@sistemastock.ar", role: "ADMIN" };
  mock.onPost("/auth/login").reply(200, { accessToken: "mock-token", user: mockUser });
  mock.onPost("/auth/refresh").reply(200, { accessToken: "mock-token", user: mockUser });
  mock.onGet("/auth/me").reply(200, { user: mockUser });
  mock.onPost("/auth/logout").reply(200, { success: true });

  // ----- DASHBOARD -----
  mock.onGet("/dashboard").reply(200, {
    kpis: {
      totalProducts: db.products.length,
      totalStockValue: db.products.reduce((acc, p) => acc + (p.currentStock * p.costPrice), 0),
      lowStockCount: db.products.filter(p => p.currentStock <= p.minStock).length,
      movementsToday: 5,
      salesToday: db.sales.length,
      cashBalance: 150000,
      profitToday: 25000,
      unitsSoldToday: 15,
      avgTicketToday: db.sales.length ? 5000 : 0,
      noMovementCount: 1
    },
    alerts: {
      lowStock: db.products.filter(p => p.currentStock <= p.minStock).map(p => ({ productId: p.id, name: p.name, sku: p.sku, currentStock: p.currentStock, minStock: p.minStock })),
      noMovement: [],
      noSupplier: []
    },
    recentActivity: []
  } as DashboardSummary);

  // ----- PRODUCTS -----
  mock.onGet(/\/products\/.+/).reply(config => {
    const id = config.url?.split("/").pop();
    const product = db.products.find(p => p.id === id);
    if (!product) return [404, { message: "Producto no encontrado" }];
    return [200, { product }];
  });

  mock.onGet("/products").reply(config => {
    // Filtrado simple mockeado
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
      supplier: null
    };
    db.products.push(newProduct);
    persist();
    return [201, { product: newProduct }];
  });

  // ----- CATEGORIES -----
  mock.onGet("/categories").reply(200, db.categories);

  // ----- SALES (Ventas simples) -----
  mock.onGet("/sales").reply(200, {
    items: db.sales,
    pagination: { page: 1, limit: 100, total: db.sales.length, totalPages: 1 }
  });

  mock.onPost("/sales").reply(config => {
    const input = JSON.parse(config.data);
    const newSale: Sale = {
      ...input,
      id: `sale-${Date.now()}`,
      status: "COMPLETED",
      createdAt: new Date().toISOString(),
      user: mockUser
    };
    db.sales.unshift(newSale);
    persist();
    return [201, { sale: newSale }];
  });

  // Default catch-all
  mock.onAny().reply(config => {
    console.warn(`[MOCK] Petición no interceptada: ${config.method?.toUpperCase()} ${config.url}`);
    return [200, { success: true, message: "Mock por defecto" }];
  });
}
