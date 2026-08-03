import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, Search, Bell, LogOut, AlertTriangle, Sun, Moon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useLowStockAlerts } from "../../hooks/useLowStockAlerts";
import { initials } from "../../lib/formatters";
import { Badge } from "../ui/Badge";

export function Topbar({ onOpenMenu, onOpenSearch }: { onOpenMenu: () => void; onOpenSearch: () => void }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const alertsRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const { data: lowStock } = useLowStockAlerts();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) setAlertsOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const lowStockCount = lowStock?.pagination.total ?? 0;

  return (
    <header className="flex h-16 items-center gap-3 border-b border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900 sm:px-6">
      <button onClick={onOpenMenu} className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 lg:hidden dark:hover:bg-neutral-800">
        <Menu className="h-5 w-5" />
      </button>

      <button
        onClick={onOpenSearch}
        className="flex flex-1 items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-400 hover:border-neutral-300 max-w-md dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-neutral-600"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Buscar productos, categorías, proveedores...</span>
        <kbd className="hidden rounded border border-neutral-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 sm:inline dark:border-neutral-600 dark:bg-neutral-900">
          Ctrl K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
          className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <div className="relative" ref={alertsRef}>
          <button
            onClick={() => setAlertsOpen((v) => !v)}
            className="relative rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <Bell className="h-5 w-5" />
            {lowStockCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                {lowStockCount > 9 ? "9+" : lowStockCount}
              </span>
            )}
          </button>
          {alertsOpen && (
            <div className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Alertas de stock bajo</span>
                <Badge tone="danger">{lowStockCount}</Badge>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {lowStockCount === 0 && (
                  <p className="px-2 py-6 text-center text-sm text-neutral-400">Todo el stock está en niveles saludables.</p>
                )}
                {lowStock?.items.map((p) => (
                  <Link
                    key={p.id}
                    to="/products"
                    onClick={() => setAlertsOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                    <span className="flex-1 truncate text-neutral-700 dark:text-neutral-300">{p.name}</span>
                    <span className="shrink-0 text-xs text-neutral-400">
                      {p.currentStock}/{p.minStock}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={userRef}>
          <button onClick={() => setUserMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
              {initials(user?.name ?? "U")}
            </div>
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{user?.name}</p>
                <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">{user?.email}</p>
                <Badge tone="info" className="mt-1.5">
                  {user?.role}
                </Badge>
              </div>
              <hr className="my-1 border-neutral-100 dark:border-neutral-800" />
              <button
                onClick={() => logout()}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              >
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
