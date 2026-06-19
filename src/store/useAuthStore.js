import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getUserPermissions } from "../shared/utils/rbac";

const useAuthStore = create(
  persist(
    (set, get) => ({
      currentUser: null,
      activeKitchenId: null,
      isHydrated: false,

      setCurrentUser: (user) =>
        set({
          currentUser: user ?? null,
        }),

      setActiveKitchenId: (kitchenId) =>
        set({
          activeKitchenId:
            typeof kitchenId === "string" && kitchenId.trim()
              ? kitchenId.trim()
              : null,
        }),

      clearCurrentUser: () =>
        set({
          currentUser: null,
          activeKitchenId: null,
        }),

      setHydrated: (value = true) =>
        set({
          isHydrated: Boolean(value),
        }),

      hasPermission: (permission) => {
        const currentUser = get().currentUser;
        if (!currentUser) return false;

        const permissions = getUserPermissions(currentUser);
        return permissions.includes(permission);
      },
    }),
    {
      name: "prep-list-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
        activeKitchenId: state.activeKitchenId,
      }),
    }
  )
);

export default useAuthStore;
