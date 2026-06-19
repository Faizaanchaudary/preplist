import { PERMISSIONS } from "../../shared/constants/permissions";
import { ROLES } from "../../shared/constants/roles";
import { formatRoleLabel } from "../../shared/utils/deriveRolePermissions";
import { getUserPermissions } from "../../shared/utils/rbac";
import { generateSequentialId } from "../../shared/utils/generateSequentialId";
import {
  createAppError,
  readDb,
  requireAuth,
  touchUser,
  withDbUpdate,
} from "./_repoContext.js";
import {
  assignUserRole as assignUserRoleInOrg,
  updateUserAccess as updateUserAccessInOrg,
} from "./organization.repository.js";
import { normalizePin } from "../auth/pinAuthPassword.js";
import {
  deleteUserAuthCredentials,
  syncUserAuthCredentials,
  syncUserAuthProfile,
} from "../auth/syncUserAuth.js";

function requireUsersModuleAccess(currentUser) {
  const permissions = getUserPermissions(currentUser);

  const canViewUsers =
    permissions.includes(PERMISSIONS.MANAGE_USERS) ||
    permissions.includes(PERMISSIONS.MANAGE_COMPANY_USERS) ||
    permissions.includes(PERMISSIONS.MANAGE_RESTAURANT_USERS) ||
    permissions.includes(PERMISSIONS.ASSIGN_STAFF_ACCESS);

  if (!canViewUsers) {
    throw createAppError(403, "You do not have permission to view users.");
  }
}

const USER_STATUSES = ["active", "invited", "disabled"];

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function formatStatusLabel(status) {
  if (status === "active") return "Active";
  if (status === "invited") return "Invited";
  if (status === "disabled") return "Disabled";
  return "Unknown";
}

function getAllowedRoleValuesForActor(actor) {
  if (!actor) return [ROLES.STAFF];

  if (actor.role === ROLES.SUPER_ADMIN) {
    return Object.values(ROLES);
  }

  if (actor.role === ROLES.FOUNDER) {
    return [ROLES.EXECUTIVE_CHEF, ROLES.HEAD_CHEF, ROLES.SOUS_CHEF, ROLES.STAFF];
  }

  if (actor.role === ROLES.EXECUTIVE_CHEF) {
    return [ROLES.HEAD_CHEF, ROLES.SOUS_CHEF, ROLES.STAFF];
  }

  const kitchenScopedRoles = new Set([ROLES.HEAD_CHEF, ROLES.SOUS_CHEF]);
  if (kitchenScopedRoles.has(actor.role)) {
    return [ROLES.STAFF];
  }

  return [ROLES.STAFF];
}

function requireUserWriteAccess(actor) {
  const permissions = getUserPermissions(actor);

  const canWrite =
    permissions.includes(PERMISSIONS.MANAGE_USERS) ||
    permissions.includes(PERMISSIONS.MANAGE_COMPANY_USERS) ||
    permissions.includes(PERMISSIONS.MANAGE_RESTAURANT_USERS) ||
    permissions.includes(PERMISSIONS.ASSIGN_STAFF_ACCESS) ||
    permissions.includes(PERMISSIONS.ASSIGN_CHEF_ROLES) ||
    permissions.includes(PERMISSIONS.ASSIGN_ANY_ROLE);

  if (!canWrite) {
    throw createAppError(403, "You do not have permission to manage users.");
  }
}

function resolveVisibleCompanies(db, currentUser) {
  const permissions = getUserPermissions(currentUser);

  if (
    currentUser.role === ROLES.SUPER_ADMIN ||
    permissions.includes(PERMISSIONS.VIEW_ALL_COMPANIES)
  ) {
    return db.companies;
  }

  const assignedCompanyIds = Array.isArray(currentUser.companyIds)
    ? currentUser.companyIds
    : [];

  const kitchenScopedRoles = new Set([ROLES.HEAD_CHEF, ROLES.SOUS_CHEF]);

  if (kitchenScopedRoles.has(currentUser.role)) {
    const accessibleKitchenIds = Array.isArray(currentUser.accessibleKitchenIds)
      ? currentUser.accessibleKitchenIds
      : [];

    const kitchenCompanyIds = new Set(
      db.kitchens
        .filter((kitchen) => accessibleKitchenIds.includes(kitchen.id))
        .map((kitchen) => kitchen.companyId)
        .filter(Boolean)
    );

    return db.companies.filter((company) => kitchenCompanyIds.has(company.id));
  }

  return db.companies.filter((company) => assignedCompanyIds.includes(company.id));
}

function resolveVisibleKitchens(db, currentUser, visibleCompanies) {
  const permissions = getUserPermissions(currentUser);

  if (
    currentUser.role === ROLES.SUPER_ADMIN ||
    permissions.includes(PERMISSIONS.VIEW_ALL_KITCHENS)
  ) {
    return db.kitchens;
  }

  const kitchenScopedRoles = new Set([ROLES.HEAD_CHEF, ROLES.SOUS_CHEF]);

  if (kitchenScopedRoles.has(currentUser.role)) {
    const accessibleKitchenIds = Array.isArray(currentUser.accessibleKitchenIds)
      ? currentUser.accessibleKitchenIds
      : [];

    return db.kitchens.filter((kitchen) => accessibleKitchenIds.includes(kitchen.id));
  }

  const visibleCompanyIds = new Set(visibleCompanies.map((company) => company.id));
  return db.kitchens.filter((kitchen) => visibleCompanyIds.has(kitchen.companyId));
}

function resolveVisibleUsers(db, currentUser, visibleCompanies, visibleKitchens) {
  if (currentUser.role === ROLES.SUPER_ADMIN) return db.users;

  const kitchenScopedRoles = new Set([ROLES.HEAD_CHEF, ROLES.SOUS_CHEF]);

  if (kitchenScopedRoles.has(currentUser.role)) {
    const visibleKitchenIds = new Set(visibleKitchens.map((kitchen) => kitchen.id));

    const userIdsFromMemberships = new Set(
      db.kitchenMemberships
        .filter((membership) => visibleKitchenIds.has(membership.kitchenId))
        .map((membership) => membership.userId)
    );

    return db.users.filter((user) => {
      if (user.role !== ROLES.STAFF) return false;

      const hasMembership = userIdsFromMemberships.has(user.id);

      const hasAccessibleKitchen = Array.isArray(user.accessibleKitchenIds)
        ? user.accessibleKitchenIds.some((id) => visibleKitchenIds.has(id))
        : false;

      return hasMembership || hasAccessibleKitchen;
    });
  }

  const visibleCompanyIds = new Set(visibleCompanies.map((company) => company.id));
  const visibleKitchenIds = new Set(visibleKitchens.map((kitchen) => kitchen.id));

  return db.users.filter((user) => {
    const hasCompany =
      Array.isArray(user.companyIds) &&
      user.companyIds.some((id) => visibleCompanyIds.has(id));

    const hasKitchen =
      Array.isArray(user.accessibleKitchenIds) &&
      user.accessibleKitchenIds.some((id) => visibleKitchenIds.has(id));

    return hasCompany || hasKitchen;
  });
}

function buildKitchenOptions(visibleKitchens) {
  return (Array.isArray(visibleKitchens) ? visibleKitchens : [])
    .map((kitchen) => ({
      value: kitchen.id,
      label: kitchen.siteCode ? `${kitchen.name} (${kitchen.siteCode})` : kitchen.name,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function buildUserStats(db, visibleCompanies, visibleKitchens, visibleUsers) {
  const users = Array.isArray(visibleUsers) ? visibleUsers : [];

  const visibleKitchenIds = new Set(
    (Array.isArray(visibleKitchens) ? visibleKitchens : []).map((kitchen) => kitchen.id)
  );

  const codeJoins = db.kitchenMemberships.filter(
    (membership) => membership.joinedViaCode && visibleKitchenIds.has(membership.kitchenId)
  ).length;

  const activeUsers = users.filter(
    (user) => String(user?.status ?? "active").toLowerCase() === "active"
  ).length;

  const chefRoles = new Set([ROLES.EXECUTIVE_CHEF, ROLES.HEAD_CHEF, ROLES.SOUS_CHEF]);
  const chefs = users.filter((user) => chefRoles.has(user.role)).length;

  const staff = users.filter((user) => user.role === ROLES.STAFF).length;

  return [
    {
      label: "Total Users",
      value: users.length,
      helper: "Visible users in your scope",
    },
    {
      label: "Active Users",
      value: activeUsers,
      helper: "Active accounts",
    },
    {
      label: "Chefs",
      value: chefs,
      helper: "Executive, head, and sous",
    },
    {
      label: "Staff",
      value: staff,
      helper: "Staff operators",
    },
    {
      label: "Joined via Code",
      value: codeJoins,
      helper: "Membership joins via code",
    },
  ];
}

function buildUserRows(db, visibleCompanies, visibleKitchens, visibleUsers) {
  const companiesById = new Map(
    (Array.isArray(visibleCompanies) ? visibleCompanies : []).map((company) => [
      company.id,
      company,
    ])
  );

  const kitchensById = new Map(
    (Array.isArray(db.kitchens) ? db.kitchens : []).map((kitchen) => [kitchen.id, kitchen])
  );

  const visibleKitchenIds = new Set(
    (Array.isArray(visibleKitchens) ? visibleKitchens : []).map((kitchen) => kitchen.id)
  );

  return (Array.isArray(visibleUsers) ? visibleUsers : [])
    .map((user) => {
      const companyIds = (Array.isArray(user.companyIds) ? user.companyIds : [])
        .filter((id) => companiesById.has(id));

      const companyNames = companyIds.map((id) => companiesById.get(id)?.name)
        .filter(Boolean);

      const kitchens = (Array.isArray(user.accessibleKitchenIds) ? user.accessibleKitchenIds : [])
        .filter((id) => visibleKitchenIds.has(id))
        .map((id) => kitchensById.get(id))
        .filter(Boolean);

      const joinedViaCode = db.kitchenMemberships.some(
        (membership) =>
          membership.userId === user.id &&
          membership.joinedViaCode &&
          visibleKitchenIds.has(membership.kitchenId)
      );

      const primaryKitchen = kitchens[0] ?? null;

      const accessScope =
        user.role === ROLES.EXECUTIVE_CHEF
          ? "Company-wide"
          : kitchens.length > 1
            ? `${kitchens.length} kitchens`
            : primaryKitchen
              ? primaryKitchen.name
              : "\u2014";

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: formatRoleLabel(user.role),
        rawRole: user.role,
        status: formatStatusLabel(String(user?.status ?? "active").toLowerCase()),
        rawStatus: String(user?.status ?? "active").toLowerCase(),
        companyIds,
        company: companyNames.join(", ") || "\u2014",
        kitchen: primaryKitchen?.name ?? "\u2014",
        accessScope,
        joinedViaCode,
        createdAt: user.createdAt ?? user.lastActiveAt ?? null,
        lastActiveAt: user.lastActiveAt ?? null,
        accessibleKitchenIds: kitchens.map((kitchen) => kitchen.id),
        invitedListIds: Array.isArray(user.invitedListIds) ? user.invitedListIds : [],
        permissions: Array.isArray(user.permissions) ? user.permissions : [],
        assignedSectionsByKitchen:
          user && typeof user.assignedSectionsByKitchen === "object"
            ? user.assignedSectionsByKitchen
            : {},
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getUsers(filters = {}) {
  const db = await readDb();
  const currentUser = requireAuth(db);

  requireUsersModuleAccess(currentUser);

  const visibleCompanies = resolveVisibleCompanies(db, currentUser);
  const visibleKitchens = resolveVisibleKitchens(db, currentUser, visibleCompanies);
  const visibleUsers = resolveVisibleUsers(db, currentUser, visibleCompanies, visibleKitchens);

  const companyId = typeof filters.companyId === "string" ? filters.companyId : "all";
  const search = typeof filters.search === "string" ? filters.search.trim().toLowerCase() : "";
  const role = typeof filters.role === "string" ? filters.role : "all";
  const status = typeof filters.status === "string" ? filters.status : "all";
  const kitchenId = typeof filters.kitchenId === "string" ? filters.kitchenId : "all";
  const joinedViaCodeFilter =
    typeof filters.joinedViaCode === "string" ? filters.joinedViaCode : "all";

  const createdFrom = typeof filters.createdFrom === "string" ? filters.createdFrom : "";
  const createdTo = typeof filters.createdTo === "string" ? filters.createdTo : "";

  const createdFromTime = createdFrom
    ? (() => {
        const date = new Date(createdFrom);
        if (Number.isNaN(date.getTime())) return null;
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })()
    : null;

  const createdToTime = createdTo
    ? (() => {
        const date = new Date(createdTo);
        if (Number.isNaN(date.getTime())) return null;
        date.setHours(23, 59, 59, 999);
        return date.getTime();
      })()
    : null;

  const rows = buildUserRows(db, visibleCompanies, visibleKitchens, visibleUsers).filter(
    (row) => {
      const matchesCompany =
        companyId === "all"
          ? true
          : Array.isArray(row?.companyIds)
            ? row.companyIds.includes(companyId)
            : false;

      const matchesKitchen =
        kitchenId === "all"
          ? true
          : Array.isArray(row?.accessibleKitchenIds)
            ? row.accessibleKitchenIds.includes(kitchenId)
            : false;

      const matchesRole = role === "all" ? true : row.rawRole === role;

      const matchesStatus = status === "all" ? true : row.rawStatus === status;

      const matchesJoinedViaCode =
        joinedViaCodeFilter === "all"
          ? true
          : joinedViaCodeFilter === "yes"
            ? Boolean(row.joinedViaCode)
            : joinedViaCodeFilter === "no"
              ? !row.joinedViaCode
              : true;

      const matchesSearch = search
        ? [row.name, row.email].some((value) =>
            String(value).toLowerCase().includes(search)
          )
        : true;

      const createdAtTime = row.createdAt ? new Date(row.createdAt).getTime() : null;

      const matchesCreatedFrom =
        createdFromTime === null
          ? true
          : createdAtTime !== null
            ? createdAtTime >= createdFromTime
            : false;

      const matchesCreatedTo =
        createdToTime === null
          ? true
          : createdAtTime !== null
            ? createdAtTime <= createdToTime
            : false;

      return (
        matchesCompany &&
        matchesKitchen &&
        matchesRole &&
        matchesStatus &&
        matchesJoinedViaCode &&
        matchesSearch &&
        matchesCreatedFrom &&
        matchesCreatedTo
      );
    }
  );

  const kitchenOptions = buildKitchenOptions(visibleKitchens);

  const visibleKitchenIds = new Set(visibleKitchens.map((kitchen) => kitchen.id));

  const kitchens = visibleKitchens.map((kitchen) => ({
    id: kitchen.id,
    name: kitchen.name,
    companyId: kitchen.companyId ?? null,
    siteCode: kitchen.siteCode ?? null,
  }));

  const lists = db.lists
    .filter((list) => visibleKitchenIds.has(list.kitchenId))
    .map((list) => ({
      id: list.id,
      title: list.title,
      kitchenId: list.kitchenId,
      section: list.section ?? null,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  const sectionsByKitchenId = kitchens.reduce((accumulator, kitchen) => {
    const kitchenSections = Array.isArray(db.kitchenSections) ? db.kitchenSections : [];

    accumulator[kitchen.id] = kitchenSections
      .filter((section) => section.kitchenId === kitchen.id)
      .map((section) => section.name)
      .filter(Boolean);

    return accumulator;
  }, {});

  return {
    companies: visibleCompanies.map((company) => ({ id: company.id, name: company.name })),
    kitchenOptions,
    kitchens,
    lists,
    sectionsByKitchenId,
    stats: buildUserStats(db, visibleCompanies, visibleKitchens, visibleUsers),
    rows,
  };
}

export async function assignUserRole(userId, payload) {
  const db = await readDb();
  const currentUser = requireAuth(db);
  requireUsersModuleAccess(currentUser);

  return assignUserRoleInOrg(userId, payload);
}

export async function updateUserAccess(userId, payload) {
  const db = await readDb();
  const currentUser = requireAuth(db);
  requireUsersModuleAccess(currentUser);

  return updateUserAccessInOrg(userId, payload);
}

function normalizeIdArray(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}

function findUserByEmail(db, email, excludeUserId = null) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  return (
    db.users.find((user) => {
      if (excludeUserId && user.id === excludeUserId) return false;
      return normalizeEmail(user.email) === normalizedEmail;
    }) ?? null
  );
}

function normalizeAssignedSectionsByKitchen(value) {
  if (!value || typeof value !== "object") return {};

  return Object.entries(value).reduce((accumulator, [kitchenId, sections]) => {
    if (!kitchenId) return accumulator;
    const normalizedKitchenId = String(kitchenId).trim();
    if (!normalizedKitchenId) return accumulator;

    accumulator[normalizedKitchenId] = Array.isArray(sections)
      ? sections.map((item) => String(item).trim()).filter(Boolean)
      : [];

    return accumulator;
  }, {});
}

function requireTargetWithinScope(db, actor, targetUser) {
  if (!actor || !targetUser) return;

  if (actor.role === ROLES.SUPER_ADMIN) return;

  const visibleCompanies = resolveVisibleCompanies(db, actor);
  const visibleKitchens = resolveVisibleKitchens(db, actor, visibleCompanies);
  const visibleUsers = resolveVisibleUsers(db, actor, visibleCompanies, visibleKitchens);

  const isVisible = visibleUsers.some((user) => user.id === targetUser.id);

  if (!isVisible) {
    throw createAppError(403, "You do not have access to manage this user.");
  }

  const kitchenScopedRoles = new Set([ROLES.HEAD_CHEF, ROLES.SOUS_CHEF]);
  if (kitchenScopedRoles.has(actor.role) && targetUser.role !== ROLES.STAFF) {
    throw createAppError(403, "Kitchen-scoped roles can only manage staff users.");
  }
}

function resolveEditableKitchenIds(db, visibleKitchens, companyId, kitchenIds) {
  const visibleKitchenIds = new Set(
    (Array.isArray(visibleKitchens) ? visibleKitchens : []).map((kitchen) => kitchen.id)
  );

  const kitchensById = new Map(
    (Array.isArray(db.kitchens) ? db.kitchens : []).map((kitchen) => [kitchen.id, kitchen])
  );

  const normalizedCompanyId = typeof companyId === "string" ? companyId.trim() : "";

  return normalizeIdArray(kitchenIds).filter((kitchenId) => {
    if (!visibleKitchenIds.has(kitchenId)) return false;
    if (!normalizedCompanyId) return true;

    const kitchen = kitchensById.get(kitchenId);
    return kitchen?.companyId === normalizedCompanyId;
  });
}

function resolveEditableListIds(db, visibleKitchenIds, listIds) {
  const validLists = Array.isArray(db.lists) ? db.lists : [];
  const allowedListIds = new Set(
    validLists
      .filter((list) => visibleKitchenIds.has(list.kitchenId))
      .map((list) => list.id)
  );

  return normalizeIdArray(listIds).filter((id) => allowedListIds.has(id));
}

function syncKitchenMemberships(db, userId, kitchenIds, joinedViaCode = false) {
  if (!Array.isArray(db.kitchenMemberships)) {
    db.kitchenMemberships = [];
  }

  const nextKitchenIdSet = new Set(kitchenIds);

  db.kitchenMemberships = db.kitchenMemberships.filter((membership) => {
    if (membership.userId !== userId) return true;
    return nextKitchenIdSet.has(membership.kitchenId);
  });

  kitchenIds.forEach((kitchenId) => {
    const exists = db.kitchenMemberships.some(
      (membership) => membership.userId === userId && membership.kitchenId === kitchenId
    );

    if (exists) return;

    db.kitchenMemberships.push({
      id: generateSequentialId("m", db.kitchenMemberships),
      kitchenId,
      userId,
      joinedViaCode: Boolean(joinedViaCode),
    });
  });
}

export async function createUser(payload) {
  const result = await withDbUpdate((db) => {
    const actor = requireAuth(db);
    requireUsersModuleAccess(actor);
    requireUserWriteAccess(actor);

    const name = typeof payload?.name === "string" ? payload.name.trim() : "";
    const email = normalizeEmail(payload?.email);

    if (!name) {
      throw createAppError(400, "Name is required.");
    }

    if (!email) {
      throw createAppError(400, "Email is required.");
    }

    if (findUserByEmail(db, email)) {
      throw createAppError(409, "A user with this email already exists.");
    }

    const visibleCompanies = resolveVisibleCompanies(db, actor);
    const visibleKitchens = resolveVisibleKitchens(db, actor, visibleCompanies);

    const companyId = typeof payload?.companyId === "string" ? payload.companyId.trim() : "";
    const company = visibleCompanies.find((entry) => entry.id === companyId) ?? null;

    if (!company) {
      throw createAppError(400, "Company selection is required.");
    }

    const requestedRole = typeof payload?.role === "string" ? payload.role.trim() : "";
    const allowedRoles = new Set(getAllowedRoleValuesForActor(actor));

    if (requestedRole && !allowedRoles.has(requestedRole)) {
      throw createAppError(403, "You do not have permission to assign this role.");
    }

    const role = requestedRole && allowedRoles.has(requestedRole) ? requestedRole : ROLES.STAFF;

    const requestedStatus =
      typeof payload?.status === "string" ? payload.status.trim().toLowerCase() : "invited";
    const status = USER_STATUSES.includes(requestedStatus) ? requestedStatus : "invited";

    const kitchenIds = resolveEditableKitchenIds(
      db,
      visibleKitchens,
      companyId,
      payload?.accessibleKitchenIds
    );

    const roleRequiresKitchen = new Set([ROLES.HEAD_CHEF, ROLES.SOUS_CHEF, ROLES.STAFF]);

    if (roleRequiresKitchen.has(role) && !kitchenIds.length) {
      throw createAppError(400, "At least one restaurant/kitchen is required for this role.");
    }

    const editableKitchenIds = new Set(kitchenIds);

    const invitedListIds = resolveEditableListIds(db, editableKitchenIds, payload?.invitedListIds);

    const assignedSectionsByKitchen = normalizeAssignedSectionsByKitchen(
      payload?.assignedSectionsByKitchen
    );

    const nowIso = new Date().toISOString();

    const user = {
      id: generateSequentialId("u", db.users),
      name,
      email,
      role,
      roleSource: "manual",
      status,
      createdAt: nowIso,
      companyIds: [companyId],
      accessibleKitchenIds: kitchenIds,
      invitedListIds,
      permissions: [],
      assignedSectionsByKitchen,
      workingSectionByKitchen: Object.entries(assignedSectionsByKitchen).reduce(
        (accumulator, [kitchenId, sections]) => {
          accumulator[kitchenId] = Array.isArray(sections) ? sections[0] ?? null : null;
          return accumulator;
        },
        {}
      ),
      lastActiveAt: status === "active" ? nowIso : null,
      tempPin: typeof payload?.tempPin === "string" ? payload.tempPin.trim() : "",
      inviteNote: typeof payload?.inviteNote === "string" ? payload.inviteNote.trim() : "",
      updatedAt: nowIso,
    };

    db.users.push(user);
    syncKitchenMemberships(db, user.id, kitchenIds, false);

    touchUser(db, actor.id);
    return { user };
  });

  await syncUserAuthCredentials(result.user);
  return result;
}

export async function updateUser(userId, payload) {
  const normalizedUserId = String(userId ?? "").trim();

  if (!normalizedUserId) {
    throw createAppError(400, "User id is required.");
  }

  const result = await withDbUpdate((db) => {
    const actor = requireAuth(db);
    requireUsersModuleAccess(actor);
    requireUserWriteAccess(actor);

    const targetUser = db.users.find((entry) => entry.id === normalizedUserId) ?? null;
    if (!targetUser) {
      throw createAppError(404, "User not found.");
    }

    requireTargetWithinScope(db, actor, targetUser);

    const name = typeof payload?.name === "string" ? payload.name.trim() : "";
    const email = normalizeEmail(payload?.email);

    if (!name) {
      throw createAppError(400, "Name is required.");
    }

    if (!email) {
      throw createAppError(400, "Email is required.");
    }

    if (findUserByEmail(db, email, targetUser.id)) {
      throw createAppError(409, "A user with this email already exists.");
    }

    const visibleCompanies = resolveVisibleCompanies(db, actor);
    const visibleKitchens = resolveVisibleKitchens(db, actor, visibleCompanies);

    const companyId = typeof payload?.companyId === "string" ? payload.companyId.trim() : "";
    const company = visibleCompanies.find((entry) => entry.id === companyId) ?? null;

    if (!company) {
      throw createAppError(400, "Company selection is required.");
    }

    const requestedRole = typeof payload?.role === "string" ? payload.role.trim() : "";

    if (requestedRole && requestedRole !== targetUser.role) {
      const allowedRoles = new Set(getAllowedRoleValuesForActor(actor));
      if (!allowedRoles.has(requestedRole)) {
        throw createAppError(403, "You do not have permission to assign this role.");
      }

      targetUser.role = requestedRole;
      targetUser.roleSource = "manual";
    }

    const requestedStatus =
      typeof payload?.status === "string" ? payload.status.trim().toLowerCase() : "";

    if (requestedStatus) {
      targetUser.status = USER_STATUSES.includes(requestedStatus) ? requestedStatus : "active";
    }

    const kitchenIds = resolveEditableKitchenIds(
      db,
      visibleKitchens,
      companyId,
      payload?.accessibleKitchenIds
    );

    const roleRequiresKitchen = new Set([ROLES.HEAD_CHEF, ROLES.SOUS_CHEF, ROLES.STAFF]);

    if (roleRequiresKitchen.has(targetUser.role) && !kitchenIds.length) {
      throw createAppError(400, "At least one restaurant/kitchen is required for this role.");
    }

    const editableKitchenIds = new Set(kitchenIds);

    targetUser.name = name;
    targetUser.email = email;
    targetUser.companyIds = [companyId];
    targetUser.accessibleKitchenIds = kitchenIds;
    targetUser.invitedListIds = resolveEditableListIds(
      db,
      editableKitchenIds,
      payload?.invitedListIds
    );

    targetUser.assignedSectionsByKitchen = normalizeAssignedSectionsByKitchen(
      payload?.assignedSectionsByKitchen
    );

    if (!targetUser.workingSectionByKitchen) {
      targetUser.workingSectionByKitchen = {};
    }

    Object.entries(targetUser.assignedSectionsByKitchen).forEach(([kitchenId, sections]) => {
      if (!targetUser.workingSectionByKitchen[kitchenId]) {
        targetUser.workingSectionByKitchen[kitchenId] = Array.isArray(sections)
          ? sections[0] ?? null
          : null;
      }
    });

    targetUser.tempPin = typeof payload?.tempPin === "string" ? payload.tempPin.trim() : "";
    targetUser.inviteNote = typeof payload?.inviteNote === "string" ? payload.inviteNote.trim() : "";
    targetUser.updatedAt = new Date().toISOString();

    syncKitchenMemberships(db, targetUser.id, kitchenIds, false);

    touchUser(db, actor.id);
    return { user: targetUser };
  });

  if (normalizePin(result.user.tempPin)) {
    await syncUserAuthCredentials(result.user);
  } else {
    await syncUserAuthProfile(result.user);
  }

  return result;
}

export async function deleteUser(userId) {
  const normalizedUserId = String(userId ?? "").trim();

  if (!normalizedUserId) {
    throw createAppError(400, "User id is required.");
  }

  const result = await withDbUpdate((db) => {
    const actor = requireAuth(db);
    requireUsersModuleAccess(actor);
    requireUserWriteAccess(actor);

    if (actor.id === normalizedUserId) {
      throw createAppError(400, "You cannot delete your own account.");
    }

    const index = db.users.findIndex((entry) => entry.id === normalizedUserId);
    if (index === -1) {
      throw createAppError(404, "User not found.");
    }

    const targetUser = db.users[index];
    requireTargetWithinScope(db, actor, targetUser);

    if (
      (targetUser.role === ROLES.SUPER_ADMIN || targetUser.role === ROLES.FOUNDER) &&
      actor.role !== ROLES.SUPER_ADMIN
    ) {
      throw createAppError(403, "Only Super Admin can delete this user.");
    }

    db.users.splice(index, 1);
    db.kitchenMemberships = db.kitchenMemberships.filter(
      (membership) => membership.userId !== normalizedUserId
    );

    touchUser(db, actor.id);
    return { deletedUserId: normalizedUserId };
  });

  await deleteUserAuthCredentials(result.deletedUserId);
  return result;
}
