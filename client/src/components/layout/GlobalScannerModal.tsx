import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { useBarcodeScanner } from "../../hooks/useBarcodeScanner";
import { listProducts } from "../../api/products";
import { formatCurrency } from "../../lib/formatters";
import type { Product } from "../../lib/types";

export function GlobalScannerModal() {
  const [product, setProduct] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const location = useLocation();

  useBarcodeScanner(async (barcode) => {
    // Si estamos en la página de ventas, ignoramos el escaneo global
    // ya que Ventas maneja su propia lógica para agregar al carrito
    if (location.pathname === "/ventas") return;

    setLoading(true);
    setOpen(true);
    setErrorMsg("");
    setProduct(null);

    try {
      const res = await listProducts({ q: barcode, isActive: true, limit: 10 });
      const match = res.items.find((p) => p.sku === barcode || p.barcode === barcode);
      
      if (match) {
        setProduct(match);
      } else {
        setErrorMsg(`Producto no encontrado con el código: ${barcode}`);
      }
    } catch (e) {
      setErrorMsg("Ocurrió un error al buscar el producto.");
    } finally {
      setLoading(false);
    }
  });

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Información de Producto Escaneado" size="sm">
      <div className="flex flex-col gap-4">
        {loading && (
          <div className="py-8 text-center text-neutral-500">Buscando producto...</div>
        )}
        
        {!loading && errorMsg && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        {!loading && product && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{product.name}</h3>
                <p className="text-sm text-neutral-500">{product.sku}</p>
              </div>
              <Badge tone={product.currentStock > 0 ? "success" : "danger"}>
                Stock: {product.currentStock}
              </Badge>
            </div>
            
            <div className="mt-2 rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Precio de Venta</span>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(product.sellPrice)}
                </span>
              </div>
            </div>

            {product.category && (
              <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                <span className="font-medium">Categoría:</span> {product.category.name}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
