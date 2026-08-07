import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { Megaphone } from "lucide-react";

export default function SuperAdminAnuncios() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 border-b border-neutral-800 pb-6">
        <Megaphone className="h-7 w-7 text-primary-500" />
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Anuncios Globales</h1>
          <p className="text-sm text-neutral-400">Envío de notificaciones y avisos del sistema a los administradores de locales</p>
        </div>
      </div>

      <Card>
        <CardHeader title="Gestión de Anuncios" description="Publicar avisos de mantenimiento, novedades y ofertas" />
        <CardBody>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-8 text-center text-neutral-400">
            <p className="text-base font-medium">Módulo de Anuncios Globales listo para desarrollo.</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
