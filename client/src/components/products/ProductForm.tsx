import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Input, Select, Textarea } from "../ui/Field";
import { Button } from "../ui/Button";
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

  const {
    register,
    handleSubmit,
    reset,
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="SKU" required error={errors.sku?.message} {...register("sku")} />
        <Input label="Código de barras" {...register("barcode")} />
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
        <Input label="Precio venta" type="number" step="0.01" required error={errors.sellPrice?.message} {...register("sellPrice")} />
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
    </form>
  );
}
