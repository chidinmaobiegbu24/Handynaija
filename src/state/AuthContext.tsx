import { createContext, useContext } from "react";
import type { CustomerRegistration, ProviderRegistration, User, UserRole, VerificationSource, VerificationStatus } from "../types";

export interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (identifier: string, role: UserRole, remember: boolean) => Promise<void>;
  registerCustomer: (input: CustomerRegistration) => Promise<void>;
  registerProvider: (input: ProviderRegistration) => Promise<void>;
  updateVerificationStatus: (status: VerificationStatus, source: VerificationSource, providerId?: string) => void;
  /** Merge fields into the signed-in demo user (e.g. a linked backend id or picture). */
  updateUser: (patch: Partial<User>) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
