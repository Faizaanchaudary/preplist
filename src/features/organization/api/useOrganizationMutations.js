import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assignUserRole,
  updateUserAccess,
} from "../../../api/dataSource";

async function invalidateOrganizationQueries(queryClient) {
  await Promise.all([
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
      await invalidateOrganizationQueries(queryClient);
    },
  });
}

export function useUpdateUserAccessMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }) => updateUserAccess(userId, payload),
    onSuccess: async () => {
      await invalidateOrganizationQueries(queryClient);
    },
  });
}

