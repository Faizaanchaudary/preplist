import { cn } from "../utils/cn";

const EMPTY_CELL = "\u2014";

const VISIBILITY_CLASSES = {
  sm: { cards: "sm:hidden", table: "hidden sm:block" },
  md: { cards: "md:hidden", table: "hidden md:block" },
  lg: { cards: "lg:hidden", table: "hidden lg:block" },
};

function normalizeBreakpoint(value) {
  return value === "sm" || value === "md" || value === "lg" ? value : "md";
}

function buildHiddenKeySet(keys) {
  return new Set(
    (Array.isArray(keys) ? keys : [])
      .map((key) => (typeof key === "string" ? key.trim() : ""))
      .filter(Boolean)
  );
}

export default function Table({
  columns = [],
  rows = [],
  className,
  getRowKey,
  emptyMessage = "No records available.",
  mobileHiddenColumns = [],
  mobileCardTitleKey,
  mobileStackBreakpoint = "md",
  responsiveMode = "stack",
  tableMinWidthClassName = "min-w-[720px]",
}) {
  const safeColumns = Array.isArray(columns) ? columns : [];
  const safeRows = Array.isArray(rows) ? rows : [];
  const hiddenColumnKeys = buildHiddenKeySet(mobileHiddenColumns);

  const resolveRowKey =
    typeof getRowKey === "function"
      ? getRowKey
      : (row, rowIndex) => row?.id ?? rowIndex;

  const isScrollMode = responsiveMode === "scroll";

  const visibility = isScrollMode
    ? { cards: "hidden", table: "block" }
    : VISIBILITY_CLASSES[normalizeBreakpoint(mobileStackBreakpoint)];

  const normalizedTitleKey =
    typeof mobileCardTitleKey === "string" ? mobileCardTitleKey.trim() : "";

  function resolveColumnLabel(column) {
    return column?.label ?? column?.key ?? "";
  }

  function resolveCellValue(column, row) {
    if (typeof column?.render === "function") {
      const rendered = column.render(row);
      return rendered ?? EMPTY_CELL;
    }

    const key = column?.key;
    if (!key) return EMPTY_CELL;
    return row?.[key] ?? EMPTY_CELL;
  }

  const mobileColumns = safeColumns.filter((column) => {
    const key = typeof column?.key === "string" ? column.key : "";
    if (!key) return true;
    if (normalizedTitleKey && key === normalizedTitleKey) return false;
    return !hiddenColumnKeys.has(key);
  });

  return (
    <div className={cn("min-w-0 w-full", className)}>
      <div className={cn(visibility.cards, "space-y-3")}>
        {safeRows.length ? (
          safeRows.map((row, rowIndex) => {
            const rowKey = resolveRowKey(row, rowIndex);
            const titleColumn = normalizedTitleKey
              ? safeColumns.find((column) => column?.key === normalizedTitleKey)
              : null;

            const titleValue =
              normalizedTitleKey && titleColumn
                ? resolveCellValue(titleColumn, row)
                : normalizedTitleKey
                  ? row?.[normalizedTitleKey] ?? null
                  : null;

            const showTitle =
              titleValue !== null && titleValue !== undefined && titleValue !== "";

            return (
              <div
                key={rowKey}
                className="rounded-[22px] bg-[var(--surface-soft)] p-4 sm:p-5"
              >
                {showTitle ? (
                  <div className="mb-3 min-w-0 break-words text-sm font-semibold text-[var(--text-primary)]">
                    {titleValue}
                  </div>
                ) : null}

                <dl className="space-y-3">
                  {mobileColumns.map((column, columnIndex) => (
                    <div
                      key={column?.key ?? column?.label ?? columnIndex}
                      className="grid min-w-0 grid-cols-1 gap-1 sm:grid-cols-[140px_1fr] sm:gap-3"
                    >
                      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                        {resolveColumnLabel(column)}
                      </dt>
                      <dd className="min-w-0 text-sm text-[var(--text-primary)]">
                        <div className="min-w-0 whitespace-normal break-words">
                          {resolveCellValue(column, row)}
                        </div>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            );
          })
        ) : (
          <div className="rounded-[22px] bg-[var(--surface-soft)] p-6 text-center text-sm text-[var(--text-muted)]">
            {emptyMessage}
          </div>
        )}
      </div>

      <div className={cn(visibility.table, "w-full min-w-0 overflow-x-auto")}>
        <table
          className={cn(
            "w-full border-separate border-spacing-y-2",
            tableMinWidthClassName
          )}
        >
          <thead>
            <tr>
              {safeColumns.map((column, columnIndex) => (
                <th
                  key={column?.key ?? column?.label ?? columnIndex}
                  className={cn(
                    "px-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] sm:text-xs",
                    "whitespace-nowrap",
                    column?.headerClassName
                  )}
                >
                  {column?.label ?? ""}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {safeRows.length ? (
              safeRows.map((row, rowIndex) => (
                <tr
                  key={resolveRowKey(row, rowIndex)}
                  className="rounded-[18px] bg-[var(--surface-soft)]"
                >
                  {safeColumns.map((column, columnIndex) => (
                    <td
                      key={column?.key ?? column?.label ?? columnIndex}
                      className="px-4 py-3 text-sm text-[var(--text-primary)] align-top first:rounded-l-[18px] last:rounded-r-[18px]"
                    >
                      <div className={cn("min-w-0 break-words", column?.cellClassName)}>
                        {typeof column?.render === "function"
                          ? column.render(row)
                          : row?.[column?.key] ?? EMPTY_CELL}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr className="rounded-[18px] bg-[var(--surface-soft)]">
                <td
                  colSpan={Math.max(safeColumns.length, 1)}
                  className="rounded-[18px] px-4 py-6 text-center text-sm text-[var(--text-muted)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
