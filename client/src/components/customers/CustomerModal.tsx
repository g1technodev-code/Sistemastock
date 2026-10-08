import { useState } from "react";
import { Modal } from "../ui/Modal";

type CustomerModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    taxId: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    creditLimit: number | null;
  }) => void;
  isLoading?: boolean;
};

export function CustomerModal({ open, onClose, onSubmit, isLoading }: CustomerModalProps) {
  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Crear Nuevo Cliente">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          onSubmit({
            name: fd.get("name") as string,
            taxId: (fd.get("taxId") as string) || null,
            email: (fd.get("email") as string) || null,
            phone: (fd.get("phone") as string) || null,
            address: (fd.get("address") as string) || null,
            creditLimit: fd.get("creditLimit") ? Number(fd.get("creditLimit")) : null,
          });
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 mb-1">
            Nombre Completo / Razón Social *
          </label>
          <input
            required
            name="name"
            placeholder="Ej: Juan Pérez o Distribuidora S.A."
            className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 mb-1">
              RUT / DNI / Tax ID
            </label>
            <input
              name="taxId"
              placeholder="Ej: 12.345.678-9"
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 mb-1">
              Teléfono
            </label>
            <input
              name="phone"
              placeholder="Ej: +56 9 1234 5678"
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            placeholder="cliente@ejemplo.com"
            className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400 mb-1">
            Límite de Crédito ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="creditLimit"
            placeholder="Dejar en blanco para sin límite"
            className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          />
        </div>
        <div className="flex justify-end gap-2 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
          >
            {isLoading ? "Guardando..." : "Guardar Cliente"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
