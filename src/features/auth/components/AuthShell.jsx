import PageTransition from "../../../app/layouts/PageTransition";
import Card from "../../../shared/ui/Card";
import { cn } from "../../../shared/utils/cn";
import AuthHeader from "./AuthHeader";

export default function AuthShell({
  title,
  description,
  actions,
  children,
  footer,
  className,
}) {
  return (
    <PageTransition>
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4 py-10">
        <Card className={cn("w-full max-w-[520px] p-6 sm:p-8", className)}>
          <AuthHeader title={title} description={description} actions={actions} />
          <div className="mt-6">{children}</div>
          {footer ? <div className="mt-6">{footer}</div> : null}
        </Card>
      </div>
    </PageTransition>
  );
}

