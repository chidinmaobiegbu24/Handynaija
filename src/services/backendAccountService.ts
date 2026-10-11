import type { ProfileOwnerType, User } from "../types";
import { apiRequest } from "./api/client";

export interface BackendAccountCreated {
  id: string;
  profile_image_token: string;
}

export interface BackendProviderAccount {
  providerId: string;
  profileImageToken: string;
}

export interface BackendCustomerAccount {
  customerId: string;
  profileImageToken: string;
}

export interface BackendOwner {
  ownerId: string;
  profileImageToken: string;
  kind: "customer" | "provider";
}

function requireContact(user: User) {
  const email = user.email?.trim() ?? "";
  const phone = user.phone?.trim() ?? "";
  if (!email || !phone) {
    throw new Error(
      "Your account is missing the contact details needed to create a backend profile. Update your email and phone, then try again.",
    );
  }
  return { email, phone };
}

/**
 * Make sure the signed-in (demo) provider has a real backend provider record.
 *
 * The backend has no browser-level accounts, so the first time a provider
 * needs a backend record (identity verification or a profile picture), this
 * creates one through the existing POST /api/providers endpoint and remembers
 * both its Mongo id and the ownership token. Later calls reuse them.
 */
export async function ensureBackendProvider(user: User): Promise<BackendProviderAccount> {
  if (user.providerId && user.profileImageToken) {
    return { providerId: user.providerId, profileImageToken: user.profileImageToken };
  }
  if (user.providerId && !user.profileImageToken) {
    throw new Error(
      "This provider record was created before profile pictures were enabled, so it has no upload key. Create a fresh provider account to upload a picture.",
    );
  }

  const { email, phone } = requireContact(user);
  const provider = await apiRequest<BackendAccountCreated>("/api/providers", {
    method: "POST",
    body: JSON.stringify({
      full_name: user.name,
      phone,
      email,
      service_category: user.professionalProfile?.categoryId ?? "General Services",
      skills: [],
      description: user.professionalProfile?.description ?? "",
      location: user.location?.city || user.location?.state || "",
      state: user.location?.state || "",
      years_of_experience: user.professionalProfile?.yearsExperience ?? 0,
      price: 0,
      availability: "Available",
      profile_image: "",
    }),
  });

  return { providerId: provider.id, profileImageToken: provider.profile_image_token };
}

/**
 * Make sure the signed-in (demo) customer has a real backend customer record.
 * Identical pattern to ensureBackendProvider but for the customers collection.
 */
export async function ensureBackendCustomer(user: User): Promise<BackendCustomerAccount> {
  if (user.customerId && user.profileImageToken) {
    return { customerId: user.customerId, profileImageToken: user.profileImageToken };
  }
  if (user.customerId && !user.profileImageToken) {
    throw new Error(
      "This customer record was created before profile pictures were enabled, so it has no upload key. Re-register or use a fresh account to upload a picture.",
    );
  }

  const { email, phone } = requireContact(user);
  const customer = await apiRequest<BackendAccountCreated>("/api/customers", {
    method: "POST",
    body: JSON.stringify({
      full_name: user.name,
      phone,
      email,
      location: user.location?.city || user.location?.state || "",
      state: user.location?.state || "",
      profile_image: "",
    }),
  });

  return { customerId: customer.id, profileImageToken: customer.profile_image_token };
}

/** Normalize the two account types so callers can branch with a single shape. */
export async function ensureBackendOwner(
  user: User,
  ownerType: ProfileOwnerType,
): Promise<BackendOwner> {
  if (ownerType === "provider") {
    const account = await ensureBackendProvider(user);
    return { ownerId: account.providerId, profileImageToken: account.profileImageToken, kind: "provider" };
  }
  const account = await ensureBackendCustomer(user);
  return { ownerId: account.customerId, profileImageToken: account.profileImageToken, kind: "customer" };
}