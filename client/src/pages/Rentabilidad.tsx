import { useQuery } from "@tanstack/react-query";
import { DollarSign, Package, Percent, TrendingDown, TrendingUp } from "lucide-react";
import * as reportsApi from "../api/reports";
import type { ProfitabilityProduct } from "../api/reports";
import { Card, CardHeader } from "../components/ui/Card";
import { StatCard } from "../components/ui/StatCard";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { FullPageSpinner } from "../components/ui/Spinner";
import { DataTable, type DataTableColumn } from "../components/ui/DataTable";
import { formatCurrency, formatNumber } from "../lib/formatters";

function MarginBadge({ value }: { value: number }) {
  return <Badge tone={value < 0 ? "danger" : value < 15 ? "warning" : "success"}>{value.toFixed(1)}%</Badge>;
}

function CompactRankList({ items }: { items: ProfitabilityProduct[] }) {
  if (items.length === 0) return <p className="px-5 py-6 text-center text-sm text-neutral-400">Sin datos.</p>;
  return (
    <div className="flex flex-col divide-y divide-neutral-100 dark:divide-neutral-800">
      {items.map((p) => (
        <div key={p.productId} className="flex items-center justify-between gap-3 px-5 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{p.name}</p>
            <p className="text-xs text-neutral-400">{p.sku}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{formatCurrency(p.profit)}</span>
            <MarginBadge value={p.marginPercent} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Rentabilidad() {
  const { data, isLoading } = useQuery({
    queryKey: ["report-profitability"],
    queryFn: () => reportsApi.getProfitabilityReport(30),
  });

  if (isLoading || !data) return <FullPageSpinner />;

  const topRentables = data.products.slice(0, 5);
  const bottomRentables = [...data.products].sort((a, b) => a.profit - b.profit).slice(0, 5);

  const columns: DataTableColumn<ProfitabilityProduct>[] = [
    {
      key: "name",
      header: "Producto",
      hideable: false,
      sortValue: (p) => p.name.toLowerCase(),
      render: (p) => (
        <div>
          <div className="font-medium text-neutral-900 dark:text-neutral-100">{p.name}</div>
          <div className="text-xs text-neutral-400">{p.sku}</div>
        </div>
      ),
    },
    { key: "quantity", header: "Cantidad", align: "right", sortValue: (p) => p.quantity, render: (p) => formatNumber(p.quantity) },
    { key: "revenue", header: "Ingresos", align: "right", sortValue: (p) => p.revenue, render: (p) => formatCurrency(p.revenue) },
    { key: "cost", header: "Costo", align: "right", sortValue: (p) => p.cost, render: (p) => formatCurrency(p.cost) },
    { key: "profit", header: "Ganancia", align: "right", sortValue: (p) => p.profit, render: (p) => formatCurrency(p.profit) },
    { key: "margin", header: "Margen", align: "right", sortValue: (p) => p.marginPercent, render: (p) => <MarginBadge value={p.marginPercent} /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Rentabilidad</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Ganancia y margen calculados sobre las ventas de los últimos 30 días.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ingresos totales" value={formatCurrency(data.totals.revenue)} icon={DollarSign} />
        <StatCard label="Costo total" value={formatCurrency(data.totals.cost)} icon={Package} />
        <StatCard label="Ganancia bruta" value={formatCurrency(data.totals.grossProfit)} icon={TrendingUp} />
        <StatCard
          label="Margen de ganancia"
          value={`${data.totals.marginPercent.toFixed(1)}%`}
          icon={Percent}
          tone={data.totals.marginPercent < 0 ? "danger" : data.totals.marginPercent < 15 ? "warning" : "neutral"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Más rentables" description="Top 5 por ganancia" action={<TrendingUp className="h-4 w-4 text-emerald-500" />} />
          <CompactRankList items={topRentables} />
        </Card>
        <Card>
          <CardHeader title="Menos rentables" description="Últimos 5 por ganancia" action={<TrendingDown className="h-4 w-4 text-red-500" />} />
          <CompactRankList items={bottomRentables} />
        </Card>
      </div>

      <Card>
        <CardHeader title="Margen por producto" description="Detalle completo, ordenable por columna" />
        <DataTable
          columns={columns}
          data={data.products}
          keyField={(p) => p.productId}
          emptyState={<EmptyState icon={Package} title="Sin ventas registradas" description="Todavía no hay ventas en los últimos 30 días." />}
        />
      </Card>
    </div>
  );
}
