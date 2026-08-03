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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Panel general</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Resumen de tu inventario en tiempo real.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ventas hoy" value={formatCurrency(data.kpis.salesToday)} icon={ShoppingCart} />
        <StatCard label="Ganancia hoy" value={formatCurrency(data.kpis.profitToday)} icon={TrendingUp} />
        <StatCard label="Valor en inventario" value={formatCurrency(data.kpis.totalStockValue)} icon={DollarSign} />
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
        <StatCard label="Productos activos" value={formatNumber(data.kpis.totalProducts)} icon={Package} />
        <StatCard label="Movimientos hoy" value={formatNumber(data.kpis.movementsToday)} icon={ArrowLeftRight} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
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
          <Card>
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
