import { TASK_STATUSES } from "../../shared/constants/taskStatuses";
import { deriveDashboardStats } from "../../shared/utils/deriveDashboardStats";
import { formatRoleLabel } from "../../shared/utils/deriveRolePermissions";
import { getUserPermissions } from "../../shared/utils/rbac";
import { PERMISSIONS } from "../../shared/constants/permissions";
import { getAllRoleSummaryRows } from "../../shared/utils/roleSummary";
import { getVisibleActivityLogs, getVisibleChecklistItems, getVisibleKitchens, getVisibleLists, getVisibleRecipes, getVisibleSnapshots } from "./_repoHelpers";

function getListById(db, listId) {
  return db.lists.find((entry) => entry.id === listId) ?? null;
}

function getUserAssignedSections(user, kitchenId) {
  const assigned = user?.assignedSectionsByKitchen?.[kitchenId];
  return Array.isArray(assigned) ? assigned : [];
}

function getUserWorkingSection(user, kitchenId) {
  const workingSection = user?.workingSectionByKitchen?.[kitchenId];

  if (typeof workingSection === "string" && workingSection.trim()) {
    return workingSection;
  }

  return getUserAssignedSections(user, kitchenId)[0] ?? null;
}

function getActiveTaskCountForUser(db, user, kitchenId) {
  const workingSection = getUserWorkingSection(user, kitchenId);
  if (!workingSection) return 0;

  return db.checklistItems.filter((item) => {
    if (item.kitchenId !== kitchenId) return false;
    if (item.status === TASK_STATUSES.COMPLETED) return false;

    const list = getListById(db, item.listId);
    return list?.section === workingSection;
  }).length;
}

export function buildStaffVisibilityRows(db, visibleKitchens = []) {
  const visibleKitchenIds = new Set(
    (Array.isArray(visibleKitchens) ? visibleKitchens : []).map(
      (kitchen) => kitchen.id
    )
  );

  return db.kitchenMemberships
    .filter((membership) => visibleKitchenIds.has(membership.kitchenId))
    .map((membership) => {
      const user = db.users.find((entry) => entry.id === membership.userId);
      const kitchen = db.kitchens.find((entry) => entry.id === membership.kitchenId);

      return {
        id: `${membership.kitchenId}-${membership.userId}`,
        userId: membership.userId,
        name: user?.name ?? "Unknown",
        email: user?.email ?? "—",
        role: formatRoleLabel(user?.role),
        kitchenId: membership.kitchenId,
        kitchenName: kitchen?.name ?? "Unknown kitchen",
        workingSection: getUserWorkingSection(user, membership.kitchenId) ?? "—",
        assignedSections: getUserAssignedSections(user, membership.kitchenId),
        activeTasks: getActiveTaskCountForUser(db, user, membership.kitchenId),
        joinedViaCode: Boolean(membership.joinedViaCode),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildDashboardPayload(db, currentUser) {
  const visibleKitchens = getVisibleKitchens(db, currentUser);
  const visibleLists = getVisibleLists(db, currentUser);
  const visibleItems = getVisibleChecklistItems(db, currentUser);
  const visibleLogs = getVisibleActivityLogs(db, currentUser);
  const activeStaff = buildStaffVisibilityRows(db, visibleKitchens);

  const kitchens = visibleKitchens.map((kitchen) => {
    const kitchenItems = visibleItems.filter((item) => item.kitchenId === kitchen.id);
    const totalItems = kitchenItems.length;
    const completedItems = kitchenItems.filter(
      (item) => item.status === TASK_STATUSES.COMPLETED
    );
    const completionPercentage = totalItems
      ? Math.round((completedItems.length / totalItems) * 100)
      : 0;

    let totalDurationMs = 0;
    let completedWithTimeCount = 0;

    completedItems.forEach((item) => {
      const list = visibleLists.find((l) => l.id === item.listId);
      if (list?.createdAt && item.completedAt) {
        const duration = new Date(item.completedAt).getTime() - new Date(list.createdAt).getTime();
        if (duration > 0) {
          totalDurationMs += duration;
          completedWithTimeCount++;
        }
      }
    });

    const avgDurationMs = completedWithTimeCount
      ? totalDurationMs / completedWithTimeCount
      : null;

    let averageCompletionTimeText = "No completions";
    if (avgDurationMs !== null) {
      const mins = Math.round(avgDurationMs / 60000);
      if (mins < 60) {
        averageCompletionTimeText = `${mins} mins`;
      } else {
        const hours = (mins / 60).toFixed(1);
        averageCompletionTimeText = `${hours} hours`;
      }
    }

    return {
      ...kitchen,
      memberCount: db.kitchenMemberships.filter(
        (membership) => membership.kitchenId === kitchen.id
      ).length,
      activeListCount: visibleLists.filter((list) => list.kitchenId === kitchen.id)
        .length,
      completionPercentage,
      averageCompletionDurationMs: avgDurationMs,
      averageCompletionTimeText,
    };
  });

  // Identify fastest kitchen
  const kitchensWithSpeed = kitchens.filter(
    (k) => k.averageCompletionDurationMs !== null && k.averageCompletionDurationMs > 0
  );
  const fastestKitchen = kitchensWithSpeed.length
    ? kitchensWithSpeed.reduce((prev, curr) =>
        prev.averageCompletionDurationMs < curr.averageCompletionDurationMs ? prev : curr
      )
    : null;

  return {
    currentUser,
    stats: deriveDashboardStats({
      kitchens: visibleKitchens,
      lists: visibleLists,
      checklistItems: visibleItems,
      memberships: db.kitchenMemberships.filter((membership) =>
        visibleKitchens.some((kitchen) => kitchen.id === membership.kitchenId)
      ),
    }),
    kitchens,
    fastestKitchen: fastestKitchen
      ? { id: fastestKitchen.id, name: fastestKitchen.name, avgTime: fastestKitchen.averageCompletionTimeText }
      : null,
    activeStaff,
    recentActivity: visibleLogs
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5),
  };
}

export function buildKitchenManagementPayload(db, currentUser) {
  const visibleKitchens = getVisibleKitchens(db, currentUser);

  return {
    kitchens: visibleKitchens.map((kitchen) => ({
      ...kitchen,
      sections: db.kitchenSections.filter((section) => section.kitchenId === kitchen.id),
      members: buildStaffVisibilityRows(db, [kitchen]),
      accessCodes: db.accessCodes.filter((code) => code.kitchenId === kitchen.id),
      joinEvents: db.activityLogs.filter(
        (log) => log.kitchenId === kitchen.id && log.action === "joined_via_code"
      ),
    })),
  };
}

export function buildKitchenDetailsPayload(db, currentUser, kitchenId) {
  const kitchen = getVisibleKitchens(db, currentUser).find(
    (entry) => entry.id === kitchenId
  );

  if (!kitchen) return null;

  return {
    kitchen,
    sections: db.kitchenSections.filter((section) => section.kitchenId === kitchenId),
    members: buildStaffVisibilityRows(db, [kitchen]),
    accessCodes: db.accessCodes.filter((code) => code.kitchenId === kitchenId),
    joinEvents: db.activityLogs.filter(
      (log) => log.kitchenId === kitchenId && log.action === "joined_via_code"
    ),
  };
}

export function buildListMonitoringPayload(db, currentUser, { section = "all" } = {}) {
  const visibleLists = getVisibleLists(db, currentUser);

  const filteredLists =
    section === "all"
      ? visibleLists
      : visibleLists.filter((list) => list.section === section);

  return {
    sections: [...new Set(visibleLists.map((list) => list.section))],
    lists: filteredLists.map((list) => {
      const items = db.checklistItems.filter((item) => item.listId === list.id);
      const kitchen = db.kitchens.find((entry) => entry.id === list.kitchenId);
      const accessCode = db.accessCodes.find((code) => code.id === list.accessCodeId);

      return {
        ...list,
        kitchenName: kitchen?.name ?? "Unknown",
        accessCode: accessCode?.code ?? null,
        items,
        completedCount: items.filter((item) => item.checked).length,
      };
    }),
  };
}

export function buildListDetailsPayload(db, currentUser, listId) {
  const list = getVisibleLists(db, currentUser).find((entry) => entry.id === listId);
  if (!list) return null;

  const items = db.checklistItems.filter((item) => item.listId === listId);
  const accessCode = db.accessCodes.find((code) => code.id === list.accessCodeId);

  return {
    list,
    accessCode,
    items,
    photosByItemId: db.photos.reduce((accumulator, photo) => {
      accumulator[photo.checklistItemId] = photo;
      return accumulator;
    }, {}),
  };
}

export function buildTemplatesPayload(db) {
  return { templates: db.templates };
}

export function buildDailyHistoryPayload(db, currentUser) {
  const visibleItems = getVisibleChecklistItems(db, currentUser);

  const rows = visibleItems
    .filter((item) => item.completedAt)
    .map((item) => {
      const completion = db.completions.find(
        (entry) => entry.checklistItemId === item.id
      );
      const photo = db.photos.find((entry) => entry.checklistItemId === item.id);
      const user = db.users.find((entry) => entry.id === item.completedBy);
      const list = db.lists.find((entry) => entry.id === item.listId);

      return {
        id: item.id,
        task: item.title,
        kitchenId: item.kitchenId,
        listTitle: list?.title ?? "Unknown list",
        section: list?.section ?? "—",
        completedBy: user?.name ?? "Unknown",
        completedAt: completion?.completedAt ?? item.completedAt,
        hasPhoto: Boolean(photo),
        photo: photo ?? null,
      };
    })
    .sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

  return { rows };
}

export function buildWeeklyHistoryPayload(db, currentUser) {
  const daily = buildDailyHistoryPayload(db, currentUser).rows;

  const rows = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - index);

    const completionsForDay = daily.filter((row) => {
      const rowDate = new Date(row.completedAt);
      rowDate.setHours(0, 0, 0, 0);
      return rowDate.getTime() === date.getTime();
    });

    return {
      id: date.toISOString(),
      date,
      dayLabel: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date),
      completions: completionsForDay.length,
      photoCount: completionsForDay.filter((row) => row.hasPhoto).length,
    };
  }).reverse();

  return { rows };
}

export function buildSnapshotsPayload(db, currentUser) {
  return {
    rows: [...getVisibleSnapshots(db, currentUser)].sort(
      (a, b) =>
        new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime()
    ),
  };
}

export function buildRecipesPayload(db, currentUser, { search = "", section = "all", category = "all" } = {}) {
  const visibleRecipes = getVisibleRecipes(db, currentUser);
  const normalizedSearch = String(search).trim().toLowerCase();

  const rows = visibleRecipes.filter((recipe) => {
    const matchesSearch = normalizedSearch
      ? [
          recipe.title,
          recipe.section,
          recipe.category,
          ...(Array.isArray(recipe.ingredients) ? recipe.ingredients : []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch)
      : true;

    const matchesSection = section === "all" ? true : recipe.section === section;
    const matchesCategory = category === "all" ? true : recipe.category === category;

    return matchesSearch && matchesSection && matchesCategory;
  });

  return {
    recipes: rows,
    sections: [...new Set(visibleRecipes.map((recipe) => recipe.section))].sort(),
    categories: [...new Set(visibleRecipes.map((recipe) => recipe.category))].sort(),
  };
}

export function buildRecipeDetailsPayload(db, currentUser, recipeId) {
  const recipe = getVisibleRecipes(db, currentUser).find((entry) => entry.id === recipeId);

  if (!recipe) return null;

  const visibleItems = getVisibleChecklistItems(db, currentUser);

  return {
    recipe,
    linkedItems: visibleItems
      .filter((item) => item.recipeId === recipeId)
      .map((item) => {
        const list = db.lists.find((entry) => entry.id === item.listId);

        return {
          id: item.id,
          listId: item.listId,
          title: item.title,
          listTitle: list?.title ?? "Unknown list",
          section: list?.section ?? "—",
        };
      }),
  };
}

export function buildAdminRolesPayload() {
  return {
    rows: getAllRoleSummaryRows().map((row) => ({
      id: row.id,
      role: row.roleLabel,
      rawRole: row.role,
      scope: row.scope,
      dataAccess: row.dataAccess,
      listOperation: row.listOperation,
      recipeAccess: row.recipeAccess,
      userRoleAccess: row.userRoleAccess,
      subscription: row.subscription,
      permissionCount: row.permissionCount,
      permissions: row.permissions,
    })),
  };
}

export function canManageRecipes(user) {
  return getUserPermissions(user).includes(PERMISSIONS.MANAGE_RECIPES);
}
