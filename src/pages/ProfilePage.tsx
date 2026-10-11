import { useAuth } from "../state/AuthContext";
import { IdentityVerificationCard } from "../components/account/IdentityVerificationCard";

export function ProfilePage() {
  const { user } = useAuth();
  return (
    <section className="page-section"><div className="container narrow-container">
      <p className="eyebrow">Your details, your way</p><h1 className="page-title">Your profile</h1><p className="page-lede">A friendly introduction makes it easier to work together.</p>
      <IdentityVerificationCard status={user?.verificationStatus} source={user?.verificationSource} provider={user?.role === "PROVIDER"} />
      <div className="profile-card"><h2>Account basics</h2><dl className="profile-details"><div><dt>Name</dt><dd>{user?.name}</dd></div><div><dt>Email</dt><dd>{user?.email}</dd></div><div><dt>Account type</dt><dd>{user?.role}</dd></div><div><dt>Identity verification</dt><dd>{user?.verificationStatus === "verified" && user.verificationSource === "demo" ? "demo response (not verified)" : user?.verificationStatus ?? "not_verified"}</dd></div><div><dt>Location</dt><dd>Not set in this demo</dd></div></dl><p className="form-hint">Profile editing will connect to the agreed backend API in a later step.</p></div>
    </div></section>
  );
}
