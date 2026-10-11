import type { User } from "../types";
import { apiRequest } from "./api/client";

export type BackendVerificationStatus = "pending" | "verified" | "rejected" | "failed";

export interface NINVerificationSubmitted {
  success: boolean;
  message: string;
  verification_reference: string;
  status: BackendVerificationStatus;
}

export interface NINVerificationStatus {
  success: boolean;
  verification_reference: string;
  status: BackendVerificationStatus;
  provider_id: string;
  masked_nin: string;
  verification_provider: string;
  submitted_at: string;
  verified_at: string | null;
  rejection_reason: string | null;
}

export interface BackendProvider {
  id: string;
}

export const NIN_VERIFICATION_ENDPOINT = "/api/nin-verification";

export function providerVerificationEndpoint(providerId: string) {
  return `/api/providers/${encodeURIComponent(providerId)}/nin-verification`;
}

export const identityVerificationService = {
  /**
   * Link the signed-in provider to a backend provider profile.
   *
   * The demo frontend stores users only in the browser, so the backend has no
   * provider id for them yet. The first time a provider verifies their
   * identity, this creates the provider record through the existing
   * POST /api/providers endpoint and returns the new MongoDB id. Later
   * submissions reuse the stored id instead of creating duplicates.
   */
  async autoRegisterProvider(user: User): Promise<string> {
    const email = user.email?.trim() ?? "";
    const phone = user.phone?.trim() ?? "";
    if (!email || !phone) {
      throw new Error(
        "Your account is missing the contact details needed to link a provider profile. Update your email and phone, then try again.",
      );
    }

    const provider = await apiRequest<BackendProvider>("/api/providers", {
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

    return provider.id;
  },

  /**
   * Submit a NIN verification request to the backend.
   *
   * The raw NIN is sent inside the JSON body (never in a URL) and is never
   * stored or returned by the backend. The page clears the input after the
   * request.
   */
  async submitVerification(nin: string, providerId: string): Promise<NINVerificationSubmitted> {
    return apiRequest<NINVerificationSubmitted>(NIN_VERIFICATION_ENDPOINT, {
      method: "POST",
      body: JSON.stringify({ provider_id: providerId, nin }),
    });
  },

  async getVerificationByReference(reference: string): Promise<NINVerificationStatus> {
    return apiRequest<NINVerificationStatus>(
      `${NIN_VERIFICATION_ENDPOINT}/${encodeURIComponent(reference)}`,
    );
  },

  async getProviderVerificationStatus(providerId: string): Promise<NINVerificationStatus> {
    return apiRequest<NINVerificationStatus>(providerVerificationEndpoint(providerId));
  },
};

export function toFrontendStatus(status: BackendVerificationStatus): "not_verified" | "pending" | "verified" | "failed" {
  if (status === "verified") return "verified";
  if (status === "pending") return "pending";
  return "failed";
}