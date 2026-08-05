import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { cn } from "../lib/utils";

type Toast = { id: number; message: string; variant: "success" | "error" };

type ToastContextValue = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, variant: Toast["variant"]) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    showSuccess: (message) => push(message, "success"),
    showError: (message) => push(message, "error"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-float backdrop-blur-xl text-sm font-medium min-w-[320px] max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300",
              toast.variant === "success"
                ? "bg-white/95 border-success-200 text-success-900 dark:bg-neutral-900/95 dark:border-success-900/50 dark:text-success-100"
                : "bg-white/95 border-danger-200 text-danger-900 dark:bg-neutral-900/95 dark:border-danger-900/50 dark:text-danger-100",
            )}
          >
            {toast.variant === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => dismiss(toast.id)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de un ToastProvider");
  return ctx;
}
