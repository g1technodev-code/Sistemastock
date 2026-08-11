import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { DollarSign } from "lucide-react";


export default function SuperAdminPagos() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <DollarSign className="h-7 w-7 text-primary-500" />
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">Pagos e Ingresos</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Historial de transacciones e ingresos generados vía Mercado Pago</p>
        </div>
      </div>

      <Card>
        <CardHeader title="Historial de Transacciones" description="Detalle de suscripciones cobradas a los locales" />
        <CardBody>
          <div className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900/50 p-8 text-center text-neutral-600 dark:text-neutral-400">
            <p className="text-base font-medium">Módulo de Historial de Pagos listo para desarrollo.</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

