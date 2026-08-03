import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileText } from "lucide-react";
import * as reportsApi from "../api/reports";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ChartCard } from "../components/ui/ChartCard";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { EmptyState } from "../components/ui/EmptyState";
import { FullPageSpinner } from "../components/ui/Spinner";
import { ChartLegend, ChartTooltip } from "../components/charts/ChartPrimitives";
import { useDarkMode } from "../hooks/useDarkMode";
import { getCategoricalPalette, getChrome, status } from "../lib/chartColors";
import { formatCurrency, formatDate, formatNumber } from "../lib/formatters";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../api/client";

export default function Reports() {
  const isDark = useDarkMode();
  const chrome = getChrome(isDark);
  const palette = getCategoricalPalette(isDark);
  const { showError } = useToast();
  const [exporting, setExporting] = useState<string | null>(null);

  const { data: valuation, isLoading: loadingValuation } = useQuery({
    queryKey: ["report-valuation"],
    queryFn: reportsApi.getStockValuationReport,
  });
  const { data: movements, isLoading: loadingMovements } = useQuery({
    queryKey: ["report-movements"],
    queryFn: () => reportsApi.getMovementsReport(30),
  });
  const { data: topProducts } = useQuery({
    queryKey: ["report-top-products"],
    queryFn: () => reportsApi.getTopProductsReport(30),
  });
  const { data: categoryBreakdown } = useQuery({
    queryKey: ["report-category-breakdown"],
    queryFn: reportsApi.getCategoryBreakdownReport,
  });

  const handleExport = async (report: "stock-valuation" | "movements") => {
    setExporting(report);
    try {
      const filename = report === "stock-valuation" ? "valoracion-stock.csv" : "movimientos-stock.csv";
      await reportsApi.downloadCsv(report, filename);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo exportar el reporte"));
    } finally {
      setExporting(null);
    }
  };

  if (loadingValuation || loadingMovements) return <FullPageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Reportes</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Analiza el valor y el movimiento de tu inventario.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Movimientos (30 días)" description="Entradas, salidas y ajustes por día">
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={movements?.series} margin={{ left: -16, right: 8 }}>
              <CartesianGrid vertical={false} stroke={chrome.grid} />
              <XAxis dataKey="date" tickFormatter={(v) => formatDate(v).replace(".", "")} tick={{ fill: chrome.muted, fontSize: 11 }} axisLine={{ stroke: chrome.axis }} tickLine={false} minTickGap={30} />
              <YAxis tick={{ fill: chrome.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip
                cursor={{ stroke: chrome.axis, strokeWidth: 1, strokeDasharray: "3 3" }}
                content={({ active, label, payload }) => (
                  <ChartTooltip active={active} label={label ? formatDate(String(label)) : undefined}>
                    {payload?.map((p) => (
                      <div key={p.dataKey as string} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                        <span style={{ color: chrome.secondaryInk }}>{p.name}:</span>
                        <span className="font-medium" style={{ color: chrome.primaryInk }}>
                          {formatNumber(Number(p.value))}
                        </span>
                      </div>
                    ))}
                  </ChartTooltip>
                )}
              />
              <Line type="monotone" dataKey="in" name="Entradas" stroke={status.good} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="out" name="Salidas" stroke={status.critical} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="adjustment" name="Ajustes" stroke={status.warning} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <ChartLegend
            items={[
              { label: "Entradas", color: status.good },
              { label: "Salidas", color: status.critical },
              { label: "Ajustes", color: status.warning },
            ]}
          />
        </ChartCard>

        <ChartCard title="Top productos" description="Unidades movidas en 30 días">
          {!topProducts || topProducts.length === 0 ? (
            <EmptyState icon={FileText} title="Sin datos" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} stroke={chrome.grid} />
                <XAxis type="number" tick={{ fill: chrome.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: chrome.secondaryInk, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
                  content={({ active, payload }) => {
                    const entry = payload?.[0];
                    if (!entry) return null;
                    return (
                      <ChartTooltip active={active} label={entry.payload.name}>
                        <span style={{ color: chrome.primaryInk }}>{formatNumber(Number(entry.value))} unidades vendidas</span>
                      </ChartTooltip>
                    );
                  }}
                />
                <Bar dataKey="out" fill={palette[0]} radius={[0, 4, 4, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Valor por categoría" description="Distribución del inventario">
          {!categoryBreakdown || categoryBreakdown.length === 0 ? (
            <EmptyState icon={FileText} title="Sin datos" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                  <Pie data={categoryBreakdown} dataKey="stockValue" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2} stroke="none">
                    {categoryBreakdown.map((entry, i) => (
                      <Cell key={entry.name} fill={palette[i % palette.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      const entry = payload?.[0];
                      if (!entry) return null;
                      return (
                        <ChartTooltip active={active}>
                          <span style={{ color: chrome.primaryInk }}>
                            {entry.name}: {formatCurrency(Number(entry.value), "PEN")}
                          </span>
                        </ChartTooltip>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ChartLegend items={categoryBreakdown.map((c, i) => ({ label: c.name, color: palette[i % palette.length] }))} />
            </>
          )}
        </ChartCard>
      </div>

      <Card>
        <CardHeader
          title="Valoración de inventario"
          description="Valor de costo y potencial de venta por producto"
          action={
            <Button variant="outline" size="sm" onClick={() => handleExport("stock-valuation")} isLoading={exporting === "stock-valuation"}>
              <Download className="h-4 w-4" /> Exportar CSV
            </Button>
          }
        />
        {!valuation || valuation.rows.length === 0 ? (
          <EmptyState icon={FileText} title="Sin productos" />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <TH>Producto</TH>
                  <TH>Categoría</TH>
                  <TH>Stock</TH>
                  <TH>Costo unit.</TH>
                  <TH>Valor en stock</TH>
                  <TH>Ingreso potencial</TH>
                </tr>
              </THead>
              <TBody>
                {valuation.rows.map((row) => (
                  <TR key={row.sku}>
                    <TD>
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">{row.name}</div>
                      <div className="text-xs text-neutral-400">{row.sku}</div>
                    </TD>
                    <TD>{row.category}</TD>
                    <TD>{formatNumber(row.currentStock)}</TD>
                    <TD>{formatCurrency(row.costPrice, "PEN")}</TD>
                    <TD className="font-medium">{formatCurrency(row.stockValue, "PEN")}</TD>
                    <TD>{formatCurrency(row.potentialRevenue, "PEN")}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <div className="flex justify-end gap-6 border-t border-neutral-200 px-5 py-3 text-sm dark:border-neutral-800">
              <span className="text-neutral-500 dark:text-neutral-400">
                Total en stock: <span className="font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(valuation.totals.stockValue, "PEN")}</span>
              </span>
              <span className="text-neutral-500 dark:text-neutral-400">
                Ingreso potencial: <span className="font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(valuation.totals.potentialRevenue, "PEN")}</span>
              </span>
            </div>
          </>
        )}
      </Card>

      <Card>
        <CardBody className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Historial de movimientos (30 días)</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Exporta el detalle completo de movimientos en formato CSV.</p>
          </div>
          <Button variant="outline" onClick={() => handleExport("movements")} isLoading={exporting === "movements"}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
