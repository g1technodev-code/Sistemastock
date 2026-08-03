import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  ArrowLeftRight,
  ShoppingCart,
  Wallet,
  BarChart3,
  Users,
  Settings,
  Boxes,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { permissions } from "../../lib/permissions";
import { cn } from "../../lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Panel", icon: LayoutDashboard, show: () => true },
  { to: "/products", label: "Productos", icon: Package, show: () => true },
  { to: "/categories", label: "Categorías", icon: Tags, show: () => true },
  { to: "/suppliers", label: "Proveedores", icon: Truck, show: () => true },
  { to: "/stock", label: "Movimientos de stock", icon: ArrowLeftRight, show: () => true },
  { to: "/ventas", label: "Ventas", icon: ShoppingCart, show: () => true },
  { to: "/caja", label: "Caja", icon: Wallet, show: () => true },
  { to: "/reports", label: "Reportes", icon: BarChart3, show: permissions.canViewReports },
  { to: "/users", label: "Usuarios", icon: Users, show: permissions.canManageUsers },
  { to: "/settings", label: "Configuración", icon: Settings, show: permissions.canManageSettings },
];

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const { user } = useAuth();
  if (!user) return null;

  const items = NAV_ITEMS.filter((item) => item.show(user.role));

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
          <Boxes className="h-5 w-5" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">StockFlow</span>
        <button onClick={onCloseMobile} className="ml-auto rounded-md p-1 text-neutral-400 hover:bg-neutral-100 lg:hidden dark:hover:bg-neutral-800">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800",
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 text-xs text-neutral-400 dark:text-neutral-600">StockFlow v1.0</div>
    </div>
  );

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white lg:block dark:border-neutral-800 dark:bg-neutral-900">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-neutral-950/40" onClick={onCloseMobile} />
          <aside className="relative h-full w-64 border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
