import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowDownCircle, ArrowUpCircle, ClipboardList, ListChecks, PackageSearch } from "lucide-react";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Field";
import { Badge } from "../components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { EmptyState } from "../components/ui/EmptyState";
import { Pagination } from "../components/ui/Pagination";
import { useProducts } from "../hooks/useProducts";
import { useCreateMovement, useMovements } from "../hooks/useStock";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../api/client";
import { formatDateTime, formatNumber } from "../lib/formatters";
import { cn } from "../lib/utils";
import type { MovementType } from "../lib/types";

const schema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  quantity: z.coerce.number().int().min(0, "Debe ser 0 o mayor"),
  reason: z.string().optional(),
  reference: z.string().optional(),
});
type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

const MOVEMENT_TYPE_LABEL: Record<MovementType, string> = { IN: "Entrada", OUT: "Salida", ADJUSTMENT: "Ajuste" };
const MOVEMENT_TYPE_TONE: Record<MovementType, "success" | "danger" | "warning"> = {
  IN: "success",
  OUT: "danger",
  ADJUSTMENT: "warning",
};

export default function Stock() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [tab, setTab] = useState<"register" | "history">("register");

  const { data: productsPage } = useProducts({ limit: 100, isActive: true });
  const createMovement = useCreateMovement();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema), defaultValues: { type: "IN", quantity: 0 } });

  const watchedType = watch("type");
  const watchedProductId = watch("productId");
  const selectedProduct = productsPage?.items.find((p) => p.id === watchedProductId);

  const onSubmit = async (values: FormValues) => {
    try {
      await createMovement.mutateAsync({
        productId: values.productId,
        type: values.type,
        quantity: values.quantity,
        reason: values.reason || undefined,
        reference: values.reference || undefined,
      });
      showSuccess("Movimiento registrado correctamente");
      reset({ type: values.type, quantity: 0, productId: values.productId, reason: "", reference: "" });
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo registrar el movimiento"));
    }
  };

  const [historyPage, setHistoryPage] = useState(1);
  const [filterType, setFilterType] = useState<MovementType | "">("");
  const { data: movements, isLoading: loadingHistory } = useMovements({
    page: historyPage,
    limit: 15,
    type: filterType || undefined,
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Movimientos de stock</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Registra entradas, salidas y ajustes de inventario.</p>
      </div>

      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setTab("register")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium",
            tab === "register" ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-neutral-500",
          )}
        >
          <ClipboardList className="h-4 w-4" /> Registrar movimiento
        </button>
        <button
          onClick={() => setTab("history")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium",
            tab === "history" ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-neutral-500",
          )}
        >
          <ListChecks className="h-4 w-4" /> Historial{user?.role === "EMPLOYEE" ? " (mío)" : ""}
        </button>
      </div>

      {tab === "register" ? (
        <Card className="max-w-2xl">
          <CardHeader title="Nuevo movimiento" description="Selecciona el producto y el tipo de movimiento" />
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Select label="Producto" required error={errors.productId?.message} {...register("productId")}>
                <option value="">Selecciona un producto</option>
                {productsPage?.items.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — stock: {p.currentStock}
                  </option>
                ))}
              </Select>

              <div className="grid grid-cols-3 gap-3">
                {(["IN", "OUT", "ADJUSTMENT"] as MovementType[]).map((t) => (
                  <label
                    key={t}
                    className={cn(
                      "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border p-3 text-sm font-medium transition-colors",
                      watchedType === t
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                        : "border-neutral-200 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800",
                    )}
                  >
                    <input type="radio" value={t} {...register("type")} className="hidden" />
                    {t === "IN" && <ArrowDownCircle className="h-5 w-5" />}
                    {t === "OUT" && <ArrowUpCircle className="h-5 w-5" />}
                    {t === "ADJUSTMENT" && <PackageSearch className="h-5 w-5" />}
                    {MOVEMENT_TYPE_LABEL[t]}
                  </label>
                ))}
              </div>

              <Input
                label={watchedType === "ADJUSTMENT" ? "Cantidad final (conteo físico)" : "Cantidad"}
                type="number"
                min={0}
                required
                hint={
                  watchedType === "ADJUSTMENT" && selectedProduct
                    ? `Stock actual del sistema: ${selectedProduct.currentStock}`
                    : selectedProduct
                      ? `Stock disponible: ${selectedProduct.currentStock}`
                      : undefined
                }
                error={errors.quantity?.message}
                {...register("quantity")}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input label="Referencia (opcional)" placeholder="N.° de orden, factura..." {...register("reference")} />
                <Input label="Motivo (opcional)" {...register("reason")} />
              </div>

              <Button type="submit" isLoading={createMovement.isPending} className="mt-2">
                Registrar movimiento
              </Button>
            </form>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-800">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Filtrar por tipo</span>
            <Select
              className="w-48"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as MovementType | "");
                setHistoryPage(1);
              }}
            >
              <option value="">Todos</option>
              <option value="IN">Entradas</option>
              <option value="OUT">Salidas</option>
              <option value="ADJUSTMENT">Ajustes</option>
            </Select>
          </div>

          {loadingHistory && !movements ? (
            <div className="p-8 text-center text-sm text-neutral-400">Cargando...</div>
          ) : !movements || movements.items.length === 0 ? (
            <EmptyState icon={ListChecks} title="Sin movimientos" description="Aún no se han registrado movimientos de stock." />
          ) : (
            <>
              <Table>
                <THead>
                  <tr>
                    <TH>Producto</TH>
                    <TH>Tipo</TH>
                    <TH>Cantidad</TH>
                    <TH>Stock (antes → después)</TH>
                    <TH>Usuario</TH>
                    <TH>Fecha</TH>
                  </tr>
                </THead>
                <TBody>
                  {movements.items.map((m) => (
                    <TR key={m.id}>
                      <TD>
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">{m.product.name}</div>
                        <div className="text-xs text-neutral-400">{m.product.sku}</div>
                      </TD>
                      <TD>
                        <Badge tone={MOVEMENT_TYPE_TONE[m.type]}>{MOVEMENT_TYPE_LABEL[m.type]}</Badge>
                      </TD>
                      <TD>{formatNumber(m.quantity)}</TD>
                      <TD className="text-xs text-neutral-500">
                        {formatNumber(m.quantityBefore)} → {formatNumber(m.quantityAfter)}
                      </TD>
                      <TD>{m.user.name}</TD>
                      <TD className="text-xs text-neutral-400">{formatDateTime(m.createdAt)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              <Pagination page={movements.pagination.page} totalPages={movements.pagination.totalPages} total={movements.pagination.total} onPageChange={setHistoryPage} />
            </>
          )}
        </Card>
      )}
    </div>
  );
}
