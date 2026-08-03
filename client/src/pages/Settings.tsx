import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import * as settingsApi from "../api/settings";
import { Card, CardBody, CardHeader } from "../components/ui/Card";
import { Input, Select } from "../components/ui/Field";
import { Button } from "../components/ui/Button";
import { FullPageSpinner } from "../components/ui/Spinner";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../api/client";

const schema = z.object({
  businessName: z.string().min(2, "El nombre es muy corto"),
  taxId: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  currency: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

const CURRENCIES = ["PEN", "USD", "EUR", "MXN", "COP", "CLP", "ARS"];

export default function Settings() {
  const { showSuccess, showError } = useToast();
  const qc = useQueryClient();
  const { data: settings, isLoading } = useQuery({ queryKey: ["settings"], queryFn: settingsApi.getSettings });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (settings) {
      reset({
        businessName: settings.businessName,
        taxId: settings.taxId ?? "",
        address: settings.address ?? "",
        phone: settings.phone ?? "",
        email: settings.email ?? "",
        currency: settings.currency,
      });
    }
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => settingsApi.updateSettings(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      showSuccess("Configuración guardada");
    },
    onError: (error) => showError(extractErrorMessage(error, "No se pudo guardar la configuración")),
  });

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Configuración del negocio</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Estos datos aparecen en reportes y documentos generados.</p>
      </div>

      <Card>
        <CardHeader title="Datos generales" description="Información de tu empresa" />
        <CardBody>
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950">
                <Building2 className="h-6 w-6 text-indigo-500" />
              </div>
              <Input className="flex-1" label="Nombre del negocio" required error={errors.businessName?.message} {...register("businessName")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="RUC / ID fiscal" {...register("taxId")} />
              <Select label="Moneda" {...register("currency")}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Teléfono" {...register("phone")} />
              <Input label="Email de contacto" type="email" error={errors.email?.message} {...register("email")} />
            </div>

            <Input label="Dirección" {...register("address")} />

            <Button type="submit" isLoading={mutation.isPending} className="mt-2 w-fit">
              Guardar cambios
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
