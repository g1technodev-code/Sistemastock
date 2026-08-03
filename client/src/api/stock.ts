import { api } from "./client";
import type { MovementType, Paginated, StockMovement } from "../lib/types";

export type CreateMovementInput = {
  productId: string;
  type: MovementType;
  quantity: number;
  reason?: string | null;
  reference?: string | null;
};

export type ListMovementsParams = {
  page?: number;
  limit?: number;
  productId?: string;
  type?: MovementType;
  userId?: string;
  from?: string;
  to?: string;
};

export async function createMovement(input: CreateMovementInput): Promise<StockMovement> {
  const { data } = await api.post("/stock/movements", input);
  return data.movement;
}

export async function listMovements(params: ListMovementsParams): Promise<Paginated<StockMovement>> {
  const { data } = await api.get("/stock/movements", { params });
  return data;
}
