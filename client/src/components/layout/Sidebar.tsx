import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { permissions } from "../../lib/permissions";
import { cn } from "../../lib/utils";

const COLLAPSE_STORAGE_KEY = "stockflow-sidebar-collapsed";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Panel", icon: LayoutDashboard, show: () => true },
  { to: "/products", label: "Productos", icon: Package, show: () => true },
  { to: "/categories", label: "Categorías", icon: Tags, show: () => true },
  { to: "/suppliers", label: "Proveedores", icon: Truck, show: () => true },
  { to: "/stock", label: "Movimientos de stock", icon: ArrowLeftRight, show: () => true },
  { to: "/inventario-fisico", label: "Inventario físico", icon: ClipboardCheck, show: () => true },
  { to: "/ventas", label: "Ventas", icon: ShoppingCart, show: () => true },
  { to: "/compras", label: "Compras", icon: ShoppingBag, show: () => true },
  { to: "/caja", label: "Caja", icon: Wallet, show: () => true },
  { to: "/reports", label: "Reportes", icon: BarChart3, show: permissions.canViewReports },
  { to: "/estadisticas", label: "Estadísticas", icon: LineChart, show: permissions.canViewReports },
  { to: "/rentabilidad", label: "Rentabilidad", icon: Percent, show: permissions.canViewReports },
  { to: "/users", label: "Usuarios", icon: Users, show: permissions.canManageUsers },
  { to: "/settings", label: "Configuración", icon: Settings, show: permissions.canManageSettings },
];

function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1";
}

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);

  useEffect(() => {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  if (!user) return null;

  const items = NAV_ITEMS.filter((item) => item.show(user.role));

  function renderContent(isCollapsed: boolean) {
    return (
      <div className="flex h-full flex-col">
        <div className={cn("flex items-center gap-3 px-6 py-6", isCollapsed && "justify-center px-3")}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm dark:bg-primary-500">
            <Boxes className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">StockFlow</span>
          )}
          <button
            onClick={onCloseMobile}
            className="ml-auto rounded-full p-2 text-neutral-400 hover:bg-neutral-100 lg:hidden dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-4 mt-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                  isCollapsed && "justify-center px-0",
                  isActive
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400 shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-200",
                )
              }
            >
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", isCollapsed && "h-5 w-5")} strokeWidth={2.5} />
              {!isCollapsed && item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden px-4 py-4 lg:block">
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
        {!isCollapsed && <div className="px-6 py-4 text-xs font-medium text-neutral-400 dark:text-neutral-600">StockFlow v1.0</div>}
      </div>
    );
  }

  return (
    <>
      <aside
        className={cn(
          "hidden shrink-0 border-r border-neutral-200/60 bg-white transition-[width] duration-300 ease-in-out lg:block dark:border-white/5 dark:bg-neutral-950",
          collapsed ? "w-[72px]" : "w-[260px]",
        )}
      >
        {renderContent(collapsed)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-neutral-950/20 backdrop-blur-sm transition-opacity" onClick={onCloseMobile} />
          <aside className="relative h-full w-[260px] border-r border-neutral-200/60 bg-white/95 backdrop-blur-xl shadow-2xl dark:border-white/10 dark:bg-neutral-950/95 animate-in slide-in-from-left">
            {renderContent(false)}
          </aside>
        </div>
      )}
    </>
  );
}
