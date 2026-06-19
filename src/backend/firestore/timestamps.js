import { Timestamp } from "firebase/firestore";

export function toIsoString(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  return null;
}

export function fromFirestoreValue(value) {
  if (value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => fromFirestoreValue(entry));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, fromFirestoreValue(entry)])
    );
  }

  return value;
}

export function toFirestoreValue(value) {
  if (value === null || value === undefined) return null;

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (
      /^\d{4}-\d{2}-\d{2}T/.test(value) &&
      !Number.isNaN(parsed)
    ) {
      return Timestamp.fromDate(new Date(parsed));
    }
    return value;
  }

  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toFirestoreValue(entry));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, toFirestoreValue(entry)])
    );
  }

  return value;
}

export function documentToEntity(snapshot) {
  const data = snapshot.data();
  return fromFirestoreValue({
    id: data?.id ?? snapshot.id,
    ...data,
  });
}
