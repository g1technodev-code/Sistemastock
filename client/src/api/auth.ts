import { api } from "./client";
import type { AuthUser } from "../lib/types";

export type LoginResponse = { accessToken: string; user: AuthUser };

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}

export async function me(): Promise<{ user: AuthUser }> {
  const { data } = await api.get("/auth/me");
  return data;
}
