import { Suspense } from "react";
import AppRouter from "./app/router";
import PageLoader from "./shared/ui/PageLoader";

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AppRouter />
    </Suspense>
  );
}