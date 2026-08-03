import { useEffect, useState } from "react";
import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, Select, Textarea } from "../ui/Field";
import { useProducts } from "../../hooks/useProducts";
import { useSuppliers } from "../../hooks/useSuppliers";
import { formatCurrency } from "../../lib/formatters";
import type { Purchase } from "../../lib/types";
import type { PurchaseInput } from "../../api/purchases";

type Line = { productId: string; name: string; sku: string; unitCost: number; quantity: number };

export function PurchaseForm({
  initialPurchase,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialPurchase?: Purchase | null;
  onSubmit: (input: PurchaseInput) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const { data: suppliers } = useSuppliers();
  const [search, setSearch] = useState("");
  const { data: productsPage } = useProducts({ q: search || undefined, isActive: true, limit: 20 });

  const [supplierId, setSupplierId] = useState(initialPurchase?.supplierId ?? "");
  const [note, setNote] = useState(initialPurchase?.note ?? "");
  const [lines, setLines] = useState<Line[]>(
    initialPurchase?.items.map((it) => ({
      productId: it.productId,
      name: it.product.name,
      sku: it.product.sku,
      unitCost: it.unitCost,
      quantity: it.quantity,
    })) ?? [],
  );

  useEffect(() => {
    if (!initialPurchase) return;
    setSupplierId(initialPurchase.supplierId);
    setNote(initialPurchase.note ?? "");
    setLines(
      initialPurchase.items.map((it) => ({
        productId: it.productId,
        name: it.product.name,
        sku: it.product.sku,
        unitCost: it.unitCost,
        quantity: it.quantity,
      })),
    );
  }, [initialPurchase]);

  const total = lines.reduce((sum, l) => sum + l.unitCost * l.quantity, 0);

  const addLine = (productId: string, name: string, sku: string, costPrice: number) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) return prev.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l));
      return [...prev, { productId, name, sku, unitCost: costPrice, quantity: 1 }];
    });
  };

  const updateLine = (productId: string, patch: Partial<Pick<Line, "quantity" | "unitCost">>) => {
    setLines((prev) => prev.map((l) => (l.productId === productId ? { ...l, ...patch } : l)));
  };

  const removeLine = (productId: string) => setLines((prev) => prev.filter((l) => l.productId !== productId));

  const canSubmit = !!supplierId && lines.length > 0 && lines.every((l) => l.quantity > 0 && l.unitCost >= 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      supplierId,
      note: note.trim() || null,
      items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitCost: l.unitCost })),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Select label="Proveedor" required value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
        <option value="">Selecciona un proveedor</option>
        {suppliers?.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>

      <div className="flex flex-col gap-4 lg:flex-row">
        <Card className="flex-1">
          <CardHeader title="Productos" description="Busca y agrega productos a la compra" />
          <CardBody className="flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input className="pl-9" placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {productsPage?.items.length === 0 && <p className="col-span-full py-6 text-center text-sm text-neutral-400">Sin resultados.</p>}
              {productsPage?.items.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addLine(p.id, p.name, p.sku, p.costPrice)}
                  className="flex flex-col items-start gap-1 rounded-lg border border-neutral-200 p-3 text-left text-sm transition-colors hover:border-indigo-400 hover:bg-indigo-50 dark:border-neutral-700 dark:hover:bg-indigo-950"
                >
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">{p.name}</span>
                  <span className="text-xs text-neutral-400">{p.sku}</span>
                  <span className="text-xs text-neutral-500">Costo actual: {formatCurrency(p.costPrice)}</span>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:w-[26rem] lg:shrink-0">
          <CardHeader title="Líneas de compra" description={`${lines.length} producto(s)`} />
          <CardBody className="flex flex-col gap-3">
            {lines.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-400">Agrega productos a la compra.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {lines.map((line) => (
                  <div key={line.productId} className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-2 dark:border-neutral-700">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{line.name}</div>
                        <div className="text-xs text-neutral-400">{line.sku}</div>
                      </div>
                      <button type="button" onClick={() => removeLine(line.productId)} className="shrink-0 text-neutral-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateLine(line.productId, { quantity: Math.max(1, line.quantity - 1) })}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-300 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => updateLine(line.productId, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                          className="w-12 rounded-md border border-neutral-300 bg-white px-1 py-1 text-center text-sm dark:border-neutral-700 dark:bg-neutral-900"
                        />
                        <button
                          type="button"
                          onClick={() => updateLine(line.productId, { quantity: line.quantity + 1 })}
                          className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-300 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.unitCost}
                        onChange={(e) => updateLine(line.productId, { unitCost: Math.max(0, Number(e.target.value) || 0) })}
                        className="w-24 rounded-md border border-neutral-300 bg-white px-2 py-1 text-right text-sm dark:border-neutral-700 dark:bg-neutral-900"
                        aria-label="Costo unitario"
                      />
                      <span className="ml-auto w-20 text-right text-sm font-medium">{formatCurrency(line.unitCost * line.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Textarea label="Nota (opcional)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />

            <div className="flex items-center justify-between border-t border-neutral-200 pt-3 dark:border-neutral-800">
              <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Total</span>
              <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(total)}</span>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={!canSubmit} isLoading={isSubmitting}>
                {initialPurchase ? "Guardar cambios" : "Crear compra"}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
