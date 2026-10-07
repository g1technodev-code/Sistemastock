import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Store, Search, Package } from "lucide-react";
import { useState } from "react";
import { API_BASE_URL } from "../api/client";
import { formatCurrency } from "../lib/formatters";
import { Input } from "../components/ui/Field";

async function fetchCatalog(localId: string) {
  const res = await fetch(`${API_BASE_URL}/catalog/${localId}`);
  if (!res.ok) throw new Error("Catalog not found");
  return res.json();
}

export default function Catalog() {
  const { localId } = useParams<{ localId: string }>();
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["catalog", localId],
    queryFn: () => fetchCatalog(localId!),
    enabled: !!localId,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-neutral-50 p-6 text-center dark:bg-neutral-950">
        <Store className="h-16 w-16 text-neutral-300 dark:text-neutral-700 mb-4" />
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Catálogo no encontrado</h1>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">El local que buscas no existe o no tiene el catálogo público habilitado.</p>
        <Link to="/" className="mt-6 text-primary-600 font-semibold hover:underline">Ir al inicio</Link>
      </div>
    );
  }

  const { local, products } = data;
  
  const filteredProducts = products.filter((p: any) => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.category?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {local.logoUrl ? (
                <img src={local.logoUrl} alt={local.name} className="h-10 w-10 rounded-full object-cover border border-neutral-200 dark:border-neutral-700" />
              ) : (
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <Store className="h-5 w-5" />
                </div>
              )}
              <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 line-clamp-1">{local.name}</h1>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar productos..."
              className="block w-full pl-10 pr-3 py-2.5 border border-neutral-300 rounded-xl leading-5 bg-neutral-100 placeholder-neutral-500 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-all dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-400 dark:focus:bg-neutral-900"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Product List */}
      <main className="max-w-md mx-auto px-4 py-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-neutral-300 dark:text-neutral-700 mb-3" />
            <p className="text-neutral-500 dark:text-neutral-400">No se encontraron productos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((p: any) => (
              <div key={p.id} className="flex flex-col bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
                <div className="aspect-square bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="h-8 w-8 text-neutral-300 dark:text-neutral-600" />
                  )}
                </div>
                <div className="p-3 flex flex-col flex-1">
                  {p.category && (
                    <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider mb-1 block line-clamp-1">
                      {p.category.name}
                    </span>
                  )}
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 mb-2">{p.name}</h3>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-base font-black text-primary-600 dark:text-primary-400">
                      {formatCurrency(p.sellPrice)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Kipo Branding - The Viral Loop */}
      <footer className="fixed bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-white via-white to-transparent dark:from-neutral-950 dark:via-neutral-950 text-center">
        <a 
          href="https://kipo.app" 
          target="_blank" 
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 shadow-lg rounded-full text-xs font-semibold text-neutral-600 hover:text-primary-600 hover:border-primary-200 transition-colors dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:text-primary-400"
        >
          <img src="/kipo-logo.png" alt="Kipo" className="h-4 w-4" />
          <span>Catálogo gratis creado con Kipo</span>
        </a>
      </footer>
    </div>
  );
}
