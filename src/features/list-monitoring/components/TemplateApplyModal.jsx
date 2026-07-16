import { useMemo, useState } from "react";
import { useListMonitoringQuery } from "../api/useListMonitoringQuery";
import Button from "../../../shared/ui/Button";
import Modal from "../../../shared/ui/Modal";
import Select from "../../../shared/ui/Select";
import { useApplyTemplateMutation } from "../api/useListMonitoringMutations";

const EMPTY_ARRAY = [];

function buildKitchenOptions(lists = []) {
  const byKitchenId = new Map();

  lists.forEach((list) => {
    if (!list?.kitchenId) return;
    if (byKitchenId.has(list.kitchenId)) return;

    byKitchenId.set(list.kitchenId, list.kitchenName ?? "Unknown kitchen");
  });

  return Array.from(byKitchenId.entries()).map(([kitchenId, name]) => ({
    value: kitchenId,
    label: name,
  }));
}

function buildListOptions(lists = [], kitchenId) {
  return lists
    .filter((list) => (kitchenId ? list.kitchenId === kitchenId : true))
    .map((list) => ({
      value: list.id,
      label: `${list.section} · ${list.title}`,
    }));
}

export default function TemplateApplyModal({
  open,
  onClose,
  template,
}) {
  const applyTemplateMutation = useApplyTemplateMutation();

  const listQuery = useListMonitoringQuery({ section: "all" });
  const lists = useMemo(() => {
    const rows = listQuery.data?.lists;
    return Array.isArray(rows) ? rows : EMPTY_ARRAY;
  }, [listQuery.data?.lists]);

  const kitchenOptions = useMemo(() => buildKitchenOptions(lists), [lists]);

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [kitchenId, setKitchenId] = useState("");
  const [listId, setListId] = useState("");

  function resetForm() {
    setHasSubmitted(false);
    setKitchenId("");
    setListId("");
    applyTemplateMutation.reset();
  }

  function handleClose() {
    if (applyTemplateMutation.isPending) return;
    resetForm();
    onClose?.();
  }

  const resolvedKitchenId = kitchenId || kitchenOptions[0]?.value || "";
  const listOptions = useMemo(
    () => buildListOptions(lists, resolvedKitchenId),
    [lists, resolvedKitchenId]
  );
  const resolvedListId = listId || listOptions[0]?.value || "";

  const validation = useMemo(() => {
    return {
      kitchenId: resolvedKitchenId ? "" : "Kitchen is required.",
      listId: resolvedListId ? "" : "Destination list is required.",
    };
  }, [resolvedKitchenId, resolvedListId]);

  const hasErrors =
    !template ||
    Boolean(listQuery.isError) ||
    Object.values(validation).some(Boolean);

  async function handleSubmit(event) {
    event.preventDefault();
    setHasSubmitted(true);

    if (hasErrors || applyTemplateMutation.isPending) return;

    try {
      await applyTemplateMutation.mutateAsync({
        templateId: template.id,
        listId: resolvedListId,
      });

      handleClose();
    } catch {
      // Mutation errors are surfaced via applyTemplateMutation.error.
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Apply template"
      description="Apply a reusable template to an existing list. Mock-first flow generates checklist items."
    >
      {template ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Template
            </p>
            <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
              {template.title} · {template.category} · {template.itemCount} items
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Kitchen
              </label>
              <Select
                value={resolvedKitchenId}
                onChange={(event) => {
                  setKitchenId(event.target.value);
                  setListId("");
                  setHasSubmitted(false);
                  applyTemplateMutation.reset();
                }}
                options={
                  kitchenOptions.length
                    ? kitchenOptions
                    : [{ value: "", label: listQuery.isLoading ? "Loading..." : "No kitchens found" }]
                }
                disabled={listQuery.isLoading || listQuery.isError}
              />
              {hasSubmitted && validation.kitchenId ? (
                <p className="text-sm text-red-600">{validation.kitchenId}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Destination list
              </label>
              <Select
                value={resolvedListId}
                onChange={(event) => setListId(event.target.value)}
                options={
                  listOptions.length
                    ? listOptions
                    : [
                        {
                          value: "",
                          label: resolvedKitchenId
                            ? "No lists found"
                            : "Select a kitchen first",
                        },
                      ]
                }
                disabled={!resolvedKitchenId || listQuery.isLoading || listQuery.isError}
              />
              {hasSubmitted && validation.listId ? (
                <p className="text-sm text-red-600">{validation.listId}</p>
              ) : null}
            </div>
          </div>

          {listQuery.isError ? (
            <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">
                Unable to load lists. Please try again.
              </p>
            </div>
          ) : null}

          {applyTemplateMutation.error ? (
            <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">
                {applyTemplateMutation.error.message}
              </p>
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={applyTemplateMutation.isPending}
              className="disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                hasErrors || applyTemplateMutation.isPending || listQuery.isLoading
              }
              className="disabled:cursor-not-allowed disabled:opacity-60"
            >
              {applyTemplateMutation.isPending ? "Applying..." : "Apply template"}
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
