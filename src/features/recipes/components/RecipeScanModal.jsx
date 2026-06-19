import { useState } from "react";
import Button from "../../../shared/ui/Button";
import Modal from "../../../shared/ui/Modal";
import { useScanRecipeMutation } from "../api/useRecipeMutations";
import {
  RECIPE_CSV_ACCEPTED_COLUMNS,
  RECIPE_CSV_REQUIRED_COLUMNS,
  parseRecipeCsv,
} from "../utils/parseRecipeCsv";

export default function RecipeScanModal({
  open,
  onClose,
  onScanned,
}) {
  const scanMutation = useScanRecipeMutation();

  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [localError, setLocalError] = useState("");

  function resetForm() {
    setFileName("");
    setSelectedFile(null);
    setLocalError("");
    scanMutation.reset();
  }

  function handleClose() {
    if (scanMutation.isPending) return;
    resetForm();
    onClose?.();
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setFileName(file?.name ?? "");
    setLocalError("");
    scanMutation.reset();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLocalError("");

    if (scanMutation.isPending) return;

    if (!selectedFile) {
      setLocalError("Please choose a CSV file to upload.");
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setLocalError("Only .csv files are accepted.");
      return;
    }

    try {
      const text = await selectedFile.text();
      const recipe = parseRecipeCsv(text);

      const data = await scanMutation.mutateAsync({
        sourceName: selectedFile.name,
        recipe,
      });

      onScanned?.(data?.draft ?? null);
      resetForm();
      onClose?.();
    } catch (error) {
      setLocalError(error?.message || "Unable to import recipe from CSV.");
    }
  }

  const errorMessage = localError || scanMutation.error?.message || "";

  return (
    <Modal
      open={open}
      onClose={scanMutation.isPending ? undefined : handleClose}
      title="Import recipe from CSV"
      description="Upload a CSV file with the accepted recipe fields. Ingredients and steps use | between items."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
            CSV file
          </label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="block w-full rounded-[16px] border border-[var(--stroke-soft)] bg-white px-3 py-3 text-sm text-[var(--text-primary)] file:mr-3 file:rounded-[12px] file:border-0 file:bg-[var(--surface-soft)] file:px-3 file:py-2 file:text-sm file:font-medium"
          />
          {fileName ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">Selected: {fileName}</p>
          ) : null}
        </div>

        <div className="rounded-[18px] border border-[var(--stroke-soft)] bg-[var(--surface-soft)] px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Required columns
          </p>
          <p className="mt-2 text-sm text-[var(--text-primary)]">
            {RECIPE_CSV_REQUIRED_COLUMNS.join(", ")}
          </p>
          <p className="mt-3 text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Optional columns
          </p>
          <p className="mt-2 text-sm text-[var(--text-primary)]">
            {RECIPE_CSV_ACCEPTED_COLUMNS.filter(
              (column) => !RECIPE_CSV_REQUIRED_COLUMNS.includes(column)
            ).join(", ")}
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={scanMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={scanMutation.isPending || !selectedFile}>
            {scanMutation.isPending ? "Importing..." : "Import CSV"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
