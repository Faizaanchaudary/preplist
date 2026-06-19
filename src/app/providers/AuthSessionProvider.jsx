import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { login, selectKitchen } from "../../api/dataSource";
import { useAuthMeQuery } from "../../features/auth/api/useAuthQuery";
import useAuthStore from "../../store/useAuthStore";

const CORE_QUERY_KEYS = [
  ["auth", "me"],
  ["dashboard"],
  ["kitchen-management"],
  ["list-monitoring"],
  ["activity-logs"],
  ["admin"],
];

const useFirebaseDataSource = import.meta.env.VITE_DATA_SOURCE === "firebase";

async function invalidateCoreQueries(queryClient) {
  await Promise.all(
    CORE_QUERY_KEYS.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey })
    )
  );
}

async function restoreKitchenSelection({
  restored,
  persistedKitchenId,
  setActiveKitchenId,
  isCancelled,
}) {
  let nextActiveKitchenId = restored?.activeKitchenId ?? null;

  setActiveKitchenId(nextActiveKitchenId);

  const accessibleKitchenIds = Array.isArray(
    restored?.currentUser?.accessibleKitchenIds
  )
    ? restored.currentUser.accessibleKitchenIds
    : [];

  const shouldRestoreKitchen =
    typeof persistedKitchenId === "string" &&
    persistedKitchenId.trim() &&
    accessibleKitchenIds.includes(persistedKitchenId) &&
    restored?.activeKitchenId !== persistedKitchenId;

  if (!shouldRestoreKitchen) {
    return { restored, nextActiveKitchenId };
  }

  try {
    const kitchenResponse = await selectKitchen({
      kitchenId: persistedKitchenId,
    });

    if (isCancelled()) {
      return { restored, nextActiveKitchenId };
    }

    nextActiveKitchenId =
      kitchenResponse?.activeKitchenId ?? persistedKitchenId;

    setActiveKitchenId(nextActiveKitchenId);

    return {
      restored: {
        ...restored,
        activeKitchenId: nextActiveKitchenId,
        currentUser: kitchenResponse?.currentUser ?? restored?.currentUser,
        accessibleKitchens: Array.isArray(kitchenResponse?.accessibleKitchens)
          ? kitchenResponse.accessibleKitchens
          : restored?.accessibleKitchens,
        permissions: Array.isArray(kitchenResponse?.permissions)
          ? kitchenResponse.permissions
          : restored?.permissions,
      },
      nextActiveKitchenId,
    };
  } catch {
    return { restored, nextActiveKitchenId };
  }
}

export default function AuthSessionProvider({ children }) {
  const queryClient = useQueryClient();

  const persistedEmailRef = useRef("");
  const persistedKitchenIdRef = useRef(null);
  const hasResolvedRef = useRef(false);

  const currentUser = useAuthStore((state) => state.currentUser);
  const activeKitchenId = useAuthStore((state) => state.activeKitchenId);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const setActiveKitchenId = useAuthStore((state) => state.setActiveKitchenId);
  const clearCurrentUser = useAuthStore((state) => state.clearCurrentUser);
  const setHydrated = useAuthStore((state) => state.setHydrated);

  const authMeQuery = useAuthMeQuery();

  useEffect(() => {
    persistedEmailRef.current =
      typeof currentUser?.email === "string" ? currentUser.email.trim() : "";
    persistedKitchenIdRef.current =
      typeof activeKitchenId === "string" && activeKitchenId.trim()
        ? activeKitchenId
        : null;
  }, [currentUser?.email, activeKitchenId]);

  useEffect(() => {
    if (!currentUser) {
      hasResolvedRef.current = false;
    }
  }, [currentUser]);

  useEffect(() => {
    let cancelled = false;
    const isCancelled = () => cancelled;

    async function restoreSession() {
      if (hasResolvedRef.current) return;
      if (authMeQuery.isPending) return;

      if (authMeQuery.isSuccess) {
        if (cancelled) return;

        const persistedKitchenId = persistedKitchenIdRef.current;
        let nextActiveKitchenId = authMeQuery.data?.activeKitchenId ?? null;

        setCurrentUser(authMeQuery.data?.currentUser ?? null);
        setActiveKitchenId(nextActiveKitchenId);

        const accessibleKitchenIds = Array.isArray(
          authMeQuery.data?.currentUser?.accessibleKitchenIds
        )
          ? authMeQuery.data.currentUser.accessibleKitchenIds
          : [];

        const shouldRestoreKitchen =
          typeof persistedKitchenId === "string" &&
          persistedKitchenId.trim() &&
          accessibleKitchenIds.includes(persistedKitchenId) &&
          nextActiveKitchenId !== persistedKitchenId;

        if (shouldRestoreKitchen) {
          try {
            const kitchenResponse = await selectKitchen({
              kitchenId: persistedKitchenId,
            });

            if (!cancelled) {
              nextActiveKitchenId =
                kitchenResponse?.activeKitchenId ?? persistedKitchenId;

              setActiveKitchenId(nextActiveKitchenId);
              queryClient.setQueryData(["auth", "me"], {
                ...authMeQuery.data,
                activeKitchenId: nextActiveKitchenId,
                currentUser:
                  kitchenResponse?.currentUser ?? authMeQuery.data?.currentUser,
              });
            }
          } catch {
            // Keep session kitchen from getCurrentSession.
          }
        }

        setHydrated(true);
        hasResolvedRef.current = true;
        return;
      }

      if (!authMeQuery.isError) {
        return;
      }

      const persistedEmail = persistedEmailRef.current;
      const persistedKitchenId = persistedKitchenIdRef.current;

      if (!persistedEmail || useFirebaseDataSource) {
        if (cancelled) return;

        clearCurrentUser();
        setHydrated(true);
        hasResolvedRef.current = true;
        return;
      }

      try {
        const restored = await login({ email: persistedEmail });
        if (cancelled) return;

        setCurrentUser(restored?.currentUser ?? null);

        const { restored: finalRestored, nextActiveKitchenId } =
          await restoreKitchenSelection({
            restored,
            persistedKitchenId,
            setActiveKitchenId,
            isCancelled,
          });

        if (cancelled) return;

        const finalAuthPayload = {
          currentUser: finalRestored?.currentUser ?? null,
          activeKitchenId: nextActiveKitchenId,
          accessibleKitchens: Array.isArray(finalRestored?.accessibleKitchens)
            ? finalRestored.accessibleKitchens
            : [],
          permissions: Array.isArray(finalRestored?.permissions)
            ? finalRestored.permissions
            : [],
        };

        queryClient.setQueryData(["auth", "me"], finalAuthPayload);
        await invalidateCoreQueries(queryClient);

        if (cancelled) return;

        setHydrated(true);
        hasResolvedRef.current = true;
      } catch {
        if (cancelled) return;

        clearCurrentUser();
        setHydrated(true);
        hasResolvedRef.current = true;
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [
    authMeQuery.isPending,
    authMeQuery.isSuccess,
    authMeQuery.isError,
    authMeQuery.data,
    queryClient,
    setCurrentUser,
    setActiveKitchenId,
    clearCurrentUser,
    setHydrated,
  ]);

  return children;
}
