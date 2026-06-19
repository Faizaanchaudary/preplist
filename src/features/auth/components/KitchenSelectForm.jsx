import { useMemo, useState } from "react";
import Button from "../../../shared/ui/Button";
import Select from "../../../shared/ui/Select";

export default function KitchenSelectForm({
  kitchens = [],
  isPending = false,
  errorMessage = "",
  onSubmit,
}) {
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [kitchenId, setKitchenId] = useState("");

  const kitchenOptions = useMemo(() => {
    return [
      { value: "", label: "Select a kitchen..." },
      ...kitchens.map((kitchen) => ({
        value: kitchen.id,
        label: kitchen.siteCode
          ? `${kitchen.name} (${kitchen.siteCode})`
          : kitchen.name,
      })),
    ];
  }, [kitchens]);

  const localError =
    hasSubmitted && !kitchenId ? "Please select a kitchen." : "";

  async function handleSubmit(event) {
    event.preventDefault();
    setHasSubmitted(true);

    if (!kitchenId || isPending) return;

    await onSubmit?.({ kitchenId });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--text-primary)]">
          Kitchen
        </label>

        <Select
          value={kitchenId}
          onChange={(event) => setKitchenId(event.target.value)}
          options={kitchenOptions}
        />

        {localError ? (
          <p className="text-sm text-red-600">{localError}</p>
        ) : null}
      </div>

      {errorMessage ? (
        <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={!kitchenId || isPending}
          className="disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Continue"}
        </Button>
      </div>
    </form>
  );
}