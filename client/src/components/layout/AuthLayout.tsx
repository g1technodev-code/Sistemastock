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
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-xl shadow-indigo-500/10 dark:shadow-none dark:ring-1 dark:ring-white/10">
            <img src="/kipo-logo.png" alt="Kipo Logo" className="h-full w-full object-cover" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 mt-2">Kipo</span>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Gestión de inventario para tu negocio</p>
        </div>
        {children}
      </div>
    </div>
  );
}
