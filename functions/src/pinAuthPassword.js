export function normalizePin(pin) {
  return String(pin ?? "").trim();
}

/** Keep in sync with src/backend/auth/pinAuthPassword.js */
export function deriveAuthPasswordFromPin(pin) {
  const normalized = normalizePin(pin);

  if (!normalized) {
    return "";
  }

  return `PL${normalized}!`;
}
