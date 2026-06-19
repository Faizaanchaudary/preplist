function padIdNumber(value, size = 3) {
  return String(value).padStart(size, "0");
}

export function generateSequentialId(prefix, collection, size = 3) {
  const normalizedPrefix = String(prefix).trim();
  const target = `${normalizedPrefix}-`;

  const max = (Array.isArray(collection) ? collection : [])
    .map((entry) => entry?.id)
    .filter((id) => typeof id === "string" && id.startsWith(target))
    .map((id) => Number(id.slice(target.length)))
    .filter((value) => Number.isFinite(value))
    .reduce((accumulator, value) => Math.max(accumulator, value), 0);

  return `${normalizedPrefix}-${padIdNumber(max + 1, size)}`;
}

