import type { ReactNode } from "react";
import { Boxes, Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export function AuthLayout({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 dark:from-neutral-950 dark:via-neutral-900 dark:to-indigo-950">
      <button
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
        className="absolute right-4 top-4 rounded-full p-2 text-neutral-500 hover:bg-white/50 hover:shadow-sm dark:text-neutral-400 dark:hover:bg-neutral-800/50 transition-all duration-300"
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 dark:from-indigo-500 dark:to-purple-500">
            <Boxes className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 mt-2">StockFlow</span>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Gestión de inventario para tu negocio</p>
        </div>
        {children}
      </div>
    </div>
  );
}
