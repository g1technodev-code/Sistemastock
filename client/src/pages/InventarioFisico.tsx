import { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Field";
import { Badge } from "../components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { DataTable, type DataTableColumn } from "../components/ui/DataTable";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useProducts } from "../hooks/useProducts";
import { useInventoryCounts, useInventoryCount, useInventoryCountMutations } from "../hooks/useInventoryCounts";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../api/client";
import { formatDateTime, formatNumber } from "../lib/formatters";
import { cn } from "../lib/utils";
import type { InventoryCount, InventoryCountStatus } from "../lib/types";

const STATUS_LABEL: Record<InventoryCountStatus, string> = { OPEN: "Abierta", COMPLETED: "Completada" };
const STATUS_TONE: Record<InventoryCountStatus, "warning" | "success"> = { OPEN: "warning", COMPLETED: "success" };

function DifferenceBadge({ value }: { value: number }) {
  if (value === 0) return <Badge tone="success">Sin diferencia</Badge>;
  return <Badge tone={value > 0 ? "info" : "danger"}>{value > 0 ? `+${value} sobrante` : `${value} faltante`}</Badge>;
}

function CountingWorkspace({ session, onBack }: { session: InventoryCount; onBack: () => void }) {
  const { showSuccess, showError } = useToast();
  const { upsertItem, removeItem, confirm } = useInventoryCountMutations();
  const isOpen = session.status === "OPEN";

  const [search, setSearch] = useState("");
  const { data: productsPage } = useProducts({ q: search || undefined, isActive: true, limit: 10 });
  const countedProductIds = new Set(session.items.map((it) => it.productId));
  const searchResults = (productsPage?.items ?? []).filter((p) => !countedProductIds.has(p.id));

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const draftValue = (productId: string, fallback: number) => drafts[productId] ?? String(fallback);

  const saveCount = async (productId: string, fallback: number) => {
    const raw = drafts[productId];
    if (raw === undefined) return;
    const parsed = Math.max(0, Number(raw) || 0);
    if (parsed === fallback) return;
    try {
      await upsertItem.mutateAsync({ id: session.id, productId, countedQuantity: parsed });
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo guardar el conteo"));
    }
  };

  const addProduct = async (productId: string) => {
    const product = productsPage?.items.find((p) => p.id === productId);
    if (!product) return;
    try {
      await upsertItem.mutateAsync({ id: session.id, productId, countedQuantity: product.currentStock });
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo agregar el producto"));
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await removeItem.mutateAsync({ id: session.id, productId });
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo quitar el producto"));
    }
  };

  const handleConfirm = async () => {
    try {
      await confirm.mutateAsync(session.id);
      showSuccess("Ajustes confirmados: el stock ya refleja el conteo físico");
      setConfirmOpen(false);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo confirmar la sesión"));
    }
  };

  const diffCount = session.items.filter((it) => it.difference !== 0).length;

  return (
    <div className="flex flex-col gap-4">
      <button onClick={onBack} className="flex w-fit items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
        <ArrowLeft className="h-4 w-4" /> Volver al historial
      </button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Sesión de inventario</h1>
            <Badge tone={STATUS_TONE[session.status]}>{STATUS_LABEL[session.status]}</Badge>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Iniciada por {session.startedBy.name} el {formatDateTime(session.startedAt)}
            {session.completedBy && ` · Confirmada por ${session.completedBy.name} el ${formatDateTime(session.completedAt!)}`}
          </p>
        </div>
        {isOpen && (
          <Button onClick={() => setConfirmOpen(true)} disabled={session.items.length === 0}>
            <CheckCircle2 className="h-4 w-4" /> Confirmar ajustes
          </Button>
        )}
      </div>

      {isOpen && (
        <Card>
          <CardHeader title="Agregar producto al conteo" description="Busca por nombre, SKU o código de barras" />
          <CardBody className="flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input className="pl-9" placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {search && (
              <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                {searchResults.length === 0 && <p className="col-span-full py-4 text-center text-sm text-neutral-400">Sin resultados.</p>}
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProduct(p.id)}
                    className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 p-3 text-left text-sm transition-colors hover:border-indigo-400 hover:bg-indigo-50 dark:border-neutral-700 dark:hover:bg-indigo-950"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-neutral-900 dark:text-neutral-100">{p.name}</div>
                      <div className="text-xs text-neutral-400">{p.sku} · sistema: {p.currentStock}</div>
                    </div>
                    <Plus className="h-4 w-4 shrink-0 text-indigo-500" />
                  </button>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Productos contados"
          description={`${session.items.length} producto(s) · ${diffCount} con diferencia`}
        />
        {session.items.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Todavía no agregaste productos" description="Busca productos arriba para empezar a contar." />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Producto</TH>
                <TH className="text-right">Cantidad sistema</TH>
                <TH className="text-right">Cantidad contada</TH>
                <TH className="text-right">Diferencia</TH>
                {isOpen && <TH className="text-right">Acciones</TH>}
              </tr>
            </THead>
            <TBody>
              {session.items.map((it) => (
                <TR key={it.id}>
                  <TD>
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">{it.product.name}</div>
                    <div className="text-xs text-neutral-400">{it.product.sku}</div>
                  </TD>
                  <TD className="text-right">{formatNumber(it.systemQuantity)}</TD>
                  <TD className="text-right">
                    {isOpen ? (
                      <input
                        type="number"
                        min={0}
                        value={draftValue(it.productId, it.countedQuantity)}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [it.productId]: e.target.value }))}
                        onBlur={() => saveCount(it.productId, it.countedQuantity)}
                        onKeyDown={(e) => e.key === "Enter" && saveCount(it.productId, it.countedQuantity)}
                        className={cn(
                          "w-20 rounded-md border border-neutral-300 bg-white px-2 py-1 text-right text-sm dark:border-neutral-700 dark:bg-neutral-900",
                        )}
                      />
                    ) : (
                      formatNumber(it.countedQuantity)
                    )}
                  </TD>
                  <TD className="text-right">
                    <DifferenceBadge value={it.difference} />
                  </TD>
                  {isOpen && (
                    <TD className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleRemove(it.productId)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TD>
                  )}
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar ajustes de inventario"
        message={
          diffCount === 0
            ? "Ningún producto tiene diferencia respecto al sistema. Igual se cerrará la sesión como confirmada."
            : `Se van a ajustar ${diffCount} producto(s) al valor contado. Esto queda registrado como movimientos de stock tipo Ajuste.`
        }
        confirmLabel="Confirmar ajustes"
        isLoading={confirm.isPending}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

export default function InventarioFisico() {
  const { showError } = useToast();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<InventoryCountStatus | "">("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const { data, isLoading } = useInventoryCounts({ page, limit: 10, status: statusFilter || undefined });
  const { data: activeSession } = useInventoryCount(activeSessionId);
  const { createSession } = useInventoryCountMutations();

  const handleCreate = async () => {
    try {
      const session = await createSession.mutateAsync(null);
      setActiveSessionId(session.id);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo crear la sesión"));
    }
  };

  if (activeSessionId) {
    if (!activeSession) {
      return <p className="py-10 text-center text-sm text-neutral-400">Cargando sesión...</p>;
    }
    return <CountingWorkspace session={activeSession} onBack={() => setActiveSessionId(null)} />;
  }

  const columns: DataTableColumn<InventoryCount>[] = [
    { key: "status", header: "Estado", hideable: false, render: (s) => <Badge tone={STATUS_TONE[s.status]}>{STATUS_LABEL[s.status]}</Badge> },
    { key: "startedBy", header: "Iniciada por", render: (s) => s.startedBy.name },
    { key: "startedAt", header: "Fecha inicio", sortValue: (s) => s.startedAt, render: (s) => <span className="text-xs text-neutral-400">{formatDateTime(s.startedAt)}</span> },
    { key: "items", header: "Productos", align: "right", sortValue: (s) => s.items.length, render: (s) => formatNumber(s.items.length) },
    {
      key: "diffs",
      header: "Diferencias",
      align: "right",
      sortValue: (s) => s.items.filter((it) => it.difference !== 0).length,
      render: (s) => {
        const diffs = s.items.filter((it) => it.difference !== 0).length;
        return diffs > 0 ? <Badge tone="warning">{diffs}</Badge> : <Badge tone="success">0</Badge>;
      },
    },
    {
      key: "completed",
      header: "Confirmada",
      render: (s) => (s.completedBy ? `${s.completedBy.name} · ${formatDateTime(s.completedAt!)}` : "—"),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Inventario físico</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Conteos físicos de stock y ajustes contra el sistema.</p>
        </div>
        <Button onClick={handleCreate} isLoading={createSession.isPending}>
          <Plus className="h-4 w-4" /> Nueva sesión
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Select
            className="w-48"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as InventoryCountStatus | "");
              setPage(1);
            }}
          >
            <option value="">Todos los estados</option>
            <option value="OPEN">Abiertas</option>
            <option value="COMPLETED">Completadas</option>
          </Select>
        </div>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          data={data?.items}
          keyField={(s) => s.id}
          isLoading={isLoading}
          onRowClick={(s) => setActiveSessionId(s.id)}
          pagination={data?.pagination}
          onPageChange={setPage}
          emptyState={
            <EmptyState icon={AlertTriangle} title="Sin sesiones de inventario" description="Crea una sesión para empezar un conteo físico." />
          }
        />
      </Card>
    </div>
  );
}
