import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Select } from "../ui/Field";
import { useCategories } from "../../hooks/useCategories";
import type { CatalogProduct } from "../../lib/types";

const schema = z.object({
  categoryId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function ImportCatalogModal({
  item,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  item: CatalogProduct | null;
  onClose: () => void;
  onSubmit: (values: { categoryId: string | null }) => void;
  isSubmitting: boolean;
}) {
  const { data: categories } = useCategories();

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { categoryId: "" } });

  const handleClose = () => {
    reset({ categoryId: "" });
    onClose();
  };

  const submit = (values: FormValues) => {
    onSubmit({ categoryId: values.categoryId || null });
  };

  if (!item) return null;

  return (
    <Modal open={!!item} onClose={handleClose} title="Importar producto del catálogo" size="sm">
      <div className="mb-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 p-3">
        <p className="font-bold text-neutral-900 dark:text-neutral-100">{item.name}</p>
        {item.description && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{item.description}</p>}
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">El SKU se asigna automáticamente al importar.</p>
      </div>

      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <Select label="Categoría (opcional)" {...register("categoryId")}>
          <option value="">Sin categoría</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Importar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
