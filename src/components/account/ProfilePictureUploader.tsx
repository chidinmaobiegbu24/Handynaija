import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  PROFILE_IMAGE_ALLOWED_TYPES,
  PROFILE_IMAGE_MAX_BYTES,
  profilePictureService,
} from "../../services/profilePictureService";
import { refreshBackendProviderList } from "../../services/providerService";
import { useAuth } from "../../state/AuthContext";
import type { ProfileOwnerType } from "../../types";
import { Avatar } from "../ui/Avatar";
import { LoadingSpinner } from "../ui/LoadingSpinner";

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

function formatBytes(bytes: number): string {
  return `${Math.ceil(bytes / (1024 * 1024))} MB`;
}

/**
 * A reusable profile-picture manager for customers and providers.
 *
 * Shows a live preview before saving, a default avatar when there is no
 * picture, lets the user replace or remove the picture, and reports
 * loading/success/error states. The actual bytes are uploaded straight to the
 * FastAPI backend (which stores them in Cloudinary); nothing but the URL is
 * saved in the browser.
 */
export function ProfilePictureUploader({
  ownerType,
  title = "Profile picture",
}: {
  ownerType: ProfileOwnerType;
  title?: string;
}) {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const currentImage = user?.profileImage || "";
  const busy = uploading || removing;
  const previewImage = filePreview || currentImage || "";

  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0];
    event.target.value = "";
    setError("");
    setSuccess("");

    if (!nextFile) {
      return;
    }

    if (!PROFILE_IMAGE_ALLOWED_TYPES.includes(nextFile.type as (typeof PROFILE_IMAGE_ALLOWED_TYPES)[number])) {
      setError(`Unsupported format. Please choose a ${PROFILE_IMAGE_ALLOWED_TYPES.join(", ").replace("image/", "")} photo.`);
      setFile(null);
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
        setFilePreview("");
      }
      return;
    }

    if (nextFile.size > PROFILE_IMAGE_MAX_BYTES) {
      setError(`That photo is ${formatBytes(nextFile.size)}. The maximum size is ${formatBytes(PROFILE_IMAGE_MAX_BYTES)}.`);
      setFile(null);
      return;
    }

    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setFile(nextFile);
    setFilePreview(URL.createObjectURL(nextFile));
  }

  async function handleSave() {
    if (!user) {
      setError("You must be signed in to upload a profile picture.");
      return;
    }
    if (!file) {
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const saved = await profilePictureService.upload({ user, ownerType, file });
      updateUser(
        ownerType === "provider"
          ? {
              providerId: saved.ownerId,
              profileImageToken: saved.profileImageToken,
              profileImage: saved.profileImage,
              profileImagePublicId: saved.profileImagePublicId,
            }
          : {
              customerId: saved.ownerId,
              profileImageToken: saved.profileImageToken,
              profileImage: saved.profileImage,
              profileImagePublicId: saved.profileImagePublicId,
            },
      );
      if (ownerType === "provider") {
        refreshBackendProviderList();
      }
      setSuccess("Your profile picture has been updated.");
      setFile(null);
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
        setFilePreview("");
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "We couldn't save your photo. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!user || !currentImage) {
      return;
    }

    setRemoving(true);
    setError("");
    setSuccess("");
    try {
      await profilePictureService.remove({ user, ownerType });
      updateUser({ profileImage: "", profileImagePublicId: "" });
      if (ownerType === "provider") {
        refreshBackendProviderList();
      }
      setSuccess("Your profile picture has been removed.");
      setFile(null);
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
        setFilePreview("");
      }
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "We couldn't remove your photo. Please try again.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <section className="profile-picture" aria-labelledby="profile-picture-title">
      <h2 id="profile-picture-title">{title}</h2>
      <p className="form-hint">Add a clear photo so others can recognise you.</p>

      <div className="profile-picture__row">
        <div className="profile-picture__preview" aria-label="Profile picture preview">
          {previewImage ? (
            <img
              className="profile-picture__image"
              src={previewImage}
              alt="Your profile picture"
              onError={() => {
                if (!filePreview) {
                  updateUser({ profileImage: "" });
                }
              }}
            />
          ) : (
            <Avatar initials={initialsFor(user?.name ?? "?")} size="large" label="Default avatar" />
          )}
        </div>

        <div className="profile-picture__actions">
          <input
            ref={fileInputRef}
            className="profile-picture__file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            aria-label="Choose a profile picture file"
          />
          <button
            className="button button--secondary"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          >
            {file ? "Choose a different photo" : "Choose photo"}
          </button>

          {file && (
            <button className="button button--primary" type="button" onClick={handleSave} disabled={busy}>
              Save photo
            </button>
          )}

          {currentImage && !file && (
            <button className="button button--outline" type="button" onClick={handleRemove} disabled={busy}>
              Remove photo
            </button>
          )}

          <p className="form-hint">JPEG, PNG or WebP · up to 5 MB</p>
        </div>
      </div>

      {busy && (
        <p className="profile-picture__status" role="status" aria-live="polite">
          <LoadingSpinner label="Saving profile picture" />
          {uploading ? "Uploading your photo…" : "Removing your photo…"}
        </p>
      )}

      {success && (
        <p className="profile-picture__status profile-picture__status--success" role="status" aria-live="polite">
          ✓ {success}
        </p>
      )}
      {error && (
        <p className="profile-picture__status profile-picture__status--error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}