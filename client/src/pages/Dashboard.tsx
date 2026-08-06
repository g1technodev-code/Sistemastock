import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Package,
  DollarSign,
  AlertTriangle,
  ArrowLeftRight,
  ShoppingCart,
  Wallet,
  TrendingUp,
  Receipt,
  Percent,
  Clock,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { getDashboardSummary } from "../api/dashboard";
import { StatCard } from "../components/ui/StatCard";
import { Card, CardHeader } from "../components/ui/Card";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { FullPageSpinner } from "../components/ui/Spinner";
import { formatCurrency, formatDateTime, formatNumber } from "../lib/formatters";

const MOVEMENT_TYPE_LABEL: Record<string, string> = { IN: "Entrada", OUT: "Salida", ADJUSTMENT: "Ajuste" };
const MOVEMENT_TYPE_TONE: Record<string, "success" | "danger" | "warning"> = {
  IN: "success",
  OUT: "danger",
  ADJUSTMENT: "warning",
};

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard-summary"], queryFn: getDashboardSummary });

  if (isLoading || !data) return <FullPageSpinner />;

  const { alerts } = data;
  const hasAlerts = alerts.lowStock.length > 0 || alerts.noMovement.length > 0 || alerts.noSupplier.length > 0;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white">Panel general</h1>
        <p className="mt-1 text-base text-neutral-500 dark:text-neutral-400">Resumen de tu inventario en tiempo real.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <StatCard label="Ventas de hoy" value={formatCurrency(data.kpis.salesToday)} icon={ShoppingCart} tone="neutral" delta={{value: "12%", direction: "up", isGood: true}} />
        <StatCard label="Ganancia de hoy" value={formatCurrency(data.kpis.profitToday)} icon={TrendingUp} tone="neutral" delta={{value: "8%", direction: "up", isGood: true}} />
        <StatCard label="Valor del inventario" value={formatCurrency(data.kpis.totalStockValue)} icon={DollarSign} />
        <StatCard label="Productos vendidos hoy" value={formatNumber(data.kpis.unitsSoldToday)} icon={Receipt} />
        <StatCard label="Ticket promedio" value={formatCurrency(data.kpis.avgTicketToday)} icon={Percent} />
        <StatCard label="Saldo en caja" value={formatCurrency(data.kpis.cashBalance)} icon={Wallet} />
        <StatCard
          label="Alertas de stock bajo"
          value={formatNumber(data.kpis.lowStockCount)}
          icon={AlertTriangle}
          tone={data.kpis.lowStockCount > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Productos sin movimiento"
          value={formatNumber(data.kpis.noMovementCount)}
          icon={Clock}
          tone={data.kpis.noMovementCount > 0 ? "warning" : "neutral"}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader title="Alertas inteligentes" description="Cosas que conviene revisar hoy" />
            {!hasAlerts ? (
              <EmptyState icon={CheckCircle2} title="Todo en orden" description="No hay alertas pendientes por ahora." />
            ) : (
              <div className="max-h-[420px] overflow-y-auto p-2">
                {alerts.lowStock.map((a) => (
                  <Link
                    key={`low-${a.productId}`}
                    to={`/products/${a.productId}`}
                    className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${a.currentStock <= 0 ? "text-red-500" : "text-amber-500"}`} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">
                        {a.currentStock <= 0 ? "Sin stock: " : "Quedan pocas unidades de "}
                        {a.name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Stock {a.currentStock} / mínimo {a.minStock}
                      </p>
                    </div>
                  </Link>
                ))}
                {alerts.noMovement.map((a) => (
                  <Link
                    key={`nomove-${a.productId}`}
                    to={`/products/${a.productId}`}
                    className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{a.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {a.daysSinceLastMovement === null
                          ? "Nunca tuvo movimientos registrados"
                          : `Hace ${a.daysSinceLastMovement} días que no tiene movimientos`}
                      </p>
                    </div>
                  </Link>
                ))}
                {alerts.noSupplier.map((a) => (
                  <Link
                    key={`nosup-${a.productId}`}
                    to={`/products/${a.productId}`}
                    className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <Truck className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{a.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Sin proveedor asignado</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader title="Actividad reciente" description="Últimos movimientos de stock registrados" />
            {data.recentActivity.length === 0 ? (
              <EmptyState icon={ArrowLeftRight} title="Aún no hay movimientos registrados" />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>Producto</TH>
                    <TH>Tipo</TH>
                    <TH>Cantidad</TH>
                    <TH>Usuario</TH>
                    <TH>Fecha</TH>
                  </tr>
                </THead>
                <TBody>
                  {data.recentActivity.map((m) => (
                    <TR key={m.id}>
                      <TD className="font-medium text-neutral-900 dark:text-neutral-100">{m.product.name}</TD>
                      <TD>
                        <Badge tone={MOVEMENT_TYPE_TONE[m.type]}>{MOVEMENT_TYPE_LABEL[m.type]}</Badge>
                      </TD>
                      <TD>{formatNumber(m.quantity)}</TD>
                      <TD>{m.user.name}</TD>
                      <TD className="text-xs text-neutral-400">{formatDateTime(m.createdAt)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
