import type {
  CustomerRegistration,
  ProviderRegistration,
  User,
  UserRole,
} from "../types";

export const MOCK_AUTH_STORAGE_KEY = "handynaija-demo-user";
export const MOCK_AUTH_SESSION_KEY = "handynaija-demo-session";

function pause() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, 350));
}

export const authService = {
  async login(identifier: string, role: UserRole): Promise<User> {
    await pause();
    if (identifier.toLowerCase() === "error@example.com") {
      throw new Error("Unable to sign in. Please check your details.");
    }
    const isEmail = identifier.includes("@");
    return {
      id: `demo-${role.toLowerCase()}-${Date.now()}`,
      name: role === "ADMIN" ? "HandyNaija Admin" : role === "PROVIDER" ? "Demo Provider" : "Demo Customer",
      email: isEmail ? identifier : "",
      phone: isEmail ? undefined : identifier,
      role,
      verificationStatus: "not_verified",
    };
  },

  async registerCustomer(input: CustomerRegistration): Promise<User> {
    await pause();
    return {
      id: `demo-customer-${Date.now()}`,
      name: input.name,
      email: input.email,
      phone: input.phone,
      location: input.location,
      role: "CUSTOMER",
      verificationStatus: "not_verified",
    };
  },

  async registerProvider(input: ProviderRegistration): Promise<User> {
    await pause();
    return {
      id: `demo-provider-${Date.now()}`,
      name: input.name,
      email: input.email,
      phone: input.phone,
      businessName: input.businessName,
      location: input.location,
      role: "PROVIDER",
      verificationStatus: "not_verified",
      professionalProfile: {
        categoryId: input.categoryId,
        yearsExperience: input.yearsExperience,
        description: input.description,
      },
    };
  },

  async forgotPassword(_identifier: string): Promise<void> {
    if (!_identifier.trim()) {
      throw new Error("A reset contact is required.");
    }
    await pause();
  },

  async resetPassword(): Promise<void> {
    await pause();
  },

  getCurrentUser(): User | null {
    try {
      const storedUser = localStorage.getItem(MOCK_AUTH_STORAGE_KEY)
        ?? sessionStorage.getItem(MOCK_AUTH_SESSION_KEY);
      return storedUser ? JSON.parse(storedUser) as User : null;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    await pause();
  },
};
