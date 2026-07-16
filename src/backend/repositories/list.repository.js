import { PERMISSIONS } from "../../shared/constants/permissions";
import { TASK_STATUSES, TASK_STATUS_LABELS } from "../../shared/constants/taskStatuses";
import { generateAccessCode } from "../../shared/utils/generateAccessCode";
import { generateSequentialId } from "../../shared/utils/generateSequentialId";
import { buildListDetailsPayload, buildListMonitoringPayload, buildTemplatesPayload } from "../mappers/index.js";
import { createAppError, getVisibleKitchens, getVisibleLists, readDb, requireAuth, requirePermission, touchUser, withDbUpdate } from "./_repoContext.js";

function appendActivityLog(db, { list, actor, action, message }) {
  db.activityLogs.unshift({
    id: generateSequentialId("al", db.activityLogs),
    kitchenId: list.kitchenId,
    listId: list.id,
    actorId: actor.id,
    action,
    message,
    createdAt: new Date().toISOString(),
  });
}

export async function getPrepLists(filters = {}) {
  const db = await readDb();
  const currentUser = requireAuth(db);

  const section = typeof filters?.section === "string" ? filters.section : "all";

  return buildListMonitoringPayload(db, currentUser, { section });
}

export async function getListDetails(listId) {
  const db = await readDb();
  const currentUser = requireAuth(db);

  const normalizedListId = String(listId ?? "").trim();
  const payload = buildListDetailsPayload(db, currentUser, normalizedListId);

  if (!payload) {
    throw createAppError(404, "List not found.");
  }

  return payload;
}

export async function getTemplates() {
  const db = await readDb();
  const currentUser = requireAuth(db);

  requirePermission(currentUser, PERMISSIONS.MANAGE_LISTS);
  return buildTemplatesPayload(db);
}

export async function createList(payload) {
  const kitchenId = typeof payload?.kitchenId === "string" ? payload.kitchenId.trim() : "";
  const section = typeof payload?.section === "string" ? payload.section.trim() : "";
  const title = typeof payload?.title === "string" ? payload.title.trim() : "";

  if (!kitchenId) {
    throw createAppError(400, "Kitchen selection is required.");
  }

  if (!section) {
    throw createAppError(400, "Section selection is required.");
  }

  if (!title || title.length < 3) {
    throw createAppError(400, "List title must be at least 3 characters.");
  }

  return withDbUpdate((db) => {
    const currentUser = requireAuth(db);
    requirePermission(currentUser, PERMISSIONS.CREATE_LISTS);

    const kitchen = db.kitchens.find((entry) => entry.id === kitchenId) ?? null;
    if (!kitchen) {
      throw createAppError(404, "Kitchen not found.");
    }

    if (!getVisibleKitchens(db, currentUser).some((entry) => entry.id === kitchenId)) {
      throw createAppError(403, "You do not have access to this kitchen.");
    }

    const listId = generateSequentialId("l", db.lists);
    const createdBy = currentUser.id;

    const accessCodeId = generateSequentialId("ac", db.accessCodes);
    const accessCodeValue = generateAccessCode(db.accessCodes, 6);

    const list = {
      id: listId,
      kitchenId,
      section,
      title,
      createdBy,
      accessCodeId,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    db.lists.unshift(list);

    db.accessCodes.unshift({
      id: accessCodeId,
      code: accessCodeValue,
      kitchenId,
      listId,
      expiresAt: null,
      createdBy,
    });

    if (Array.isArray(kitchen.activeListIds)) {
      kitchen.activeListIds.push(listId);
    }

    if (!Array.isArray(currentUser.invitedListIds)) {
      currentUser.invitedListIds = [];
    }

    if (!currentUser.invitedListIds.includes(listId)) {
      currentUser.invitedListIds.push(listId);
    }

    appendActivityLog(db, {
      list,
      actor: currentUser,
      action: "created_list",
      message: `${currentUser.name} created ${title}`,
    });

    appendActivityLog(db, {
      list,
      actor: currentUser,
      action: "access_code_generated",
      message: `Access code generated for ${title}`,
    });

    appendActivityLog(db, {
      list,
      actor: currentUser,
      action: "access_code_sent",
      message: `Access code sent to ${currentUser.email}`,
    });

    touchUser(db, currentUser.id);

    return {
      list,
      accessCode: accessCodeValue,
      emailStatus: `Access code sent to ${currentUser.email}`,
    };
  });
}

export async function updateChecklistItem(listId, itemId, payload) {
  const normalizedListId = String(listId ?? "").trim();
  const normalizedItemId = String(itemId ?? "").trim();

  return withDbUpdate((db) => {
    const currentUser = requireAuth(db);
    requirePermission(currentUser, PERMISSIONS.OPERATE_LISTS);

    const list = db.lists.find((entry) => entry.id === normalizedListId) ?? null;
    if (!list) {
      throw createAppError(404, "List not found.");
    }

    if (!getVisibleLists(db, currentUser).some((entry) => entry.id === list.id)) {
      throw createAppError(403, "You do not have access to this list.");
    }

    const item =
      db.checklistItems.find(
        (entry) => entry.id === normalizedItemId && entry.listId === normalizedListId
      ) ?? null;

    if (!item) {
      throw createAppError(404, "Checklist item not found.");
    }

    const now = new Date().toISOString();

    const providedStatus =
      typeof payload?.status === "string" ? payload.status.trim() : null;
    const providedChecked = typeof payload?.checked === "boolean" ? payload.checked : null;
    const providedRecipeId =
      payload?.recipeId === null || typeof payload?.recipeId === "string" ? payload.recipeId : undefined;

    if (providedStatus === null && providedChecked === null && providedRecipeId === undefined) {
      throw createAppError(400, "Nothing to update.");
    }

    if (providedRecipeId !== undefined) {
      item.recipeId = providedRecipeId || null;
    }

    if (providedStatus !== null || providedChecked !== null) {
      const nextStatus =
        providedStatus !== null
          ? providedStatus
          : providedChecked
            ? TASK_STATUSES.COMPLETED
            : TASK_STATUSES.PENDING;

      if (!Object.values(TASK_STATUSES).includes(nextStatus)) {
        throw createAppError(400, "Status is invalid.");
      }

      const nextChecked =
        providedStatus !== null
          ? nextStatus === TASK_STATUSES.COMPLETED
          : Boolean(providedChecked);

      const checkedChanged = item.checked !== nextChecked;
      const statusChanged = item.status !== nextStatus;
      const wasCompleted = item.status === TASK_STATUSES.COMPLETED;
      const isCompletingNow = nextStatus === TASK_STATUSES.COMPLETED && !wasCompleted;
      const isUncompletingNow = nextStatus !== TASK_STATUSES.COMPLETED && wasCompleted;

      item.checked = nextChecked;
      item.status = nextStatus;

      if (nextStatus === TASK_STATUSES.COMPLETED) {
        if (isCompletingNow || !item.completedAt) {
          item.completedAt = now;
          item.completedBy = currentUser.id;

          const existingCompletion = db.completions.find(
            (entry) => entry.checklistItemId === item.id
          );

          if (existingCompletion) {
            existingCompletion.completedAt = now;
            existingCompletion.userId = currentUser.id;
          } else {
            db.completions.unshift({
              id: generateSequentialId("cmp", db.completions),
              checklistItemId: item.id,
              userId: currentUser.id,
              completedAt: now,
            });
          }
        }
      } else {
        item.completedAt = null;
        item.completedBy = null;

        const completionIndex = db.completions.findIndex(
          (entry) => entry.checklistItemId === item.id
        );

        if (completionIndex !== -1) {
          db.completions.splice(completionIndex, 1);
        }
      }

      if (checkedChanged) {
        appendActivityLog(db, {
          list,
          actor: currentUser,
          action: nextChecked ? "checked_item" : "unchecked_item",
          message: `${currentUser.name} ${nextChecked ? "checked" : "unchecked"} ${item.title}`,
        });
      }

      if (statusChanged) {
        appendActivityLog(db, {
          list,
          actor: currentUser,
          action: "status_changed",
          message: `${currentUser.name} moved ${item.title} to ${TASK_STATUS_LABELS[nextStatus]}`,
        });
      }

      if (isCompletingNow) {
        appendActivityLog(db, {
          list,
          actor: currentUser,
          action: "completed_item",
          message: `${currentUser.name} completed ${item.title}`,
        });
      }

      if (isUncompletingNow) {
        const photoIndex = db.photos.findIndex((entry) => entry.checklistItemId === item.id);

        if (photoIndex !== -1) {
          db.photos.splice(photoIndex, 1);
        }
      }
    }

    touchUser(db, currentUser.id);
    return { item };
  });
}

export async function attachChecklistItemPhoto(listId, itemId, payload) {
  const normalizedListId = String(listId ?? "").trim();
  const normalizedItemId = String(itemId ?? "").trim();

  return withDbUpdate((db) => {
    const currentUser = requireAuth(db);
    requirePermission(currentUser, PERMISSIONS.OPERATE_LISTS);

    const list = db.lists.find((entry) => entry.id === normalizedListId) ?? null;
    if (!list) {
      throw createAppError(404, "List not found.");
    }

    if (!getVisibleLists(db, currentUser).some((entry) => entry.id === list.id)) {
      throw createAppError(403, "You do not have access to this list.");
    }

    const item =
      db.checklistItems.find(
        (entry) => entry.id === normalizedItemId && entry.listId === normalizedListId
      ) ?? null;

    if (!item) {
      throw createAppError(404, "Checklist item not found.");
    }

    const label = typeof payload?.label === "string" ? payload.label.trim() : "";
    if (!label) {
      throw createAppError(400, "Photo label is required.");
    }

    const url = typeof payload?.url === "string" ? payload.url.trim() : "";
    if (!url) {
      throw createAppError(400, "Photo image is required.");
    }

    const storagePath =
      typeof payload?.storagePath === "string" ? payload.storagePath.trim() : null;

    if (!item.completedAt || item.status !== TASK_STATUSES.COMPLETED) {
      throw createAppError(400, "Item must be completed before attaching a photo.");
    }

    const now = new Date().toISOString();

    const existingPhoto = db.photos.find((entry) => entry.checklistItemId === item.id);

    const photo = existingPhoto
      ? Object.assign(existingPhoto, {
          label,
          url,
          storagePath,
          uploadedAt: now,
          uploadedBy: currentUser.id,
        })
      : {
          id: generateSequentialId("ph", db.photos),
          checklistItemId: item.id,
          uploadedBy: currentUser.id,
          uploadedAt: now,
          label,
          url,
          storagePath,
        };

    if (!existingPhoto) {
      db.photos.unshift(photo);
    }

    appendActivityLog(db, {
      list,
      actor: currentUser,
      action: "attached_photo",
      message: `${currentUser.name} attached completion photo for ${item.title}`,
    });

    touchUser(db, currentUser.id);
    return { photo };
  });
}

export async function createTemplate(payload) {
  const title = typeof payload?.title === "string" ? payload.title.trim() : "";
  const categoryId = typeof payload?.categoryId === "string" ? payload.categoryId.trim() : "";
  const category = typeof payload?.category === "string" ? payload.category.trim() : "";
  const itemCount = Number(payload?.itemCount);

  if (!title || title.length < 2) {
    throw createAppError(400, "Template title is required.");
  }

  if (!categoryId && !category) {
    throw createAppError(400, "Template category is required.");
  }

  if (!Number.isFinite(itemCount) || itemCount < 1 || itemCount > 50) {
    throw createAppError(400, "Item count must be between 1 and 50.");
  }

  return withDbUpdate((db) => {
    const currentUser = requireAuth(db);
    requirePermission(currentUser, PERMISSIONS.MANAGE_LISTS);

    const categoryDoc = (db.templateCategories ?? []).find((c) => c.id === categoryId);
    const resolvedCategory = categoryDoc?.name ?? category ?? "General";

    const template = {
      id: generateSequentialId("t", db.templates),
      title,
      categoryId: categoryId || null,
      category: resolvedCategory,
      itemCount: Math.trunc(itemCount),
    };

    db.templates.unshift(template);

    touchUser(db, currentUser.id);
    return { template };
  });
}

export async function applyTemplate(templateId, payload) {
  const normalizedTemplateId = String(templateId ?? "").trim();
  const normalizedListId = typeof payload?.listId === "string" ? payload.listId.trim() : "";

  if (!normalizedListId) {
    throw createAppError(400, "Destination list is required.");
  }

  return withDbUpdate((db) => {
    const currentUser = requireAuth(db);
    requirePermission(currentUser, PERMISSIONS.MANAGE_LISTS);

    const template = db.templates.find((entry) => entry.id === normalizedTemplateId) ?? null;
    if (!template) {
      throw createAppError(404, "Template not found.");
    }

    const list = db.lists.find((entry) => entry.id === normalizedListId) ?? null;
    if (!list) {
      throw createAppError(404, "List not found.");
    }

    if (!getVisibleLists(db, currentUser).some((entry) => entry.id === list.id)) {
      throw createAppError(403, "You do not have access to this list.");
    }

    const itemCount = Number(template.itemCount) || 0;
    if (itemCount <= 0) {
      throw createAppError(400, "Template has no items to apply.");
    }

    const createdItems = [];

    for (let index = 0; index < itemCount; index += 1) {
      const item = {
        id: generateSequentialId("ci", db.checklistItems),
        listId: list.id,
        kitchenId: list.kitchenId,
        title: `${template.title} #${index + 1}`,
        recipeId: null,
        checked: false,
        status: TASK_STATUSES.PENDING,
        completedBy: null,
        completedAt: null,
        notes: "",
      };

      db.checklistItems.push(item);
      createdItems.push(item.id);
    }

    touchUser(db, currentUser.id);
    return { appliedToListId: list.id, createdItemIds: createdItems };
  });
}

