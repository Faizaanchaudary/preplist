import { useMemo, useState } from "react";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Drawer from "../../../shared/ui/Drawer";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import Input from "../../../shared/ui/Input";
import Modal from "../../../shared/ui/Modal";
import PageLoader from "../../../shared/ui/PageLoader";
import Tabs from "../../../shared/ui/Tabs";
import { formatDate } from "../../../shared/utils/formatDate";
import { formatTime } from "../../../shared/utils/formatTime";
import { useRecipeDraftsQuery } from "../api/useRecipeDraftsQuery";
import {
  useApproveRecipeDraftMutation,
  useRejectRecipeDraftMutation,
} from "../api/useRecipeMutations";
import RecipeIngredientsList from "./RecipeIngredientsList";
import RecipeStepsList from "./RecipeStepsList";

const DRAFT_FILTERS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

function getStatusLabel(status) {
  if (status === "approved") return "Approved";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

function getStatusVariant(status) {
  if (status === "approved") return "success";
  if (status === "rejected") return "neutral";
  return "warning";
}

function resolveKitchenLabel(kitchenId, kitchenLookup) {
  if (!kitchenId) return "\u2014";
  const kitchen = kitchenLookup.get(kitchenId);
  if (!kitchen) return kitchenId;
  return kitchen.siteCode ? `${kitchen.name} (${kitchen.siteCode})` : kitchen.name;
}

function RejectDraftModal({
  open,
  draft,
  pending,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
}) {
  return (
    <Modal
      open={open}
      onClose={pending ? undefined : onClose}
      title="Reject recipe draft"
      description="Optionally include a short reason for rejecting this draft."
    >
      <div className="space-y-4">
        {draft ? (
          <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Draft
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
              {draft.title}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Submitted by {draft.submittedByName}
            </p>
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            Reason (optional)
          </label>
          <Input
            value={reason}
            onChange={(event) => onReasonChange?.(event.target.value)}
            placeholder="Needs clearer quantities or steps"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Rejecting..." : "Reject draft"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function RecipeDraftsDrawer({
  open,
  onClose,
  kitchens = [],
  canApprove = false,
  defaultStatus = "pending",
}) {
  const [status, setStatus] = useState(defaultStatus);
  const [expandedDraftId, setExpandedDraftId] = useState(null);
  const [rejectDraft, setRejectDraft] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const approveMutation = useApproveRecipeDraftMutation();
  const rejectMutation = useRejectRecipeDraftMutation();

  const kitchenLookup = useMemo(() => {
    const rows = Array.isArray(kitchens) ? kitchens : [];
    return new Map(rows.map((kitchen) => [kitchen.id, kitchen]));
  }, [kitchens]);

  const filters = useMemo(() => ({ status }), [status]);
  const draftsQuery = useRecipeDraftsQuery(filters, {
    enabled: open,
    retry: 0,
    refetchOnWindowFocus: false,
  });

  const rows = Array.isArray(draftsQuery.data?.rows) ? draftsQuery.data.rows : [];

  const hasPendingActions = approveMutation.isPending || rejectMutation.isPending;
  const actionErrorMessage =
    approveMutation.error?.message || rejectMutation.error?.message || "";

  async function handleApprove(draftId) {
    if (!draftId || approveMutation.isPending) return;

    try {
      await approveMutation.mutateAsync({ draftId });
      setExpandedDraftId(null);
    } catch {
      // Error surfaced in mutation state.
    }
  }

  async function handleReject() {
    if (!rejectDraft?.id || rejectMutation.isPending) return;

    try {
      await rejectMutation.mutateAsync({
        draftId: rejectDraft.id,
        reason: rejectReason,
      });
      setRejectDraft(null);
      setRejectReason("");
      setExpandedDraftId(null);
    } catch {
      // Error surfaced in mutation state.
    }
  }

  return (
    <>
      <Drawer
        open={open}
        onClose={hasPendingActions ? undefined : onClose}
        title={canApprove ? "Recipe drafts" : "My recipe drafts"}
        description={
          canApprove
            ? "Review scanned drafts pending chef approval. Approving publishes a live recipe."
            : "Your scanned drafts are saved for chef review. You can track their status here."
        }
      >
        <div className="space-y-5">
          <Tabs items={DRAFT_FILTERS} value={status} onChange={setStatus} />

          {draftsQuery.isLoading ? <PageLoader /> : null}

          {!draftsQuery.isLoading && draftsQuery.isError ? (
            <ErrorState title="Unable to load drafts" error={draftsQuery.error} />
          ) : null}

          {!draftsQuery.isLoading && !draftsQuery.isError && actionErrorMessage ? (
            <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{actionErrorMessage}</p>
            </div>
          ) : null}

          {!draftsQuery.isLoading && !draftsQuery.isError && !rows.length ? (
            <EmptyState
              title="No drafts found"
              description="No recipe drafts match the current filter."
            />
          ) : null}

          {!draftsQuery.isLoading && !draftsQuery.isError && rows.length ? (
            <div className="space-y-4">
              {rows.map((draft) => {
                const isExpanded = expandedDraftId === draft.id;
                const kitchenLabel = resolveKitchenLabel(
                  draft.kitchenIds?.[0] ?? null,
                  kitchenLookup
                );
                const isPendingDraft = draft.status === "pending";

                return (
                  <div
                    key={draft.id}
                    className="rounded-[22px] border border-[var(--stroke-soft)] bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                          {draft.title}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {kitchenLabel} · {draft.section} · {draft.category}
                        </p>
                        <p className="mt-2 text-xs text-[var(--text-muted)]">
                          Submitted by {draft.submittedByName} · {formatDate(draft.updatedAt)}{" "}
                          {formatTime(draft.updatedAt)}
                        </p>
                        {draft.reviewedByName ? (
                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            Reviewed by {draft.reviewedByName}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Badge variant={getStatusVariant(draft.status)}>
                          {getStatusLabel(draft.status)}
                        </Badge>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setExpandedDraftId((previous) =>
                              previous === draft.id ? null : draft.id
                            )
                          }
                        >
                          {isExpanded ? "Hide" : "Review"}
                        </Button>
                      </div>
                    </div>

                    {isExpanded ? (
                      <div className="mt-4 space-y-5">
                        {draft.notes ? (
                          <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
                            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                              Notes
                            </p>
                            <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
                              {draft.notes}
                            </p>
                          </div>
                        ) : null}

                        <RecipeIngredientsList
                          ingredients={Array.isArray(draft.ingredients) ? draft.ingredients : []}
                        />
                        <RecipeStepsList
                          steps={Array.isArray(draft.steps) ? draft.steps : []}
                        />

                        {canApprove && isPendingDraft ? (
                          <div className="flex flex-wrap justify-end gap-3">
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setRejectReason("");
                                setRejectDraft(draft);
                              }}
                              disabled={hasPendingActions}
                            >
                              Reject
                            </Button>
                            <Button
                              onClick={() => handleApprove(draft.id)}
                              disabled={hasPendingActions}
                            >
                              {approveMutation.isPending ? "Approving..." : "Approve & publish"}
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </Drawer>

      <RejectDraftModal
        open={Boolean(rejectDraft)}
        draft={rejectDraft}
        pending={rejectMutation.isPending}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onClose={() => {
          setRejectDraft(null);
          setRejectReason("");
        }}
        onConfirm={handleReject}
      />
    </>
  );
}
