import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { Camera, Sparkles } from "lucide-react";
import { Input, Select, Textarea } from "../ui/Field";
import { Button } from "../ui/Button";
import { CameraScannerModal } from "../common/CameraScannerModal";
import { useCategories } from "../../hooks/useCategories";
import { useSuppliers } from "../../hooks/useSuppliers";
import { lookupBarcode } from "../../api/products";
import type { Product } from "../../lib/types";


const schema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  description: z.string().optional(),
  barcode: z.string().optional(),
  unit: z.string().min(1, "Obligatorio"),
  costPrice: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number({ message: "Debe ingresar el costo" }).min(0, "Debe ser 0 o mayor")
  ),
  sellPrice: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number({ message: "Debe ingresar el precio de venta" }).min(0, "Debe ser 0 o mayor")
  ),

  minStock: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().int().min(0, "Debe ser 0 o mayor").default(0)
  ),
  initialStock: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().int().min(0, "Debe ser 0 o mayor").optional().default(0)
  ),
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
  const [isLookingUp, setIsLookingUp] = useState(false);

  const isEditing = Boolean(initialValues && initialValues.id);

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
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
      barcode: initialValues?.barcode ?? "",
      unit: initialValues?.unit ?? "unidad",
      costPrice: (initialValues?.costPrice as any) ?? "",
      sellPrice: (initialValues?.sellPrice as any) ?? "",
      minStock: (initialValues?.minStock as any) ?? "",
      initialStock: (initialValues?.currentStock as any) ?? "",
      categoryId: initialValues?.categoryId ?? "",
      supplierId: initialValues?.supplierId ?? "",
      isActive: initialValues?.isActive ?? true,
    },
  });

  useEffect(() => {
    reset({
      name: initialValues?.name ?? "",
      description: initialValues?.description ?? "",
      barcode: initialValues?.barcode ?? "",
      unit: initialValues?.unit ?? "unidad",
      costPrice: (initialValues?.costPrice as any) ?? "",
      sellPrice: (initialValues?.sellPrice as any) ?? "",
      minStock: (initialValues?.minStock as any) ?? "",
      initialStock: (initialValues?.currentStock as any) ?? "",
      categoryId: initialValues?.categoryId ?? "",
      supplierId: initialValues?.supplierId ?? "",
      isActive: initialValues?.isActive ?? true,
    });
  }, [initialValues, reset]);

  const triggerLookup = async (code: string) => {
    if (!code || code.trim().length < 4 || isLookingUp) return;
    setIsLookingUp(true);
    try {
      const res = await lookupBarcode(code.trim());
      if (res.found) {
        const currentName = getValues("name");
        const currentDesc = getValues("description");
        if (res.name && (!currentName || currentName.trim() === "")) {
          setValue("name", res.name, { shouldValidate: true, shouldDirty: true });
        }
        if (res.description && (!currentDesc || currentDesc.trim() === "")) {
          setValue("description", res.description, { shouldValidate: true, shouldDirty: true });
        }
      }
    } catch (e) {
      // Defensive fallback: do nothing
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleBarcodeScanned = (code: string) => {
    setValue("barcode", code, { shouldValidate: true, shouldDirty: true });
    triggerLookup(code);
  };

  const costPrice = useWatch({ control, name: "costPrice" }) || 0;
  const sellPrice = useWatch({ control, name: "sellPrice" }) || 0;
  const profit = Number(sellPrice) - Number(costPrice);
  const margin = Number(costPrice) > 0 ? (profit / Number(costPrice)) * 100 : 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {initialValues?.sku && (
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          SKU: <span className="font-mono font-semibold text-neutral-700 dark:text-neutral-300">{initialValues.sku}</span>
        </p>
      )}
      <div>
        <label className="block text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 mb-1">
          Código de barras
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              {...register("barcode", {
                onBlur: (e) => triggerLookup(e.target.value),
              })}
              placeholder="Escanear o ingresar..."
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900 pr-9"
            />
            {isLookingUp && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500" title="Buscando datos del producto...">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </div>
            )}
          </div>
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
      <Input label="Nombre *" required error={errors.name?.message} {...register("name")} />
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
        <Input label="Unidad *" required error={errors.unit?.message} {...register("unit")} />
        <Input label="Costo ($) *" type="number" step="0.01" placeholder="0.00" required error={errors.costPrice?.message} {...register("costPrice")} />
        <div>
          <Input label="Precio venta ($) *" type="number" step="0.01" placeholder="0.00" required error={errors.sellPrice?.message} {...register("sellPrice")} />
          {(Number(sellPrice) > 0 || Number(costPrice) > 0) && (
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              Ganancia: <span className={profit > 0 ? "text-green-600 dark:text-green-400" : profit < 0 ? "text-red-600 dark:text-red-400" : ""}>${profit.toFixed(2)}</span>
              {Number(costPrice) > 0 && ` (${margin.toFixed(1)}%)`}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Stock mínimo"
          type="number"
          placeholder="0"
          hint="Genera una alerta cuando el stock descienda"
          error={errors.minStock?.message}
          {...register("minStock")}
        />
        {!isEditing && (
          <Input
            label="Stock inicial / actual"
            type="number"
            placeholder="0"
            hint="Cantidad de unidades actualmente en stock"
            error={errors.initialStock?.message}
            {...register("initialStock")}
          />
        )}
      </div>


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
