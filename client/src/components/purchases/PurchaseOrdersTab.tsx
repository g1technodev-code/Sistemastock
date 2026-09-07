import { useState } from "react";
import { Plus, ClipboardList, PackageCheck, Pencil } from "lucide-react";
import { usePurchaseOrders, usePurchaseOrderMutations } from "../../hooks/usePurchaseOrders";
import { useSuppliers } from "../../hooks/useSuppliers";
import { PurchaseOrderForm } from "./PurchaseOrderForm";
import { ReceiveOrderModal } from "./ReceiveOrderModal";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { DataTable, type DataTableColumn } from "../ui/DataTable";
import { Badge } from "../ui/Badge";
import { Select } from "../ui/Select";
import { Modal } from "../ui/Modal";
import { Drawer } from "../ui/Drawer";
import { EmptyState } from "../ui/EmptyState";
import { Table, TBody, TD, TH, THead, TR } from "../ui/Table";
import { formatCurrency, formatDateTime } from "../../lib/utils";
import { useToast } from "../../hooks/useToast";
import { extractErrorMessage } from "../../lib/api";
import type { PurchaseOrder, PurchaseOrderStatus } from "../../lib/types";

const STATUS_TONE: Record<PurchaseOrderStatus, "neutral" | "success" | "danger" | "warning" | "info"> = {
  PENDING: "warning",
  PARTIALLY_RECEIVED: "info",
  RECEIVED: "success",
  CANCELLED: "danger",
};

const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  PENDING: "Pendiente",
  PARTIALLY_RECEIVED: "Recep. Parcial",
  RECEIVED: "Completado",
  CANCELLED: "Cancelado",
};

export function PurchaseOrdersTab({ canManage }: { canManage: boolean }) {
  const { showSuccess, showError } = useToast();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | "">("");
  const [supplierFilter, setSupplierFilter] = useState<string>("");

  const { data, isLoading } = usePurchaseOrders({
    page,
    limit: 20,
    status: statusFilter || undefined,
    supplierId: supplierFilter || undefined,
  });

  const { data: suppliers } = useSuppliers();
  const { create, update } = usePurchaseOrderMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = data?.items.find((p) => p.id === detailId);

  const [receiveTarget, setReceiveTarget] = useState<PurchaseOrder | null>(null);

  const openCreate = () => {
    setEditingPO(null);
    setFormOpen(true);
  };

  const openEdit = (po: PurchaseOrder) => {
    setEditingPO(po);
    setFormOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingPO) {
        await update.mutateAsync({ id: editingPO.id, input: values });
        showSuccess("Pedido actualizado");
      } else {
        await create.mutateAsync(values);
        showSuccess("Pedido registrado exitosamente");
      }
      setFormOpen(false);
    } catch (error) {
      showError(extractErrorMessage(error, "Error al guardar el pedido"));
    }
  };

  const columns: DataTableColumn<PurchaseOrder>[] = [
    {
      key: "supplier",
      header: "Proveedor",
      hideable: false,
      render: (p) => (
        <div>
          <div className="font-medium text-neutral-900 dark:text-neutral-100">{p.supplier.name}</div>
          <div className="text-xs text-neutral-400">ID: {p.id.slice(-6)}</div>
        </div>
      ),
    },
    { key: "status", header: "Estado", render: (p) => <Badge tone={STATUS_TONE[p.status]}>{STATUS_LABEL[p.status]}</Badge> },
    { key: "estimatedTotal", header: "Total Est.", align: "right", render: (p) => formatCurrency(p.estimatedTotal) },
    { key: "date", header: "Fecha", sortValue: (p) => p.createdAt, render: (p) => <span className="text-xs text-neutral-400">{formatDateTime(p.createdAt)}</span> },
  ];

  return (
    <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Pedidos a Proveedores</h2>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nuevo Pedido
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select
            className="w-48"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as PurchaseOrderStatus | "");
              setPage(1);
            }}
          >
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="PARTIALLY_RECEIVED">Recep. Parcial</option>
            <option value="RECEIVED">Completado</option>
            <option value="CANCELLED">Cancelado</option>
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
          emptyState={<EmptyState icon={ClipboardList} title="Sin pedidos" description="Registra un pedido para enviarlo a tu proveedor." />}
          rowActions={
            canManage
              ? (p) => (
                  <>
                    {(p.status === "PENDING" || p.status === "PARTIALLY_RECEIVED") && (
                      <Button variant="ghost" size="sm" onClick={() => setReceiveTarget(p)} title="Recibir Mercadería">
                        <PackageCheck className="h-4 w-4 text-emerald-500" />
                      </Button>
                    )}
                    {p.status === "PENDING" && (
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
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
        title={editingPO ? "Editar pedido" : "Nuevo pedido"}
        size="lg"
      >
        <PurchaseOrderForm
          initialOrder={editingPO}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
          isSubmitting={create.isPending || update.isPending}
        />
      </Modal>

      <Drawer open={!!detailId} onClose={() => setDetailId(null)} title={detail ? `Pedido a ${detail.supplier.name}` : "Detalle de pedido"}>
        {!detail ? (
          <p className="py-6 text-center text-sm text-neutral-400">Cargando...</p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge tone={STATUS_TONE[detail.status]}>{STATUS_LABEL[detail.status]}</Badge>
                <span className="text-xs text-neutral-400">{formatDateTime(detail.createdAt)}</span>
              </div>
              {(detail.status === "PENDING" || detail.status === "PARTIALLY_RECEIVED") && (
                <Button size="sm" onClick={() => { setDetailId(null); setReceiveTarget(detail); }}>
                  <PackageCheck className="w-4 h-4 mr-2" /> Recibir
                </Button>
              )}
            </div>

            <Table>
              <THead>
                <tr>
                  <TH>Producto</TH>
                  <TH className="text-right">Pedida</TH>
                  <TH className="text-right">Recibida</TH>
                  <TH className="text-right">Costo est.</TH>
                  <TH className="text-right">Total est.</TH>
                </tr>
              </THead>
              <TBody>
                {detail.items.map((it) => (
                  <TR key={it.id}>
                    <TD>
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">{it.product.name}</div>
                      <div className="text-xs text-neutral-400">{it.product.sku}</div>
                    </TD>
                    <TD className="text-right font-medium">{it.quantity}</TD>
                    <TD className="text-right text-primary-600 font-medium">{it.receivedQuantity}</TD>
                    <TD className="text-right text-neutral-500">{formatCurrency(it.estimatedUnitPrice)}</TD>
                    <TD className="text-right">{formatCurrency(it.estimatedUnitPrice * it.quantity)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>

            <div className="flex items-center justify-between border-t border-neutral-200 pt-3 text-sm dark:border-neutral-800">
              <span className="text-neutral-500 dark:text-neutral-400">Total Estimado</span>
              <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(detail.estimatedTotal)}</span>
            </div>

            {detail.notes && (
              <div className="rounded-lg border border-neutral-200 p-3 text-sm text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
                {detail.notes}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {receiveTarget && (
        <ReceiveOrderModal
          order={receiveTarget}
          open={!!receiveTarget}
          onClose={() => setReceiveTarget(null)}
        />
      )}
    </div>
  );
}
