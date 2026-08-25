import type { AuthUser, Role } from "./types";

export const ROLE_LABEL: Record<Role, string> = {
  SUPERADMIN: "SuperAdmin SaaS",
  ADMIN: "Administrador",
  MANAGER: "Administrador",
  EMPLOYEE: "Empleado",
};

/** Mirrors the server-side RBAC matrix in server/src/middlewares/auth.middleware.ts usage across routes. */
export const permissions = {
  canManageCatalog: (userOrRole: AuthUser | Role) => {
    if (typeof userOrRole === "string") {
      return userOrRole === "ADMIN" || userOrRole === "SUPERADMIN";
    }
    return (
      userOrRole.role === "ADMIN" ||
      userOrRole.role === "SUPERADMIN" ||
      (userOrRole.role === "EMPLOYEE" && Boolean(userOrRole.canCreateProducts))
    );
  },

  canViewReports: (role: Role) => role === "ADMIN" || role === "SUPERADMIN",
  canManageUsers: (role: Role) => role === "ADMIN" || role === "SUPERADMIN",
  canManageSettings: (role: Role) => role === "ADMIN" || role === "SUPERADMIN",
  canRegisterMovements: (_role: Role) => true,
  canManageCash: (_role: Role) => true,
  canViewCashLedger: (role: Role) => role === "ADMIN" || role === "SUPERADMIN",
  
  canViewDashboard: (role: Role) => role === "ADMIN" || role === "SUPERADMIN",
  canViewProducts: (role: Role) => role === "ADMIN" || role === "EMPLOYEE" || role === "SUPERADMIN",
  canViewCategories: (role: Role) => role === "ADMIN" || role === "SUPERADMIN",
  canViewSuppliers: (role: Role) => role === "ADMIN" || role === "SUPERADMIN",
  canViewStockMovements: (role: Role) => role === "ADMIN" || role === "EMPLOYEE" || role === "SUPERADMIN",
  canViewPhysicalInventory: (role: Role) => role === "ADMIN" || role === "EMPLOYEE" || role === "SUPERADMIN",
  canViewSales: (role: Role) => role === "ADMIN" || role === "EMPLOYEE" || role === "SUPERADMIN",
  canViewPurchases: (role: Role) => role === "ADMIN" || role === "EMPLOYEE" || role === "SUPERADMIN",
  canViewCash: (role: Role) => role === "ADMIN" || role === "EMPLOYEE" || role === "SUPERADMIN",
  canViewCustomers: (_role: Role) => true,
  canViewSuperAdmin: (role: Role) => role === "SUPERADMIN",
};

