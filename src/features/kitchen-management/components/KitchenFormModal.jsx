import { useMemo, useState } from "react";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import Modal from "../../../shared/ui/Modal";
import { useCreateKitchenMutation } from "../api/useKitchenManagementMutations";

function normalizeSiteCode(value) {
  return value.toUpperCase().replace(/\s+/g, "");
}

export default function KitchenFormModal({ open, onClose }) {
  const createKitchenMutation = useCreateKitchenMutation();

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [siteCode, setSiteCode] = useState("");

  function resetForm() {
    setHasSubmitted(false);
    setName("");
    setCity("");
    setSiteCode("");
    createKitchenMutation.reset();
  }

  function handleClose() {
    if (createKitchenMutation.isPending) return;
    resetForm();
    onClose?.();
  }

  const validation = useMemo(() => {
    const trimmedName = name.trim();
    const trimmedCity = city.trim();
    const normalizedSiteCode = normalizeSiteCode(siteCode.trim());

    return {
      name:
        trimmedName.length >= 2 ? "" : "Kitchen name must be at least 2 characters.",
      city: trimmedCity ? "" : "City is required.",
      siteCode:
        normalizedSiteCode && /^[A-Z0-9-]{2,12}$/.test(normalizedSiteCode)
          ? ""
          : "Site code is required (example: DT-01).",
    };
  }, [name, city, siteCode]);

  const hasErrors = Object.values(validation).some(Boolean);

  async function handleSubmit(event) {
    event.preventDefault();
    setHasSubmitted(true);

    if (hasErrors || createKitchenMutation.isPending) return;

    try {
      await createKitchenMutation.mutateAsync({
        name: name.trim(),
        city: city.trim(),
        siteCode: normalizeSiteCode(siteCode.trim()),
      });

      handleClose();
    } catch {
      // Mutation errors are surfaced via createKitchenMutation.error.
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add kitchen"
      description="Create a new kitchen entity for section grouping, access codes, and list monitoring."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            Kitchen name
          </label>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Downtown Kitchen"
            autoComplete="off"
          />
          {hasSubmitted && validation.name ? (
            <p className="text-sm text-red-600">{validation.name}</p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              City
            </label>
            <Input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="New York"
              autoComplete="off"
            />
            {hasSubmitted && validation.city ? (
              <p className="text-sm text-red-600">{validation.city}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Site code
            </label>
            <Input
              value={siteCode}
              onChange={(event) => setSiteCode(normalizeSiteCode(event.target.value))}
              placeholder="DT-01"
              autoComplete="off"
            />
            {hasSubmitted && validation.siteCode ? (
              <p className="text-sm text-red-600">{validation.siteCode}</p>
            ) : null}
          </div>
        </div>

        {createKitchenMutation.error ? (
          <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">
              {createKitchenMutation.error.message}
            </p>
          </div>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={createKitchenMutation.isPending}
            className="disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={hasErrors || createKitchenMutation.isPending}
            className="disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createKitchenMutation.isPending ? "Adding..." : "Add kitchen"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
