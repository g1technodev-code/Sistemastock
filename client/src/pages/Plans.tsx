import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Crown, Zap, ExternalLink, HelpCircle, ShieldCheck, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { createCheckout, type PlanId } from "../api/plans";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../api/client";

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface PlanDefinition {
  id: PlanId;
  name: string;
  price: number;
  period: string;
  description: string;
  targetAudience: string;
  recommended?: boolean;
  features: PlanFeature[];
}

const PLANS: PlanDefinition[] = [
  {
    id: "BASICO",
    name: "Kipo Básico",
    price: 24900,
    period: "mes",
    description: "Ideal para gestionar el inventario del día a día y tener control claro de tus entradas y salidas.",
    targetAudience: "Pequeños negocios o emprendedores que están iniciando.",
    recommended: false,
    features: [
      { text: "Incluye 1 Administrador y 3 Empleados", included: true, highlight: true },
      { text: "Gestor de Productos y Categorías", included: true },
      { text: "Registro de Proveedores", included: true },
      { text: "Movimientos de stock básicos (Entradas/Salidas)", included: true },
      { text: "Registro de Ventas y Compras", included: true },
      { text: "Gestión básica de Clientes", included: true },
      { text: "Soporte estándar por Email", included: true },
      { text: "Control de Inventario Físico (Auditorías)", included: false },
      { text: "Gestión y control de Caja diaria", included: false },
      { text: "Módulo completo de Reportes e Historial", included: false },
      { text: "Análisis de Rentabilidad y Estadísticas", included: false },
    ],
  },
  {
    id: "PRO",
    name: "Kipo Pro",
    price: 39900,
    period: "mes",
    description: "La solución completa para maximizar ganancias, auditar caja y tomar decisiones basadas en datos reales.",
    targetAudience: "Negocios en crecimiento que necesitan control financiero avanzado y gestión de equipo.",
    recommended: true,
    features: [
      { text: "Incluye 2 Administradores y 6 Empleados", included: true, highlight: true },
      { text: "Todo lo incluido en Kipo Básico", included: true },
      { text: "Control de Inventario Físico (Auditorías y conteo rápido)", included: true, highlight: true },
      { text: "Gestión y control de Caja diaria", included: true, highlight: true },
      { text: "Módulo completo de Reportes e Historial", included: true },
      { text: "Estadísticas avanzadas de rendimiento", included: true },
      { text: "Análisis de Rentabilidad (Márgenes de ganancia e indicadores clave)", included: true, highlight: true },
      { text: "Gestión multiusuario y asignación de roles", included: true },
      { text: "Soporte prioritario 24/7", included: true },
    ],
  },
];


export default function Plans() {
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get("status");
  const { showSuccess, showError } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);

  const handleSubscribe = async (planId: PlanId) => {
    setLoadingPlan(planId);
    try {
      const response = await createCheckout(planId);
      if (response.initPoint) {
        window.location.href = response.initPoint;
      } else {
        showError("No se pudo generar el enlace de pago de Mercado Pago");
      }
    } catch (error) {
      showError(extractErrorMessage(error, "Error al conectar con Mercado Pago"));
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Notifications */}
      {statusParam === "success" && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-500" />
          <div>
            <p className="font-semibold text-sm">¡Pago procesado con éxito!</p>
            <p className="text-xs text-neutral-300">Tu suscripción ha sido registrada correctamente en Mercado Pago.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Badge tone="success" className="px-3 py-1 text-xs font-semibold uppercase tracking-wider">
          Planes Flexibles
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
          Potencia la gestión de tu negocio con <span className="text-primary-500">Kipo</span>
        </h1>
        <p className="text-base text-neutral-600 dark:text-neutral-400">
          Elige el plan ideal para tu nivel de operación. Cancela o cambia de plan en cualquier momento.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-3xl flex flex-col justify-between border transition-all duration-300 ${
              plan.recommended
                ? "bg-neutral-900 border-primary-500/50 shadow-2xl shadow-primary-500/10 ring-1 ring-primary-500/30"
                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
            }`}
          >
            {plan.recommended && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-1 text-xs font-bold text-white shadow-lg uppercase tracking-wider">
                  <Crown className="h-3.5 w-3.5" /> Recomendado / Más Popular
                </span>
              </div>
            )}

            <div className="p-8 space-y-6">
              {/* Header section */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    {plan.name}
                    {plan.recommended ? <Zap className="h-5 w-5 text-amber-400 fill-amber-400" /> : null}
                  </h3>
                </div>
                <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  {plan.targetAudience}
                </p>
              </div>

              {/* Price section */}
              <div className="border-y border-neutral-100 dark:border-neutral-800/80 py-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-neutral-900 dark:text-white">
                    ${plan.price.toLocaleString("es-AR")}
                  </span>
                  <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                    ARS / {plan.period}
                  </span>
                </div>
                <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              {/* Features List */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Funcionalidades incluidas:</p>
                <ul className="space-y-2.5">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                      {feature.included ? (
                        <Check className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                      ) : (
                        <span className="h-4 w-4 shrink-0 text-neutral-400 dark:text-neutral-600 font-mono text-center">×</span>
                      )}
                      <span
                        className={
                          feature.included
                            ? feature.highlight
                              ? "font-semibold text-neutral-900 dark:text-neutral-100"
                              : "text-neutral-700 dark:text-neutral-300"
                            : "text-neutral-400 dark:text-neutral-600 line-through"
                        }
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action button footer */}
            <div className="p-8 pt-0">
              <Button
                onClick={() => handleSubscribe(plan.id)}
                isLoading={loadingPlan === plan.id}
                className={`w-full py-3.5 justify-center text-sm font-bold rounded-2xl shadow-lg transition-all ${
                  plan.recommended
                    ? "bg-primary-600 hover:bg-primary-500 text-white shadow-primary-600/25"
                    : "bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white"
                }`}
              >
                Suscribirme con Mercado Pago <ExternalLink className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Trust & FAQ Footer */}
      <div className="mt-12 rounded-2xl bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-primary-500 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">¿Tienes dudas sobre los planes?</h4>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Pagos procesados de forma segura con la garantía de Mercado Pago Argentina en Pesos (ARS).
            </p>
          </div>
        </div>
        <Badge tone="neutral" className="px-3 py-1.5 text-xs font-semibold shrink-0">
          Pagos en Pesos Argentinos (ARS)
        </Badge>
      </div>
    </div>
  );
}
