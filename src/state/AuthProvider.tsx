import { useEffect, useMemo, useState, type ReactNode } from "react";
import { authService, MOCK_AUTH_SESSION_KEY, MOCK_AUTH_STORAGE_KEY } from "../services/authService";
import type { User, VerificationSource, VerificationStatus } from "../types";
import { AuthContext, type AuthContextValue } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser);

  useEffect(() => {
    if (user) {
      const persistentUser = localStorage.getItem(MOCK_AUTH_STORAGE_KEY);
      const sessionUser = sessionStorage.getItem(MOCK_AUTH_SESSION_KEY);
      if (persistentUser) localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(user));
      else if (sessionUser) sessionStorage.setItem(MOCK_AUTH_SESSION_KEY, JSON.stringify(user));
      else sessionStorage.setItem(MOCK_AUTH_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
      sessionStorage.removeItem(MOCK_AUTH_SESSION_KEY);
    }
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      async login(identifier: string, role: User["role"], remember: boolean) {
        const nextUser = await authService.login(identifier, role);
        if (remember) {
          localStorage.setItem(MOCK_AUTH_STORAGE_KEY, JSON.stringify(nextUser));
          sessionStorage.removeItem(MOCK_AUTH_SESSION_KEY);
        } else {
          sessionStorage.setItem(MOCK_AUTH_SESSION_KEY, JSON.stringify(nextUser));
          localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
        }
        setUser(nextUser);
      },
      async registerCustomer(input) {
        const nextUser = await authService.registerCustomer(input);
        sessionStorage.setItem(MOCK_AUTH_SESSION_KEY, JSON.stringify(nextUser));
        localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
        setUser(nextUser);
      },
      async registerProvider(input) {
        const nextUser = await authService.registerProvider(input);
        sessionStorage.setItem(MOCK_AUTH_SESSION_KEY, JSON.stringify(nextUser));
        localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
        setUser(nextUser);
      },
      updateVerificationStatus(status: VerificationStatus, source: VerificationSource, providerId?: string) {
        setUser((current) => current
          ? {
              ...current,
              verificationStatus: status,
              verificationSource: source,
              ...(providerId ? { providerId } : {}),
            }
          : current);
      },
      async logout() {
        localStorage.removeItem(MOCK_AUTH_STORAGE_KEY);
        sessionStorage.removeItem(MOCK_AUTH_SESSION_KEY);
        await authService.logout();
        setUser(null);
      },
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
