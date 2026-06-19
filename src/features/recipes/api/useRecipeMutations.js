import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createRecipe,
  submitRecipeDraft,
  approveRecipeDraft,
  rejectRecipeDraft,
  scanRecipe,
  updateRecipe,
} from "../../../api/dataSource";

async function invalidateRecipeQueries(queryClient, recipeId) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["recipes"] }),
    recipeId
      ? queryClient.invalidateQueries({
          queryKey: ["recipes", "details", recipeId],
        })
      : Promise.resolve(),
  ]);
}

export function useCreateRecipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRecipe,
    onSuccess: async (data) => {
      await invalidateRecipeQueries(queryClient, data?.recipe?.id);
    },
  });
}

export function useUpdateRecipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ recipeId, payload }) => updateRecipe(recipeId, payload),
    onSuccess: async (data) => {
      await invalidateRecipeQueries(queryClient, data?.recipe?.id);
    },
  });
}

export function useScanRecipeMutation() {
  return useMutation({
    mutationFn: scanRecipe,
  });
}

export function useSubmitRecipeDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitRecipeDraft,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["recipes"] }),
        queryClient.invalidateQueries({ queryKey: ["activity-logs"] }),
      ]);
    },
  });
}

export function useApproveRecipeDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ draftId }) => approveRecipeDraft(draftId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["recipes"] }),
        queryClient.invalidateQueries({ queryKey: ["recipes", "drafts"] }),
        queryClient.invalidateQueries({ queryKey: ["activity-logs"] }),
      ]);
    },
  });
}

export function useRejectRecipeDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ draftId, reason }) => rejectRecipeDraft(draftId, { reason }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["recipes", "drafts"] }),
        queryClient.invalidateQueries({ queryKey: ["activity-logs"] }),
      ]);
    },
  });
}
