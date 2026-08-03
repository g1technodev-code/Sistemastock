import { useState } from "react";
import { Package } from "lucide-react";
import { Drawer } from "../ui/Drawer";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Field";
import { Table, THead, TBody, TR, TH, TD } from "../ui/Table";
import { EmptyState } from "../ui/EmptyState";
import { Spinner } from "../ui/Spinner";
import { useProduct } from "../../hooks/useProducts";
import { useMovements, useCreateMovement } from "../../hooks/useStock";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../api/client";
import { formatCurrency, formatDateTime, formatNumber } from "../../lib/formatters";
import type { MovementType } from "../../lib/types";

const MOVEMENT_TYPE_LABEL: Record<MovementType, string> = { IN: "Entrada", OUT: "Salida", ADJUSTMENT: "Ajuste" };
const MOVEMENT_TYPE_TONE: Record<MovementType, "success" | "danger" | "warning"> = {
  IN: "success",
  OUT: "danger",
  ADJUSTMENT: "warning",
};

export function ProductDetailDrawer({ productId, onClose }: { productId: string | null; onClose: () => void }) {
  const { data: product, isLoading } = useProduct(productId);
  const { data: movements } = useMovements({ productId: productId ?? undefined, limit: 10 });
  const createMovement = useCreateMovement();
  const { showSuccess, showError } = useToast();

  const [type, setType] = useState<MovementType>("IN");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const handleQuickMovement = async () => {
    if (!productId || !quantity) return;
    try {
      await createMovement.mutateAsync({ productId, type, quantity: Number(quantity), reason: reason || undefined });
      showSuccess("Movimiento registrado correctamente");
      setQuantity("");
      setReason("");
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo registrar el movimiento"));
    }
  };

  return (
    <Drawer open={!!productId} onClose={onClose} title={product?.name ?? "Detalle de producto"}>
      {isLoading || !product ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950">
              <Package className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{product.sku}</p>
              <div className="mt-1 flex items-center gap-2">
                {product.currentStock <= product.minStock && <Badge tone="danger">Stock bajo</Badge>}
                {!product.isActive && <Badge tone="neutral">Inactivo</Badge>}
                {product.category && <Badge tone="info">{product.category.name}</Badge>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-lg border border-neutral-200 p-4 text-sm dark:border-neutral-800">
            <div>
              <p className="text-neutral-500 dark:text-neutral-400">Stock actual</p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {formatNumber(product.currentStock)} <span className="text-xs font-normal text-neutral-400">{product.unit}</span>
              </p>
            </div>
            <div>
              <p className="text-neutral-500 dark:text-neutral-400">Stock mínimo</p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatNumber(product.minStock)}</p>
            </div>
            <div>
              <p className="text-neutral-500 dark:text-neutral-400">Costo</p>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">{formatCurrency(product.costPrice, "PEN")}</p>
            </div>
            <div>
              <p className="text-neutral-500 dark:text-neutral-400">Precio venta</p>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">{formatCurrency(product.sellPrice, "PEN")}</p>
            </div>
            {product.supplier && (
              <div className="col-span-2">
                <p className="text-neutral-500 dark:text-neutral-400">Proveedor</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{product.supplier.name}</p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="mb-3 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Ajuste rápido de stock</p>
            <div className="grid grid-cols-3 gap-2">
              <Select value={type} onChange={(e) => setType(e.target.value as MovementType)}>
                <option value="IN">Entrada</option>
                <option value="OUT">Salida</option>
                <option value="ADJUSTMENT">Ajuste (cantidad final)</option>
              </Select>
              <Input type="number" min={0} placeholder="Cantidad" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              <Button onClick={handleQuickMovement} isLoading={createMovement.isPending} disabled={!quantity}>
                Aplicar
              </Button>
            </div>
            <Input className="mt-2" placeholder="Motivo (opcional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Historial reciente</p>
            {!movements || movements.items.length === 0 ? (
              <EmptyState icon={Package} title="Sin movimientos" description="Este producto aún no tiene historial." />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>Tipo</TH>
                    <TH>Cant.</TH>
                    <TH>Fecha</TH>
                  </tr>
                </THead>
                <TBody>
                  {movements.items.map((m) => (
                    <TR key={m.id}>
                      <TD>
                        <Badge tone={MOVEMENT_TYPE_TONE[m.type]}>{MOVEMENT_TYPE_LABEL[m.type]}</Badge>
                      </TD>
                      <TD>{formatNumber(m.quantity)}</TD>
                      <TD className="text-xs text-neutral-400">{formatDateTime(m.createdAt)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
