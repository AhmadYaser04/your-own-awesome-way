import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname, requireAdmin }} replace />;
  }

  if (requireAdmin && role !== "admin") {
    // Logged-in but not admin — send to auth so they can sign in with an admin account
    return <Navigate to="/auth" state={{ from: location.pathname, requireAdmin: true, notAdmin: true }} replace />;
  }

  return <>{children}</>;
}
