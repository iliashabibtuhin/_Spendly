import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { Spinner } from "../ui/States";

/** Renders child routes only for signed-in users; otherwise redirects to /login. */
export function ProtectedRoute() {
  const { user, status } = useAuth();
  const location = useLocation();
  if (status === "loading") return <Spinner label="Checking your session" className="min-h-dvh" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Login/register pages: signed-in users are sent to the dashboard. */
export function PublicOnlyRoute() {
  const { user, status } = useAuth();
  if (status === "loading") return <Spinner label="Checking your session" className="min-h-dvh" />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
