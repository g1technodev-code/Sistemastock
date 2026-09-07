import { useState } from "react";
import { Plus, ShoppingBag, PackageCheck, Ban, Pencil } from "lucide-react";
import { usePurchases, usePurchaseMutations } from "../../hooks/usePurchases";
import { useSuppliers } from "../../hooks/useSuppliers";
import { PurchaseForm } from "./PurchaseForm";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { DataTable, type DataTableColumn } from "../ui/DataTable";
import { Badge } from "../ui/Badge";
import { Select } from "../ui/Select";
import { Modal } from "../ui/Modal";
import { Drawer } from "../ui/Drawer";
import { EmptyState } from "../ui/EmptyState";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Table, TBody, TD, TH, THead, TR } from "../ui/Table";
import { formatCurrency, formatDateTime } from "../../lib/utils";
import { useToast } from "../../hooks/useToast";
import { extractErrorMessage } from "../../lib/api";
import type { Purchase, PurchaseStatus } from "../../lib/types";

const STATUS_TONE: Record<PurchaseStatus, "neutral" | "success" | "danger" | "warning"> = {
  PENDING: "warning",
  RECEIVED: "success",
  CANCELLED: "danger",
};

const STATUS_LABEL: Record<PurchaseStatus, string> = {
  PENDING: "Pendiente",
  RECEIVED: "Recibida",
  CANCELLED: "Cancelada",
};

export function PurchasesListTab({ canManage }: { canManage: boolean }) {
  const { showSuccess, showError } = useToast();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | "">("");
  const [supplierFilter, setSupplierFilter] = useState<string>("");

  const { data, isLoading } = usePurchases({
    page,
    limit: 20,
    status: statusFilter || undefined,
    supplierId: supplierFilter || undefined,
  });

  const { data: suppliers } = useSuppliers();
  const { create, update, receive, cancel } = usePurchaseMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = data?.items.find((p) => p.id === detailId);

  const [receiveTarget, setReceiveTarget] = useState<Purchase | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Purchase | null>(null);

  const openCreate = () => {
    setEditingPurchase(null);
    setFormOpen(true);
  };

  const openEdit = (p: Purchase) => {
    setEditingPurchase(p);
    setFormOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingPurchase) {
        await update.mutateAsync({ id: editingPurchase.id, input: values });
        showSuccess("Compra actualizada");
      } else {
        await create.mutateAsync(values);
        showSuccess("Compra registrada exitosamente (Recepcionada)");
      }
      setFormOpen(false);
    } catch (error) {
      showError(extractErrorMessage(error, "Error al guardar compra"));
    }
  };

  const handleReceive = async () => {
    if (!receiveTarget) return;
    try {
      await receive.mutateAsync(receiveTarget.id);
      showSuccess("Mercadería recibida y stock actualizado");
      setReceiveTarget(null);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo recibir la compra"));
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancel.mutateAsync(cancelTarget.id);
      showSuccess("Compra cancelada");
      setCancelTarget(null);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo cancelar la compra"));
    }
  };

  const columns: DataTableColumn<Purchase>[] = [
    {
      key: "supplier",
      header: "Proveedor",
      hideable: false,
      render: (p) => (
        <div>
          <div className="font-medium text-neutral-900 dark:text-neutral-100">{p.supplier.name}</div>
          <div className="text-xs text-neutral-400">{p.items.length} línea(s)</div>
        </div>
      ),
    },
    { key: "status", header: "Estado", render: (p) => <Badge tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge> },
    { key: "total", header: "Total", align: "right", sortValue: (p) => p.total, render: (p) => formatCurrency(p.total) },
    { key: "payment", header: "Pago", render: (p) => <span className="text-sm text-neutral-500">{p.paymentMethod || "-"}</span> },
    { key: "user", header: "Registrado por", render: (p) => p.user.name },
    { key: "date", header: "Fecha", sortValue: (p) => p.createdAt, render: (p) => <span className="text-xs text-neutral-400">{formatDateTime(p.createdAt)}</span> },
  ];

  return (
    <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Historial de Compras Directas y Recepciones</h2>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Registrar Compra Directa
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            className="w-48"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as PurchaseStatus | "");
              setPage(1);
            }}
          >
            <option value="">Todos los estados</option>
            <option value="RECEIVED">Recibida</option>
            <option value="PENDING">Pendiente</option>
            <option value="CANCELLED">Cancelada</option>
          </Select>
          <Select
            className="w-56"
            value={supplierFilter}
            onChange={(e) => {
              setSupplierFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos los proveedores</option>
            {suppliers?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          data={data?.items}
          keyField={(p) => p.id}
          isLoading={isLoading}
          onRowClick={(p) => setDetailId(p.id)}
          pagination={data?.pagination}
          onPageChange={setPage}
          emptyState={<EmptyState icon={ShoppingBag} title="Sin compras registradas" description="Registra una compra directa o recibe un pedido." />}
          rowActions={
            canManage
              ? (p) => (
                  <>
                    {p.status === "PENDING" && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setReceiveTarget(p)}>
                          <PackageCheck className="h-4 w-4 text-emerald-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setCancelTarget(p)}>
                          <Ban className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </>
                )
              : undefined
          }
        />
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingPurchase ? "Editar compra" : "Registrar Compra Directa"}
        size="lg"
      >
        <PurchaseForm
          initialPurchase={editingPurchase}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
          isSubmitting={create.isPending || update.isPending}
        />
      </Modal>

      <Drawer open={!!detailId} onClose={() => setDetailId(null)} title={detail ? `Compra a ${detail.supplier.name}` : "Detalle de compra"}>
        {!detail ? (
          <p className="py-6 text-center text-sm text-neutral-400">Cargando...</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Badge tone={STATUS_TONE[detail.status]}>{STATUS_LABEL[detail.status]}</Badge>
              <span className="text-xs text-neutral-400">{formatDateTime(detail.createdAt)}</span>
            </div>

            <Table>
              <THead>
                <tr>
                  <TH>Producto</TH>
                  <TH className="text-right">Cant.</TH>
                  <TH className="text-right">Costo unit.</TH>
                  <TH className="text-right">Subtotal</TH>
                </tr>
              </THead>
              <TBody>
                {detail.items.map((it) => (
                  <TR key={it.id}>
                    <TD>
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">{it.product.name}</div>
                      <div className="text-xs text-neutral-400">{it.product.sku}</div>
                    </TD>
                    <TD className="text-right">{it.quantity}</TD>
                    <TD className="text-right">{formatCurrency(it.unitCost)}</TD>
                    <TD className="text-right font-medium">{formatCurrency(it.subtotal)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>

            <div className="flex flex-col gap-1 border-t border-neutral-200 pt-3 text-sm dark:border-neutral-800">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 dark:text-neutral-400">Método de pago:</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{detail.paymentMethod || "No especificado"}</span>
              </div>
              {detail.receiptNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 dark:text-neutral-400">Comprobante:</span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">{detail.receiptNumber}</span>
                </div>
              )}
              {detail.purchaseOrderId && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-neutral-500 dark:text-neutral-400">Pedido Origen:</span>
                  <span className="font-medium text-primary-600 dark:text-primary-400">#{detail.purchaseOrderId}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-neutral-200 pt-3 text-sm dark:border-neutral-800">
              <span className="text-neutral-500 dark:text-neutral-400">Total</span>
              <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(detail.total)}</span>
            </div>

            {detail.note && (
              <div className="rounded-lg border border-neutral-200 p-3 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
                {detail.note}
              </div>
            )}

            <div className="flex flex-col gap-1 text-xs text-neutral-500 dark:text-neutral-400">
              <span>Registrada por {detail.user.name}</span>
              {detail.receivedBy && <span>Recibida por {detail.receivedBy.name} el {formatDateTime(detail.receivedAt!)}</span>}
              {detail.cancelledBy && <span>Cancelada por {detail.cancelledBy.name} el {formatDateTime(detail.cancelledAt!)}</span>}
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!receiveTarget}
        title="Recibir compra"
        message={
          receiveTarget
            ? `Vas a marcar como recibida la compra a "${receiveTarget.supplier.name}" por ${formatCurrency(receiveTarget.total)}. Esto va a sumar el stock de cada producto automáticamente.`
            : ""
        }
        confirmLabel="Recibir"
        isLoading={receive.isPending}
        onConfirm={handleReceive}
        onCancel={() => setReceiveTarget(null)}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancelar compra"
        message={cancelTarget ? `¿Seguro que deseas cancelar la compra a "${cancelTarget.supplier.name}"? Esta acción no se puede deshacer.` : ""}
        confirmLabel="Cancelar compra"
        danger
        isLoading={cancel.isPending}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  );
}
