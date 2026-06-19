import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createKitchen } from "../../../api/dataSource";

export function useCreateKitchenMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createKitchen,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["kitchen-management"] });
    },
  });
}
