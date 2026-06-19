export const RECIPE_CSV_REQUIRED_COLUMNS = [
  "title",
  "section",
  "ingredients",
  "steps",
];

export const RECIPE_CSV_OPTIONAL_COLUMNS = [
  "category",
  "prep_time_minutes",
  "yield",
  "notes",
];

export const RECIPE_CSV_ACCEPTED_COLUMNS = [
  ...RECIPE_CSV_REQUIRED_COLUMNS,
  ...RECIPE_CSV_OPTIONAL_COLUMNS,
];

function normalizeHeader(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function splitListField(value) {
  return String(value ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function parseCsvRows(text) {
  const lines = String(text ?? "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    throw new Error("CSV file is empty.");
  }

  return lines.map(parseCsvLine);
}

export function parseRecipeCsv(text) {
  const rows = parseCsvRows(text);

  if (rows.length < 2) {
    throw new Error("CSV must include a header row and one recipe row.");
  }

  const headers = rows[0].map(normalizeHeader);
  const dataRow = rows[1];

  const missingColumns = RECIPE_CSV_REQUIRED_COLUMNS.filter(
    (column) => !headers.includes(column)
  );

  if (missingColumns.length) {
    throw new Error(
      `Missing required columns: ${missingColumns.join(", ")}. Accepted columns: ${RECIPE_CSV_ACCEPTED_COLUMNS.join(", ")}.`
    );
  }

  const unknownColumns = headers.filter(
    (header) => header && !RECIPE_CSV_ACCEPTED_COLUMNS.includes(header)
  );

  if (unknownColumns.length) {
    throw new Error(
      `Unknown columns: ${unknownColumns.join(", ")}. Accepted columns: ${RECIPE_CSV_ACCEPTED_COLUMNS.join(", ")}.`
    );
  }

  const record = {};

  headers.forEach((header, index) => {
    if (!header) return;
    record[header] = dataRow[index] ?? "";
  });

  const title = String(record.title ?? "").trim();
  const section = String(record.section ?? "").trim();
  const ingredients = splitListField(record.ingredients);
  const steps = splitListField(record.steps);

  if (!title) {
    throw new Error("Recipe title is required.");
  }

  if (!section) {
    throw new Error("Section is required.");
  }

  if (!ingredients.length) {
    throw new Error("At least one ingredient is required. Separate items with | in the ingredients column.");
  }

  if (!steps.length) {
    throw new Error("At least one step is required. Separate steps with | in the steps column.");
  }

  const prepTimeRaw = String(record.prep_time_minutes ?? "").trim();
  const prepTimeMinutes = prepTimeRaw ? Number(prepTimeRaw) : null;

  if (prepTimeRaw && !Number.isFinite(prepTimeMinutes)) {
    throw new Error("prep_time_minutes must be a number.");
  }

  return {
    title,
    section,
    category: String(record.category ?? "").trim() || "Imported",
    prepTimeMinutes,
    yield: String(record.yield ?? "").trim(),
    notes: String(record.notes ?? "").trim(),
    ingredients,
    steps,
  };
}
