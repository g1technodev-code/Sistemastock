export type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";
export type MovementType = "IN" | "OUT" | "ADJUSTMENT";
export type PaymentMethod = "EFECTIVO" | "TRANSFERENCIA" | "TARJETA";
export type SaleStatus = "COMPLETED" | "VOIDED";
export type CashMovementType = "SALE_IN" | "WITHDRAWAL" | "ADJUSTMENT";
export type CashShiftStatus = "OPEN" | "CLOSED";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Category = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { products: number };
};

export type Supplier = {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  taxId: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { products: number };
};

export type Product = {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  unit: string;
  costPrice: number;
  sellPrice: number;
  currentStock: number;
  minStock: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categoryId: string | null;
  supplierId: string | null;
  category: { id: string; name: string; color: string | null } | null;
  supplier: { id: string; name: string } | null;
};

export type StockMovement = {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  unitCost: number | null;
  reason: string | null;
  reference: string | null;
  userId: string;
  createdAt: string;
  product: { id: string; sku: string; name: string; unit: string };
  user: { id: string; name: string };
};

export type SaleItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: { id: string; sku: string; name: string; unit: string };
};

export type Sale = {
  id: string;
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  receiptNumber: string | null;
  payerName: string | null;
  userId: string;
  user: { id: string; name: string };
  createdAt: string;
  items: SaleItem[];
};

export type SalesSummary = {
  total: number;
  count: number;
  byPaymentMethod: { paymentMethod: PaymentMethod; total: number; count: number }[];
};

export type CashShift = {
  id: string;
  openedById: string;
  openedBy: { id: string; name: string };
  openedAt: string;
  openingCounted: number;
  openingExpected: number;
  openingDiscrepancy: number;
  closedById: string | null;
  closedBy: { id: string; name: string } | null;
  closedAt: string | null;
  closingCounted: number | null;
  closingExpected: number | null;
  closingDiscrepancy: number | null;
  status: CashShiftStatus;
  note: string | null;
};

export type CashMovement = {
  id: string;
  type: CashMovementType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  saleId: string | null;
  userId: string;
  user: { id: string; name: string };
  note: string | null;
  createdAt: string;
};

export type CashRegisterStatus = {
  currentBalance: number;
  myOpenShift: CashShift | null;
};

export type CashSummary = {
  currentBalance: number;
  salesInToday: number;
  withdrawalsToday: number;
};

export type BusinessSettings = {
  id: string;
  businessName: string;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  logoUrl: string | null;
  updatedAt: string;
};

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Paginated<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type DashboardSummary = {
  kpis: {
    totalProducts: number;
    totalStockValue: number;
    lowStockCount: number;
    movementsToday: number;
    salesToday: number;
    cashBalance: number;
  };
  movementSeries: { date: string; in: number; out: number }[];
  categoryBreakdown: { name: string; color: string | null; value: number }[];
  topProducts: { productId: string; name: string; sku: string; quantity: number }[];
  recentActivity: StockMovement[];
};
