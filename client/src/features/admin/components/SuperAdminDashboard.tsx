import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Building2, ShieldAlert, CheckCircle, DollarSign, AlertCircle, Sparkles, Clock, UserCheck } from "lucide-react";
import { getSuperAdminMetrics } from "../actions/superadmin.api";

import { Card, CardHeader, CardBody } from "../../../components/ui/Card";
import { StatCard } from "../../../components/ui/StatCard";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { formatCurrency, formatDate } from "../../../lib/formatters";

export default function SuperAdminDashboard() {
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ["superadmin-metrics"],
    queryFn: getSuperAdminMetrics,
  });

  if (metricsLoading || !metricsData) {
    return <FullPageSpinner />;
  }

  const { metrics, conversionAlerts } = metricsData;

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-500">
      {/* SuperAdmin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary-500" />
            <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
              Control Global SaaS — SuperAdmin
            </h1>
          </div>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Administración centralizada de todos los locales registrados en Kipo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/superadmin/locales">
            <Button>
              <Building2 className="h-4 w-4 mr-1.5" /> Gestionar Locales y Usuarios
            </Button>
          </Link>
          <Badge tone="success" className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider shrink-0">
            Modo Administrador Máximo
          </Badge>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ingreso Mensual (MRR)"
          value={formatCurrency(metrics.mrr)}
          icon={DollarSign}
          tone="neutral"
        />
        <StatCard
          label="Locales Totales"
          value={metrics.totalLocales.toString()}
          icon={Building2}
        />
        <StatCard
          label="Locales Activos"
          value={metrics.activeLocales.toString()}
          icon={CheckCircle}
          tone="neutral"
        />
        <StatCard
          label="Suspendidos / Por Vencer"
          value={(metrics.suspendedLocales + metrics.dueSoonLocales).toString()}
          icon={ShieldAlert}
          tone={metrics.suspendedLocales > 0 ? "danger" : "warning"}
        />
      </div>

      {/* Conversion Alerts Section */}
      {conversionAlerts && conversionAlerts.length > 0 && (
        <Card>
          <CardHeader
            title="Alertas de Conversión & Pruebas"
            description="Estado de locales en prueba de 7 días y vencimientos recientes"
          />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {conversionAlerts.map((alert) => (
                <div
                  key={alert.localId}
                  className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900/60 p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-neutral-900 dark:text-white text-sm">{alert.name}</h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{alert.ownerEmail}</p>
                    </div>
                    {alert.alertStatus === "CONVERTED" ? (
                      <Badge tone="success" className="text-[10px]">
                        <UserCheck className="h-3 w-3 mr-1 inline" /> Convertido ({alert.plan.name})
                      </Badge>
                    ) : alert.alertStatus === "SUSPENDED_EXPIRED" ? (
                      <Badge tone="danger" className="text-[10px]">
                        <AlertCircle className="h-3 w-3 mr-1 inline" /> Vencido / Suspendido
                      </Badge>
                    ) : (
                      <Badge tone="warning" className="text-[10px]">
                        <Clock className="h-3 w-3 mr-1 inline" /> Trial Activo
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    <span>Vence: {formatDate(alert.dueDate)}</span>
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">Plan: {alert.plan.name}</span>

                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
