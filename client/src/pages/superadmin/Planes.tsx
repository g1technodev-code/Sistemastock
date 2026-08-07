import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { Sliders } from "lucide-react";

export default function SuperAdminPlanes() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 border-b border-neutral-800 pb-6">
        <Sliders className="h-7 w-7 text-primary-500" />
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Configuración de Planes</h1>
          <p className="text-sm text-neutral-400">Ajuste de precios, características y ofertas de los planes Básico y Pro</p>
        </div>
      </div>

      <Card>
        <CardHeader title="Gestión de Suscripciones SaaS" description="Modificación de tarifas y beneficios por nivel" />
        <CardBody>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-8 text-center text-neutral-400">
            <p className="text-base font-medium">Módulo de Configuración de Planes listo para desarrollo.</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
