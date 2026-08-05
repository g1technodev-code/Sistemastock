import type { Role } from "./types";

/** Mirrors the server-side RBAC matrix in server/src/middlewares/auth.middleware.ts usage across routes. */
export const permissions = {
  // Catalog management: Admins can do anything. Employees can see products, but maybe not manage categories/suppliers
  canManageCatalog: (role: Role) => role === "ADMIN",
  canViewReports: (role: Role) => role === "ADMIN",
  canManageUsers: (role: Role) => role === "ADMIN",
  canManageSettings: (role: Role) => role === "ADMIN",
  canRegisterMovements: (_role: Role) => true,
  canManageCash: (role: Role) => true, // Employees can manage cash registers since they need to use "Caja"
  canViewCashLedger: (role: Role) => role === "ADMIN",
  
  // Specific menu visibility permissions
  canViewDashboard: (role: Role) => role === "ADMIN",
  canViewProducts: (role: Role) => role === "ADMIN" || role === "EMPLOYEE",
  canViewCategories: (role: Role) => role === "ADMIN",
  canViewSuppliers: (role: Role) => role === "ADMIN",
  canViewStockMovements: (role: Role) => role === "ADMIN" || role === "EMPLOYEE",
  canViewPhysicalInventory: (role: Role) => role === "ADMIN",
  canViewSales: (role: Role) => role === "ADMIN" || role === "EMPLOYEE",
  canViewPurchases: (role: Role) => role === "ADMIN" || role === "EMPLOYEE",
  canViewCash: (role: Role) => role === "ADMIN" || role === "EMPLOYEE",
};
