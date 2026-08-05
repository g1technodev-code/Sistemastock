import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Search, Package, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Field";
import { Badge } from "../components/ui/Badge";
import { DataTable, type DataTableColumn } from "../components/ui/DataTable";
import { Modal } from "../components/ui/Modal";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ProductForm, type ProductFormValues } from "../components/products/ProductForm";
import { useProducts, useProductMutations } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { permissions } from "../lib/permissions";
import { extractErrorMessage } from "../api/client";
import { formatCurrency, formatNumber } from "../lib/formatters";
import { listProducts } from "../api/products";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import type { Product } from "../lib/types";

export default function Products() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = user ? permissions.canManageCatalog(user.role) : false;
  const { showSuccess, showError } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const location = useLocation();

  const { data: categories } = useCategories();
  const { data, isLoading } = useProducts({ page, limit: 10, q: search || undefined, categoryId: categoryId || undefined, lowStock: lowStockOnly || undefined });
  const { create, update, remove } = useProductMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const openCreate = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };
  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  useEffect(() => {
    if (location.state?.newBarcode && canManage) {
      const barcode = location.state.newBarcode;
      setEditingProduct({ sku: barcode, barcode: barcode, name: "" } as Product);
      setFormOpen(true);
      // Limpiamos el state para no reabrir en recargas
      navigate("/products", { replace: true, state: {} });
    }
  }, [location.state, navigate, canManage]);

  useBarcodeScanner(async (barcode) => {
    if (formOpen) return; // Si ya hay un modal abierto, ignorar
    try {
      const res = await listProducts({ q: barcode, isActive: true, limit: 2 });
      const match = res.items.find((p) => p.sku === barcode || p.barcode === barcode);
      if (match) {
        setSearch(barcode);
        setPage(1);
      } else if (canManage) {
        setEditingProduct({ sku: barcode, barcode: barcode, name: "" } as Product);
        setFormOpen(true);
      } else {
        showError("Producto no encontrado");
      }
    } catch (e) {
      showError("Error al procesar el escaneo");
    }
  });

  const handleSubmit = async (values: ProductFormValues) => {
    try {
      const input = {
        ...values,
        categoryId: values.categoryId || null,
        supplierId: values.supplierId || null,
        barcode: values.barcode || null,
        description: values.description || null,
      };
      if (editingProduct) {
        await update.mutateAsync({ id: editingProduct.id, input });
        showSuccess("Producto actualizado");
      } else {
        await create.mutateAsync(input);
        showSuccess("Producto creado");
      }
      setFormOpen(false);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo guardar el producto"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const result = await remove.mutateAsync(deleteTarget.id);
      showSuccess(result.softDeleted ? "Producto desactivado (tiene historial de movimientos)" : "Producto eliminado");
      setDeleteTarget(null);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo eliminar el producto"));
    }
  };

  const productColumns: DataTableColumn<Product>[] = [
    {
      key: "name",
      header: "Producto",
      hideable: false,
      sortValue: (product) => product.name.toLowerCase(),
      render: (product) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{product.name}</span>
            {!product.isActive && <Badge tone="neutral">Inactivo</Badge>}
          </div>
          <div className="text-xs text-neutral-400">{product.sku}</div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Categoría",
      sortValue: (product) => product.category?.name?.toLowerCase() ?? "",
      render: (product) => product.category?.name ?? "—",
    },
    {
      key: "stock",
      header: "Stock",
      sortValue: (product) => product.currentStock,
      render: (product) => (
        <div className="flex items-center gap-2">
          <span>
            {formatNumber(product.currentStock)} {product.unit}
          </span>
          {product.currentStock <= product.minStock && <Badge tone="danger">Bajo</Badge>}
        </div>
      ),
    },
    {
      key: "cost",
      header: "Costo",
      sortValue: (product) => product.costPrice,
      render: (product) => formatCurrency(product.costPrice),
    },
    {
      key: "price",
      header: "Precio venta",
      sortValue: (product) => product.sellPrice,
      render: (product) => formatCurrency(product.sellPrice),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Productos</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Catálogo completo de tu inventario.</p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nuevo producto
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre, SKU o código de barras..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            className="w-48"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todas las categorías</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <button
            onClick={() => {
              setLowStockOnly((v) => !v);
              setPage(1);
            }}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              lowStockOnly
                ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
                : "border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
            }`}
          >
            <AlertTriangle className="h-4 w-4" /> Stock bajo
          </button>
        </div>
      </Card>

      <Card>
        <DataTable
          columns={productColumns}
          data={data?.items}
          keyField={(p) => p.id}
          isLoading={isLoading}
          onRowClick={(p) => navigate(`/products/${p.id}`)}
          pagination={data?.pagination}
          onPageChange={setPage}
          emptyState={
            <EmptyState icon={Package} title="No se encontraron productos" description="Ajusta los filtros o crea tu primer producto." />
          }
          rowActions={
            canManage
              ? (product) => (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(product)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(product)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </>
                )
              : undefined
          }
        />
      </Card>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingProduct ? "Editar producto" : "Nuevo producto"} size="lg">
        <ProductForm
          initialValues={editingProduct ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
          isSubmitting={create.isPending || update.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar producto"
        message={`¿Seguro que deseas eliminar "${deleteTarget?.name}"? Si tiene movimientos registrados, se desactivará en lugar de eliminarse.`}
        confirmLabel="Eliminar"
        danger
        isLoading={remove.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
