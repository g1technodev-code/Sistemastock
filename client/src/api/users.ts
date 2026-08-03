import { api } from "./client";
import type { ManagedUser, Paginated, Role } from "../lib/types";

export type CreateUserInput = { name: string; email: string; password: string; role: Role };
export type UpdateUserInput = Partial<{ name: string; email: string; role: Role; isActive: boolean }>;

export async function listUsers(params: { page?: number; limit?: number; q?: string } = {}): Promise<Paginated<ManagedUser>> {
  const { data } = await api.get("/users", { params });
  return data;
}

export async function createUser(input: CreateUserInput): Promise<ManagedUser> {
  const { data } = await api.post("/users", input);
  return data.user;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<ManagedUser> {
  const { data } = await api.patch(`/users/${id}`, input);
  return data.user;
}

export async function resetUserPassword(id: string, newPassword?: string): Promise<{ temporaryPassword: string }> {
  const { data } = await api.patch(`/users/${id}/reset-password`, newPassword ? { newPassword } : {});
  return data;
}
