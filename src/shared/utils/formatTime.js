export function formatTime(value, options = {}) {
  if (!value) return "—";

  const date = new Date(value);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    ...options,
  }).format(date);
}