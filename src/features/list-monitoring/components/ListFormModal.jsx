import { useMemo, useState } from "react";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import Modal from "../../../shared/ui/Modal";
import Select from "../../../shared/ui/Select";
import { useKitchenManagementQuery } from "../../kitchen-management/api/useKitchenManagementQuery";
import { useCreateListMutation } from "../api/useListMonitoringMutations";

const EMPTY_ARRAY = [];

function getKitchenOptions(kitchens) {
  return kitchens.map((kitchen) => ({
    value: kitchen.id,
    label: `${kitchen.name} · ${kitchen.siteCode}`,
  }));
}

function getSectionOptions(sections = []) {
  const sectionNames = sections
    .map((section) => section?.name)
    .filter((name) => typeof name === "string" && name.trim());

  const unique = [...new Set(sectionNames)];

  const resolved = unique.length ? unique : ["General"];

  return resolved.map((name) => ({ value: name, label: name }));
}

export default function ListFormModal({
  open,
  onClose,
  onCreated,
}) {
  const createListMutation = useCreateListMutation();

  const kitchensQuery = useKitchenManagementQuery();

  const kitchens = useMemo(() => {
    const rows = kitchensQuery.data?.kitchens;
    return Array.isArray(rows) ? rows : EMPTY_ARRAY;
  }, [kitchensQuery.data?.kitchens]);

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [kitchenId, setKitchenId] = useState("");
  const [section, setSection] = useState("");
  const [title, setTitle] = useState("");

  function resetForm() {
    setHasSubmitted(false);
    setKitchenId("");
    setSection("");
    setTitle("");
    createListMutation.reset();
  }

  function handleClose() {
    if (createListMutation.isPending) return;
    resetForm();
    onClose?.();
  }

  const resolvedKitchenId = kitchenId || kitchens[0]?.id || "";

  const selectedKitchen = useMemo(
    () => kitchens.find((kitchen) => kitchen.id === resolvedKitchenId),
    [kitchens, resolvedKitchenId]
  );

  const kitchenOptions = useMemo(() => getKitchenOptions(kitchens), [kitchens]);

  const sectionOptions = useMemo(
    () =>
      getSectionOptions(
        Array.isArray(selectedKitchen?.sections) ? selectedKitchen.sections : []
      ),
    [selectedKitchen]
  );

  const resolvedSection = sectionOptions.some(
    (option) => option.value === section
  )
    ? section
    : sectionOptions[0]?.value ?? "";

  const validation = useMemo(() => {
    return {
      kitchenId: resolvedKitchenId ? "" : "Kitchen selection is required.",
      section: resolvedSection ? "" : "Section selection is required.",
      title:
        title.trim().length >= 3 ? "" : "List title must be at least 3 characters.",
    };
  }, [resolvedKitchenId, resolvedSection, title]);

  const hasErrors =
    Boolean(kitchensQuery.isError) || Object.values(validation).some(Boolean);

  async function handleSubmit(event) {
    event.preventDefault();
    setHasSubmitted(true);

    if (hasErrors || createListMutation.isPending) return;

    try {
      const result = await createListMutation.mutateAsync({
        kitchenId: resolvedKitchenId,
        section: resolvedSection,
        title: title.trim(),
      });

      onCreated?.(result);
      handleClose();
    } catch {
      // Mutation errors are surfaced via createListMutation.error.
    }
  }

  const submitDisabled =
    hasErrors || createListMutation.isPending || kitchensQuery.isLoading;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create list"
      description="Create a new prep list. A unique access code is generated automatically in the mock flow."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Kitchen
            </label>
            <Select
              value={resolvedKitchenId}
              onChange={(event) => {
                setKitchenId(event.target.value);
                setSection("");
                setHasSubmitted(false);
                createListMutation.reset();
              }}
              options={
                kitchenOptions.length
                  ? kitchenOptions
                  : [{ value: "", label: "Loading kitchens..." }]
              }
              disabled={kitchensQuery.isLoading || kitchensQuery.isError}
            />
            {hasSubmitted && validation.kitchenId ? (
              <p className="text-sm text-red-600">{validation.kitchenId}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Section
            </label>
            <Select
              value={resolvedSection}
              onChange={(event) => setSection(event.target.value)}
              options={sectionOptions}
              disabled={!resolvedKitchenId || kitchensQuery.isLoading || kitchensQuery.isError}
            />
            {hasSubmitted && validation.section ? (
              <p className="text-sm text-red-600">{validation.section}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            List title
          </label>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Morning Grill Prep"
            autoComplete="off"
          />
          {hasSubmitted && validation.title ? (
            <p className="text-sm text-red-600">{validation.title}</p>
          ) : null}
        </div>

        {kitchensQuery.isError ? (
          <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              Unable to load kitchens. Please try again.
            </p>
          </div>
        ) : null}

        {createListMutation.error ? (
          <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              {createListMutation.error.message}
            </p>
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={createListMutation.isPending}
            className="disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitDisabled}
            className="disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createListMutation.isPending ? "Creating..." : "Create list"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
