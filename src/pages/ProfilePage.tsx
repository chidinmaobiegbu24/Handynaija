import { useAuth } from "../state/AuthContext";
import { IdentityVerificationCard } from "../components/account/IdentityVerificationCard";
import { ProfilePictureUploader } from "../components/account/ProfilePictureUploader";
import { Avatar } from "../components/ui/Avatar";

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

export function ProfilePage() {
  const { user } = useAuth();
  return (
    <section className="page-section"><div className="container narrow-container">
      <p className="eyebrow">Your details, your way</p><h1 className="page-title">Your profile</h1><p className="page-lede">A friendly introduction makes it easier to work together.</p>
      <IdentityVerificationCard status={user?.verificationStatus} source={user?.verificationSource} provider={user?.role === "PROVIDER"} />

      <div className="profile-card profile-card--photo">
        <div className="profile-card__identity">
          <Avatar
            initials={initialsFor(user?.name ?? "?")}
            size="large"
            image={user?.profileImage}
            alt={`${user?.name ?? "Your"} profile picture`}
          />
          <div>
            <p className="eyebrow">You</p>
            <h2 className="profile-card__identity-name">{user?.name}</h2>
            <p>{user?.email}</p>
          </div>
        </div>
        <ProfilePictureUploader ownerType="customer" />
        <div className="profile-card__section">
          <h2>Account basics</h2>
          <dl className="profile-details">
            <div><dt>Email</dt><dd>{user?.email}</dd></div>
            <div><dt>Phone</dt><dd>{user?.phone ?? "Not set"}</dd></div>
            <div><dt>Account type</dt><dd>{user?.role}</dd></div>
            <div><dt>Identity verification</dt><dd>{user?.verificationStatus === "verified" && user.verificationSource === "demo" ? "demo response (not verified)" : user?.verificationStatus ?? "not_verified"}</dd></div>
            <div><dt>Location</dt><dd>{user?.location ? `${user.location.area}, ${user.location.city}, ${user.location.state}` : "Not set in this demo"}</dd></div>
          </dl>
          <p className="form-hint">Profile details connect to the agreed backend API. Your picture is stored with your HandyNaija account, not in your browser.</p>
        </div>
      </div>
    </div></section>
  );
}
