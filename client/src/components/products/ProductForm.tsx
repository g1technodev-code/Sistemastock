import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { Input, Select, Textarea } from "../ui/Field";
import { Button } from "../ui/Button";
import { CameraScannerModal } from "../common/CameraScannerModal";
import { useCategories } from "../../hooks/useCategories";
import { useSuppliers } from "../../hooks/useSuppliers";
import type { Product } from "../../lib/types";

const schema = z.object({
  sku: z.string().min(1, "El SKU es obligatorio"),
  name: z.string().min(2, "El nombre es muy corto"),
  description: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.string().min(1, "Obligatorio"),
  costPrice: z.coerce.number().min(0, "Debe ser 0 o mayor"),
  sellPrice: z.coerce.number().min(0, "Debe ser 0 o mayor"),
  minStock: z.coerce.number().int().min(0, "Debe ser 0 o mayor"),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  isActive: z.boolean().optional(),
});

type ProductFormInput = z.input<typeof schema>;
export type ProductFormValues = z.output<typeof schema>;

export function ProductForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialValues?: Product;
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const { data: categories } = useCategories();
  const { data: suppliers } = useSuppliers();
  const [cameraOpen, setCameraOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sku: initialValues?.sku ?? "",
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
      barcode: initialValues?.barcode ?? "",
      unit: initialValues?.unit ?? "unidad",
      costPrice: initialValues?.costPrice ?? 0,
      sellPrice: initialValues?.sellPrice ?? 0,
      minStock: initialValues?.minStock ?? 0,
      categoryId: initialValues?.categoryId ?? "",
      supplierId: initialValues?.supplierId ?? "",
      isActive: initialValues?.isActive ?? true,
    },
  });

  useEffect(() => {
    reset({
      sku: initialValues?.sku ?? "",
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
      barcode: initialValues?.barcode ?? "",
      unit: initialValues?.unit ?? "unidad",
      costPrice: initialValues?.costPrice ?? 0,
      sellPrice: initialValues?.sellPrice ?? 0,
      minStock: initialValues?.minStock ?? 0,
      categoryId: initialValues?.categoryId ?? "",
      supplierId: initialValues?.supplierId ?? "",
      isActive: initialValues?.isActive ?? true,
    });
  }, [initialValues, reset]);

  const handleBarcodeScanned = (code: string) => {
    setValue("barcode", code, { shouldValidate: true, shouldDirty: true });
    if (!getValues("sku")) {
      setValue("sku", code, { shouldValidate: true, shouldDirty: true });
    }
  };

  const costPrice = useWatch({ control, name: "costPrice" }) || 0;
  const sellPrice = useWatch({ control, name: "sellPrice" }) || 0;
  const profit = Number(sellPrice) - Number(costPrice);
  const margin = Number(costPrice) > 0 ? (profit / Number(costPrice)) * 100 : 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="SKU *" required error={errors.sku?.message} {...register("sku")} />
        <div>
          <label className="block text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 mb-1">
            Código de barras
          </label>
          <div className="flex gap-2">
            <input
              {...register("barcode")}
              placeholder="Escanear o ingresar..."
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
            />
            <button
              type="button"
              onClick={() => setCameraOpen(true)}
              title="Escanear con Cámara"
              className="flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-3 text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <Camera className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </button>
          </div>
        </div>
      </div>
      <Input label="Nombre" required error={errors.name?.message} {...register("name")} />
      <Textarea label="Descripción" rows={2} {...register("description")} />

      <div className="grid grid-cols-2 gap-4">
        <Select label="Categoría" {...register("categoryId")}>
          <option value="">Sin categoría</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select label="Proveedor" {...register("supplierId")}>
          <option value="">Sin proveedor</option>
          {suppliers?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input label="Unidad" required error={errors.unit?.message} {...register("unit")} />
        <Input label="Costo" type="number" step="0.01" required error={errors.costPrice?.message} {...register("costPrice")} />
        <div>
          <Input label="Precio venta" type="number" step="0.01" required error={errors.sellPrice?.message} {...register("sellPrice")} />
          {(Number(sellPrice) > 0 || Number(costPrice) > 0) && (
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Ganancia: <span className={profit > 0 ? "text-green-600 dark:text-green-400" : profit < 0 ? "text-red-600 dark:text-red-400" : ""}>${profit.toFixed(2)}</span>
              {Number(costPrice) > 0 && ` (${margin.toFixed(1)}%)`}
            </p>
          )}
        </div>
      </div>

      <Input
        label="Stock mínimo"
        type="number"
        hint="Se generará una alerta cuando el stock actual sea igual o menor"
        required
        error={errors.minStock?.message}
        {...register("minStock")}
      />

      {initialValues && initialValues.id && (
        <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input type="checkbox" className="h-4 w-4 rounded border-neutral-300" {...register("isActive")} />
          Producto activo (desmarca para desactivarlo sin eliminar su historial)
        </label>
      )}

      <div className="mt-2 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {initialValues && initialValues.id ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>

      <CameraScannerModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onScan={handleBarcodeScanned}
        title="Escanear Código para Producto"
      />
    </form>
  );
}
