import { PERMISSIONS } from "../../shared/constants/permissions";
import { getUserPermissions } from "../../shared/utils/rbac";
import { generateSequentialId } from "../../shared/utils/generateSequentialId";
import { buildRecipeDetailsPayload, buildRecipesPayload, canManageRecipes } from "../mappers/index.js";
import { createAppError, readDb, requireAuth, touchUser, withDbUpdate } from "./_repoContext.js";

function sanitizeString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function sanitizeArray(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function buildRecipePayload(body, existingRecipe = null) {
  const title = sanitizeString(body?.title);
  const section = sanitizeString(body?.section);
  const category = sanitizeString(body?.category, "General");
  const yieldValue = sanitizeString(body?.yield);
  const notes = sanitizeString(body?.notes);
  const kitchenIds = sanitizeArray(body?.kitchenIds);
  const ingredients = sanitizeArray(body?.ingredients);
  const steps = sanitizeArray(body?.steps);
  const prepTimeMinutes =
    body?.prepTimeMinutes || body?.prepTimeMinutes === 0
      ? Number(body.prepTimeMinutes)
      : null;

  if (!title) {
    throw createAppError(400, "Recipe title is required.");
  }

  if (!section) {
    throw createAppError(400, "Section is required.");
  }

  if (!kitchenIds.length) {
    throw createAppError(400, "At least one kitchen is required.");
  }

  if (!ingredients.length) {
    throw createAppError(400, "At least one ingredient is required.");
  }

  if (!steps.length) {
    throw createAppError(400, "At least one step is required.");
  }

  const now = new Date().toISOString();

  return {
    id: existingRecipe?.id ?? generateSequentialId("r", []),
    title,
    section,
    category,
    prepTimeMinutes: Number.isFinite(prepTimeMinutes) ? prepTimeMinutes : null,
    yield: yieldValue,
    notes,
    imageUrl: sanitizeString(body?.imageUrl),
    scalingMultiplier: Number(body?.scalingMultiplier) || 1,
    kitchenIds,
    ingredients,
    steps,
    createdAt: existingRecipe?.createdAt ?? now,
    updatedAt: now,
  };
}

function buildRecipeDraftPayload(body, { submittedBy, status = "pending", reviewedBy = null } = {}) {
  const base = buildRecipePayload(body, null);

  const now = new Date().toISOString();

  return {
    id: generateSequentialId("rd", []),
    title: base.title,
    section: base.section,
    category: base.category,
    kitchenIds: base.kitchenIds,
    ingredients: base.ingredients,
    steps: base.steps,
    notes: base.notes,
    imageUrl: base.imageUrl,
    scalingMultiplier: base.scalingMultiplier,
    status,
    submittedBy,
    reviewedBy,
    createdAt: now,
    updatedAt: now,
  };
}

function splitPipeList(value) {
  return String(value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildScanDraft({ sourceName, kitchenIds = [], recipe = null }) {
  if (recipe) {
    const title = sanitizeString(recipe.title);
    const section = sanitizeString(recipe.section);
    const ingredients = Array.isArray(recipe.ingredients)
      ? sanitizeArray(recipe.ingredients)
      : splitPipeList(recipe.ingredients);
    const steps = Array.isArray(recipe.steps)
      ? sanitizeArray(recipe.steps)
      : splitPipeList(recipe.steps);

    if (!title) {
      throw createAppError(400, "Recipe title is required.");
    }

    if (!section) {
      throw createAppError(400, "Section is required.");
    }

    if (!ingredients.length) {
      throw createAppError(400, "At least one ingredient is required.");
    }

    if (!steps.length) {
      throw createAppError(400, "At least one step is required.");
    }

    const prepTimeMinutes =
      recipe.prepTimeMinutes || recipe.prepTimeMinutes === 0
        ? Number(recipe.prepTimeMinutes)
        : null;

    return {
      title,
      section,
      category: sanitizeString(recipe.category, "Imported"),
      prepTimeMinutes: Number.isFinite(prepTimeMinutes) ? prepTimeMinutes : null,
      yield: sanitizeString(recipe.yield, ""),
      ingredients,
      steps,
      notes:
        sanitizeString(recipe.notes, "") ||
        `Imported from ${sanitizeString(sourceName, "CSV upload")}.`,
      kitchenIds: kitchenIds.length ? [kitchenIds[0]] : [],
    };
  }

  throw createAppError(400, "Recipe CSV data is required.");
}

function appendRecipeActivity(db, { actorId, kitchenId, action, message }) {
  db.activityLogs.unshift({
    id: generateSequentialId("al", db.activityLogs),
    kitchenId: kitchenId ?? null,
    listId: null,
    actorId,
    action,
    message,
    createdAt: new Date().toISOString(),
  });
}

export async function getRecipes(filters = {}) {
  const db = await readDb();
  const currentUser = requireAuth(db);

  const permissions = getUserPermissions(currentUser);
  if (!permissions.includes(PERMISSIONS.VIEW_RECIPES)) {
    throw createAppError(403, "You do not have permission to view recipes.");
  }

  const search = typeof filters.search === "string" ? filters.search : "";
  const section = typeof filters.section === "string" ? filters.section : "all";
  const category = typeof filters.category === "string" ? filters.category : "all";

  return buildRecipesPayload(db, currentUser, { search, section, category });
}

export async function getRecipeDetails(recipeId) {
  const db = await readDb();
  const currentUser = requireAuth(db);

  const permissions = getUserPermissions(currentUser);
  if (!permissions.includes(PERMISSIONS.VIEW_RECIPES)) {
    throw createAppError(403, "You do not have permission to view recipes.");
  }

  const normalizedRecipeId = String(recipeId ?? "").trim();
  const payload = buildRecipeDetailsPayload(db, currentUser, normalizedRecipeId);

  if (!payload) {
    throw createAppError(404, "Recipe not found.");
  }

  return payload;
}

export async function createRecipe(payload) {
  return withDbUpdate((db) => {
    const currentUser = requireAuth(db);

    if (!canManageRecipes(currentUser)) {
      throw createAppError(403, "You do not have permission to manage recipes.");
    }

    const recipe = buildRecipePayload(payload);
    recipe.id = generateSequentialId("r", db.recipes);

    db.recipes.unshift(recipe);

    appendRecipeActivity(db, {
      actorId: currentUser.id,
      kitchenId: recipe.kitchenIds?.[0] ?? null,
      action: "recipe_created",
      message: `${currentUser.name} created recipe ${recipe.title}`,
    });

    touchUser(db, currentUser.id);
    return { recipe };
  });
}

export async function updateRecipe(recipeId, payload) {
  const normalizedRecipeId = String(recipeId ?? "").trim();

  return withDbUpdate((db) => {
    const currentUser = requireAuth(db);

    if (!canManageRecipes(currentUser)) {
      throw createAppError(403, "You do not have permission to manage recipes.");
    }

    const recipeIndex = db.recipes.findIndex((entry) => entry.id === normalizedRecipeId);

    if (recipeIndex === -1) {
      throw createAppError(404, "Recipe not found.");
    }

    const recipe = buildRecipePayload(payload, db.recipes[recipeIndex]);
    db.recipes[recipeIndex] = recipe;

    appendRecipeActivity(db, {
      actorId: currentUser.id,
      kitchenId: recipe.kitchenIds?.[0] ?? null,
      action: "recipe_updated",
      message: `${currentUser.name} updated recipe ${recipe.title}`,
    });

    touchUser(db, currentUser.id);
    return { recipe };
  });
}

export async function scanRecipe(payload) {
  const sourceName = sanitizeString(payload?.sourceName, "recipe.csv");

  return withDbUpdate((db) => {
    const currentUser = requireAuth(db);

    const permissions = getUserPermissions(currentUser);
    const canScan =
      canManageRecipes(currentUser) ||
      permissions.includes(PERMISSIONS.SCAN_RECIPE_DRAFTS);

    if (!canScan) {
      throw createAppError(403, "You do not have permission to scan recipes.");
    }

    const draft = buildScanDraft({
      sourceName,
      kitchenIds: Array.isArray(currentUser.accessibleKitchenIds)
        ? currentUser.accessibleKitchenIds
        : [],
      recipe: payload?.recipe ?? null,
    });

    appendRecipeActivity(db, {
      actorId: currentUser.id,
      kitchenId: draft.kitchenIds?.[0] ?? null,
      action: "recipe_scanned",
      message: `${currentUser.name} imported recipe "${draft.title}" from CSV`,
    });

    touchUser(db, currentUser.id);

    return { draft };
  });
}

export async function getRecipeDrafts(filters = {}) {
  const db = await readDb();
  const currentUser = requireAuth(db);

  const permissions = getUserPermissions(currentUser);

  const canView =
    permissions.includes(PERMISSIONS.SCAN_RECIPE_DRAFTS) ||
    permissions.includes(PERMISSIONS.APPROVE_RECIPE_DRAFTS) ||
    permissions.includes(PERMISSIONS.MANAGE_RECIPES);

  if (!canView) {
    throw createAppError(403, "You do not have permission to view recipe drafts.");
  }

  const status = typeof filters.status === "string" ? filters.status : "all";

  const accessibleKitchenIds = Array.isArray(currentUser.accessibleKitchenIds)
    ? currentUser.accessibleKitchenIds
    : [];

  const isApprover = permissions.includes(PERMISSIONS.APPROVE_RECIPE_DRAFTS);

  const visibleDrafts = db.recipeDrafts.filter((draft) => {
    const inKitchenScope = Array.isArray(draft.kitchenIds)
      ? draft.kitchenIds.some((id) => accessibleKitchenIds.includes(id))
      : false;

    if (!inKitchenScope) return false;

    if (!isApprover && draft.submittedBy !== currentUser.id) {
      return false;
    }

    if (status !== "all" && draft.status !== status) return false;

    return true;
  });

  const rows = visibleDrafts
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map((draft) => {
      const submitter = db.users.find((u) => u.id === draft.submittedBy) ?? null;
      const reviewer = draft.reviewedBy
        ? db.users.find((u) => u.id === draft.reviewedBy) ?? null
        : null;

      return {
        ...draft,
        submittedByName: submitter?.name ?? "Unknown",
        reviewedByName: reviewer?.name ?? null,
      };
    });

  return { rows };
}

export async function submitRecipeDraft(payload) {
  return withDbUpdate((db) => {
    const currentUser = requireAuth(db);
    const permissions = getUserPermissions(currentUser);

    const canSubmit =
      permissions.includes(PERMISSIONS.SCAN_RECIPE_DRAFTS) ||
      permissions.includes(PERMISSIONS.MANAGE_RECIPES);

    if (!canSubmit) {
      throw createAppError(403, "You do not have permission to submit recipe drafts.");
    }

    const draft = buildRecipeDraftPayload(payload, {
      submittedBy: currentUser.id,
      status: "pending",
      reviewedBy: null,
    });

    draft.id = generateSequentialId("rd", db.recipeDrafts);

    db.recipeDrafts.unshift(draft);

    appendRecipeActivity(db, {
      actorId: currentUser.id,
      kitchenId: draft.kitchenIds?.[0] ?? null,
      action: "recipe_draft_submitted",
      message: `${currentUser.name} submitted recipe draft ${draft.title}`,
    });

    touchUser(db, currentUser.id);
    return { draft };
  });
}

export async function approveRecipeDraft(draftId) {
  const normalizedDraftId = String(draftId ?? "").trim();

  return withDbUpdate((db) => {
    const currentUser = requireAuth(db);
    const permissions = getUserPermissions(currentUser);

    if (!permissions.includes(PERMISSIONS.APPROVE_RECIPE_DRAFTS)) {
      throw createAppError(403, "You do not have permission to approve recipe drafts.");
    }

    const draft = db.recipeDrafts.find((entry) => entry.id === normalizedDraftId) ?? null;

    if (!draft) {
      throw createAppError(404, "Recipe draft not found.");
    }

    if (draft.status !== "pending") {
      throw createAppError(409, "Only pending drafts can be approved.");
    }

    const now = new Date().toISOString();

    draft.status = "approved";
    draft.reviewedBy = currentUser.id;
    draft.updatedAt = now;

    const recipe = {
      id: generateSequentialId("r", db.recipes),
      title: draft.title,
      section: draft.section,
      category: draft.category,
      prepTimeMinutes: null,
      yield: "",
      kitchenIds: Array.isArray(draft.kitchenIds) ? draft.kitchenIds : [],
      ingredients: Array.isArray(draft.ingredients) ? draft.ingredients : [],
      steps: Array.isArray(draft.steps) ? draft.steps : [],
      notes: draft.notes ?? "",
      createdAt: now,
      updatedAt: now,
    };

    db.recipes.unshift(recipe);

    appendRecipeActivity(db, {
      actorId: currentUser.id,
      kitchenId: recipe.kitchenIds?.[0] ?? null,
      action: "recipe_draft_approved",
      message: `${currentUser.name} approved recipe draft ${draft.title}`,
    });

    appendRecipeActivity(db, {
      actorId: currentUser.id,
      kitchenId: recipe.kitchenIds?.[0] ?? null,
      action: "recipe_created",
      message: `${currentUser.name} published recipe ${recipe.title} from a draft`,
    });

    touchUser(db, currentUser.id);
    return { draft, recipe };
  });
}

export async function rejectRecipeDraft(draftId, payload = {}) {
  const normalizedDraftId = String(draftId ?? "").trim();

  return withDbUpdate((db) => {
    const currentUser = requireAuth(db);
    const permissions = getUserPermissions(currentUser);

    if (!permissions.includes(PERMISSIONS.APPROVE_RECIPE_DRAFTS)) {
      throw createAppError(403, "You do not have permission to reject recipe drafts.");
    }

    const draft = db.recipeDrafts.find((entry) => entry.id === normalizedDraftId) ?? null;

    if (!draft) {
      throw createAppError(404, "Recipe draft not found.");
    }

    if (draft.status !== "pending") {
      throw createAppError(409, "Only pending drafts can be rejected.");
    }

    const now = new Date().toISOString();

    draft.status = "rejected";
    draft.reviewedBy = currentUser.id;
    draft.updatedAt = now;

    const reason = sanitizeString(payload?.reason);

    appendRecipeActivity(db, {
      actorId: currentUser.id,
      kitchenId: draft.kitchenIds?.[0] ?? null,
      action: "recipe_draft_rejected",
      message: `${currentUser.name} rejected recipe draft ${draft.title}${reason ? ` (${reason})` : ""}`,
    });

    touchUser(db, currentUser.id);
    return { draft };
  });
}
