import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ProfilePictureUploader } from "../components/account/ProfilePictureUploader";
import { Avatar } from "../components/ui/Avatar";
import { routePaths } from "../constants/routes";
import { serviceCategories } from "../data/mockData";
import { providerService } from "../services/providerService";
import { useAuth } from "../state/AuthContext";
import type { Provider } from "../types";

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

export function ProviderProfileManagementPage() {
  const { user } = useAuth();
  const [backendProvider, setBackendProvider] = useState<Provider | undefined>();

  useEffect(() => {
    if (!user?.providerId) {
      setBackendProvider(undefined);
      return;
    }
    let active = true;
    void providerService
      .getById(user.providerId)
      .then((result) => {
        if (active) setBackendProvider(result);
      })
      .catch(() => {
        if (active) setBackendProvider(undefined);
      });
    return () => {
      active = false;
    };
  }, [user?.providerId, user?.profileImage]);

  const provider = backendProvider;
  const categoryId = provider?.categoryId || user?.professionalProfile?.categoryId || "";
  const category = serviceCategories.find((item) => item.id === categoryId);
  const picture = provider?.profileImage || user?.profileImage;
  const businessName = provider?.businessName ?? provider?.name ?? user?.businessName ?? user?.name;
  const profession = provider?.profession ?? category?.name ?? user?.professionalProfile?.description ?? "Service provider";
  const description = provider?.description ?? user?.professionalProfile?.description ?? "";
  const location = provider?.location ?? user?.location;

  return (
    <section className="page-section">
      <div className="container">
        <p className="eyebrow">profile</p>
        <h1 className="page-title">Manage your professional profile</h1>
        <p className="page-lede">Keep your business details, specialties and customer trust signals up to date.</p>

        <div className="profile-card profile-card--photo">
          <div className="profile-card__identity">
            <Avatar
              initials={initialsFor(businessName ?? user?.name ?? "?")}
              size="large"
              image={picture}
              alt={`${businessName ?? "Your"} profile picture`}
            />
            <div>
              <p className="eyebrow">You</p>
              <h2 className="profile-card__identity-name">{businessName ?? user?.name}</h2>
              <p>{profession}</p>
              {!user?.providerId && (
                <p className="form-hint">
                  No backend profile yet — uploading a photo creates one.{" "}
                  <Link className="text-link" to={routePaths.verifyIdentity}>
                    Verify your identity instead
                  </Link>
                </p>
              )}
            </div>
          </div>
          <ProfilePictureUploader ownerType="provider" />
        </div>

        <div className="profile-card-grid">
          <article className="detail-card">
            <h2>Business overview</h2>
            <div className="profile-field">
              <label>Business name</label>
              <p>{businessName}</p>
            </div>
            <div className="profile-field">
              <label>Professional title</label>
              <p>{profession}</p>
            </div>
            <div className="profile-field">
              <label>Location</label>
              <p>
                {location
                  ? [location.area, location.city, location.state].filter(Boolean).join(", ")
                  : "Not set"}
              </p>
            </div>
            {!user?.providerId && (
              <p className="form-hint">
                Your photo will be live in provider search results as soon as a backend provider
                profile is linked (automatically when you verify your identity or upload a photo).
              </p>
            )}
            <button className="button button--primary" type="button">Edit profile</button>
          </article>

          <article className="detail-card">
            <h2>About you</h2>
            <div className="profile-field">
              <label>Short description</label>
              <p>{description || "No description yet. Customers see this when they find you."}</p>
            </div>
            <div className="profile-field">
              <label>Specialty</label>
              <div className="tag-list">
                {category ? (
                  <span className="tag">{category.name}</span>
                ) : (
                  <span className="tag">General services</span>
                )}
              </div>
            </div>
            {provider?.profileImage && (
              <p className="form-hint">This is the photo customers see on your card and profile.</p>
            )}
            <button className="button button--secondary" type="button">Manage services</button>
          </article>
        </div>
      </div>
    </section>
  );
}