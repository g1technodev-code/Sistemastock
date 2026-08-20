import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Search, Package, Pencil, Trash2, AlertTriangle, Camera, Upload } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Field";
import { Badge } from "../components/ui/Badge";
import { DataTable, type DataTableColumn } from "../components/ui/DataTable";
import { Drawer } from "../components/ui/Drawer";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ProductForm, type ProductFormValues } from "../components/products/ProductForm";
import { CatalogBrowseTab } from "../components/products/CatalogBrowseTab";
import { CameraScannerModal } from "../components/common/CameraScannerModal";
import { BulkUploadModal } from "../components/common/BulkUploadModal";
import { useProducts, useProductMutations } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { permissions } from "../lib/permissions";
import { extractErrorMessage } from "../api/client";
import { formatCurrency, formatNumber } from "../lib/formatters";
import { listProducts, downloadProductBulkTemplate, bulkUploadProducts } from "../api/products";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import type { Product } from "../lib/types";

export default function Products() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = user ? permissions.canManageCatalog(user.role) : false;
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "catalog">("products");
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
      setEditingProduct({ barcode, name: "" } as Product);
      setFormOpen(true);
      navigate("/products", { replace: true, state: {} });
    }
  }, [location.state, navigate, canManage]);

  const handleGlobalScan = async (barcode: string) => {
    if (formOpen) return;
    try {
      const res = await listProducts({ q: barcode, isActive: true, limit: 10 });
      const match = res.items.find((p) => p.sku === barcode || p.barcode === barcode);
      if (match) {
        setSearch(barcode);
        setPage(1);
        showSuccess(`Producto encontrado: ${match.name}`);
      } else if (canManage) {
        setEditingProduct({ sku: barcode, barcode: barcode, name: "" } as Product);
        setFormOpen(true);
        showSuccess(`Código ${barcode} escaneado. Completa los datos para crear el producto.`);
      } else {
        showError("Producto no encontrado");
      }
    } catch (e) {
      showError("Error al procesar el escaneo");
    }
  };

  useBarcodeScanner(handleGlobalScan);

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
            <span className="font-bold text-neutral-900 dark:text-neutral-100">{product.name}</span>
            {!product.isActive && <Badge tone="neutral">Inactivo</Badge>}
          </div>
          <div className="text-xs font-medium text-neutral-400 mt-0.5">{product.sku}</div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Categoría",
      sortValue: (product) => product.category?.name?.toLowerCase() ?? "",
      render: (product) => <Badge tone="info">{product.category?.name ?? "Sin categoría"}</Badge>,
    },
    {
      key: "stock",
      header: "Stock",
      sortValue: (product) => product.currentStock,
      render: (product) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            {formatNumber(product.currentStock)} <span className="text-neutral-400 font-medium">{product.unit}</span>
          </span>
          {product.currentStock <= product.minStock && <Badge tone="danger">Bajo</Badge>}
        </div>
      ),
    },
    {
      key: "cost",
      header: "Costo",
      sortValue: (product) => product.costPrice,
      render: (product) => <span className="font-medium text-neutral-600 dark:text-neutral-400">{formatCurrency(product.costPrice)}</span>,
    },
    {
      key: "price",
      header: "Precio venta",
      sortValue: (product) => product.sellPrice,
      render: (product) => <span className="font-bold text-primary-600 dark:text-primary-400">{formatCurrency(product.sellPrice)}</span>,
    },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">Productos</h1>
          <p className="mt-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">Catálogo completo de tu inventario.</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button onClick={() => setCameraOpen(true)} variant="outline" className="shadow-sm">
              <Camera className="h-4 w-4 text-primary-600 dark:text-primary-400" strokeWidth={2.5} /> Escanear
            </Button>
            <Button onClick={() => setBulkOpen(true)} variant="outline" className="shadow-sm">
              <Upload className="h-4 w-4" strokeWidth={2.5} /> Carga masiva
            </Button>
            <Button onClick={openCreate} className="shadow-sm">
              <Plus className="h-4 w-4" strokeWidth={2.5} /> Nuevo producto
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
            activeTab === "products"
              ? "border-primary-500 text-primary-600 dark:text-primary-400"
              : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          }`}
        >
          Mis Productos
        </button>
        <button
          onClick={() => setActiveTab("catalog")}
          className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
            activeTab === "catalog"
              ? "border-primary-500 text-primary-600 dark:text-primary-400"
              : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          }`}
        >
          Catálogo del Rubro
        </button>
      </div>

      {activeTab === "products" ? (
        <>
          <Card className="p-2">
            <div className="flex flex-wrap items-center gap-3 p-2">
              <div className="relative min-w-[280px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  className="pl-9 h-10 border-transparent bg-neutral-100/80 hover:bg-neutral-200/50 focus:bg-white dark:bg-neutral-800/80 dark:hover:bg-neutral-800"
                  placeholder="Buscar por nombre, SKU o código de barras..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Select
                className="w-48 h-10"
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
                className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-all duration-200 ${
                  lowStockOnly
                    ? "border-warning-300 bg-warning-50 text-warning-700 shadow-sm dark:border-warning-800/60 dark:bg-warning-500/10 dark:text-warning-400"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 dark:border-white/10 dark:bg-neutral-900/50 dark:text-neutral-400 dark:hover:bg-neutral-900"
                }`}
              >
                <AlertTriangle className="h-4 w-4" strokeWidth={2.5} /> Stock bajo
              </button>
            </div>
          </Card>

          <Card className="shadow-float">
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
                          <Trash2 className="h-4 w-4 text-danger-500" />
                        </Button>
                      </>
                    )
                  : undefined
              }
            />
          </Card>
        </>
      ) : (
        <CatalogBrowseTab canManage={canManage} />
      )}

      <Drawer open={formOpen} onClose={() => setFormOpen(false)} title={editingProduct ? "Editar producto" : "Nuevo producto"}>
        <ProductForm
          initialValues={editingProduct ?? undefined}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
          isSubmitting={create.isPending || update.isPending}
        />
      </Drawer>

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

      <CameraScannerModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onScan={handleGlobalScan}
        title="Escanear Código de Producto"
      />

      <BulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Carga masiva de productos"
        columnsHint="nombre, descripcion, codigo_barras, cantidad, precio"
        onDownloadTemplate={downloadProductBulkTemplate}
        onUpload={bulkUploadProducts}
        onDone={() => {
          showSuccess("Carga masiva completada");
          queryClient.invalidateQueries({ queryKey: ["products"] });
          queryClient.invalidateQueries({ queryKey: ["low-stock-alerts"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
        }}
      />
    </div>
  );
}
