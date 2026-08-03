import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Package, Tags, Truck, X } from "lucide-react";
import { createPortal } from "react-dom";
import { globalSearch } from "../../api/search";
import { Badge } from "../ui/Badge";

export function QuickSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebounced("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const { data, isFetching } = useQuery({
    queryKey: ["global-search", debounced],
    queryFn: () => globalSearch(debounced),
    enabled: open && debounced.trim().length >= 2,
  });

  if (!open) return null;

  const hasResults = data && (data.products.length > 0 || data.categories.length > 0 || data.suppliers.length > 0);

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24">
      <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-3 border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <Search className="h-5 w-5 text-neutral-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar productos, categorías, proveedores..."
            className="flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100"
          />
          <button onClick={onClose} className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {debounced.trim().length < 2 && (
            <p className="px-3 py-8 text-center text-sm text-neutral-400">Escribe al menos 2 caracteres para buscar.</p>
          )}
          {debounced.trim().length >= 2 && isFetching && (
            <p className="px-3 py-8 text-center text-sm text-neutral-400">Buscando...</p>
          )}
          {debounced.trim().length >= 2 && !isFetching && !hasResults && (
            <p className="px-3 py-8 text-center text-sm text-neutral-400">Sin resultados para "{debounced}".</p>
          )}

          {data && data.products.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Productos</p>
              {data.products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => go("/products")}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  <Package className="h-4 w-4 text-neutral-400" />
                  <span className="flex-1 text-neutral-700 dark:text-neutral-300">{p.name}</span>
                  <span className="text-xs text-neutral-400">{p.sku}</span>
                  {p.currentStock <= p.minStock && <Badge tone="danger">Bajo</Badge>}
                </button>
              ))}
            </div>
          )}

          {data && data.categories.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Categorías</p>
              {data.categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => go("/categories")}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  <Tags className="h-4 w-4 text-neutral-400" />
                  <span className="text-neutral-700 dark:text-neutral-300">{c.name}</span>
                </button>
              ))}
            </div>
          )}

          {data && data.suppliers.length > 0 && (
            <div>
              <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Proveedores</p>
              {data.suppliers.map((s) => (
                <button
                  key={s.id}
                  onClick={() => go("/suppliers")}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  <Truck className="h-4 w-4 text-neutral-400" />
                  <span className="text-neutral-700 dark:text-neutral-300">{s.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
