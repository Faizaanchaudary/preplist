import { PERMISSIONS } from "../../shared/constants/permissions";
import { generateSequentialId } from "../../shared/utils/generateSequentialId";
import { buildKitchenDetailsPayload, buildKitchenManagementPayload } from "./_builders";
import { createAppError, readDb, requireAuth, requirePermission, withDbUpdate, getMockSession, touchUser } from "./_repoHelpers";

function normalizeSiteCode(value) {
  return String(value ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

export async function getKitchens() {
  const db = readDb();
  const currentUser = requireAuth(db);

  return buildKitchenManagementPayload(db, currentUser);
}

export async function getKitchenDetails(kitchenId) {
  const db = readDb();
  const currentUser = requireAuth(db);
  const normalizedKitchenId = String(kitchenId ?? "").trim();

  const payload = buildKitchenDetailsPayload(db, currentUser, normalizedKitchenId);

  if (!payload) {
    throw createAppError(404, "Kitchen not found.");
  }

  return payload;
}

export async function createKitchen(payload) {
  const name = String(payload?.name ?? "").trim();
  const city = String(payload?.city ?? "").trim();
  const siteCode = normalizeSiteCode(payload?.siteCode);

  if (!name || name.length < 2) {
    throw createAppError(400, "Kitchen name must be at least 2 characters.");
  }

  if (!city) {
    throw createAppError(400, "City is required.");
  }

  if (!siteCode || !/^[A-Z0-9-]{2,12}$/.test(siteCode)) {
    throw createAppError(400, "Site code is required (example: DT-01).");
  }

  return withDbUpdate((db) => {
    const currentUser = requireAuth(db);
    requirePermission(currentUser, PERMISSIONS.MANAGE_KITCHENS);

    const session = getMockSession();
    const activeKitchen = session.activeKitchenId
      ? db.kitchens.find((k) => k.id === session.activeKitchenId) ?? null
      : null;

    const companyId =
      (Array.isArray(currentUser.companyIds) && currentUser.companyIds.length === 1
        ? currentUser.companyIds[0]
        : null) ??
      activeKitchen?.companyId ??
      db.companies[0]?.id ??
      null;

    if (!companyId) {
      throw createAppError(400, "Company selection is required for this kitchen.");
    }

    const kitchen = {
      id: generateSequentialId("k", db.kitchens),
      companyId,
      name,
      city,
      siteCode,
      activeListIds: [],
    };

    db.kitchens.push(kitchen);

    const company = db.companies.find((entry) => entry.id === companyId);
    if (company) {
      if (!Array.isArray(company.kitchenIds)) company.kitchenIds = [];
      if (!company.kitchenIds.includes(kitchen.id)) {
        company.kitchenIds.push(kitchen.id);
      }
    }

    if (!Array.isArray(currentUser.accessibleKitchenIds)) {
      currentUser.accessibleKitchenIds = [];
    }

    if (!currentUser.accessibleKitchenIds.includes(kitchen.id)) {
      currentUser.accessibleKitchenIds.push(kitchen.id);
    }

    db.kitchenMemberships.push({
      id: generateSequentialId("m", db.kitchenMemberships),
      kitchenId: kitchen.id,
      userId: currentUser.id,
      joinedViaCode: false,
    });

    touchUser(db, currentUser.id);

    return { kitchen };
  });
}

export async function updateKitchen(kitchenId, payload) {
  const normalizedKitchenId = String(kitchenId ?? "").trim();

  return withDbUpdate((db) => {
    const currentUser = requireAuth(db);
    requirePermission(currentUser, PERMISSIONS.MANAGE_KITCHENS);

    const kitchen = db.kitchens.find((entry) => entry.id === normalizedKitchenId);
    if (!kitchen) {
      throw createAppError(404, "Kitchen not found.");
    }

    if (typeof payload?.name === "string" && payload.name.trim().length >= 2) {
      kitchen.name = payload.name.trim();
    }

    if (typeof payload?.city === "string" && payload.city.trim()) {
      kitchen.city = payload.city.trim();
    }

    if (payload?.siteCode) {
      const nextCode = normalizeSiteCode(payload.siteCode);
      if (!/^[A-Z0-9-]{2,12}$/.test(nextCode)) {
        throw createAppError(400, "Site code is invalid.");
      }
      kitchen.siteCode = nextCode;
    }

    touchUser(db, currentUser.id);
    return { kitchen };
  });
}

export async function deleteKitchen(kitchenId) {
  const normalizedKitchenId = String(kitchenId ?? "").trim();

  return withDbUpdate((db) => {
    const currentUser = requireAuth(db);
    requirePermission(currentUser, PERMISSIONS.MANAGE_KITCHENS);

    const kitchenIndex = db.kitchens.findIndex((entry) => entry.id === normalizedKitchenId);

    if (kitchenIndex === -1) {
      throw createAppError(404, "Kitchen not found.");
    }

    const hasLists = db.lists.some((list) => list.kitchenId === normalizedKitchenId);

    if (hasLists) {
      throw createAppError(
        409,
        "This kitchen has lists and cannot be deleted in mock mode."
      );
    }

    db.kitchens.splice(kitchenIndex, 1);
    db.kitchenSections = db.kitchenSections.filter((s) => s.kitchenId !== normalizedKitchenId);
    db.kitchenMemberships = db.kitchenMemberships.filter(
      (m) => m.kitchenId !== normalizedKitchenId
    );
    db.accessCodes = db.accessCodes.filter((c) => c.kitchenId !== normalizedKitchenId);

    db.companies.forEach((company) => {
      if (!Array.isArray(company.kitchenIds)) return;
      company.kitchenIds = company.kitchenIds.filter((id) => id !== normalizedKitchenId);
    });

    db.users.forEach((user) => {
      if (Array.isArray(user.accessibleKitchenIds)) {
        user.accessibleKitchenIds = user.accessibleKitchenIds.filter(
          (id) => id !== normalizedKitchenId
        );
      }
    });

    touchUser(db, currentUser.id);
    return { deletedKitchenId: normalizedKitchenId };
  });
}

