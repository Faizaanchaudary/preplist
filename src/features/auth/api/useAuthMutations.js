import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  joinByCode,
  login,
  logout,
  pinLogin,
  selectKitchen,
} from "../../../api/dataSource";
import useAuthStore from "../../../store/useAuthStore";
import { clearAuthSession, syncAuthSession } from "./authSessionSync";

export function useJoinByCodeMutation() {
  const queryClient = useQueryClient();
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const setActiveKitchenId = useAuthStore((state) => state.setActiveKitchenId);

  return useMutation({
    mutationFn: ({ code, email }) => joinByCode({ code, email }),
    onSuccess: async (data) => {
      if (data?.currentUser) {
        setCurrentUser(data.currentUser);
      }

      if ("activeKitchenId" in (data ?? {})) {
        setActiveKitchenId(data?.activeKitchenId ?? null);
      }

      await syncAuthSession(queryClient, data);
    },
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const setActiveKitchenId = useAuthStore((state) => state.setActiveKitchenId);

  return useMutation({
    mutationFn: ({ email, password }) => login({ email, password }),
    onSuccess: async (data) => {
      if (data?.currentUser) {
        setCurrentUser(data.currentUser);
      }

      if ("activeKitchenId" in (data ?? {})) {
        setActiveKitchenId(data?.activeKitchenId ?? null);
      }

      await syncAuthSession(queryClient, data);
    },
  });
}

export function usePinLoginMutation() {
  const queryClient = useQueryClient();
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const setActiveKitchenId = useAuthStore((state) => state.setActiveKitchenId);

  return useMutation({
    mutationFn: ({ email, pin }) => pinLogin({ email, pin }),
    onSuccess: async (data) => {
      if (data?.currentUser) {
        setCurrentUser(data.currentUser);
      }

      if ("activeKitchenId" in (data ?? {})) {
        setActiveKitchenId(data?.activeKitchenId ?? null);
      }

      await syncAuthSession(queryClient, data);
    },
  });
}

export function useSelectKitchenMutation() {
  const queryClient = useQueryClient();
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const setActiveKitchenId = useAuthStore((state) => state.setActiveKitchenId);

  return useMutation({
    mutationFn: ({ kitchenId }) => selectKitchen({ kitchenId }),
    onSuccess: async (data) => {
      if (data?.currentUser) {
        setCurrentUser(data.currentUser);
      }

      if ("activeKitchenId" in (data ?? {})) {
        setActiveKitchenId(data?.activeKitchenId ?? null);
      }

      await syncAuthSession(queryClient, data);
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const clearCurrentUser = useAuthStore((state) => state.clearCurrentUser);

  return useMutation({
    mutationFn: logout,
    onSettled: async () => {
      clearCurrentUser();
      await clearAuthSession(queryClient);
    },
  });
}
