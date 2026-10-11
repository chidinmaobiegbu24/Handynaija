import type { ProfileOwnerType, User } from "../types";
import { getApiBaseUrl } from "./api/client";
import { ensureBackendOwner } from "./backendAccountService";

export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export interface ProfilePictureSaved {
  ownerId: string;
  profileImageToken: string;
  profileImage: string;
  profileImagePublicId: string;
}

async function parseApiError(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    const detail = (body as { detail?: unknown })?.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
    if (detail && typeof detail === "object") {
      const message = (detail as { message?: unknown })?.message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
    if (Array.isArray(detail) && typeof detail[0]?.msg === "string") {
      return detail[0].msg;
    }
  } catch {
    // Non-JSON error body; fall through to the generic message.
  }
  return `${fallback} (${response.status}).`;
}

function ensureApiConfigured(): string {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new Error(
      "The backend API is not configured. Add VITE_API_BASE_URL to your frontend environment to enable profile pictures.",
    );
  }
  return baseUrl;
}

export const profilePictureService = {
  /**
   * Upload (or replace) the profile picture for the signed-in user.
   *
   * The image bytes go straight to the backend in a multipart request; the
   * backend forwards them to Cloudinary and stores only the URL/metadata.
   * No image data is written to localStorage/sessionStorage.
   */
  async upload(params: { user: User; ownerType: ProfileOwnerType; file: File }): Promise<ProfilePictureSaved> {
    const { user, ownerType, file } = params;
    const baseUrl = ensureApiConfigured();
    const owner = await ensureBackendOwner(user, ownerType);

    const form = new FormData();
    form.append("owner_type", ownerType);
    form.append("owner_id", owner.ownerId);
    form.append("file", file, file.name);

    const response = await fetch(`${baseUrl}/api/profile-pictures`, {
      method: "POST",
      headers: { "X-Profile-Token": owner.profileImageToken },
      body: form,
    });

    if (!response.ok) {
      throw new Error(await parseApiError(response, "Your photo could not be uploaded"));
    }

    const body = (await response.json()) as {
      profile_image: string;
      profile_image_public_id: string;
    };

    return {
      ownerId: owner.ownerId,
      profileImageToken: owner.profileImageToken,
      profileImage: body.profile_image,
      profileImagePublicId: body.profile_image_public_id,
    };
  },

  /** Remove the signed-in user's profile picture on the backend. */
  async remove(params: { user: User; ownerType: ProfileOwnerType }): Promise<void> {
    const { user, ownerType } = params;
    const baseUrl = ensureApiConfigured();
    const owner = await ensureBackendOwner(user, ownerType);

    const url = new URL(`${baseUrl}/api/profile-pictures`);
    url.searchParams.set("owner_type", ownerType);
    url.searchParams.set("owner_id", owner.ownerId);

    const response = await fetch(url.toString(), {
      method: "DELETE",
      headers: { "X-Profile-Token": owner.profileImageToken },
    });

    if (!response.ok) {
      throw new Error(await parseApiError(response, "Your photo could not be removed"));
    }
  },
};