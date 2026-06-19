const ALPHANUMERIC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function normalizeExistingCodes(existing = []) {
  if (!Array.isArray(existing)) return new Set();

  return new Set(
    existing
      .map((entry) => {
        if (typeof entry === "string") return entry.trim().toUpperCase();
        if (typeof entry?.code === "string") return entry.code.trim().toUpperCase();
        return "";
      })
      .filter(Boolean)
  );
}

function generateRawCode(length = 6) {
  return Array.from({ length }, () => {
    const index = Math.floor(Math.random() * ALPHANUMERIC.length);
    return ALPHANUMERIC[index];
  }).join("");
}

// Supports both:
// - generateAccessCode(6)
// - generateAccessCode(existingCodesOrEntries, 6)
export function generateAccessCode(existingOrLength = 6, maybeLength = 6) {
  const existing = Array.isArray(existingOrLength) ? existingOrLength : [];
  const length = Array.isArray(existingOrLength) ? maybeLength : existingOrLength;

  const normalizedLength = Math.max(4, Number(length) || 6);
  const existingSet = normalizeExistingCodes(existing);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = generateRawCode(normalizedLength);
    if (!existingSet.has(code)) return code;
  }

  return `${Date.now()}`.slice(-normalizedLength).padStart(normalizedLength, "0");
}
