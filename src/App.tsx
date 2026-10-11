import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/routing/ProtectedRoute";
import { routePaths } from "./constants/routes";
import { DashboardPage } from "./pages/DashboardPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { HomePage } from "./pages/HomePage";
import { IdentityVerificationPage } from "./pages/IdentityVerificationPage";
import { LoginPage } from "./pages/LoginPage";
import { MessagesPage } from "./pages/MessagesPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProviderProfilePage } from "./pages/ProviderProfilePage";
import { ProviderDashboardPage } from "./pages/ProviderDashboardPage";
import { ProvidersPage } from "./pages/ProvidersPage";
import { RegisterPage } from "./pages/RegisterPage";
import { RequestServicePage } from "./pages/RequestServicePage";
import { RequestDetailsPage } from "./pages/RequestDetailsPage";
import { RequestsPage } from "./pages/RequestsPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ServicesPage } from "./pages/ServicesPage";
import type { UserRole } from "./types";

const providerRoutes = [
  { path: "/provider/requests", title: "Customer requests" },
  { path: "/provider/services", title: "Your services" },
  { path: "/provider/availability", title: "Manage availability" },
  { path: "/provider/messages", title: "Messages" },
  { path: "/provider/profile", title: "Professional profile" },
  { path: "/provider/reviews", title: "Your reviews" },
];

const adminRoutes = [
  { path: "/admin", title: "Admin dashboard" },
  { path: "/admin/users", title: "Manage customers" },
  { path: "/admin/providers", title: "Manage providers" },
  { path: "/admin/categories", title: "Manage categories" },
  { path: "/admin/requests", title: "Manage requests" },
  { path: "/admin/reviews", title: "Moderate reviews" },
  { path: "/admin/reports", title: "Manage reports" },
];

function roleRoutes(routes: { path: string; title: string }[], role: UserRole) {
  return routes.map(({ path, title }) => (
    <Route
      key={path}
      path={path}
      element={
        <ProtectedRoute allowedRoles={[role]}>
          <PlaceholderPage title={title} />
        </ProtectedRoute>
      }
    />
  ));
}

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path={routePaths.home} element={<HomePage />} />
        <Route path={routePaths.login} element={<LoginPage />} />
        <Route path={routePaths.register} element={<RegisterPage />} />
        <Route path={routePaths.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={routePaths.resetPassword} element={<ResetPasswordPage />} />
        <Route path={routePaths.terms} element={<PlaceholderPage title="Terms of Service" />} />
        <Route path={routePaths.privacy} element={<PlaceholderPage title="Privacy Policy" />} />
        <Route path={routePaths.services} element={<ServicesPage />} />
        <Route path="/services/:serviceId" element={<PlaceholderPage title="Service details" />} />
        <Route path={routePaths.providers} element={<ProvidersPage />} />
        <Route
          path={routePaths.verifyIdentity}
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER", "PROVIDER"]}>
              <IdentityVerificationPage />
            </ProtectedRoute>
          }
        />
        <Route path="/provider/:providerId" element={<ProviderProfilePage />} />
        <Route path="/request-service" element={<RequestServicePage />} />
        <Route
          path={routePaths.providerDashboard}
          element={
            <ProtectedRoute allowedRoles={["PROVIDER"]}>
              <ProviderDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER", "PROVIDER", "ADMIN"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <RequestsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests/:requestId"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <RequestDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER", "PROVIDER"]}>
              <MessagesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        {roleRoutes(providerRoutes, "PROVIDER")}
        {roleRoutes(adminRoutes, "ADMIN")}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
