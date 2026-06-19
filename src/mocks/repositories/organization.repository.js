import { PERMISSIONS } from "../../shared/constants/permissions";
import { ROLES } from "../../shared/constants/roles";
import { formatRoleLabel } from "../../shared/utils/deriveRolePermissions";
import { getUserPermissions } from "../../shared/utils/rbac";
import { createAppError, readDb, requireAuth, touchUser, withDbUpdate } from "./_repoHelpers";

function requireOrganizationAccess(user) {
  const permissions = getUserPermissions(user);
  if (!permissions.includes(PERMISSIONS.VIEW_ORGANIZATION)) {
    throw createAppError(403, "You do not have permission to view the organization.");
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

  const assignedCompanyIds = Array.isArray(currentUser.companyIds) ? currentUser.companyIds : [];

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
  if (currentUser.role === ROLES.SUPER_ADMIN) return db.kitchens;

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

    return db.users.filter(
      (user) =>
        userIdsFromMemberships.has(user.id) ||
        (Array.isArray(user.accessibleKitchenIds)
          ? user.accessibleKitchenIds.some((id) => visibleKitchenIds.has(id))
          : false)
    );
  }

  const visibleCompanyIds = new Set(visibleCompanies.map((company) => company.id));
  const visibleKitchenIds = new Set(visibleKitchens.map((kitchen) => kitchen.id));

  return db.users.filter((user) => {
    const hasCompany =
      Array.isArray(user.companyIds) && user.companyIds.some((id) => visibleCompanyIds.has(id));

    const hasKitchen =
      Array.isArray(user.accessibleKitchenIds) &&
      user.accessibleKitchenIds.some((id) => visibleKitchenIds.has(id));

    return hasCompany || hasKitchen;
  });
}

function buildOrganizationStats(db, visibleCompanies, visibleKitchens, visibleUsers) {
  const visibleKitchenIds = new Set(visibleKitchens.map((kitchen) => kitchen.id));

  const activeLists = db.lists.filter(
    (list) => list.isActive && visibleKitchenIds.has(list.kitchenId)
  ).length;

  const codeJoins = db.kitchenMemberships.filter(
    (membership) => membership.joinedViaCode && visibleKitchenIds.has(membership.kitchenId)
  ).length;

  return [
    { label: "Companies", value: visibleCompanies.length, helper: "Company entities" },
    {
      label: "Restaurants/Kitchens",
      value: visibleKitchens.length,
      helper: "Restaurant locations",
    },
    {
      label: "Executive Chefs",
      value: visibleUsers.filter((user) => user.role === ROLES.EXECUTIVE_CHEF).length,
      helper: "Company leads",
    },
    {
      label: "Head Chefs",
      value: visibleUsers.filter((user) => user.role === ROLES.HEAD_CHEF).length,
      helper: "Restaurant leads",
    },
    {
      label: "Staff",
      value: visibleUsers.filter((user) => user.role === ROLES.STAFF).length,
      helper: "Kitchen operators",
    },
    {
      label: "Active Lists",
      value: activeLists,
      helper: "Operational prep lists",
    },
    {
      label: "Code Joins",
      value: codeJoins,
      helper: "Members joined via code",
    },
  ];
}

function buildOrganizationTree(db, visibleCompanies, visibleKitchens, visibleUsers) {
  const usersById = new Map(visibleUsers.map((user) => [user.id, user]));
  const kitchensByCompany = visibleKitchens.reduce((accumulator, kitchen) => {
    const companyId = kitchen.companyId ?? "unknown";
    accumulator[companyId] = accumulator[companyId] ?? [];
    accumulator[companyId].push(kitchen);
    return accumulator;
  }, {});

  const membershipsByKitchen = db.kitchenMemberships.reduce((accumulator, membership) => {
    accumulator[membership.kitchenId] = accumulator[membership.kitchenId] ?? [];
    accumulator[membership.kitchenId].push(membership);
    return accumulator;
  }, {});

  const companies = visibleCompanies.map((company) => {
    const executiveChefs = Array.isArray(company.executiveChefIds)
      ? company.executiveChefIds
          .map((id) => usersById.get(id))
          .filter(Boolean)
          .map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
          }))
      : [];

    const kitchens = (kitchensByCompany[company.id] ?? []).map((kitchen) => {
      const memberIds = new Set(
        (membershipsByKitchen[kitchen.id] ?? []).map((membership) => membership.userId)
      );

      const members = Array.from(memberIds)
        .map((id) => usersById.get(id))
        .filter(Boolean);

      return {
        id: kitchen.id,
        name: kitchen.name,
        siteCode: kitchen.siteCode,
        headChefs: members.filter((user) => user.role === ROLES.HEAD_CHEF),
        sousChefs: members.filter((user) => user.role === ROLES.SOUS_CHEF),
        staff: members.filter((user) => user.role === ROLES.STAFF),
      };
    });

    const founder = company.founderId ? db.users.find((u) => u.id === company.founderId) : null;

    return {
      id: company.id,
      name: company.name,
      founder: founder
        ? { id: founder.id, name: founder.name, email: founder.email }
        : null,
      executiveChefs,
      kitchens,
    };
  });

  return { companies };
}

export async function getOrganizationOverview(filters = {}) {
  const db = readDb();
  const currentUser = requireAuth(db);
  requireOrganizationAccess(currentUser);

  const visibleCompanies = resolveVisibleCompanies(db, currentUser);

  const companyId = typeof filters.companyId === "string" ? filters.companyId : "all";
  const scopedCompanies =
    companyId && companyId !== "all"
      ? visibleCompanies.filter((company) => company.id === companyId)
      : visibleCompanies;

  const visibleKitchens = resolveVisibleKitchens(db, currentUser, scopedCompanies);
  const visibleUsers = resolveVisibleUsers(db, currentUser, scopedCompanies, visibleKitchens);

  return {
    companies: visibleCompanies.map((company) => ({ id: company.id, name: company.name })),
    stats: buildOrganizationStats(db, scopedCompanies, visibleKitchens, visibleUsers),
    tree: buildOrganizationTree(db, scopedCompanies, visibleKitchens, visibleUsers),
  };
}

export async function getOrganizationUsers(filters = {}) {
  const db = readDb();
  const currentUser = requireAuth(db);
  requireOrganizationAccess(currentUser);

  const visibleCompanies = resolveVisibleCompanies(db, currentUser);
  const visibleKitchens = resolveVisibleKitchens(db, currentUser, visibleCompanies);
  const visibleUsers = resolveVisibleUsers(db, currentUser, visibleCompanies, visibleKitchens);

  const search = typeof filters.search === "string" ? filters.search.trim().toLowerCase() : "";
  const role = typeof filters.role === "string" ? filters.role : "all";

  const companiesById = new Map(visibleCompanies.map((company) => [company.id, company]));
  const kitchensById = new Map(db.kitchens.map((kitchen) => [kitchen.id, kitchen]));

  const visibleKitchenIds = new Set(visibleKitchens.map((kitchen) => kitchen.id));

  const rows = visibleUsers
    .filter((user) => {
      const matchesRole = role === "all" ? true : user.role === role;
      const matchesSearch = search
        ? [user.name, user.email].some((value) =>
            String(value).toLowerCase().includes(search)
          )
        : true;

      return matchesRole && matchesSearch;
    })
    .map((user) => {
      const companyNames = (Array.isArray(user.companyIds) ? user.companyIds : [])
        .map((id) => companiesById.get(id)?.name)
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

      const accessScope = user.role === ROLES.EXECUTIVE_CHEF
        ? "Company-wide"
        : kitchens.length > 1
          ? `${kitchens.length} kitchens`
          : primaryKitchen
            ? primaryKitchen.name
            : "—";

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: formatRoleLabel(user.role),
        rawRole: user.role,
        company: companyNames.join(", ") || "—",
        kitchen: primaryKitchen?.name ?? "—",
        accessScope,
        joinedViaCode,
        lastActiveAt: user.lastActiveAt ?? null,
        accessibleKitchenIds: kitchens.map((kitchen) => kitchen.id),
        invitedListIds: Array.isArray(user.invitedListIds) ? user.invitedListIds : [],
        permissions: Array.isArray(user.permissions) ? user.permissions : [],
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return { rows };
}

function canAssignRole(actor, nextRoleValue, targetUser) {
  const permissions = getUserPermissions(actor);

  if (actor.id === targetUser.id) {
    throw createAppError(403, "You cannot change your own role.");
  }

  if (permissions.includes(PERMISSIONS.ASSIGN_ANY_ROLE)) {
    return true;
  }

  const chefAssignable = permissions.includes(PERMISSIONS.ASSIGN_CHEF_ROLES) &&
    [ROLES.HEAD_CHEF, ROLES.SOUS_CHEF].includes(nextRoleValue);

  const staffAssignable = permissions.includes(PERMISSIONS.ASSIGN_STAFF_ACCESS) &&
    nextRoleValue === ROLES.STAFF;

  if (chefAssignable || staffAssignable) {
    const forbidden = new Set([ROLES.SUPER_ADMIN, ROLES.FOUNDER]);

    if (forbidden.has(targetUser.role) || forbidden.has(nextRoleValue)) {
      throw createAppError(403, "You cannot assign this role.");
    }

    if (actor.role === ROLES.EXECUTIVE_CHEF && nextRoleValue === ROLES.EXECUTIVE_CHEF) {
      throw createAppError(403, "Executive Chef role assignment is restricted.");
    }

    return true;
  }

  throw createAppError(403, "You do not have permission to assign roles.");
}

function requireWithinScope(db, actor, targetUser) {
  if (actor.role === ROLES.SUPER_ADMIN) return;

  const actorKitchenIds = Array.isArray(actor.accessibleKitchenIds) ? actor.accessibleKitchenIds : [];
  const targetKitchenIds = Array.isArray(targetUser.accessibleKitchenIds)
    ? targetUser.accessibleKitchenIds
    : [];

  const kitchenIntersection = targetKitchenIds.some((id) => actorKitchenIds.includes(id));

  const actorCompanyIds = Array.isArray(actor.companyIds) ? actor.companyIds : [];
  const targetCompanyIds = Array.isArray(targetUser.companyIds) ? targetUser.companyIds : [];

  const companyIntersection = targetCompanyIds.some((id) => actorCompanyIds.includes(id));

  if (actor.role === ROLES.EXECUTIVE_CHEF && !companyIntersection) {
    throw createAppError(403, "You can only manage users within your company scope.");
  }

  const kitchenScopedRoles = new Set([ROLES.HEAD_CHEF, ROLES.SOUS_CHEF]);

  if (kitchenScopedRoles.has(actor.role) && !kitchenIntersection) {
    throw createAppError(403, "You can only manage users within your kitchen scope.");
  }
}

export async function assignUserRole(userId, payload) {
  const normalizedUserId = String(userId ?? "").trim();
  const nextRoleValue = typeof payload?.role === "string" ? payload.role.trim() : "";

  if (!nextRoleValue) {
    throw createAppError(400, "Role is required.");
  }

  return withDbUpdate((db) => {
    const currentUser = requireAuth(db);
    requireOrganizationAccess(currentUser);

    const targetUser = db.users.find((entry) => entry.id === normalizedUserId) ?? null;
    if (!targetUser) {
      throw createAppError(404, "User not found.");
    }

    requireWithinScope(db, currentUser, targetUser);
    canAssignRole(currentUser, nextRoleValue, targetUser);

    targetUser.role = nextRoleValue;
    targetUser.roleSource = "manual";
    targetUser.updatedAt = new Date().toISOString();

    touchUser(db, currentUser.id);

    return { user: targetUser };
  });
}

export async function updateUserAccess(userId, payload) {
  const normalizedUserId = String(userId ?? "").trim();

  return withDbUpdate((db) => {
    const currentUser = requireAuth(db);
    requireOrganizationAccess(currentUser);

    const permissions = getUserPermissions(currentUser);

    const canManageUsers =
      permissions.includes(PERMISSIONS.MANAGE_USERS) ||
      permissions.includes(PERMISSIONS.MANAGE_COMPANY_USERS) ||
      permissions.includes(PERMISSIONS.MANAGE_RESTAURANT_USERS);

    if (!canManageUsers) {
      throw createAppError(403, "You do not have permission to manage user access.");
    }

    const targetUser = db.users.find((entry) => entry.id === normalizedUserId) ?? null;
    if (!targetUser) {
      throw createAppError(404, "User not found.");
    }

    requireWithinScope(db, currentUser, targetUser);

    if (Array.isArray(payload?.accessibleKitchenIds)) {
      targetUser.accessibleKitchenIds = payload.accessibleKitchenIds
        .map((id) => String(id).trim())
        .filter(Boolean);
    }

    if (Array.isArray(payload?.invitedListIds)) {
      targetUser.invitedListIds = payload.invitedListIds
        .map((id) => String(id).trim())
        .filter(Boolean);
    }

    if (Array.isArray(payload?.companyIds)) {
      targetUser.companyIds = payload.companyIds.map((id) => String(id).trim()).filter(Boolean);
    }

    if (Array.isArray(payload?.permissions)) {
      targetUser.permissions = payload.permissions
        .map((permission) => String(permission).trim())
        .filter(Boolean);
    }

    touchUser(db, currentUser.id);
    return { user: targetUser };
  });
}
