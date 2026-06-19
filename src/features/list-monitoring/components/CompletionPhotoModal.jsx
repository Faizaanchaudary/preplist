import { useEffect, useMemo, useState } from "react";
import Modal from "../../../shared/ui/Modal";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import { formatDate } from "../../../shared/utils/formatDate";
import { formatTime } from "../../../shared/utils/formatTime";
import { TASK_STATUSES } from "../../../shared/constants/taskStatuses";
import { useAttachChecklistItemPhotoMutation } from "../api/useListMonitoringMutations";
import ProofImagePreview from "../../../shared/ui/ProofImagePreview";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

function isImageFile(file) {
  return Boolean(file && String(file.type).startsWith("image/"));
}

export default function CompletionPhotoModal({
  open,
  onClose,
  item,
  photo,
}) {
  const attachPhotoMutation = useAttachChecklistItemPhotoMutation();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [label, setLabel] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");

  const isAttachMode = Boolean(item) && !photo;
  const isCompleted = item?.status === TASK_STATUSES.COMPLETED;

  useEffect(() => {
    if (!open) return;

    setHasSubmitted(false);
    setLabel(item ? `${item.title} proof` : "");
    setSelectedFile(null);
    setLocalPreviewUrl("");
    attachPhotoMutation.reset();
  }, [open, item?.id]);

  useEffect(() => {
    if (!selectedFile) {
      setLocalPreviewUrl("");
      return undefined;
    }

    const previewUrl = URL.createObjectURL(selectedFile);
    setLocalPreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedFile]);

  const validation = useMemo(() => {
    const trimmed = label.trim();

    return {
      label: trimmed ? "" : "Photo label is required.",
      file:
        selectedFile && isImageFile(selectedFile)
          ? selectedFile.size > MAX_PHOTO_BYTES
            ? "Image must be smaller than 10 MB."
            : ""
          : "Please select an image file.",
    };
  }, [label, selectedFile]);

  const hasErrors =
    !isCompleted || Object.values(validation).some(Boolean);

  function handleClose() {
    if (attachPhotoMutation.isPending) return;
    attachPhotoMutation.reset();
    setHasSubmitted(false);
    setSelectedFile(null);
    onClose?.();
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setHasSubmitted(false);
    attachPhotoMutation.reset();
  }

  async function handleAttach(event) {
    event.preventDefault();
    setHasSubmitted(true);

    if (!item || hasErrors || attachPhotoMutation.isPending || !selectedFile) return;

    try {
      await attachPhotoMutation.mutateAsync({
        listId: item.listId,
        itemId: item.id,
        kitchenId: item.kitchenId,
        label: label.trim(),
        file: selectedFile,
      });

      handleClose();
    } catch {
      // Mutation errors are surfaced via attachPhotoMutation.error.
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Completion proof"
      description="Upload a photo as proof that this checklist task was completed."
    >
      {item && photo ? (
        <div className="space-y-4">
          <ProofImagePreview url={photo.url} label={photo.label} />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Task
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                {item.title}
              </p>
            </div>

            <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Uploaded
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                {formatDate(photo.uploadedAt)} · {formatTime(photo.uploadedAt)}
              </p>
            </div>
          </div>

          {photo.label ? (
            <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Label
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                {photo.label}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {item && isAttachMode ? (
        <form onSubmit={handleAttach} className="space-y-4">
          <ProofImagePreview
            url={localPreviewUrl}
            label={label}
            emptyTitle="Attach completion proof"
            emptyDescription="Choose a photo from your device. JPG, PNG, and WebP are supported."
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Photo file
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={attachPhotoMutation.isPending}
              inputClassName="py-2.5"
            />
            {hasSubmitted && validation.file ? (
              <p className="text-sm text-red-600">{validation.file}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Photo label
            </label>
            <Input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Prep completion proof"
              autoComplete="off"
              disabled={attachPhotoMutation.isPending}
            />
            {hasSubmitted && validation.label ? (
              <p className="text-sm text-red-600">{validation.label}</p>
            ) : null}
          </div>

          {!isCompleted ? (
            <div className="rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-800">
                Complete this item before attaching proof.
              </p>
            </div>
          ) : null}

          {attachPhotoMutation.error ? (
            <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">
                {attachPhotoMutation.error.message}
              </p>
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={attachPhotoMutation.isPending}
              className="disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={hasErrors || attachPhotoMutation.isPending}
              className="disabled:cursor-not-allowed disabled:opacity-60"
            >
              {attachPhotoMutation.isPending ? "Uploading..." : "Attach proof"}
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
