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

export const NIN_VERIFICATION_ENDPOINT = "/api/nin-verification";

export function providerVerificationEndpoint(providerId: string) {
  return `/api/providers/${encodeURIComponent(providerId)}/nin-verification`;
}

export const identityVerificationService = {

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