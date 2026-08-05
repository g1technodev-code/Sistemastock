import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Plus,
  Search,
  CreditCard,
  History,
  Edit2,
  DollarSign,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { listCustomers, getCustomer, createCustomer, updateCustomer, registerPayment } from "../api/customers";
import { formatCurrency, formatDate } from "../lib/formatters";
import type { Customer, CustomerMovement } from "../lib/types";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { Drawer } from "../components/ui/Drawer";

export default function Customers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [detailCustomerId, setDetailCustomerId] = useState<string | null>(null);

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ["customers", page, search],
    queryFn: () => listCustomers({ page, limit: 15, q: search }),
  });

  const { data: customerDetail } = useQuery({
    queryKey: ["customer-detail", detailCustomerId],
    queryFn: () => getCustomer(detailCustomerId!),
    enabled: !!detailCustomerId,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setCreateModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateCustomer>[1] }) =>
      updateCustomer(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-detail"] });
      setEditingCustomer(null);
    },
  });

  const paymentMutation = useMutation({
    mutationFn: ({ id, amount, note }: { id: string; amount: number; note?: string }) =>
      registerPayment(id, amount, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-detail"] });
      setPaymentCustomer(null);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Users className="h-7 w-7 text-primary-600 dark:text-primary-400" />
            Clientes y Cuentas Corrientes
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Administra tus clientes, verifica saldos deudores y registra abonos en cuenta corriente.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 active:scale-95"
        >
          <Plus className="h-4 w-4" /> Nuevo Cliente
        </button>
      </div>

      {/* Bar de búsqueda */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nombre, RUT/DNI, teléfono o email..."
            className="w-full rounded-xl border border-neutral-300 bg-white py-2.5 pl-10 pr-4 text-sm text-neutral-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-neutral-950">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-300">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500 dark:bg-neutral-900/50 dark:text-neutral-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold">Contacto</th>
                <th className="px-6 py-4 font-semibold">Saldo Deudor</th>
                <th className="px-6 py-4 font-semibold">Límite de Crédito</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
                <th className="px-6 py-4 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/60">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-400">
                    Cargando lista de clientes...
                  </td>
                </tr>
              )}

              {!isLoading && data?.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-400">
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              )}

              {data?.items.map((c: Customer) => {
                const hasDebt = c.currentBalance > 0;
                return (
                  <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors dark:hover:bg-neutral-900/50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">{c.name}</div>
                      {c.taxId && <div className="text-xs text-neutral-400 font-mono">ID: {c.taxId}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                        {c.phone && <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {c.phone}</div>}
                        {c.email && <div className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {c.email}</div>}
                        {!c.phone && !c.email && <span className="italic text-neutral-400">Sin datos</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold font-mono text-base ${hasDebt ? "text-danger-600 dark:text-danger-400" : "text-success-600 dark:text-success-400"}`}>
                        {formatCurrency(c.currentBalance)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {c.creditLimit !== null ? formatCurrency(c.creditLimit) : <span className="text-neutral-400">Sin límite</span>}
                    </td>
                    <td className="px-6 py-4">
                      <Badge tone={c.isActive ? "success" : "neutral"}>
                        {c.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {hasDebt && (
                          <button
                            onClick={() => setPaymentCustomer(c)}
                            title="Registrar Abono"
                            className="flex items-center gap-1.5 rounded-lg bg-success-50 px-3 py-1.5 text-xs font-semibold text-success-700 hover:bg-success-100 transition-colors dark:bg-success-500/10 dark:text-success-400 dark:hover:bg-success-500/20"
                          >
                            <DollarSign className="h-3.5 w-3.5" /> Registrar Pago
                          </button>
                        )}
                        <button
                          onClick={() => setDetailCustomerId(c.id)}
                          title="Ver Movimientos"
                          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingCustomer(c)}
                          title="Editar Cliente"
                          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition-colors dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Cliente */}
      {createModalOpen && (
        <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Crear Nuevo Cliente">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              createMutation.mutate({
                name: fd.get("name") as string,
                taxId: (fd.get("taxId") as string) || null,
                email: (fd.get("email") as string) || null,
                phone: (fd.get("phone") as string) || null,
                address: (fd.get("address") as string) || null,
                creditLimit: fd.get("creditLimit") ? Number(fd.get("creditLimit")) : null,
              });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 mb-1">Nombre Completo / Razón Social *</label>
              <input required name="name" className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 mb-1">RUT / DNI / Tax ID</label>
                <input name="taxId" className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 mb-1">Teléfono</label>
                <input name="phone" className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 mb-1">Email</label>
              <input type="email" name="email" className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 mb-1">Límite de Crédito ($)</label>
              <input type="number" step="0.01" min="0" name="creditLimit" placeholder="Dejar en blanco para sin límite" className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900" />
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <button type="button" onClick={() => setCreateModalOpen(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800">Cancelar</button>
              <button type="submit" disabled={createMutation.isPending} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500">Guardar Cliente</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Editar Cliente */}
      {editingCustomer && (
        <Modal open={!!editingCustomer} onClose={() => setEditingCustomer(null)} title="Editar Cliente">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              updateMutation.mutate({
                id: editingCustomer.id,
                input: {
                  name: fd.get("name") as string,
                  taxId: (fd.get("taxId") as string) || null,
                  email: (fd.get("email") as string) || null,
                  phone: (fd.get("phone") as string) || null,
                  address: (fd.get("address") as string) || null,
                  creditLimit: fd.get("creditLimit") ? Number(fd.get("creditLimit")) : null,
                  isActive: fd.get("isActive") === "on",
                },
              });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 mb-1">Nombre Completo *</label>
              <input required name="name" defaultValue={editingCustomer.name} className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 mb-1">RUT / DNI</label>
                <input name="taxId" defaultValue={editingCustomer.taxId || ""} className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 mb-1">Teléfono</label>
                <input name="phone" defaultValue={editingCustomer.phone || ""} className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 mb-1">Límite de Crédito ($)</label>
              <input type="number" step="0.01" min="0" name="creditLimit" defaultValue={editingCustomer.creditLimit ?? ""} className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isActive" name="isActive" defaultChecked={editingCustomer.isActive} className="rounded border-neutral-300" />
              <label htmlFor="isActive" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Cliente Activo</label>
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <button type="button" onClick={() => setEditingCustomer(null)} className="rounded-xl px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800">Cancelar</button>
              <button type="submit" disabled={updateMutation.isPending} className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500">Guardar Cambios</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Registrar Pago / Abono */}
      {paymentCustomer && (
        <Modal open={!!paymentCustomer} onClose={() => setPaymentCustomer(null)} title={`Registrar Pago - ${paymentCustomer.name}`}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              paymentMutation.mutate({
                id: paymentCustomer.id,
                amount: Number(fd.get("amount")),
                note: (fd.get("note") as string) || undefined,
              });
            }}
            className="space-y-4"
          >
            <div className="rounded-xl bg-neutral-100 p-4 dark:bg-neutral-900">
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Saldo Deudor Actual:</p>
              <p className="text-2xl font-bold font-mono text-danger-600 dark:text-danger-400">{formatCurrency(paymentCustomer.currentBalance)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 mb-1">Monto Abonado ($) *</label>
              <input required type="number" step="0.01" min="0.01" max={paymentCustomer.currentBalance} name="amount" defaultValue={paymentCustomer.currentBalance} className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900 font-mono text-lg" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 mb-1">Nota / Observación</label>
              <input name="note" placeholder="Ej. Pago en efectivo comprobante #123" className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900" />
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <button type="button" onClick={() => setPaymentCustomer(null)} className="rounded-xl px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800">Cancelar</button>
              <button type="submit" disabled={paymentMutation.isPending} className="rounded-xl bg-success-600 px-4 py-2 text-sm font-semibold text-white hover:bg-success-500">Confirmar Pago</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Drawer Historial de Movimientos de Cuenta Corriente */}
      {detailCustomerId && customerDetail && (
        <Drawer open={!!detailCustomerId} onClose={() => setDetailCustomerId(null)} title={`Cuenta Corriente - ${customerDetail.name}`}>
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Saldo Deudor Actual</span>
              <p className="text-3xl font-extrabold font-mono text-danger-600 dark:text-danger-400">{formatCurrency(customerDetail.currentBalance)}</p>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 mb-3">Historial de Movimientos</h3>
              <div className="space-y-3">
                {customerDetail.movements.length === 0 && (
                  <p className="text-sm text-neutral-400 italic">No hay movimientos registrados.</p>
                )}
                {customerDetail.movements.map((m: CustomerMovement) => {
                  const isCharge = m.type === "CHARGE";
                  return (
                    <div key={m.id} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                      <div>
                        <div className="flex items-center gap-2 font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                          {isCharge ? <AlertCircle className="h-4 w-4 text-danger-500" /> : <CheckCircle2 className="h-4 w-4 text-success-500" />}
                          <span>{isCharge ? "Cargo por Venta" : "Abono / Pago"}</span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5">{m.note || "Sin nota"} • {formatDate(m.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold font-mono text-sm ${isCharge ? "text-danger-600 dark:text-danger-400" : "text-success-600 dark:text-success-400"}`}>
                          {isCharge ? `+${formatCurrency(m.amount)}` : `-${formatCurrency(m.amount)}`}
                        </p>
                        <p className="text-[10px] text-neutral-400 font-mono">Saldo: {formatCurrency(m.balanceAfter)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
