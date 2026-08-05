import { useQuery } from "@tanstack/react-query";
import { Package, Tags, User, Wallet } from "lucide-react";
import * as reportsApi from "../api/reports";
import { Card, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { FullPageSpinner } from "../components/ui/Spinner";
import { DataTable, type DataTableColumn } from "../components/ui/DataTable";
import { formatCurrency, formatNumber } from "../lib/formatters";
import { SalesChart } from "../components/ui/SalesChart";
import type { PaymentMethod } from "../lib/types";

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
};

type PeriodRow = { key: "today" | "week" | "month" | "year"; label: string };
const PERIOD_ROWS: PeriodRow[] = [
  { key: "today", label: "Hoy" },
  { key: "week", label: "Últimos 7 días" },
  { key: "month", label: "Este mes" },
  { key: "year", label: "Este año" },
];

export default function Estadisticas() {
  const { data, isLoading } = useQuery({ queryKey: ["report-sales-stats"], queryFn: reportsApi.getSalesStatsReport });

  if (isLoading || !data) return <FullPageSpinner />;

  const topProductsColumns: DataTableColumn<(typeof data.topProducts)[number]>[] = [
    { key: "name", header: "Producto", hideable: false, render: (p) => (
        <div>
          <div className="font-medium text-neutral-900 dark:text-neutral-100">{p.name}</div>
          <div className="text-xs text-neutral-400">{p.sku}</div>
        </div>
      ) },
    { key: "quantity", header: "Cantidad", align: "right", sortValue: (p) => p.quantity, render: (p) => formatNumber(p.quantity) },
    { key: "revenue", header: "Ingresos", align: "right", sortValue: (p) => p.revenue, render: (p) => formatCurrency(p.revenue) },
  ];

  const topCategoriesColumns: DataTableColumn<(typeof data.topCategories)[number]>[] = [
    {
      key: "name",
      header: "Categoría",
      hideable: false,
      render: (c) => (
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color ?? "#a3a3a3" }} />
          {c.name}
        </div>
      ),
    },
    { key: "quantity", header: "Cantidad", align: "right", sortValue: (c) => c.quantity, render: (c) => formatNumber(c.quantity) },
    { key: "revenue", header: "Ingresos", align: "right", sortValue: (c) => c.revenue, render: (c) => formatCurrency(c.revenue) },
  ];

  const byEmployeeColumns: DataTableColumn<(typeof data.byEmployee)[number]>[] = [
    { key: "name", header: "Empleado", hideable: false, render: (e) => e.name },
    { key: "count", header: "Ventas", align: "right", sortValue: (e) => e.count, render: (e) => formatNumber(e.count) },
    { key: "total", header: "Total vendido", align: "right", sortValue: (e) => e.total, render: (e) => formatCurrency(e.total) },
  ];

  const byPaymentColumns: DataTableColumn<(typeof data.byPaymentMethod)[number]>[] = [
    {
      key: "method",
      header: "Método de pago",
      hideable: false,
      render: (p) => <Badge tone="info">{PAYMENT_METHOD_LABEL[p.paymentMethod as PaymentMethod] ?? p.paymentMethod}</Badge>,
    },
    { key: "count", header: "Ventas", align: "right", sortValue: (p) => p.count, render: (p) => formatNumber(p.count) },
    { key: "total", header: "Total", align: "right", sortValue: (p) => p.total, render: (p) => formatCurrency(p.total) },
  ];

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-neutral-100">Estadísticas de ventas</h1>
        <p className="mt-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">Rendimiento de ventas por período, producto, categoría, empleado y método de pago.</p>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
        <SalesChart />
      </div>

      <Card className="shadow-float">
        <CardHeader title="Ventas por período" description="Total vendido, cantidad de ventas, ticket promedio y ganancia" />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900/60">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Período</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Total vendido</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Cantidad de ventas</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Ticket promedio</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Ganancia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {PERIOD_ROWS.map((row) => {
                const p = data.periods[row.key];
                return (
                  <tr key={row.key}>
                    <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{row.label}</td>
                    <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">{formatCurrency(p.total)}</td>
                    <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">{formatNumber(p.count)}</td>
                    <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">{formatCurrency(p.avgTicket)}</td>
                    <td className="px-4 py-3 text-right font-medium text-neutral-900 dark:text-neutral-100">{formatCurrency(p.profit)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Top productos vendidos" description="Últimos 30 días" />
          <DataTable
            columns={topProductsColumns}
            data={data.topProducts}
            keyField={(p) => p.productId}
            emptyState={<EmptyState icon={Package} title="Sin ventas registradas" />}
          />
        </Card>

        <Card>
          <CardHeader title="Top categorías" description="Últimos 30 días" />
          <DataTable
            columns={topCategoriesColumns}
            data={data.topCategories}
            keyField={(c) => c.name}
            emptyState={<EmptyState icon={Tags} title="Sin ventas registradas" />}
          />
        </Card>

        <Card>
          <CardHeader title="Ventas por empleado" description="Últimos 30 días" />
          <DataTable
            columns={byEmployeeColumns}
            data={data.byEmployee}
            keyField={(e) => e.userId}
            emptyState={<EmptyState icon={User} title="Sin ventas registradas" />}
          />
        </Card>

        <Card>
          <CardHeader title="Ventas por método de pago" description="Últimos 30 días" />
          <DataTable
            columns={byPaymentColumns}
            data={data.byPaymentMethod}
            keyField={(p) => p.paymentMethod}
            emptyState={<EmptyState icon={Wallet} title="Sin ventas registradas" />}
          />
        </Card>
      </div>
    </div>
  );
}
