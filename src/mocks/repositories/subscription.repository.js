import { PERMISSIONS } from "../../shared/constants/permissions";
import { ROLES } from "../../shared/constants/roles";
import { getUserPermissions } from "../../shared/utils/rbac";
import {
  createAppError,
  readDb,
  requireAuth,
  touchUser,
  withDbUpdate,
} from "./_repoHelpers";

function requireSubscriptionAccess(currentUser) {
  const permissions = getUserPermissions(currentUser);
  if (!permissions.includes(PERMISSIONS.VIEW_SUBSCRIPTION)) {
    throw createAppError(403, "You do not have permission to view subscription.");
  }
}

function requirePlanManagementAccess(currentUser) {
  const permissions = getUserPermissions(currentUser);
  if (!permissions.includes(PERMISSIONS.MANAGE_SUBSCRIPTION)) {
    throw createAppError(403, "You do not have permission to manage plans.");
  }
}

function resolveVisibleCompanies(db, currentUser) {
  const permissions = getUserPermissions(currentUser);

  if (
    currentUser.role === ROLES.SUPER_ADMIN ||
    permissions.includes(PERMISSIONS.VIEW_ALL_COMPANIES)
  ) {
    return Array.isArray(db.companies) ? db.companies : [];
  }

  const assignedCompanyIds = Array.isArray(currentUser.companyIds)
    ? currentUser.companyIds
    : [];

  const kitchenScopedRoles = new Set([ROLES.HEAD_CHEF, ROLES.SOUS_CHEF, ROLES.STAFF]);

  if (kitchenScopedRoles.has(currentUser.role)) {
    const accessibleKitchenIds = Array.isArray(currentUser.accessibleKitchenIds)
      ? currentUser.accessibleKitchenIds
      : [];

    const kitchenCompanyIds = new Set(
      (Array.isArray(db.kitchens) ? db.kitchens : [])
        .filter((kitchen) => accessibleKitchenIds.includes(kitchen.id))
        .map((kitchen) => kitchen.companyId)
        .filter(Boolean)
    );

    return (Array.isArray(db.companies) ? db.companies : []).filter((company) =>
      kitchenCompanyIds.has(company.id)
    );
  }

  return (Array.isArray(db.companies) ? db.companies : []).filter((company) =>
    assignedCompanyIds.includes(company.id)
  );
}

function resolveVisibleKitchens(db, currentUser, visibleCompanies) {
  const permissions = getUserPermissions(currentUser);
  const kitchens = Array.isArray(db.kitchens) ? db.kitchens : [];

  if (
    currentUser.role === ROLES.SUPER_ADMIN ||
    permissions.includes(PERMISSIONS.VIEW_ALL_KITCHENS)
  ) {
    return kitchens;
  }

  const kitchenScopedRoles = new Set([ROLES.HEAD_CHEF, ROLES.SOUS_CHEF, ROLES.STAFF]);

  if (kitchenScopedRoles.has(currentUser.role)) {
    const accessibleKitchenIds = Array.isArray(currentUser.accessibleKitchenIds)
      ? currentUser.accessibleKitchenIds
      : [];

    return kitchens.filter((kitchen) => accessibleKitchenIds.includes(kitchen.id));
  }

  const companyIds = new Set(
    (Array.isArray(visibleCompanies) ? visibleCompanies : [])
      .map((company) => company.id)
      .filter(Boolean)
  );

  return kitchens.filter((kitchen) => companyIds.has(kitchen.companyId));
}

function createPlanId(now = Date.now()) {
  const suffix = Math.random().toString(36).slice(2, 7);
  return `sp-${now.toString(36)}-${suffix}`;
}

function normalizeFeatureList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeRequiredString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePlanPayload(payload) {
  const name = normalizeRequiredString(payload?.name);
  const price = normalizeRequiredString(payload?.price);
  const billingLabel = normalizeRequiredString(payload?.billingLabel);
  const description =
    typeof payload?.description === "string" ? payload.description.trim() : "";

  if (!name) throw createAppError(400, "Plan name is required.");
  if (!price) throw createAppError(400, "Plan price is required.");

  return {
    name,
    price,
    billingLabel,
    description,
    features: normalizeFeatureList(payload?.features),
    recommended: Boolean(payload?.recommended),
    isActive: payload?.isActive === false ? false : true,
  };
}

function formatStatus(status) {
  const normalized = String(status ?? "active").trim().toLowerCase();
  if (normalized === "inactive") return "Inactive";
  if (normalized === "disabled") return "Disabled";
  if (normalized === "archived") return "Archived";
  return "Active";
}

function isRestaurantActive(kitchen) {
  const status = String(kitchen?.status ?? "active").trim().toLowerCase();
  return !["inactive", "disabled", "archived"].includes(status);
}

function buildRestaurantUsageRows(db, currentUser) {
  const visibleCompanies = resolveVisibleCompanies(db, currentUser);
  const visibleKitchens = resolveVisibleKitchens(db, currentUser, visibleCompanies);
  const companiesById = new Map(visibleCompanies.map((company) => [company.id, company]));
  const plansById = new Map(
    (Array.isArray(db.subscriptionPlans) ? db.subscriptionPlans : []).map((plan) => [
      plan.id,
      plan,
    ])
  );

  return visibleKitchens
    .map((kitchen) => {
      const plan = plansById.get(kitchen.subscriptionPlanId) ?? null;
      const company = companiesById.get(kitchen.companyId) ?? null;
      const status = String(kitchen?.status ?? "active").trim().toLowerCase();
      const location = [kitchen.city, kitchen.siteCode].filter(Boolean).join(" - ");

      return {
        id: kitchen.id,
        kitchenId: kitchen.id,
        restaurantName: kitchen.name,
        companyId: kitchen.companyId ?? null,
        companyName: company?.name ?? "Unassigned company",
        subscriptionPlanId: kitchen.subscriptionPlanId ?? null,
        currentPlanName: plan?.name ?? "No plan assigned",
        currentPlan: plan,
        location: location || "Unknown",
        rawStatus: status || "active",
        status: formatStatus(status),
        isActive: isRestaurantActive(kitchen),
        lastUpdatedAt: kitchen.subscriptionUpdatedAt ?? kitchen.updatedAt ?? null,
      };
    })
    .sort((a, b) => a.restaurantName.localeCompare(b.restaurantName));
}

export async function getSubscriptionPlans() {
  const db = readDb();
  const currentUser = requireAuth(db);

  requireSubscriptionAccess(currentUser);

  return {
    plans: Array.isArray(db.subscriptionPlans) ? db.subscriptionPlans : [],
  };
}

export async function getRestaurantSubscriptionUsage() {
  const db = readDb();
  const currentUser = requireAuth(db);

  requireSubscriptionAccess(currentUser);

  return {
    rows: buildRestaurantUsageRows(db, currentUser),
  };
}

export async function createSubscriptionPlan(payload) {
  return withDbUpdate((db) => {
    const currentUser = requireAuth(db);
    requireSubscriptionAccess(currentUser);
    requirePlanManagementAccess(currentUser);

    const normalized = normalizePlanPayload(payload);
    const nowIso = new Date().toISOString();

    const plan = {
      id: createPlanId(),
      ...normalized,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (!Array.isArray(db.subscriptionPlans)) {
      db.subscriptionPlans = [];
    }

    db.subscriptionPlans.push(plan);
    touchUser(db, currentUser.id);

    return { plan };
  });
}

export async function updateSubscriptionPlan(planId, payload) {
  const normalizedPlanId = normalizeRequiredString(planId);
  if (!normalizedPlanId) throw createAppError(400, "Plan id is required.");

  return withDbUpdate((db) => {
    const currentUser = requireAuth(db);
    requireSubscriptionAccess(currentUser);
    requirePlanManagementAccess(currentUser);

    const plan = Array.isArray(db.subscriptionPlans)
      ? db.subscriptionPlans.find((entry) => entry.id === normalizedPlanId) ?? null
      : null;

    if (!plan) throw createAppError(404, "Subscription plan not found.");

    const normalized = normalizePlanPayload(payload);

    plan.name = normalized.name;
    plan.price = normalized.price;
    plan.billingLabel = normalized.billingLabel;
    plan.description = normalized.description;
    plan.features = normalized.features;
    plan.recommended = normalized.recommended;
    plan.isActive = normalized.isActive;
    plan.updatedAt = new Date().toISOString();

    touchUser(db, currentUser.id);
    return { plan };
  });
}

export async function deleteSubscriptionPlan(planId) {
  const normalizedPlanId = normalizeRequiredString(planId);
  if (!normalizedPlanId) throw createAppError(400, "Plan id is required.");

  return withDbUpdate((db) => {
    const currentUser = requireAuth(db);
    requireSubscriptionAccess(currentUser);
    requirePlanManagementAccess(currentUser);

    const plans = Array.isArray(db.subscriptionPlans) ? db.subscriptionPlans : [];
    const index = plans.findIndex((plan) => plan.id === normalizedPlanId);
    if (index < 0) throw createAppError(404, "Subscription plan not found.");

    const assignedCount = (Array.isArray(db.kitchens) ? db.kitchens : []).filter(
      (kitchen) => kitchen.subscriptionPlanId === normalizedPlanId
    ).length;

    if (assignedCount > 0) {
      throw createAppError(
        400,
        "This plan is assigned to restaurants and cannot be deleted."
      );
    }

    if (plans.length <= 1) {
      throw createAppError(400, "At least one plan must remain available.");
    }

    plans.splice(index, 1);
    db.subscriptionPlans = plans;
    touchUser(db, currentUser.id);

    return { deletedPlanId: normalizedPlanId };
  });
}

export async function assignRestaurantPlan(kitchenId, planId) {
  const normalizedKitchenId = normalizeRequiredString(kitchenId);
  const normalizedPlanId = normalizeRequiredString(planId);

  if (!normalizedKitchenId) throw createAppError(400, "Restaurant/kitchen id is required.");
  if (!normalizedPlanId) throw createAppError(400, "Plan id is required.");

  return withDbUpdate((db) => {
    const currentUser = requireAuth(db);
    requireSubscriptionAccess(currentUser);
    requirePlanManagementAccess(currentUser);

    const visibleCompanies = resolveVisibleCompanies(db, currentUser);
    const visibleKitchenIds = new Set(
      resolveVisibleKitchens(db, currentUser, visibleCompanies).map((kitchen) => kitchen.id)
    );

    if (!visibleKitchenIds.has(normalizedKitchenId)) {
      throw createAppError(403, "You do not have access to manage this restaurant.");
    }

    const kitchen = Array.isArray(db.kitchens)
      ? db.kitchens.find((entry) => entry.id === normalizedKitchenId) ?? null
      : null;

    if (!kitchen) throw createAppError(404, "Restaurant/kitchen not found.");

    const plan = Array.isArray(db.subscriptionPlans)
      ? db.subscriptionPlans.find((entry) => entry.id === normalizedPlanId) ?? null
      : null;

    if (!plan) throw createAppError(404, "Subscription plan not found.");

    const nowIso = new Date().toISOString();

    kitchen.subscriptionPlanId = normalizedPlanId;
    kitchen.subscriptionUpdatedAt = nowIso;
    kitchen.updatedAt = nowIso;

    touchUser(db, currentUser.id);

    return {
      restaurant: {
        id: kitchen.id,
        name: kitchen.name,
        companyId: kitchen.companyId ?? null,
        subscriptionPlanId: kitchen.subscriptionPlanId,
      },
      plan,
    };
  });
}

export async function removeRestaurantPlan(kitchenId) {
  const normalizedKitchenId = normalizeRequiredString(kitchenId);

  if (!normalizedKitchenId) {
    throw createAppError(400, "Restaurant/kitchen id is required.");
  }

  return withDbUpdate((db) => {
    const currentUser = requireAuth(db);
    requireSubscriptionAccess(currentUser);
    requirePlanManagementAccess(currentUser);

    const visibleCompanies = resolveVisibleCompanies(db, currentUser);
    const visibleKitchenIds = new Set(
      resolveVisibleKitchens(db, currentUser, visibleCompanies).map((kitchen) => kitchen.id)
    );

    if (!visibleKitchenIds.has(normalizedKitchenId)) {
      throw createAppError(403, "You do not have access to manage this restaurant.");
    }

    const kitchen = Array.isArray(db.kitchens)
      ? db.kitchens.find((entry) => entry.id === normalizedKitchenId) ?? null
      : null;

    if (!kitchen) throw createAppError(404, "Restaurant/kitchen not found.");

    const nowIso = new Date().toISOString();

    kitchen.subscriptionPlanId = null;
    kitchen.subscriptionUpdatedAt = nowIso;
    kitchen.updatedAt = nowIso;

    touchUser(db, currentUser.id);

    return {
      restaurant: {
        id: kitchen.id,
        name: kitchen.name,
        companyId: kitchen.companyId ?? null,
        subscriptionPlanId: null,
      },
    };
  });
}
