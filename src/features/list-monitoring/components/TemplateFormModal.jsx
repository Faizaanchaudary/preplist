import { useMemo, useState } from "react";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import Modal from "../../../shared/ui/Modal";
import { useCreateTemplateMutation } from "../api/useListMonitoringMutations";

export default function TemplateFormModal({
  open,
  onClose,
}) {
  const createTemplateMutation = useCreateTemplateMutation();

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [title, setTitle] = useState("");
  const [section, setSection] = useState("");
  const [itemCount, setItemCount] = useState("6");

  function resetForm() {
    setHasSubmitted(false);
    setTitle("");
    setSection("");
    setItemCount("6");
    createTemplateMutation.reset();
  }

  function handleClose() {
    if (createTemplateMutation.isPending) return;
    resetForm();
    onClose?.();
  }

  const validation = useMemo(() => {
    const parsedItemCount = Number(itemCount);

    return {
      title:
        title.trim().length >= 2 ? "" : "Template title must be at least 2 characters.",
      section: section.trim() ? "" : "Template section is required.",
      itemCount:
        Number.isFinite(parsedItemCount) && parsedItemCount >= 1 && parsedItemCount <= 50
          ? ""
          : "Item count must be between 1 and 50.",
    };
  }, [title, section, itemCount]);

  const hasErrors = Object.values(validation).some(Boolean);

  async function handleSubmit(event) {
    event.preventDefault();
    setHasSubmitted(true);

    if (hasErrors || createTemplateMutation.isPending) return;

    try {
      await createTemplateMutation.mutateAsync({
        title: title.trim(),
        section: section.trim(),
        itemCount: Math.trunc(Number(itemCount)),
      });

      handleClose();
    } catch {
      // Mutation errors are surfaced via createTemplateMutation.error.
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create template"
      description="Save a reusable checklist template. Items are generated when you apply the template in the mock flow."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            Template title
          </label>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Breakfast Open"
            autoComplete="off"
          />
          {hasSubmitted && validation.title ? (
            <p className="text-sm text-red-600">{validation.title}</p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Section
            </label>
            <Input
              value={section}
              onChange={(event) => setSection(event.target.value)}
              placeholder="Prep"
              autoComplete="off"
            />
            {hasSubmitted && validation.section ? (
              <p className="text-sm text-red-600">{validation.section}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Item count
            </label>
            <Input
              type="number"
              min={1}
              max={50}
              value={itemCount}
              onChange={(event) => setItemCount(event.target.value)}
            />
            {hasSubmitted && validation.itemCount ? (
              <p className="text-sm text-red-600">{validation.itemCount}</p>
            ) : null}
          </div>
        </div>

        {createTemplateMutation.error ? (
          <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              {createTemplateMutation.error.message}
            </p>
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={createTemplateMutation.isPending}
            className="disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={hasErrors || createTemplateMutation.isPending}
            className="disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createTemplateMutation.isPending ? "Creating..." : "Create template"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
