import { kitchens } from "../data/kitchens.data";
import { users } from "../data/users.data";
import { kitchenSections } from "../data/kitchen-sections.data";
import { kitchenMemberships } from "../data/kitchen-memberships.data";
import { accessCodes } from "../data/access-codes.data";
import { lists } from "../data/lists.data";
import { checklistItems } from "../data/checklist-items.data";
import { templates } from "../data/templates.data";
import { activityLogs } from "../data/activity-logs.data";
import { listSnapshots } from "../data/list-snapshots.data";
import { photos } from "../data/photos.data";
import { completions } from "../data/completions.data";
import { subscriptionPlans } from "../data/subscription.data";
import { recipes } from "../data/recipes.data";
import { recipeDrafts } from "../data/recipe-drafts.data";
import { companies } from "../data/companies.data";
import { recipeCategories } from "../data/recipe-categories.data";
import { templateCategories } from "../data/template-categories.data";
import { activityCategories } from "../data/activity-categories.data";
import { carryForwardList } from "../../shared/utils/carryForwardList";
import { readJson, writeJson } from "./mockStorage";

const DB_STORAGE_KEY = "vpl_mock_db_v1";
const DB_VERSION = 5;
const MAX_CARRY_FORWARD_DAYS = 14;

function deepClone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function startOfDay(dateLike) {
  const date = new Date(dateLike);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(dateLike) {
  const date = new Date(dateLike);
  date.setHours(23, 59, 0, 0);
  return date;
}

function isSameLocalDay(left, right) {
  const leftDate = new Date(left);
  const rightDate = new Date(right);

  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  );
}

function ensureCarryForwardSnapshots(db, now = new Date()) {
  const todayStart = startOfDay(now);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  if (yesterdayStart.getTime() < 0) return false;

  const earliestAllowed = new Date(todayStart);
  earliestAllowed.setDate(earliestAllowed.getDate() - MAX_CARRY_FORWARD_DAYS);

  let changed = false;

  db.lists.forEach((list) => {
    if (!list?.isActive) return;

    const createdAtTime = list?.createdAt ? new Date(list.createdAt).getTime() : NaN;

    const listStart = Number.isNaN(createdAtTime)
      ? new Date(earliestAllowed)
      : startOfDay(createdAtTime);

    if (listStart.getTime() > yesterdayStart.getTime()) return;

    const firstDay =
      listStart.getTime() < earliestAllowed.getTime() ? earliestAllowed : listStart;

    for (
      let cursor = new Date(firstDay);
      cursor.getTime() <= yesterdayStart.getTime();
      cursor.setDate(cursor.getDate() + 1)
    ) {
      const snapshotDate = endOfDay(cursor).toISOString();

      const alreadyCaptured = db.listSnapshots.some(
        (snapshot) =>
          snapshot.listId === list.id &&
          isSameLocalDay(snapshot.snapshotDate, snapshotDate)
      );

      if (alreadyCaptured) continue;

      const items = db.checklistItems.filter((item) => item.listId === list.id);
      db.listSnapshots.unshift(carryForwardList(list, items, snapshotDate));
      changed = true;
    }
  });

  if (changed) {
    db.meta.lastCarryForwardRunAt = now.toISOString();
  }

  return changed;
}

function ensureSubscriptionState(db, now = new Date()) {
  const nowIso = now.toISOString();
  const seededPlans = Array.isArray(subscriptionPlans)
    ? deepClone(subscriptionPlans)
    : [];
  const seededPlanById = new Map(seededPlans.map((plan) => [plan.id, plan]));

  let changed = false;

  if (!Array.isArray(db.subscriptionPlans) || !db.subscriptionPlans.length) {
    db.subscriptionPlans = seededPlans;
    changed = true;
  } else {
    const existingPlanIds = new Set(
      db.subscriptionPlans.map((plan) => plan?.id).filter(Boolean)
    );

    seededPlans.forEach((plan) => {
      if (!plan?.id || existingPlanIds.has(plan.id)) return;
      db.subscriptionPlans.push(plan);
      changed = true;
    });
  }

  const plans = Array.isArray(db.subscriptionPlans) ? db.subscriptionPlans : [];
  if (!plans.length) return changed;

  plans.forEach((plan) => {
    if (!plan || typeof plan !== "object") return;

    const seededPlan = seededPlanById.get(plan.id);

    if (typeof plan.billingLabel !== "string") {
      plan.billingLabel =
        typeof plan.frequency === "string" ? plan.frequency : seededPlan?.billingLabel ?? "";
      changed = true;
    }

    if (typeof plan.description !== "string") {
      plan.description = seededPlan?.description ?? "";
      changed = true;
    }

    if (!Array.isArray(plan.features)) {
      plan.features = Array.isArray(seededPlan?.features) ? seededPlan.features : [];
      changed = true;
    }

    if (typeof plan.recommended !== "boolean") {
      plan.recommended = Boolean(seededPlan?.recommended);
      changed = true;
    }

    if (typeof plan.isActive !== "boolean") {
      plan.isActive = true;
      changed = true;
    }

    if (!plan.createdAt) {
      plan.createdAt = seededPlan?.createdAt ?? nowIso;
      changed = true;
    }

    if (!plan.updatedAt) {
      plan.updatedAt = seededPlan?.updatedAt ?? plan.createdAt ?? nowIso;
      changed = true;
    }

    if ("frequency" in plan) {
      delete plan.frequency;
      changed = true;
    }
  });

  const planIds = new Set(plans.map((plan) => plan?.id).filter(Boolean));
  const fallbackPlanId = planIds.has("sp-free") ? "sp-free" : plans[0]?.id ?? null;
  const seededKitchenById = new Map(
    (Array.isArray(kitchens) ? kitchens : []).map((kitchen) => [kitchen.id, kitchen])
  );
  const legacySubscriptionByCompany =
    db.subscriptionByCompany && typeof db.subscriptionByCompany === "object"
      ? db.subscriptionByCompany
      : {};

  if (Array.isArray(db.kitchens)) {
    db.kitchens.forEach((kitchen) => {
      if (!kitchen || typeof kitchen !== "object") return;

      const seededKitchen = seededKitchenById.get(kitchen.id);
      const legacyPlanId =
        typeof legacySubscriptionByCompany?.[kitchen.companyId]?.activePlanId === "string"
          ? legacySubscriptionByCompany[kitchen.companyId].activePlanId
          : "";
      const seededPlanId =
        typeof seededKitchen?.subscriptionPlanId === "string"
          ? seededKitchen.subscriptionPlanId
          : "";
      const currentPlanId =
        typeof kitchen.subscriptionPlanId === "string" ? kitchen.subscriptionPlanId : "";

      if (currentPlanId && planIds.has(currentPlanId)) return;

      const nextPlanId = planIds.has(seededPlanId)
        ? seededPlanId
        : planIds.has(legacyPlanId)
          ? legacyPlanId
          : fallbackPlanId;

      if (nextPlanId) {
        kitchen.subscriptionPlanId = nextPlanId;
        changed = true;
      }
    });
  }

  if (db.subscriptionByCompany) {
    delete db.subscriptionByCompany;
    changed = true;
  }

  if (db.subscription) {
    delete db.subscription;
    changed = true;
  }

  return changed;
}

function ensureCompanyCatalog(db) {
  const seededCompanies = Array.isArray(companies) ? deepClone(companies) : [];
  const seededKitchens = Array.isArray(kitchens) ? deepClone(kitchens) : [];

  let changed = false;

  if (!Array.isArray(db.companies)) {
    db.companies = seededCompanies;
    changed = true;
  } else {
    const existingCompanyIds = new Set(
      db.companies.map((company) => company?.id).filter(Boolean)
    );

    seededCompanies.forEach((company) => {
      if (!company?.id) return;
      if (existingCompanyIds.has(company.id)) return;
      db.companies.push(company);
      changed = true;
    });
  }

  if (!Array.isArray(db.kitchens)) {
    db.kitchens = seededKitchens;
    changed = true;
  } else {
    const kitchenSeedById = new Map(
      seededKitchens.map((kitchen) => [kitchen.id, kitchen])
    );

    db.kitchens.forEach((kitchen) => {
      if (kitchen?.companyId) return;
      const seeded = kitchenSeedById.get(kitchen?.id);
      if (!seeded?.companyId) return;
      kitchen.companyId = seeded.companyId;
      changed = true;
    });

    const existingKitchenIds = new Set(db.kitchens.map((k) => k?.id).filter(Boolean));
    seededKitchens.forEach((kitchen) => {
      if (!kitchen?.id) return;
      if (existingKitchenIds.has(kitchen.id)) return;
      db.kitchens.push(kitchen);
      changed = true;
    });
  }

  return changed;
}

function ensureUserCatalog(db, now = new Date()) {
  const seededUsers = Array.isArray(users) ? deepClone(users) : [];

  let changed = false;

  if (!Array.isArray(db.users)) {
    db.users = seededUsers;
    return true;
  }

  const seededById = new Map(seededUsers.map((user) => [user.id, user]));

  db.users.forEach((user) => {
    if (!user || typeof user !== "object") return;

    if (!user.createdAt) {
      const seeded = seededById.get(user.id);
      user.createdAt = seeded?.createdAt ?? user.lastActiveAt ?? now.toISOString();
      changed = true;
    }

    if (!user.status) {
      user.status = "active";
      changed = true;
    }
  });

  return changed;
}

export function buildSeedDb() {
  const seededAt = new Date().toISOString();

  return {
    version: DB_VERSION,
    meta: {
      seededAt,
      lastCarryForwardRunAt: null,
    },
    companies: deepClone(companies),
    kitchens: deepClone(kitchens),
    users: deepClone(users),
    kitchenSections: deepClone(kitchenSections),
    kitchenMemberships: deepClone(kitchenMemberships),
    accessCodes: deepClone(accessCodes),
    lists: deepClone(lists),
    checklistItems: deepClone(checklistItems),
    templates: deepClone(templates),
    activityLogs: deepClone(activityLogs),
    listSnapshots: deepClone(listSnapshots),
    photos: deepClone(photos),
    completions: deepClone(completions),
    subscriptionPlans: deepClone(subscriptionPlans),
    recipes: deepClone(recipes),
    recipeDrafts: deepClone(recipeDrafts),
    // Category collections — hardcoded, seeded once
    recipeCategories: deepClone(recipeCategories),
    templateCategories: deepClone(templateCategories),
    activityCategories: deepClone(activityCategories),
  };
}

export function getMockDb() {
  const stored = readJson(DB_STORAGE_KEY, null);
  let db = stored && stored.version === DB_VERSION ? stored : null;

  if (!db) {
    db = buildSeedDb();
    writeJson(DB_STORAGE_KEY, db);
    return db;
  }

  const carryForwardChanged = ensureCarryForwardSnapshots(db);
  const subscriptionChanged = ensureSubscriptionState(db);
  const companyCatalogChanged = ensureCompanyCatalog(db);
  const userCatalogChanged = ensureUserCatalog(db);

  if (carryForwardChanged || subscriptionChanged || companyCatalogChanged || userCatalogChanged) {
    writeJson(DB_STORAGE_KEY, db);
  }

  return db;
}

export function writeMockDb(nextDb) {
  writeJson(DB_STORAGE_KEY, nextDb);
}

export function updateMockDb(mutator) {
  const db = getMockDb();
  const result = mutator(db);
  writeMockDb(db);
  return result;
}

export function resetMockDb() {
  const db = buildSeedDb();
  writeMockDb(db);
  return db;
}
