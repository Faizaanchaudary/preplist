import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { carryForwardList } from "../../shared/utils/carryForwardList.js";
import { isFirebaseConfigured, getDb } from "../config/firebase.js";
import {
  COLLECTION_KEY_MAP,
  DB_COLLECTION_KEYS,
} from "../firestore/collections.js";
import { documentToEntity, toFirestoreValue } from "../firestore/timestamps.js";
import { createAppError } from "../core/errors.js";

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

function createEmptyDb() {
  return {
    version: DB_VERSION,
    meta: {
      seededAt: new Date().toISOString(),
      lastCarryForwardRunAt: null,
    },
    companies: [],
    kitchens: [],
    users: [],
    kitchenSections: [],
    kitchenMemberships: [],
    accessCodes: [],
    lists: [],
    checklistItems: [],
    templates: [],
    activityLogs: [],
    listSnapshots: [],
    photos: [],
    completions: [],
    subscriptionPlans: [],
    recipes: [],
    recipeDrafts: [],
    // Category collections — seeded via seedCategories.mjs
    recipeCategories: [],
    templateCategories: [],
    activityCategories: [],
  };
}


function ensureCarryForwardSnapshots(dbState, now = new Date()) {
  const todayStart = startOfDay(now);
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  if (yesterdayStart.getTime() < 0) return false;

  const earliestAllowed = new Date(todayStart);
  earliestAllowed.setDate(earliestAllowed.getDate() - MAX_CARRY_FORWARD_DAYS);

  let changed = false;

  dbState.lists.forEach((list) => {
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

      const alreadyCaptured = dbState.listSnapshots.some(
        (snapshot) =>
          snapshot.listId === list.id &&
          isSameLocalDay(snapshot.snapshotDate, snapshotDate)
      );

      if (alreadyCaptured) continue;

      const items = dbState.checklistItems.filter((item) => item.listId === list.id);
      dbState.listSnapshots.unshift(carryForwardList(list, items, snapshotDate));
      changed = true;
    }
  });

  if (changed) {
    dbState.meta.lastCarryForwardRunAt = now.toISOString();
  }

  return changed;
}

async function fetchCollection(key) {
  const collectionName = COLLECTION_KEY_MAP[key];
  const snapshot = await getDocs(collection(getDb(), collectionName));

  return snapshot.docs.map((entry) => documentToEntity(entry));
}

function indexById(items = []) {
  return new Map(items.map((item) => [item.id, item]));
}

function diffCollection(before = [], after = []) {
  const beforeMap = indexById(before);
  const afterMap = indexById(after);

  const upserts = [];
  const deletions = [];

  after.forEach((item) => {
    const previous = beforeMap.get(item.id);
    if (!previous || JSON.stringify(previous) !== JSON.stringify(item)) {
      upserts.push(item);
    }
  });

  before.forEach((item) => {
    if (!afterMap.has(item.id)) {
      deletions.push(item.id);
    }
  });

  return { upserts, deletions };
}

async function persistDb(beforeDb, afterDb) {
  if (!isFirebaseConfigured()) return;

  const batch = writeBatch(getDb());
  let operationCount = 0;

  async function commitIfNeeded(force = false) {
    if (!operationCount) return;
    if (force || operationCount >= 400) {
      await batch.commit();
      operationCount = 0;
    }
  }

  for (const key of DB_COLLECTION_KEYS) {
    const collectionName = COLLECTION_KEY_MAP[key];
    const { upserts, deletions } = diffCollection(beforeDb[key], afterDb[key]);

    for (const item of upserts) {
      const docId = item.id;
      if (!docId) continue;

      batch.set(
        doc(getDb(), collectionName, docId),
        toFirestoreValue({ ...item, id: docId }),
        { merge: true }
      );
      operationCount += 1;

      if (operationCount >= 400) {
        await batch.commit();
        operationCount = 0;
      }
    }

    for (const docId of deletions) {
      batch.delete(doc(getDb(), collectionName, docId));
      operationCount += 1;

      if (operationCount >= 400) {
        await batch.commit();
        operationCount = 0;
      }
    }
  }

  if (operationCount > 0) {
    await batch.commit();
  }
}

export async function readDb() {
  if (!isFirebaseConfigured()) {
    throw createAppError(
      503,
      "Firebase is not configured. Add VITE_FIREBASE_* values to your environment."
    );
  }

  const entries = await Promise.all(
    DB_COLLECTION_KEYS.map(async (key) => [key, await fetchCollection(key)])
  );

  const nextDb = createEmptyDb();

  entries.forEach(([key, value]) => {
    nextDb[key] = value;
  });

  ensureCarryForwardSnapshots(nextDb);

  return nextDb;
}

export async function withDbUpdate(mutator) {
  const beforeDb = await readDb();
  const workingDb = deepClone(beforeDb);
  const result = await mutator(workingDb);

  ensureCarryForwardSnapshots(workingDb);
  await persistDb(beforeDb, workingDb);

  return result;
}

export async function writeEntity(collectionKey, entity) {
  if (!isFirebaseConfigured()) return entity;

  const collectionName = COLLECTION_KEY_MAP[collectionKey];
  const docId = entity.id;

  if (!collectionName || !docId) return entity;

  await setDoc(
    doc(getDb(), collectionName, docId),
    toFirestoreValue({ ...entity, id: docId }),
    { merge: true }
  );

  return entity;
}

export async function deleteEntity(collectionKey, docId) {
  if (!isFirebaseConfigured() || !docId) return;

  const collectionName = COLLECTION_KEY_MAP[collectionKey];
  if (!collectionName) return;

  await deleteDoc(doc(getDb(), collectionName, docId));
}
