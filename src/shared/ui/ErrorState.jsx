import EmptyState from "./EmptyState";

function getErrorMessage(error) {
  if (!error) return null;

  if (typeof error === "string") return error;

  if (error instanceof Error) {
    return error.message || "Something went wrong.";
  }

  if (typeof error === "object" && "message" in error) {
    return String(error.message || "Something went wrong.");
  }

  return "Something went wrong.";
}

export default function ErrorState({
  title = "Something went wrong",
  description,
  error,
  children,
  ...props
}) {
  const message = description ?? getErrorMessage(error) ?? "Please try again.";

  return (
    <EmptyState title={title} description={message} {...props}>
      {children}
    </EmptyState>
  );
}

