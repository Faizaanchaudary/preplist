import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  applyTemplate,
  attachChecklistItemPhoto,
  createList,
  createTemplate,
  updateChecklistItem,
} from "../../../api/dataSource";
import { uploadChecklistItemPhotoFile } from "../../../api/checklistPhotoUpload";

export function useCreateListMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createList,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["list-monitoring"] });
      await queryClient.invalidateQueries({ queryKey: ["kitchen-management"] });
    },
  });
}

export function useCreateTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTemplate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["list-monitoring", "templates"],
      });
    },
  });
}

export function useApplyTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ templateId, ...payload }) => applyTemplate(templateId, payload),
    onSuccess: async (_data, variables) => {
      const refetches = [
        queryClient.refetchQueries({ queryKey: ["list-monitoring"] }),
      ];

      if (variables?.listId) {
        refetches.push(
          queryClient.refetchQueries({
            queryKey: ["list-monitoring", variables.listId],
          })
        );
      }

      await Promise.all(refetches);
    },
  });
}

export function useUpdateChecklistItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, itemId, ...payload }) =>
      updateChecklistItem(listId, itemId, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["list-monitoring"] });

      if (variables?.listId) {
        await queryClient.invalidateQueries({
          queryKey: ["list-monitoring", variables.listId],
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
    },
  });
}

export function useAttachChecklistItemPhotoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, itemId, file, kitchenId, label }) => {
      const { url, storagePath } = await uploadChecklistItemPhotoFile({
        kitchenId,
        listId,
        itemId,
        file,
      });

      return attachChecklistItemPhoto(listId, itemId, {
        label,
        url,
        storagePath,
      });
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["list-monitoring"] });

      if (variables?.listId) {
        await queryClient.invalidateQueries({
          queryKey: ["list-monitoring", variables.listId],
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
    },
  });
}
