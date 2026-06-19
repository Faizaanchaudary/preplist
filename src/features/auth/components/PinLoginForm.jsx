import { useCallback, useEffect, useMemo, useState } from "react";
import { Delete } from "lucide-react";
import Button from "../../../shared/ui/Button";
import { cn } from "../../../shared/utils/cn";

const PIN_LENGTH = 5;
const KEYPAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "backspace"],
];

export default function PinLoginForm({
  isPending = false,
  errorMessage = "",
  onSubmit,
  onForgotPassword,
}) {
  const [pin, setPin] = useState("");

  const isComplete = pin.length === PIN_LENGTH;

  const boxes = useMemo(
    () => Array.from({ length: PIN_LENGTH }, (_, index) => pin[index] ?? ""),
    [pin]
  );

  const appendDigit = useCallback((value) => {
    if (isPending) return;
    setPin((previous) =>
      previous.length >= PIN_LENGTH ? previous : `${previous}${value}`
    );
  }, [isPending]);

  const removeLastDigit = useCallback(() => {
    if (isPending) return;
    setPin((previous) => previous.slice(0, -1));
  }, [isPending]);

  const submitPin = useCallback(async () => {
    if (!isComplete || isPending) return;
    await onSubmit?.({ pin });
  }, [isComplete, isPending, onSubmit, pin]);

  function handleSubmit(event) {
    event.preventDefault();
    submitPin();
  }

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const target = event.target;
      const isEditableField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (isEditableField) return;

      if (/^\d$/.test(event.key)) {
        event.preventDefault();
        appendDigit(event.key);
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        removeLastDigit();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        submitPin();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [appendDigit, removeLastDigit, submitPin]);

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-7">
        <div>
          <h1 className="text-[34px] font-semibold leading-tight text-[var(--text-primary)] sm:text-[40px]">
            Login using PIN Code
          </h1>
          <p className="mt-3 text-lg leading-7 text-[var(--text-muted)]">
            Please enter the PIN Code for smart login.
          </p>
        </div>

        <div
          className="grid grid-cols-5 gap-3 sm:gap-4"
          role="group"
          aria-label="PIN code"
        >
          {boxes.map((value, index) => (
            <div
              key={index}
              aria-label={`PIN digit ${index + 1}${value ? " entered" : " empty"}`}
              className={cn(
                "flex aspect-square min-h-[64px] items-center justify-center rounded-[22px] border bg-white text-3xl font-semibold text-[var(--text-primary)] shadow-sm",
                value
                  ? "border-[var(--surface-strong)]"
                  : "border-[var(--stroke-soft)]"
              )}
            >
              {value ? (
                <span
                  aria-hidden="true"
                  className="h-3 w-3 rounded-full bg-[var(--text-primary)]"
                />
              ) : null}
            </div>
          ))}
        </div>

        <p className="text-center text-base text-[var(--text-muted)] sm:text-lg">
          Forgot Password?{" "}
          <button
            type="button"
            onClick={onForgotPassword}
            className="font-semibold text-[var(--text-primary)] underline-offset-4 hover:underline"
          >
            Contact Admin
          </button>
        </p>

        {errorMessage ? (
          <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}
      </div>

      <div className="mt-auto space-y-5 pt-8">
        <Button
          type="submit"
          fullWidth
          disabled={!isComplete || isPending}
          className={cn(
            "min-h-[58px] rounded-[22px] text-base",
            !isComplete || isPending
              ? "border-0 bg-[#dedfe1] text-white hover:bg-[#dedfe1]"
              : ""
          )}
        >
          {isPending ? "Signing in..." : "Continue"}
        </Button>

        <div className="grid grid-cols-3 gap-2 rounded-[24px] bg-[#e7e9e9] p-2 sm:gap-3 sm:p-3">
          {KEYPAD_ROWS.flatMap((row) =>
            row.map((key, index) => {
              if (!key) {
                return <div key={`empty-${index}`} aria-hidden="true" />;
              }

              if (key === "backspace") {
                return (
                  <button
                    key="backspace"
                    type="button"
                    aria-label="Remove last digit"
                    disabled={isPending || !pin.length}
                    onClick={removeLastDigit}
                    className="flex min-h-[72px] items-center justify-center rounded-[12px] text-[var(--text-primary)] transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Delete className="h-8 w-8" />
                  </button>
                );
              }

              return (
                <button
                  key={key}
                  type="button"
                  disabled={isPending || pin.length >= PIN_LENGTH}
                  onClick={() => appendDigit(key)}
                  className="flex min-h-[72px] items-center justify-center rounded-[12px] bg-white text-4xl font-medium text-[var(--text-primary)] shadow-sm transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={`Enter digit ${key}`}
                >
                  {key}
                </button>
              );
            })
          )}
        </div>
      </div>
    </form>
  );
}
