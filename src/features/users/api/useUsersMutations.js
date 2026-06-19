import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assignUserRole,
  createUser,
  deleteUser,
  updateUserAccess,
  updateUser,
} from "../../../api/dataSource";

async function invalidateUsersQueries(queryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["users"] }),
    queryClient.invalidateQueries({ queryKey: ["organization"] }),
    queryClient.invalidateQueries({ queryKey: ["admin"] }),
    queryClient.invalidateQueries({ queryKey: ["auth", "me"] }),
  ]);
}

export function useAssignUserRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }) => assignUserRole(userId, { role }),
    onSuccess: async () => {
      await invalidateUsersQueries(queryClient);
    },
  });
}

export function useUpdateUserAccessMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }) => updateUserAccess(userId, payload),
    onSuccess: async () => {
      await invalidateUsersQueries(queryClient);
    },
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => createUser(payload),
    onSuccess: async () => {
      await invalidateUsersQueries(queryClient);
    },
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }) => updateUser(userId, payload),
    onSuccess: async () => {
      await invalidateUsersQueries(queryClient);
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => deleteUser(userId),
    onSuccess: async () => {
      await invalidateUsersQueries(queryClient);
    },
  });
}
