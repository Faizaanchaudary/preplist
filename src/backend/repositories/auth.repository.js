import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../config/firebase.js";
import { ROLES } from "../../shared/constants/roles";
import { getUserPermissions } from "../../shared/utils/rbac";
import { generateSequentialId } from "../../shared/utils/generateSequentialId";
import {
  readDb,
  withDbUpdate,
  createAppError,
  getMockSession,
  setMockSession,
  clearMockSession,
  getVisibleKitchens,
  touchUser,
  waitForAuthReady,
  setAuthUid,
} from "./_repoContext.js";
import { deriveAuthPasswordFromPin } from "../auth/pinAuthPassword.js";

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function isRoleTestEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  return (
    normalized === "vincent@testa.com" ||
    normalized.startsWith("super@") ||
    normalized.startsWith("admin@") ||
    normalized.startsWith("founder@") ||
    normalized.startsWith("owner@") ||
    normalized.startsWith("exec@") ||
    normalized.startsWith("head@") ||
    normalized.startsWith("sous@") ||
    normalized.startsWith("staff@")
  );
}

function deriveRoleFromEmail(email) {
  const normalized = normalizeEmail(email);

  if (normalized === "vincent@testa.com") return ROLES.SUPER_ADMIN;
  if (normalized.startsWith("super@") || normalized.startsWith("admin@")) {
    return ROLES.SUPER_ADMIN;
  }
  if (normalized.startsWith("founder@") || normalized.startsWith("owner@")) {
    return ROLES.FOUNDER;
  }
  if (normalized.startsWith("exec@")) return ROLES.EXECUTIVE_CHEF;
  if (normalized.startsWith("head@")) return ROLES.HEAD_CHEF;
  if (normalized.startsWith("sous@")) return ROLES.SOUS_CHEF;

  return ROLES.STAFF;
}

function ensureDefaultScopeForRole(db, user) {
  if (!db || !user) return;

  if (!Array.isArray(user.companyIds)) user.companyIds = [];
  if (!Array.isArray(user.accessibleKitchenIds)) user.accessibleKitchenIds = [];
  if (!Array.isArray(user.invitedListIds)) user.invitedListIds = [];
  if (!Array.isArray(user.permissions)) user.permissions = [];

  const companyIds = Array.isArray(db.companies)
    ? db.companies.map((company) => company.id)
    : [];
  const kitchenIds = Array.isArray(db.kitchens)
    ? db.kitchens.map((kitchen) => kitchen.id)
    : [];

  if (user.role === ROLES.SUPER_ADMIN) {
    if (!user.companyIds.length) user.companyIds = companyIds;
    return;
  }

  if (user.role === ROLES.FOUNDER) {
    user.dataOnlyAccess = true;

    if (!user.companyIds.length) user.companyIds = companyIds;
    if (!user.accessibleKitchenIds.length) user.accessibleKitchenIds = kitchenIds;
    return;
  }

  const fallbackCompanyId = companyIds[0] ?? null;
  const fallbackKitchenId = kitchenIds[0] ?? null;

  if (user.role === ROLES.EXECUTIVE_CHEF) {
    if (!user.companyIds.length && fallbackCompanyId) {
      user.companyIds = [fallbackCompanyId];
    }

    if (!user.accessibleKitchenIds.length && user.companyIds.length) {
      const scopedKitchenIds = db.kitchens
        .filter((kitchen) => user.companyIds.includes(kitchen.companyId))
        .map((kitchen) => kitchen.id);

      user.accessibleKitchenIds = scopedKitchenIds.length
        ? scopedKitchenIds
        : fallbackKitchenId
          ? [fallbackKitchenId]
          : [];
    }

    return;
  }

  if (!user.companyIds.length && fallbackCompanyId) {
    user.companyIds = [fallbackCompanyId];
  }

  if (!user.accessibleKitchenIds.length && fallbackKitchenId) {
    user.accessibleKitchenIds = [fallbackKitchenId];
  }

  if (user.role === ROLES.STAFF && !user.invitedListIds.length && fallbackKitchenId) {
    const list = db.lists.find((entry) => entry.kitchenId === fallbackKitchenId) ?? null;

    if (list?.id) {
      user.invitedListIds = [list.id];
      ensureSectionStateForKitchen(user, fallbackKitchenId, list.section ?? null);
    }
  }
}

function findUserByEmail(db, email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  return (
    db.users.find((user) => normalizeEmail(user.email) === normalized) ??
    db.users.find((user) => user.id === getMockSession().userId) ??
    null
  );
}

function findUserByAuthContext(db, email) {
  const session = getMockSession();
  const authUid = auth.currentUser?.uid ?? session.userId;

  if (authUid) {
    const byId = db.users.find((user) => user.id === authUid);
    if (byId) return byId;
  }

  return findUserByEmail(db, email);
}

function ensureSectionStateForKitchen(user, kitchenId, preferredSection = null) {
  if (!user || !kitchenId) return;

  if (!user.assignedSectionsByKitchen) {
    user.assignedSectionsByKitchen = {};
  }

  if (!user.workingSectionByKitchen) {
    user.workingSectionByKitchen = {};
  }

  const assigned = Array.isArray(user.assignedSectionsByKitchen[kitchenId])
    ? user.assignedSectionsByKitchen[kitchenId]
    : [];

  const nextAssigned = new Set(assigned);
  if (preferredSection) nextAssigned.add(preferredSection);

  user.assignedSectionsByKitchen[kitchenId] = Array.from(nextAssigned);

  if (!user.workingSectionByKitchen[kitchenId]) {
    user.workingSectionByKitchen[kitchenId] =
      preferredSection ?? user.assignedSectionsByKitchen[kitchenId][0] ?? null;
  }
}

function buildAuthPayload(db, user) {
  const visibleKitchens = user ? getVisibleKitchens(db, user) : [];
  const visibleKitchenIds = new Set(visibleKitchens.map((kitchen) => kitchen.id));

  const session = getMockSession();
  const sessionKitchenId = session.activeKitchenId;

  const safeActiveKitchenId =
    sessionKitchenId && visibleKitchenIds.has(sessionKitchenId)
      ? sessionKitchenId
      : visibleKitchens.length === 1
        ? visibleKitchens[0].id
        : null;

  if (safeActiveKitchenId !== sessionKitchenId) {
    setMockSession({
      userId: session.userId,
      activeKitchenId: safeActiveKitchenId,
    });
  }

  return {
    currentUser: user,
    permissions: user ? getUserPermissions(user) : [],
    activeKitchenId: safeActiveKitchenId,
    accessibleKitchens: visibleKitchens.map((kitchen) => ({
      id: kitchen.id,
      name: kitchen.name,
      city: kitchen.city,
      siteCode: kitchen.siteCode,
      companyId: kitchen.companyId ?? null,
    })),
  };
}

function setSessionForUser(user) {
  const accessibleKitchenIds = Array.isArray(user?.accessibleKitchenIds)
    ? user.accessibleKitchenIds
    : [];

  setMockSession({
    userId: user.id,
    activeKitchenId: accessibleKitchenIds.length === 1 ? accessibleKitchenIds[0] : null,
  });
}

export async function getCurrentSession() {
  await waitForAuthReady();

  if (!auth.currentUser) {
    throw createAppError(401, "Not authenticated.");
  }

  const db = await readDb();
  const user =
    db.users.find((entry) => entry.id === auth.currentUser.uid) ??
    db.users.find(
      (entry) => normalizeEmail(entry.email) === normalizeEmail(auth.currentUser.email)
    ) ??
    null;

  if (!user) {
    await clearMockSession();
    throw createAppError(401, "Not authenticated.");
  }

  setAuthUid(user.id);

  const remoteSession = getMockSession();
  if (!remoteSession.userId) {
    setMockSession({ userId: user.id, activeKitchenId: null });
  }

  return buildAuthPayload(db, user);
}

export async function login({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password ?? "");

  if (!normalizedEmail) {
    throw createAppError(400, "Email is required.");
  }

  if (!normalizedPassword) {
    throw createAppError(400, "Password is required.");
  }

  const credential = await signInWithEmailAndPassword(
    auth,
    normalizedEmail,
    normalizedPassword
  );

  setAuthUid(credential.user.uid);

  await withDbUpdate((db) => {
    let user = findUserByAuthContext(db, normalizedEmail);

    if (!user) {
      throw createAppError(401, "User profile not found.");
    }

    if (user.id !== credential.user.uid) {
      user.id = credential.user.uid;
    }

    touchUser(db, user.id);
    setSessionForUser(user);
  });

  return getCurrentSession();
}

export async function pinLogin({ email, pin }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPin = String(pin ?? "").trim();

  if (!normalizedEmail) {
    throw createAppError(400, "Email is required.");
  }

  if (!normalizedPin) {
    throw createAppError(400, "PIN is required.");
  }

  const session = await login({
    email: normalizedEmail,
    password: deriveAuthPasswordFromPin(normalizedPin),
  });
  const storedPin = String(session?.currentUser?.tempPin ?? "").trim();

  if (storedPin && storedPin !== normalizedPin) {
    await logout();
    throw createAppError(401, "Invalid email or PIN.");
  }

  return session;
}

export async function selectKitchen({ kitchenId }) {
  const normalizedKitchenId = String(kitchenId ?? "").trim();

  if (!normalizedKitchenId) {
    throw createAppError(400, "Kitchen selection is required.");
  }

  await withDbUpdate((db) => {
    const user = db.users.find((entry) => entry.id === getMockSession().userId) ?? null;
    if (!user) {
      throw createAppError(401, "Not authenticated.");
    }

    const visibleKitchenIds = new Set(getVisibleKitchens(db, user).map((k) => k.id));

    if (!visibleKitchenIds.has(normalizedKitchenId)) {
      throw createAppError(403, "You do not have access to this kitchen.");
    }

    const session = getMockSession();
    setMockSession({
      userId: session.userId,
      activeKitchenId: normalizedKitchenId,
    });
  });

  return getCurrentSession();
}

export async function logout() {
  clearMockSession();
  if (auth.currentUser) {
    await signOut(auth);
  }
  return null;
}

export async function joinByCode({ email, code }) {
  const normalizedCode = String(code ?? "").trim().toUpperCase();
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedCode) {
    throw createAppError(400, "Access code is required.");
  }

  if (!/^[A-Z0-9]{4,12}$/.test(normalizedCode)) {
    throw createAppError(400, "Access code format is invalid.");
  }

  const nowIso = new Date().toISOString();

  const result = await withDbUpdate((db) => {
    let actor = db.users.find((entry) => entry.id === getMockSession().userId) ?? null;

    if (!actor) {
      if (!normalizedEmail) {
        throw createAppError(400, "Email is required to join via access code.");
      }

      const isTestEmail = isRoleTestEmail(normalizedEmail);
      actor = findUserByEmail(db, normalizedEmail);

      if (!actor) {
        const derivedRole = deriveRoleFromEmail(normalizedEmail);

        actor = {
          id: generateSequentialId("u", db.users),
          name: normalizedEmail.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "User",
          email: normalizedEmail,
          role: derivedRole,
          roleSource: isTestEmail ? "email" : "default",
          companyIds: [],
          accessibleKitchenIds: [],
          invitedListIds: [],
          permissions: [],
          assignedSectionsByKitchen: {},
          workingSectionByKitchen: {},
          lastActiveAt: nowIso,
        };

        db.users.push(actor);
      } else if (isTestEmail && actor.roleSource !== "manual") {
        const derivedRole = deriveRoleFromEmail(normalizedEmail);
        if (!actor.roleSource) actor.roleSource = "email";
        if (actor.role !== derivedRole) actor.role = derivedRole;
      }

      if (isTestEmail && actor.roleSource !== "manual") {
        ensureDefaultScopeForRole(db, actor);
      }

      setSessionForUser(actor);
    }

    const accessCode = db.accessCodes.find(
      (entry) =>
        typeof entry?.code === "string" && entry.code.toUpperCase() === normalizedCode
    );

    if (!accessCode) {
      throw createAppError(404, "Access code is invalid.");
    }

    if (accessCode.expiresAt) {
      const expiresAt = new Date(accessCode.expiresAt).getTime();

      if (!Number.isNaN(expiresAt) && expiresAt < Date.now()) {
        throw createAppError(410, "Access code has expired.");
      }
    }

    const kitchenId = typeof accessCode.kitchenId === "string" ? accessCode.kitchenId : "";
    const listId = typeof accessCode.listId === "string" ? accessCode.listId : "";

    const kitchen = db.kitchens.find((entry) => entry.id === kitchenId) ?? null;

    if (!kitchen) {
      throw createAppError(404, "Kitchen not found for this access code.");
    }

    const list = listId ? db.lists.find((entry) => entry.id === listId) ?? null : null;

    if (listId && !list) {
      throw createAppError(404, "List not found for this access code.");
    }

    const invitedListIds = Array.isArray(actor.invitedListIds) ? actor.invitedListIds : [];

    if (list?.id && invitedListIds.includes(list.id)) {
      throw createAppError(409, "You already have access to this list.");
    }

    if (!Array.isArray(actor.accessibleKitchenIds)) {
      actor.accessibleKitchenIds = [];
    }

    if (!actor.accessibleKitchenIds.includes(kitchen.id)) {
      actor.accessibleKitchenIds.push(kitchen.id);
    }

    if (!Array.isArray(actor.invitedListIds)) {
      actor.invitedListIds = [];
    }

    if (list?.id && !actor.invitedListIds.includes(list.id)) {
      actor.invitedListIds.push(list.id);
    }

    if (kitchen.companyId) {
      if (!Array.isArray(actor.companyIds)) actor.companyIds = [];
      if (!actor.companyIds.includes(kitchen.companyId)) {
        actor.companyIds.push(kitchen.companyId);
      }
    }

    ensureSectionStateForKitchen(actor, kitchen.id, list?.section ?? null);

    const existingMembership = db.kitchenMemberships.find(
      (membership) => membership.kitchenId === kitchen.id && membership.userId === actor.id
    );

    if (existingMembership) {
      existingMembership.joinedViaCode = true;
    } else {
      db.kitchenMemberships.push({
        id: generateSequentialId("m", db.kitchenMemberships),
        kitchenId: kitchen.id,
        userId: actor.id,
        joinedViaCode: true,
      });
    }

    const joinedTargetLabel = list?.title ?? kitchen.name;

    db.activityLogs.unshift({
      id: generateSequentialId("al", db.activityLogs),
      kitchenId: kitchen.id,
      listId: list?.id ?? null,
      actorId: actor.id,
      action: "joined_via_code",
      message: `${actor.name} joined ${joinedTargetLabel} via access code`,
      createdAt: nowIso,
    });

    touchUser(db, actor.id, new Date(nowIso));

    const payload = buildAuthPayload(db, actor);

    return {
      payload,
      kitchen: { id: kitchen.id, name: kitchen.name },
      list: list ? { id: list.id, title: list.title } : null,
    };
  });

  return {
    ...result.payload,
    kitchen: result.kitchen,
    list: result.list,
  };
}
