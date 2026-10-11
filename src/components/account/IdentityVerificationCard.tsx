import { Link } from "react-router-dom";
import { routePaths } from "../../constants/routes";
import type { VerificationStatus } from "../../types";
import { Badge } from "../ui/Badge";

export function IdentityVerificationCard({
  status = "not_verified",
  source,
  provider = false,
}: {
  status?: VerificationStatus;
  source?: "demo" | "backend";
  provider?: boolean;
}) {
  const heading = "Identity Verification";
  const descriptions: Record<VerificationStatus, string> = {
    not_verified: provider
      ? "Identity verification required"
      : "Verify your identity to help keep HandyNaija safe.",
    pending: source === "demo" ? "The demo returned a pending status; no real verification is underway." : "Identity verification pending",
    verified: source === "demo" ? "The demo returned a verified status; your identity has not been checked." : "Your identity is verified.",
    failed: "We couldn't verify your identity. You can try again.",
  };

  return (
    <section className="identity-status-card" aria-labelledby="identity-status-heading">
      <div className="identity-status-card__copy">
        <p className="eyebrow">Account safety</p>
        <h2 id="identity-status-heading">{heading}</h2>
        <p>{descriptions[status]}</p>
      </div>
      <div className="identity-status-card__actions">
        {status === "verified" ? (
          <Badge tone={source === "demo" ? "warning" : "success"}>
            {source === "demo" ? "Demo response · not identity verified" : "✓ Identity Verified"}
          </Badge>
        ) : status === "pending" ? (
          <Badge tone="warning">{source === "demo" ? "Demo response · Pending" : "Verification Pending"}</Badge>
        ) : (
          <Link className="button button--primary" to={routePaths.verifyIdentity}>Verify Identity</Link>
        )}
      </div>
    </section>
  );
}
