export const routePaths = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  terms: "/terms",
  privacy: "/privacy",
  services: "/services",
  providers: "/providers",
  verifyIdentity: "/verify-identity",
  providerSignup: "/register?role=PROVIDER",
  customerDashboard: "/dashboard",
  requests: "/requests",
  requestService: "/request-service",
  messages: "/messages",
  profile: "/profile",
  providerDashboard: "/provider/dashboard",
  adminDashboard: "/admin",
  providerProfile: (providerId: string) => `/provider/${encodeURIComponent(providerId)}`,
} as const;

export function getDashboardPath(role: "CUSTOMER" | "PROVIDER" | "ADMIN") {
  if (role === "PROVIDER") return routePaths.providerDashboard;
  if (role === "ADMIN") return routePaths.adminDashboard;
  return routePaths.customerDashboard;
}
