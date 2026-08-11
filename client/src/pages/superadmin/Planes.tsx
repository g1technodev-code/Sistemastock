import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Sliders, Pencil, Trash2, Star } from "lucide-react";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Field";
import { Badge } from "../../components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { FullPageSpinner } from "../../components/ui/Spinner";
import { usePlans, usePlanMutations } from "../../hooks/usePlans";
import { useToast } from "../../context/ToastContext";
import { formatCurrency } from "../../lib/formatters";
import { extractErrorMessage } from "../../api/client";
import { PLAN_FEATURES, PLAN_FEATURE_LABELS } from "../../lib/features";
import type { Plan } from "../../lib/types";

const schema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  description: z.string().optional(),
  monthlyPrice: z.coerce.number().min(0, "El precio no puede ser negativo"),
  maxAdmins: z.coerce.number().int().min(1, "Debe permitir al menos 1 administrador"),
  maxEmployees: z.coerce.number().int().min(0),
  isTrial: z.boolean().optional(),
  trialDays: z.coerce.number().int().min(1).optional(),
  isRecommended: z.boolean().optional(),
  featuresText: z.string().optional(),
  enabledFeatures: z.array(z.string()).optional(),
});
type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

const emptyValues: FormInput = {
  name: "",
  description: "",
  monthlyPrice: 0,
  maxAdmins: 1,
  maxEmployees: 3,
  isTrial: false,
  trialDays: undefined,
  isRecommended: false,
  featuresText: "",
  enabledFeatures: [],
};

export default function SuperAdminPlanes() {
  const { showSuccess, showError } = useToast();
  const { data, isLoading } = usePlans();
  const { create, update, remove } = usePlanMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema), defaultValues: emptyValues });

  const isTrial = watch("isTrial");

  const openCreate = () => {
    setEditing(null);
    reset(emptyValues);
    setFormOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditing(plan);
    reset({
      name: plan.name,
      description: plan.description ?? "",
      monthlyPrice: plan.monthlyPrice,
      maxAdmins: plan.maxAdmins,
      maxEmployees: plan.maxEmployees,
      isTrial: plan.isTrial,
      trialDays: plan.trialDays ?? undefined,
      isRecommended: plan.isRecommended,
      featuresText: plan.features.join("\n"),
      enabledFeatures: plan.enabledFeatures,
    });
    setFormOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    const input = {
      name: values.name,
      description: values.description || null,
      monthlyPrice: values.monthlyPrice,
      maxAdmins: values.maxAdmins,
      maxEmployees: values.maxEmployees,
      isTrial: values.isTrial ?? false,
      trialDays: values.isTrial ? values.trialDays ?? 7 : null,
      isRecommended: values.isRecommended ?? false,
      features: (values.featuresText ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      enabledFeatures: values.enabledFeatures ?? [],
    };

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input });
        showSuccess("Plan actualizado");
      } else {
        await create.mutateAsync(input);
        showSuccess("Plan creado");
      }
      setFormOpen(false);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo guardar el plan"));
    }
  };

  const toggleActive = async (plan: Plan) => {
    try {
      await update.mutateAsync({
        id: plan.id,
        input: {
          name: plan.name,
          description: plan.description,
          monthlyPrice: plan.monthlyPrice,
          maxAdmins: plan.maxAdmins,
          maxEmployees: plan.maxEmployees,
          isTrial: plan.isTrial,
          trialDays: plan.trialDays,
          isRecommended: plan.isRecommended,
          isActive: !plan.isActive,
          features: plan.features,
          enabledFeatures: plan.enabledFeatures,
        },
      });
      showSuccess(plan.isActive ? "Plan desactivado" : "Plan activado");
    } catch (error) {
      showError(extractErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      showSuccess("Plan eliminado");
      setDeleteTarget(null);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo eliminar el plan"));
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-6">
        <div className="flex items-center gap-3">
          <Sliders className="h-7 w-7 text-primary-500" />
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Configuración de Planes</h1>
            <p className="text-sm text-neutral-400">Precio, límites y beneficios de cada plan de suscripción</p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" /> Nuevo Plan
        </Button>
      </div>

      <Card>
        <CardHeader title="Planes de Kipo" description="Se muestran en el alta de nuevos locales y en la página pública de precios" />
        <CardBody>
          {isLoading ? (
            <FullPageSpinner />
          ) : !data || data.length === 0 ? (
            <EmptyState icon={Sliders} title="Sin planes" description="Crea el primer plan de suscripción." />
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Plan</TH>
                  <TH>Precio Mensual</TH>
                  <TH>Límites</TH>
                  <TH>Tipo</TH>
                  <TH>Estado</TH>
                  <TH className="text-right">Acciones</TH>
                </tr>
              </THead>
              <TBody>
                {data.map((plan) => (
                  <TR key={plan.id}>
                    <TD>
                      <div className="flex items-center gap-2 font-bold text-neutral-100">
                        {plan.name}
                        {plan.isRecommended && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />}
                      </div>
                      {plan.description && <p className="text-xs text-neutral-400 mt-0.5">{plan.description}</p>}
                    </TD>
                    <TD className="font-semibold">{formatCurrency(plan.monthlyPrice)}</TD>
                    <TD className="text-xs text-neutral-400">
                      {plan.maxAdmins} Admin(es) · {plan.maxEmployees} Empleado(s)
                    </TD>
                    <TD>
                      <Badge tone={plan.isTrial ? "warning" : "neutral"}>
                        {plan.isTrial ? `Prueba (${plan.trialDays ?? "-"} días)` : "Pago"}
                      </Badge>
                    </TD>
                    <TD>
                      <button onClick={() => toggleActive(plan)}>
                        <Badge tone={plan.isActive ? "success" : "neutral"}>{plan.isActive ? "Activo" : "Inactivo"}</Badge>
                      </button>
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(plan)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(plan)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Editar plan" : "Nuevo plan"} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Nombre del plan" required error={errors.name?.message} {...register("name")} />
          <Textarea label="Descripción" rows={2} {...register("description")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Precio mensual (ARS)" type="number" step="1" error={errors.monthlyPrice?.message} {...register("monthlyPrice")} />
            <Input label="Máx. Administradores" type="number" step="1" error={errors.maxAdmins?.message} {...register("maxAdmins")} />
            <Input label="Máx. Empleados" type="number" step="1" error={errors.maxEmployees?.message} {...register("maxEmployees")} />
          </div>

          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" {...register("isTrial")} />
            Es un plan de prueba (trial)
          </label>
          {isTrial && (
            <Input label="Días de prueba" type="number" step="1" error={errors.trialDays?.message} {...register("trialDays")} />
          )}
          <label className="flex items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" {...register("isRecommended")} />
            Marcar como "Recomendado" en la página de precios
          </label>

          <div>
            <p className="text-sm font-semibold text-neutral-200 mb-1">Módulos habilitados</p>
            <p className="text-xs text-neutral-500 mb-2">
              Esto controla el acceso real a la app (a diferencia del texto de abajo, que es solo marketing).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PLAN_FEATURES.map((code) => (
                <label key={code} className="flex items-center gap-2 text-sm text-neutral-300">
                  <input type="checkbox" value={code} {...register("enabledFeatures")} />
                  {PLAN_FEATURE_LABELS[code]}
                </label>
              ))}
            </div>
          </div>

          <Textarea
            label="Texto de marketing (una por línea, solo visual)"
            rows={5}
            placeholder={"Incluye 1 Administrador y 3 Empleados\nGestor de Productos y Categorías"}
            {...register("featuresText")}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={create.isPending || update.isPending}>
              {editing ? "Guardar cambios" : "Crear plan"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar plan"
        message={`¿Seguro que deseas eliminar "${deleteTarget?.name}"? Esto no es posible si hay locales usándolo.`}
        confirmLabel="Eliminar"
        danger
        isLoading={remove.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
