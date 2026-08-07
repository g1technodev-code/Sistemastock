export type Role = "SUPERADMIN" | "ADMIN" | "MANAGER" | "EMPLOYEE";
export type MovementType = "IN" | "OUT" | "ADJUSTMENT";
export type PaymentMethod = "EFECTIVO" | "TRANSFERENCIA" | "TARJETA" | "CUENTA_CORRIENTE";
export type SaleStatus = "COMPLETED" | "VOIDED";
export type CashMovementType = "SALE_IN" | "WITHDRAWAL" | "ADJUSTMENT";
export type CashShiftStatus = "OPEN" | "CLOSED";
export type PurchaseStatus = "PENDING" | "RECEIVED" | "CANCELLED";
export type InventoryCountStatus = "OPEN" | "COMPLETED";
export type CustomerMovementType = "CHARGE" | "PAYMENT";
export type NotificationType = "LOW_STOCK" | "SHIFT_OPEN" | "SHIFT_CLOSE";

export type LocalStatus = "ACTIVE" | "DUE_SOON" | "SUSPENDED";
export type PlanType = "TRIAL" | "BASICO" | "PRO";

export type LocalItem = {
  id: string;
  name: string;
  ownerEmail: string;
  plan: PlanType;
  isTrial?: boolean;
  status: LocalStatus;
  dueDate: string;
  monthlyPrice: number;
  createdAt: string;
  updatedAt: string;
};

export type ConversionAlert = {
  localId: string;
  name: string;
  ownerEmail: string;
  plan: PlanType;
  isTrial: boolean;
  status: LocalStatus;
  dueDate: string;
  alertStatus: "TRIAL_ACTIVE" | "CONVERTED" | "SUSPENDED_EXPIRED";
};

export type SuperAdminMetrics = {
  totalLocales: number;
  activeLocales: number;
  suspendedLocales: number;
  dueSoonLocales: number;
  mrr: number;
};


export type AuthUser = {
  id: string;
  localId?: string | null;
  name: string;
  email: string;
  role: Role;
};


export type Customer = {
  id: string;
  name: string;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  currentBalance: number;
  creditLimit: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerMovement = {
  id: string;
  customerId: string;
  type: CustomerMovementType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  saleId: string | null;
  userId: string;
  user: { id: string; name: string };
  note: string | null;
  createdAt: string;
};

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
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
  customerId?: string | null;
  customer?: { id: string; name: string } | null;
  createdAt: string;
  items: SaleItem[];
};

export type SalesSummary = {
  total: number;
  count: number;
  byPaymentMethod: { paymentMethod: PaymentMethod; total: number; count: number }[];
};

export type PurchaseItem = {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  product: { id: string; sku: string; name: string; unit: string };
};

export type Purchase = {
  id: string;
  supplierId: string;
  supplier: { id: string; name: string };
  status: PurchaseStatus;
  total: number;
  note: string | null;
  userId: string;
  user: { id: string; name: string };
  receivedById: string | null;
  receivedBy: { id: string; name: string } | null;
  receivedAt: string | null;
  cancelledById: string | null;
  cancelledBy: { id: string; name: string } | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: PurchaseItem[];
};

export type InventoryCountItem = {
  id: string;
  productId: string;
  systemQuantity: number;
  countedQuantity: number;
  difference: number;
  countedAt: string;
  product: { id: string; sku: string; name: string; unit: string };
};

export type InventoryCount = {
  id: string;
  status: InventoryCountStatus;
  note: string | null;
  startedById: string;
  startedBy: { id: string; name: string };
  startedAt: string;
  completedById: string | null;
  completedBy: { id: string; name: string } | null;
  completedAt: string | null;
  items: InventoryCountItem[];
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
    profitToday: number;
    unitsSoldToday: number;
    avgTicketToday: number;
    noMovementCount: number;
  };
  alerts: {
    lowStock: { productId: string; name: string; sku: string; currentStock: number; minStock: number }[];
    noMovement: { productId: string; name: string; sku: string; daysSinceLastMovement: number | null }[];
    noSupplier: { productId: string; name: string; sku: string }[];
  };
  recentActivity: StockMovement[];
};
