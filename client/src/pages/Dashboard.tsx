import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Package, DollarSign, AlertTriangle, ArrowLeftRight, ShoppingCart, Wallet } from "lucide-react";
import { getDashboardSummary } from "../api/dashboard";
import { StatCard } from "../components/ui/StatCard";
import { ChartCard } from "../components/ui/ChartCard";
import { Card, CardHeader } from "../components/ui/Card";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { FullPageSpinner } from "../components/ui/Spinner";
import { ChartLegend, ChartTooltip } from "../components/charts/ChartPrimitives";
import { useDarkMode } from "../hooks/useDarkMode";
import { getCategoricalPalette, getChrome, status } from "../lib/chartColors";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "../lib/formatters";

const MOVEMENT_TYPE_LABEL: Record<string, string> = { IN: "Entrada", OUT: "Salida", ADJUSTMENT: "Ajuste" };
const MOVEMENT_TYPE_TONE: Record<string, "success" | "danger" | "warning"> = {
  IN: "success",
  OUT: "danger",
  ADJUSTMENT: "warning",
};

export default function Dashboard() {
  const isDark = useDarkMode();
  const chrome = getChrome(isDark);
  const palette = getCategoricalPalette(isDark);

  const { data, isLoading } = useQuery({ queryKey: ["dashboard-summary"], queryFn: getDashboardSummary });

  if (isLoading || !data) return <FullPageSpinner />;

  const inColor = status.good;
  const outColor = status.critical;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Panel general</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Resumen de tu inventario en tiempo real.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Productos activos" value={formatNumber(data.kpis.totalProducts)} icon={Package} />
        <StatCard label="Valor en inventario" value={formatCurrency(data.kpis.totalStockValue, "PEN")} icon={DollarSign} />
        <StatCard
          label="Alertas de stock bajo"
          value={formatNumber(data.kpis.lowStockCount)}
          icon={AlertTriangle}
          tone={data.kpis.lowStockCount > 0 ? "warning" : "neutral"}
        />
        <StatCard label="Movimientos hoy" value={formatNumber(data.kpis.movementsToday)} icon={ArrowLeftRight} />
        <StatCard label="Ventas hoy" value={formatCurrency(data.kpis.salesToday, "PEN")} icon={ShoppingCart} />
        <StatCard label="Caja" value={formatCurrency(data.kpis.cashBalance, "PEN")} icon={Wallet} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Movimientos de stock (14 días)" description="Unidades que entraron y salieron por día">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.movementSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="inGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={inColor} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={inColor} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={outColor} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={outColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={chrome.grid} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => formatDate(v).replace(".", "")}
                  tick={{ fill: chrome.muted, fontSize: 11 }}
                  axisLine={{ stroke: chrome.axis }}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis tick={{ fill: chrome.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip
                  cursor={{ stroke: chrome.axis, strokeWidth: 1, strokeDasharray: "3 3" }}
                  content={({ active, label, payload }) => (
                    <ChartTooltip active={active} label={label ? formatDate(String(label)) : undefined}>
                      {payload?.map((p) => (
                        <div key={p.dataKey as string} className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                          <span style={{ color: chrome.secondaryInk }}>{p.dataKey === "in" ? "Entradas" : "Salidas"}:</span>
                          <span className="font-medium" style={{ color: chrome.primaryInk }}>
                            {formatNumber(Number(p.value))}
                          </span>
                        </div>
                      ))}
                    </ChartTooltip>
                  )}
                />
                <Area type="monotone" dataKey="in" stroke={inColor} strokeWidth={2} fill="url(#inGradient)" dot={false} />
                <Area type="monotone" dataKey="out" stroke={outColor} strokeWidth={2} fill="url(#outGradient)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <ChartLegend
              items={[
                { label: "Entradas", color: inColor },
                { label: "Salidas", color: outColor },
              ]}
            />
          </ChartCard>
        </div>

        <ChartCard title="Valor por categoría" description="Distribución del valor en inventario">
          {data.categoryBreakdown.length === 0 ? (
            <EmptyState icon={Package} title="Sin datos" description="Registra productos con categoría para ver esta gráfica." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie
                    data={data.categoryBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="85%"
                    paddingAngle={2}
                    stroke="none"
                  >
                    {data.categoryBreakdown.map((entry, i) => (
                      <Cell key={entry.name} fill={palette[i % palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      const entry = payload?.[0];
                      if (!entry) return null;
                      return (
                        <ChartTooltip active={active}>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span style={{ color: chrome.secondaryInk }}>{entry.name}:</span>
                            <span className="font-medium" style={{ color: chrome.primaryInk }}>
                              {formatCurrency(Number(entry.value), "PEN")}
                            </span>
                          </div>
                        </ChartTooltip>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ChartLegend
                items={data.categoryBreakdown.map((c, i) => ({ label: c.name, color: palette[i % palette.length] }))}
              />
            </>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Top productos (30 días)" description="Más unidades vendidas / consumidas">
          {data.topProducts.length === 0 ? (
            <EmptyState icon={ArrowLeftRight} title="Sin movimientos recientes" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topProducts} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} stroke={chrome.grid} />
                <XAxis type="number" tick={{ fill: chrome.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fill: chrome.secondaryInk, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
                  content={({ active, payload }) => {
                    const entry = payload?.[0];
                    if (!entry) return null;
                    return (
                      <ChartTooltip active={active} label={entry.payload.name}>
                        <span style={{ color: chrome.primaryInk }}>{formatNumber(Number(entry.value))} unidades</span>
                      </ChartTooltip>
                    );
                  }}
                />
                <Bar dataKey="quantity" fill={palette[0]} radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

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
