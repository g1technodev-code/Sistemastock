import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Lock,
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  ArrowLeftRight,
  ShoppingCart,
  ShoppingBag,
  ClipboardCheck,
  Wallet,
  BarChart3,
  LineChart,
  Percent,
  Users,
  Settings,
  Boxes,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  CreditCard,
  ShieldCheck,
  DollarSign,
  Megaphone,
  Sliders,
  Store,
  PackageSearch,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { permissions } from "../../lib/permissions";
import { cn } from "../../lib/utils";
import type { Role } from "../../lib/types";
import { hasFeature, type PlanFeature } from "../../lib/features";
import { listPublicPlans } from "../../api/plans";
import { useMySubscription } from "../../hooks/usePlans";
import { PWAInstallPrompt } from "../PWAInstallPrompt";




const COLLAPSE_STORAGE_KEY = "stockflow-sidebar-collapsed";

type NavItem = {

  to: string;
  label: string;
  icon: any;
  show: (role: any) => boolean;
  shortcut?: string;
  feature?: PlanFeature;
};

const SUPERADMIN_NAV_ITEMS: NavItem[] = [
  { to: "/superadmin", label: "Panel Global", icon: ShieldCheck, show: () => true },
  { to: "/superadmin/pagos", label: "Pagos e Ingresos", icon: DollarSign, show: () => true },
  { to: "/superadmin/anuncios", label: "Anuncios Globales", icon: Megaphone, show: () => true },
  { to: "/superadmin/planes", label: "Configuración de Planes", icon: Sliders, show: () => true },
  { to: "/superadmin/rubros", label: "Rubros", icon: Store, show: () => true },
  { to: "/superadmin/catalogo", label: "Catálogo de Productos", icon: PackageSearch, show: () => true },
];

const TENANT_NAV_ITEMS: NavItem[] = [

  { to: "/dashboard", label: "Panel", icon: LayoutDashboard, show: permissions.canViewDashboard },
  { to: "/products", label: "Productos", icon: Package, show: permissions.canViewProducts },
  { to: "/categories", label: "Categorías", icon: Tags, show: permissions.canViewCategories },
  { to: "/suppliers", label: "Proveedores", icon: Truck, show: permissions.canViewSuppliers },
  { to: "/stock", label: "Movimientos de stock", icon: ArrowLeftRight, show: permissions.canViewStockMovements },
  { to: "/inventario-fisico", label: "Inventario físico", icon: ClipboardCheck, show: permissions.canViewPhysicalInventory, feature: "PHYSICAL_INVENTORY" },
  { to: "/ventas", label: "Ventas", icon: ShoppingCart, show: permissions.canViewSales, shortcut: "⇧V" },
  { to: "/compras", label: "Compras", icon: ShoppingBag, show: permissions.canViewPurchases, shortcut: "⇧X", feature: "PURCHASES" },
  { to: "/caja", label: "Caja", icon: Wallet, show: permissions.canViewCash, shortcut: "⇧C", feature: "CASH_REGISTER" },
  { to: "/customers", label: "Clientes", icon: Users, show: permissions.canViewCustomers, feature: "CUSTOMERS" },
  { to: "/plans", label: "Suscripciones", icon: CreditCard, show: (role: Role) => role !== "EMPLOYEE" },

  { to: "/reports", label: "Reportes", icon: BarChart3, show: permissions.canViewReports, feature: "REPORTS" },
  { to: "/estadisticas", label: "Estadísticas", icon: LineChart, show: permissions.canViewReports, feature: "REPORTS" },
  { to: "/rentabilidad", label: "Rentabilidad", icon: Percent, show: permissions.canViewReports, feature: "REPORTS" },
  { to: "/users", label: "Usuarios", icon: Users, show: permissions.canManageUsers },
  { to: "/settings", label: "Configuración", icon: Settings, show: permissions.canManageSettings },
];



function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1";
}

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const { data: publicPlans } = useQuery({ queryKey: ["public-plans"], queryFn: listPublicPlans, enabled: !!user && user.role !== "SUPERADMIN" });
  const { data: subscription } = useMySubscription(!!user && user.role !== "SUPERADMIN" && !!user.localId);



  useEffect(() => {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  if (!user) return null;

  const rawItems = user.role === "SUPERADMIN" ? SUPERADMIN_NAV_ITEMS : TENANT_NAV_ITEMS;
  const items = rawItems.filter((item) => item.show(user.role));

  const isProPlan = subscription?.planName?.toLowerCase().includes("pro") ?? false;
  const subFeatures = subscription?.plan?.enabledFeatures ?? subscription?.plan?.features ?? [];

  function isItemLocked(feature?: PlanFeature): boolean {
    if (!feature) return false;
    if (user?.role === "SUPERADMIN") return false;
    if (isProPlan) return false;
    if (subFeatures.length > 0) return !subFeatures.includes(feature);
    return !hasFeature(user, feature);
  }

  function upgradePlanFor(feature: PlanFeature): string | null {
    const candidates = (publicPlans ?? []).filter((p) => {
      const feats = (p as any).enabledFeatures ?? p.features ?? [];
      return feats.includes(feature);
    });
    if (candidates.length === 0) return null;
    return [...candidates].sort((a, b) => a.monthlyPrice - b.monthlyPrice)[0].name;
  }



  function renderContent(isCollapsed: boolean) {
    return (
      <div className="flex h-full flex-col">
        <div className={cn("flex items-center gap-3 px-6 py-6", isCollapsed && "justify-center px-3")}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm dark:bg-neutral-900">
            <img src="/kipo-logo.png" alt="Kipo Logo" className="h-full w-full object-cover" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Kipo</span>
          )}
          <button
            onClick={onCloseMobile}
            className="ml-auto rounded-full p-2 text-neutral-400 hover:bg-neutral-100 lg:hidden dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-4 mt-2 overflow-y-auto">
          {items.map((item) => {
            const locked = isItemLocked(item.feature);
            const upgradePlan = locked && item.feature ? upgradePlanFor(item.feature) : null;
            return (
            <NavLink
              key={item.to}
              to={item.to}
              end
              onClick={onCloseMobile}

              title={
                isCollapsed
                  ? `${item.label}${item.shortcut ? ` (${item.shortcut})` : ""}${locked ? ` — requiere plan ${upgradePlan ?? "superior"}` : ""}`
                  : undefined
              }
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                  isCollapsed && "justify-center px-0",
                  locked && "opacity-60",
                  isActive
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400 shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-200",
                )
              }
            >
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", isCollapsed && "h-5 w-5")} strokeWidth={2.5} />
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {locked ? (
                    <span
                      className="flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
                      title={upgradePlan ? `Disponible en el plan ${upgradePlan}` : undefined}
                    >
                      <Lock className="h-3 w-3" />
                      {upgradePlan ?? "Plan superior"}
                    </span>
                  ) : (
                    item.shortcut && (
                      <kbd className="rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-500">
                        {item.shortcut}
                      </kbd>
                    )
                  )}
                </>
              )}
            </NavLink>
            );
          })}
          {!isCollapsed && (
            <div className="py-2 px-1">
              <PWAInstallPrompt />
            </div>
          )}

          <div className="pt-2">

            <button
              onClick={() => {
                onCloseMobile();
                logout();
              }}
              title={isCollapsed ? "Cerrar sesión" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-danger-600 transition-all duration-200 hover:bg-danger-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-500 dark:text-danger-400 dark:hover:bg-danger-500/10",
                isCollapsed && "justify-center px-0",
              )}
            >
              <LogOut className={cn("h-[18px] w-[18px] shrink-0", isCollapsed && "h-5 w-5")} strokeWidth={2.5} />
              {!isCollapsed && "Cerrar sesión"}
            </button>
          </div>
        </nav>
        <div className="hidden px-4 py-4 lg:block border-t border-neutral-100 dark:border-neutral-800/60">
          <button
            onClick={() => setCollapsed((v) => !v)}
            aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-200",
              isCollapsed && "justify-center px-0",
            )}
          >
            {isCollapsed ? <PanelLeftOpen className="h-5 w-5 shrink-0" strokeWidth={2.5} /> : <PanelLeftClose className="h-5 w-5 shrink-0" strokeWidth={2.5} />}
            {!isCollapsed && "Colapsar"}
          </button>
        </div>
        {!isCollapsed && <div className="px-6 py-4 text-xs font-medium text-neutral-400 dark:text-neutral-600">Kipo v1.0</div>}
      </div>
    );
  }

  return (
    <>
      <aside
        className={cn(
          "hidden shrink-0 border-r border-neutral-200 bg-white transition-[width] duration-300 ease-in-out lg:block dark:border-white/5 dark:bg-neutral-950",
          collapsed ? "w-[72px]" : "w-[260px]",
        )}
      >
        {renderContent(collapsed)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-neutral-950/20 backdrop-blur-sm transition-opacity" onClick={onCloseMobile} />
          <aside className="relative h-full w-[260px] border-r border-neutral-200 bg-white/95 backdrop-blur-xl shadow-2xl dark:border-white/10 dark:bg-neutral-950/95 animate-in slide-in-from-left">
            {renderContent(false)}
          </aside>
        </div>
      )}
    </>
  );
}
