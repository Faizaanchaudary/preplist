export const AUTH_ME_QUERY_KEY = ["auth", "me"];

const CORE_QUERY_KEYS = [
  ["dashboard"],
  ["kitchen-management"],
  ["list-monitoring"],
  ["activity-logs"],
  ["admin"],
  ["users"],
  ["recipes"],
  ["organization"],
  ["subscription"],
];

export function toAuthMePayload(data) {
  if (!data) {
    return {
      currentUser: null,
      activeKitchenId: null,
      accessibleKitchens: [],
      permissions: [],
    };
  }

  return {
    currentUser: data.currentUser ?? null,
    activeKitchenId: data.activeKitchenId ?? null,
    accessibleKitchens: Array.isArray(data.accessibleKitchens)
      ? data.accessibleKitchens
      : [],
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
  };
}

export async function syncAuthSession(queryClient, data) {
  queryClient.setQueryData(AUTH_ME_QUERY_KEY, toAuthMePayload(data));

  await Promise.all(
    CORE_QUERY_KEYS.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey })
    )
  );
}

export async function clearAuthSession(queryClient) {
  await queryClient.cancelQueries();
  queryClient.clear();
}
