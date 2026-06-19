import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  assignRestaurantPlan,
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  removeRestaurantPlan,
  updateSubscriptionPlan,
} from "../../../api/dataSource";

async function invalidateSubscription(queryClient) {
  await queryClient.invalidateQueries({ queryKey: ["subscription"] });
}

export function useCreateSubscriptionPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => createSubscriptionPlan(payload),
    onSuccess: async () => {
      await invalidateSubscription(queryClient);
    },
  });
}

export function useUpdateSubscriptionPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, payload }) => updateSubscriptionPlan(planId, payload),
    onSuccess: async () => {
      await invalidateSubscription(queryClient);
    },
  });
}

export function useDeleteSubscriptionPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId) => deleteSubscriptionPlan(planId),
    onSuccess: async () => {
      await invalidateSubscription(queryClient);
    },
  });
}

export function useAssignRestaurantPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ kitchenId, planId }) => assignRestaurantPlan(kitchenId, planId),
    onSuccess: async () => {
      await invalidateSubscription(queryClient);
    },
  });
}

export function useRemoveRestaurantPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (kitchenId) => removeRestaurantPlan(kitchenId),
    onSuccess: async () => {
      await invalidateSubscription(queryClient);
    },
  });
}
