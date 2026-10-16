import { useEffect, useState } from "react";
import { ArrowRight, Percent } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Field";
import { useCategories } from "../../hooks/useCategories";
import { useSuppliers } from "../../hooks/useSuppliers";
import { useInvalidateProducts } from "../../hooks/useProducts";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../api/client";
import { formatCurrency } from "../../lib/formatters";
import { previewPriceUpdate, applyPriceUpdate, type PriceUpdateInput, type PriceUpdatePreview } from "../../api/products";

const ROUNDING_OPTIONS = [
  { value: 0, label: "Sin redondeo" },
  { value: 10, label: "Hacia arriba a $10" },
  { value: 50, label: "Hacia arriba a $50" },
  { value: 100, label: "Hacia arriba a $100" },
];

export function PriceUpdateModal({
  open,
  onClose,
  initialCategoryId,
  initialSupplierId,
}: {
  open: boolean;
  onClose: () => void;
  initialCategoryId?: string;
  initialSupplierId?: string;
}) {
  const { showSuccess, showError } = useToast();
  const { data: categories } = useCategories();
  const { data: suppliers } = useSuppliers();
  const invalidateProducts = useInvalidateProducts();

  const [categoryId, setCategoryId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [percentage, setPercentage] = useState("");
  const [applyTo, setApplyTo] = useState<PriceUpdateInput["applyTo"]>("SELL");
  const [rounding, setRounding] = useState(0);
  const [preview, setPreview] = useState<PriceUpdatePreview | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCategoryId(initialCategoryId ?? "");
    setSupplierId(initialSupplierId ?? "");
    setPercentage("");
    setApplyTo("SELL");
    setRounding(0);
    setPreview(null);
  }, [open, initialCategoryId, initialSupplierId]);

  // Any change to the inputs invalidates the preview, so what gets applied is always what was shown
  const resetPreview = () => setPreview(null);

  const pct = Number(percentage);
  const hasFilter = Boolean(categoryId || supplierId);
  const isValid = hasFilter && percentage !== "" && pct !== 0 && pct >= -90 && pct <= 1000;

  const input = (): PriceUpdateInput => ({
    categoryId: categoryId || null,
    supplierId: supplierId || null,
    percentage: pct,
    applyTo,
    rounding,
  });

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      setPreview(await previewPriceUpdate(input()));
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo calcular la vista previa"));
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const { updated } = await applyPriceUpdate(input());
      showSuccess(`Precios actualizados en ${updated} producto${updated === 1 ? "" : "s"}`);
      invalidateProducts();
      onClose();
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudieron actualizar los precios"));
    } finally {
      setIsApplying(false);
    }
  };

  const isIncrease = pct > 0;

  return (
    <Modal open={open} onClose={onClose} title="Actualizar precios masivamente" size="lg">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Categoría" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); resetPreview(); }}>
            <option value="">Todas las categorías</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select label="Proveedor" value={supplierId} onChange={(e) => { setSupplierId(e.target.value); resetPreview(); }}>
            <option value="">Todos los proveedores</option>
            {suppliers?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        {!hasFilter && (
          <p className="-mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            Elegí una categoría, un proveedor o ambos (se aplica a los productos que cumplan los dos).
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Porcentaje (%)"
            type="number"
            step="0.01"
            placeholder="Ej: 15 para aumentar, -10 para bajar"
            value={percentage}
            onChange={(e) => { setPercentage(e.target.value); resetPreview(); }}
          />
          <Select label="Redondeo del precio de venta" value={rounding} onChange={(e) => { setRounding(Number(e.target.value)); resetPreview(); }}>
            {ROUNDING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <label className="flex items-center gap-2">
            <input type="radio" className="h-4 w-4 text-primary-600" checked={applyTo === "SELL"} onChange={() => { setApplyTo("SELL"); resetPreview(); }} />
            Solo precio de venta
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" className="h-4 w-4 text-primary-600" checked={applyTo === "COST_AND_SELL"} onChange={() => { setApplyTo("COST_AND_SELL"); resetPreview(); }} />
            Costo y precio de venta (cuando aumenta el proveedor, mantiene tu margen)
          </label>
        </div>

        {preview && (
          preview.count === 0 ? (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">No hay productos que coincidan con el filtro elegido.</p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                {preview.count} producto{preview.count === 1 ? "" : "s"} se van a actualizar:
              </p>
              <div className="max-h-72 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-neutral-50 text-left text-xs uppercase text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                    <tr>
                      <th className="px-3 py-2">Producto</th>
                      {applyTo === "COST_AND_SELL" && <th className="px-3 py-2">Costo</th>}
                      <th className="px-3 py-2">Precio de venta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.items.map((p) => (
                      <tr key={p.id} className="border-t border-neutral-100 dark:border-neutral-800/60">
                        <td className="px-3 py-2">
                          <div className="font-medium text-neutral-900 dark:text-neutral-100">{p.name}</div>
                          <div className="font-mono text-xs text-neutral-400">{p.sku}</div>
                        </td>
                        {applyTo === "COST_AND_SELL" && (
                          <td className="whitespace-nowrap px-3 py-2 text-neutral-600 dark:text-neutral-400">
                            {formatCurrency(p.costPrice)} <ArrowRight className="inline h-3 w-3" /> {formatCurrency(p.newCostPrice)}
                          </td>
                        )}
                        <td className="whitespace-nowrap px-3 py-2">
                          <span className="text-neutral-500 dark:text-neutral-400">{formatCurrency(p.sellPrice)}</span>{" "}
                          <ArrowRight className="inline h-3 w-3" />{" "}
                          <span className={isIncrease ? "font-semibold text-green-600 dark:text-green-400" : "font-semibold text-red-600 dark:text-red-400"}>
                            {formatCurrency(p.newSellPrice)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          {preview && preview.count > 0 ? (
            <Button type="button" isLoading={isApplying} onClick={handleApply}>
              <Percent className="h-4 w-4 mr-1.5" /> Aplicar a {preview.count} producto{preview.count === 1 ? "" : "s"}
            </Button>
          ) : (
            <Button type="button" disabled={!isValid} isLoading={isPreviewing} onClick={handlePreview}>
              Ver vista previa
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
