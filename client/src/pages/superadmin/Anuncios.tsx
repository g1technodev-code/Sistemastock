import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus, Trash2, Info, AlertTriangle, Wrench } from "lucide-react";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Field";
import { Badge } from "../../components/ui/Badge";
import { FullPageSpinner } from "../../components/ui/Spinner";
import { useToast } from "../../context/ToastContext";
import { formatDate } from "../../lib/formatters";
import { listAnnouncements, createAnnouncement, deleteAnnouncement } from "../../features/admin/actions/superadmin.api";
import type { AnnouncementType } from "../../lib/types";

const TYPE_TONE: Record<AnnouncementType, "info" | "warning" | "danger"> = {
  INFO: "info",
  WARNING: "warning",
  MAINTENANCE: "danger",
};

const TYPE_LABEL: Record<AnnouncementType, string> = {
  INFO: "Información",
  WARNING: "Advertencia",
  MAINTENANCE: "Mantenimiento",
};

const TYPE_ICON: Record<AnnouncementType, any> = {
  INFO: Info,
  WARNING: AlertTriangle,
  MAINTENANCE: Wrench,
};

export default function SuperAdminAnuncios() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<AnnouncementType>("INFO");
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["superadmin-announcements"],
    queryFn: listAnnouncements,
  });

  const createMutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      showSuccess("Anuncio global publicado correctamente");
      setTitle("");
      setMessage("");
      setType("INFO");
      queryClient.invalidateQueries({ queryKey: ["superadmin-announcements"] });
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message || "No se pudo publicar el anuncio");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      showSuccess("Anuncio eliminado correctamente");
      queryClient.invalidateQueries({ queryKey: ["superadmin-announcements"] });
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message || "No se pudo eliminar el anuncio");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) {
      showError("Completa el título y el mensaje");
      return;
    }
    createMutation.mutate({ title, message, type });
  };

  if (isLoading) return <FullPageSpinner />;

  const announcements = data?.items || [];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <Megaphone className="h-7 w-7 text-primary-500" />
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">Anuncios Globales</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Envío de notificaciones y avisos del sistema a los administradores de locales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <Card className="lg:col-span-1">
          <CardHeader title="Publicar Nuevo Anuncio" description="Los administradores verán este aviso en su panel" />
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Título del Anuncio"
                placeholder="Ej. Mantenimiento programado"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Mensaje
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
                  placeholder="Detalla la novedad o aviso..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>
              <Select
                label="Tipo de Anuncio"
                value={type}
                onChange={(e) => setType(e.target.value as AnnouncementType)}
              >
                <option value="INFO">Información (Azul)</option>
                <option value="WARNING">Advertencia (Amarillo)</option>
                <option value="MAINTENANCE">Mantenimiento (Rojo)</option>
              </Select>
              <Button type="submit" isLoading={createMutation.isPending} className="w-full justify-center">
                <Plus className="h-4 w-4 mr-1.5" /> Publicar Anuncio
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* List Column */}
        <Card className="lg:col-span-2">
          <CardHeader title="Historial de Anuncios Enviados" description="Anuncios activos e históricos visibles en los locales" />
          <CardBody>
            {announcements.length === 0 ? (
              <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900/50 p-8 text-center text-neutral-500 dark:text-neutral-400">
                No hay anuncios globales publicados actualmente.
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((item) => {
                  const annType = (item.type || "INFO") as AnnouncementType;
                  const Icon = TYPE_ICON[annType] || Info;
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900/60 p-5 space-y-3 flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 shrink-0">
                            <Icon className="h-5 w-5 text-primary-500" />
                          </div>
                          <div>
                            <h3 className="font-bold text-neutral-900 dark:text-white text-base">{item.title}</h3>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                              {formatDate(item.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge tone={TYPE_TONE[annType]}>{TYPE_LABEL[annType]}</Badge>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-neutral-400 hover:text-red-500"
                            isLoading={deleteMutation.isPending}
                            onClick={() => deleteMutation.mutate(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
