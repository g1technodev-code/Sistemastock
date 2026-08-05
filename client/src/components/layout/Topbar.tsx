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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-neutral-200/60 bg-white/70 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/70 sm:px-6">
      <button onClick={onOpenMenu} className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 lg:hidden dark:hover:bg-neutral-800">
        <Menu className="h-5 w-5" />
      </button>

      <button
        onClick={onOpenSearch}
        className="flex flex-1 items-center gap-3 rounded-full border border-neutral-200/80 bg-white/50 px-4 py-2.5 text-sm text-neutral-400 shadow-sm transition-all duration-200 hover:border-neutral-300 hover:bg-white max-w-lg dark:border-white/10 dark:bg-neutral-900/50 dark:hover:border-white/20 dark:hover:bg-neutral-900"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left font-medium">Buscar...</span>
        <kbd className="hidden rounded border border-neutral-300/80 bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500 sm:inline dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
          ⌘ K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <button
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
          className="rounded-full p-2.5 text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" strokeWidth={2.5} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={2.5} />}
        </button>

        <div className="relative" ref={alertsRef}>
          <button
            onClick={() => setAlertsOpen((v) => !v)}
            className="relative rounded-full p-2.5 text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={2.5} />
            {lowStockCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-neutral-950">
                {lowStockCount > 9 ? "9+" : lowStockCount}
              </span>
            )}
          </button>
          {alertsOpen && (
            <div className="absolute right-0 z-40 mt-3 w-80 rounded-2xl border border-neutral-200/60 bg-white/95 p-2 shadow-float backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/95 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/60">
                <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Alertas de stock</span>
                <Badge tone="danger">{lowStockCount}</Badge>
              </div>
              <div className="max-h-72 overflow-y-auto p-1 mt-1">
                {lowStockCount === 0 && (
                  <div className="px-2 py-8 text-center">
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Todo el stock está en niveles saludables.</p>
                  </div>
                )}
                {lowStock?.items.map((p) => (
                  <Link
                    key={p.id}
                    to="/products"
                    onClick={() => setAlertsOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning-100 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-semibold text-neutral-900 dark:text-neutral-100">{p.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Actual: {p.currentStock} / Min: {p.minStock}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={userRef}>
          <button onClick={() => setUserMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-full p-1 transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white shadow-sm dark:bg-primary-500">
              {initials(user?.name ?? "U")}
            </div>
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 z-40 mt-3 w-56 rounded-2xl border border-neutral-200/60 bg-white/95 p-2 shadow-float backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/95 animate-in zoom-in-95 duration-200">
              <div className="px-4 py-3">
                <p className="truncate text-sm font-bold text-neutral-900 dark:text-neutral-100">{user?.name}</p>
                <p className="truncate text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{user?.email}</p>
                <div className="mt-2">
                  <Badge tone="info">{user?.role}</Badge>
                </div>
              </div>
              <div className="my-1 h-px bg-neutral-100 dark:bg-neutral-800/60" />
              <button
                onClick={() => logout()}
                className="flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-danger-600 transition-colors hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-500/10"
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
