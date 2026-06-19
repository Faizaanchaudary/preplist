function hasLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function readJson(key, fallbackValue = null) {
  if (!hasLocalStorage()) return fallbackValue;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallbackValue;
    return JSON.parse(raw);
  } catch {
    return fallbackValue;
  }
}

export function writeJson(key, value) {
  if (!hasLocalStorage()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota / serialisation failures in mock mode.
  }
}

export function removeItem(key) {
  if (!hasLocalStorage()) return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore failures.
  }
}

