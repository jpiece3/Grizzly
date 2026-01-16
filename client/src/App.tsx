import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuthContext } from "@/context/auth-context";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import AdminStopsPage from "@/pages/admin/stops";
import AdminRoutesPage from "@/pages/admin/routes";
import AdminCalendarPage from "@/pages/admin/calendar";
import AdminDriversPage from "@/pages/admin/drivers";
import AdminTimeTrackingPage from "@/pages/admin/time-tracking";
import AdminLocationsPage from "@/pages/admin/locations";
import AdminConfirmRoutePage from "@/pages/admin/confirm-route";
import AdminMaterialsPage from "@/pages/admin/materials";
import DriverPage from "@/pages/driver/index";
import { LoadingSpinner } from "@/components/common/loading-spinner";

function ProtectedRoute({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode; 
  requiredRole?: "admin" | "driver" 
}) {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    if (user?.role === "admin") {
      return <Redirect to="/admin" />;
    } else {
      return <Redirect to="/driver" />;
    }
  }

  return <>{children}</>;
}

function Router() {
  const { isAuthenticated, user, isLoading } = useAuthContext();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  if (location === "/" && isAuthenticated) {
    if (user?.role === "admin") {
      return <Redirect to="/admin" />;
    } else {
      return <Redirect to="/driver" />;
    }
  }

  return (
    <Switch>
      <Route path="/">
        {isAuthenticated ? (
          user?.role === "admin" ? <Redirect to="/admin" /> : <Redirect to="/driver" />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      <Route path="/login">
        {isAuthenticated ? (
          user?.role === "admin" ? <Redirect to="/admin" /> : <Redirect to="/driver" />
        ) : (
          <LoginPage />
        )}
      </Route>

      <Route path="/admin">
        <ProtectedRoute requiredRole="admin">
          <AdminRoutesPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/drivers">
        <ProtectedRoute requiredRole="admin">
          <AdminDriversPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/time-tracking">
        <ProtectedRoute requiredRole="admin">
          <AdminTimeTrackingPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/stops">
        <ProtectedRoute requiredRole="admin">
          <AdminStopsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/calendar">
        <ProtectedRoute requiredRole="admin">
          <AdminCalendarPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/locations">
        <ProtectedRoute requiredRole="admin">
          <AdminLocationsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/confirm-route">
        <ProtectedRoute requiredRole="admin">
          <AdminConfirmRoutePage />
        </ProtectedRoute>
      </Route>

      <Route path="/admin/materials">
        <ProtectedRoute requiredRole="admin">
          <AdminMaterialsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/driver">
        <ProtectedRoute requiredRole="driver">
          <DriverPage />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
