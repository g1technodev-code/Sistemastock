import { api } from "./client";

export type SubscriptionPayment = {
  id: string;
  localId: string;
  local: {
    id: string;
    name: string;
    ownerEmail: string;
  };
  planId?: string | null;
  plan?: {
    id: string;
    name: string;
  } | null;
  amount: number;
  currency: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "REFUNDED";
  mpPaymentId?: string | null;
  mpMerchantOrderId?: string | null;
  paymentMethod?: string | null;
  createdAt: string;
};

export type ListPaymentsResponse = {
  items: SubscriptionPayment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  metrics: {
    monthlyIncome: number;
    estimatedMrr: number;
    successRate: number;
  };
};

export async function listPayments(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<ListPaymentsResponse> {
  const { data } = await api.get("/superadmin/payments", { params });
  return data;
}
