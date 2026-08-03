import type { Role } from "./types";

/** Mirrors the server-side RBAC matrix in server/src/middlewares/auth.middleware.ts usage across routes. */
export const permissions = {
  canManageCatalog: (role: Role) => role === "ADMIN" || role === "MANAGER",
  canViewReports: (role: Role) => role === "ADMIN" || role === "MANAGER",
  canManageUsers: (role: Role) => role === "ADMIN",
  canManageSettings: (role: Role) => role === "ADMIN",
  canRegisterMovements: (_role: Role) => true,
  canManageCash: (role: Role) => role === "ADMIN",
  canViewCashLedger: (role: Role) => role === "ADMIN" || role === "MANAGER",
};
