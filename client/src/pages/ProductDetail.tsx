import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Package,
  RefreshCw,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Field";
import { EmptyState } from "../components/ui/EmptyState";
import { Pagination } from "../components/ui/Pagination";
import { FullPageSpinner } from "../components/ui/Spinner";
import { TableSkeleton } from "../components/ui/Skeleton";
import { useProduct } from "../hooks/useProducts";
import { useCreateMovement, useMovements } from "../hooks/useStock";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../api/client";
import { formatCurrency, formatDateTime, formatNumber } from "../lib/formatters";
import { cn } from "../lib/utils";
import type { MovementType } from "../lib/types";

const MOVEMENT_TYPE_LABEL: Record<MovementType, string> = { IN: "Entrada", OUT: "Salida", ADJUSTMENT: "Ajuste" };
const MOVEMENT_TYPE_TONE: Record<MovementType, "success" | "danger" | "warning"> = {
  IN: "success",
  OUT: "danger",
  ADJUSTMENT: "warning",
};
const MOVEMENT_TYPE_ICON: Record<MovementType, typeof ArrowDown> = {
  IN: ArrowDown,
  OUT: ArrowUp,
  ADJUSTMENT: RefreshCw,
};
const MOVEMENT_TYPE_ICON_TONE: Record<MovementType, string> = {
  IN: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  OUT: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
  ADJUSTMENT: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { showSuccess, showError } = useToast();

  const { data: product, isLoading, isError } = useProduct(id ?? null);
  const [page, setPage] = useState(1);
  const { data: movements, isLoading: loadingMovements } = useMovements({ productId: id, page, limit: 15 });
  const createMovement = useCreateMovement();

  const [type, setType] = useState<MovementType>("IN");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");

  const handleQuickMovement = async () => {
    if (!id || !quantity) return;
    try {
      await createMovement.mutateAsync({ productId: id, type, quantity: Number(quantity), reason: reason || undefined });
      showSuccess("Movimiento registrado correctamente");
      setQuantity("");
      setReason("");
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo registrar el movimiento"));
    }
  };

  if (isLoading) return <FullPageSpinner />;

  if (isError || !product) {
    return (
      <div className="flex flex-col gap-4">
        <Link to="/products" className="flex w-fit items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
          <ArrowLeft className="h-4 w-4" /> Volver a productos
        </Link>
        <Card>
          <EmptyState icon={Package} title="Producto no encontrado" description="Puede que haya sido eliminado." />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Link to="/products" className="flex w-fit items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
        <ArrowLeft className="h-4 w-4" /> Volver a productos
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row">
        <Card className="lg:w-96 lg:shrink-0">
          <CardBody className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950">
                  <Package className="h-7 w-7 text-indigo-500" />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold text-neutral-900 dark:text-neutral-100">{product.name}</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{product.sku}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
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
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{formatCurrency(product.costPrice)}</p>
              </div>
              <div>
                <p className="text-neutral-500 dark:text-neutral-400">Precio venta</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{formatCurrency(product.sellPrice)}</p>
              </div>
              {product.barcode && (
                <div className="col-span-2">
                  <p className="text-neutral-500 dark:text-neutral-400">Código de barras</p>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">{product.barcode}</p>
                </div>
              )}
              <div className="col-span-2">
                <p className="text-neutral-500 dark:text-neutral-400">Proveedor</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{product.supplier?.name ?? "Sin proveedor asignado"}</p>
              </div>
              {product.description && (
                <div className="col-span-2">
                  <p className="text-neutral-500 dark:text-neutral-400">Descripción</p>
                  <p className="text-neutral-700 dark:text-neutral-300">{product.description}</p>
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
          </CardBody>
        </Card>

        <Card className="flex-1">
          <CardHeader title="Historial de movimientos" description="Línea de tiempo completa de entradas, salidas y ajustes" />
          <CardBody>
            {loadingMovements && !movements ? (
              <TableSkeleton columns={1} rows={5} />
            ) : !movements || movements.items.length === 0 ? (
              <EmptyState icon={Package} title="Sin movimientos" description="Este producto aún no tiene historial." />
            ) : (
              <>
                <div className="flex flex-col">
                  {movements.items.map((m, idx) => {
                    const Icon = MOVEMENT_TYPE_ICON[m.type];
                    return (
                      <div key={m.id} className="relative flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={cn("z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", MOVEMENT_TYPE_ICON_TONE[m.type])}>
                            <Icon className="h-4 w-4" />
                          </div>
                          {idx < movements.items.length - 1 && <div className="w-px flex-1 bg-neutral-200 dark:bg-neutral-800" />}
                        </div>
                        <div className={cn("min-w-0 flex-1", idx < movements.items.length - 1 ? "pb-6" : "pb-1")}>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={MOVEMENT_TYPE_TONE[m.type]}>{MOVEMENT_TYPE_LABEL[m.type]}</Badge>
                            <span className="text-xs text-neutral-400">{formatDateTime(m.createdAt)}</span>
                          </div>
                          <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                            {m.user.name} · {formatNumber(m.quantity)} {product.unit} · {formatNumber(m.quantityBefore)} → {formatNumber(m.quantityAfter)}
                          </p>
                          {m.reason && <p className="text-xs text-neutral-500 dark:text-neutral-400">Motivo: {m.reason}</p>}
                          {m.reference && <p className="text-xs text-neutral-400 dark:text-neutral-500">Referencia: {m.reference}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 border-t border-neutral-200 pt-1 dark:border-neutral-800">
                  <Pagination
                    page={movements.pagination.page}
                    totalPages={movements.pagination.totalPages}
                    total={movements.pagination.total}
                    onPageChange={setPage}
                  />
                </div>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
