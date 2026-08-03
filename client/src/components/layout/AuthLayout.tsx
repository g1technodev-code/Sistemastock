import type { ReactNode } from "react";
import { Boxes, Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export function AuthLayout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <button
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
        className="absolute right-4 top-4 rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-sm dark:bg-white dark:text-neutral-900">
            <Boxes className="h-6 w-6" />
          </div>
          <span className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">StockFlow</span>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Gestión de inventario para tu negocio</p>
        </div>
        {children}
      </div>
    </div>
  );
}
