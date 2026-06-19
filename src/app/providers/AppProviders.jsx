import MotionProvider from "./MotionProvider";
import QueryProvider from "./QueryProvider";
import AuthSessionProvider from "./AuthSessionProvider";

export default function AppProviders({ children }) {
  return (
    <QueryProvider>
      <AuthSessionProvider>
        <MotionProvider>{children}</MotionProvider>
      </AuthSessionProvider>
    </QueryProvider>
  );
}
