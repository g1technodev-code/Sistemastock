import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as usersApi from "../api/users";
import type { CreateUserInput, UpdateUserInput } from "../api/users";

export function useUsers(params: { page?: number; limit?: number; q?: string }) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => usersApi.listUsers(params),
    placeholderData: (prev) => prev,
  });
}

export function useUserMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["users"] });

  const create = useMutation({
    mutationFn: (input: CreateUserInput) => usersApi.createUser(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) => usersApi.updateUser(id, input),
    onSuccess: invalidate,
  });
  const resetPassword = useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword?: string }) => usersApi.resetUserPassword(id, newPassword),
  });

  return { create, update, resetPassword };
}
