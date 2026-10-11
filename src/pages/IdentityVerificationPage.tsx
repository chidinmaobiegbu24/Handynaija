import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { routePaths } from "../constants/routes";
import { ensureBackendProvider } from "../services/backendAccountService";
import {
  identityVerificationService,
  toFrontendStatus,
} from "../services/identityVerificationService";
import { useAuth } from "../state/AuthContext";
import type { VerificationStatus } from "../types";

export function IdentityVerificationPage() {
  const { user, updateUser, updateVerificationStatus } = useAuth();
  const [nin, setNin] = useState("");
  const [status, setStatus] = useState<VerificationStatus>(user?.verificationStatus ?? "not_verified");
  const [verificationReference, setVerificationReference] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If the signed-in provider already has a backend request, show its status.
  useEffect(() => {
    if (!user?.providerId) return;
    let cancelled = false;
    void identityVerificationService
      .getProviderVerificationStatus(user.providerId)
      .then((record) => {
        if (cancelled) return;
        const nextStatus = toFrontendStatus(record.status);
        setStatus(nextStatus);
        setVerificationReference(record.verification_reference);
        setRejectionReason(record.rejection_reason ?? "");
      })
      .catch(() => {
        // Backend may be offline; keep the stored status instead of erroring.
      });
    return () => {
      cancelled = true;
    };
  }, [user?.providerId]);

  function handleNinChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    setNin(digits);
    setError(value === digits ? "" : "Use numbers only.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    if (!/^\d{11}$/.test(nin)) {
      setError("NIN must contain exactly 11 digits.");
      return;
    }

    const submittedNin = nin;
    setNin("");
    setSubmitting(true);
    setError("");
    setVerificationReference("");
    setRejectionReason("");
    try {
      if (!user) {
        throw new Error("You must be signed in to verify your identity.");
      }

      let providerId = user.providerId ?? "";
      let profileImageToken = user.profileImageToken ?? "";
      if (!providerId) {
        if (user.role !== "PROVIDER") {
          throw new Error("Identity verification is currently available for service-provider accounts only.");
        }
        const account = await ensureBackendProvider(user);
        providerId = account.providerId;
        profileImageToken = account.profileImageToken;
      }

      const result = await identityVerificationService.submitVerification(submittedNin, providerId);
      const nextStatus = toFrontendStatus(result.status);
      setStatus(nextStatus);
      setVerificationReference(result.verification_reference);
      updateVerificationStatus(nextStatus, "backend", providerId);
      // Persist the provider link and its upload ownership token with the user,
      // so later profile-picture uploads reuse the same backend record.
      updateUser({
        providerId,
        ...(profileImageToken ? { profileImageToken } : {}),
      });
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "We couldn't verify your identity. Please try again.",
      );
    } finally {
      setNin("");
      setSubmitting(false);
    }
  }

  if (status === "verified") {
    return (
      <section className="page-section identity-verification-page">
        <div className="container narrow-container identity-verification-page__container">
          <div className="identity-verification-card" role="status" aria-live="polite">
            <span className="identity-verification-card__icon" aria-hidden="true">✓</span>
            <p className="eyebrow">Identity verification</p>
            <h1>Identity Verified</h1>
            <p>Your identity verification status is verified. Your NIN is not displayed.</p>
            <Badge tone="success">✓ Verified Identity</Badge>
            <Link className="button button--outline" to={user?.role === "PROVIDER" ? routePaths.providerDashboard : routePaths.customerDashboard}>Back to dashboard</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section identity-verification-page">
      <div className="container narrow-container identity-verification-page__container">
        <div className="identity-verification-card">
          <p className="eyebrow">Account safety</p>
          <h1>Verify Your Identity</h1>
          <p className="identity-verification-card__lede">
            Service providers verify their identity through HandyNaija to help keep the marketplace safe and trusted.
          </p>

          <div className="identity-demo-notice" role="note">
            This form sends the request to your FastAPI backend. A real identity check runs only after an authorized verification provider is connected — until then, requests are saved as pending and are never marked verified.
          </div>

          {status === "pending" && (
            <div className="identity-verification-feedback identity-verification-feedback--pending" role="status" aria-live="polite">
              <Badge tone="warning">Verification Pending</Badge>
              <p>The backend received your request. It stays pending until an authorized verification provider confirms your identity.</p>
              {verificationReference && (
                <p className="form-hint">
                  Verification reference: <strong>{verificationReference}</strong>
                </p>
              )}
            </div>
          )}
          {status === "failed" && (
            <div className="identity-verification-feedback identity-verification-feedback--failed" role="status" aria-live="polite">
              <strong>We couldn't verify your identity.</strong>
              <p>{rejectionReason || "Check the NIN and try again."}</p>
            </div>
          )}

          <form className="form-stack identity-verification-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="identity-nin">National Identification Number (NIN)</label>
              <input
                id="identity-nin"
                name="nin"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                maxLength={11}
                value={nin}
                onChange={(event) => handleNinChange(event.target.value)}
                aria-describedby="identity-nin-help identity-nin-count identity-nin-error"
                aria-invalid={Boolean(error)}
                disabled={submitting}
                placeholder="Enter your 11-digit NIN"
              />
              <span className="form-hint" id="identity-nin-help">Your NIN is used only for identity verification.</span>
              <span className="form-hint" id="identity-nin-count">{11 - nin.length} digits remaining</span>
              {error && <span className="field-error" id="identity-nin-error" role="alert">{error}</span>}
            </div>

            <div className="identity-privacy-notice" role="note">
              <strong>Keep your identity information private.</strong>
              <p>Your NIN is sensitive identity information. Never share it publicly or with another user. It is sent to the HandyNaija backend only for verification, is never stored in your browser, and is cleared from this form after submission.</p>
            </div>

            {submitting ? (
              <p className="identity-verification-loading" role="status" aria-live="polite">Submitting verification request...</p>
            ) : (
              <Button type="submit" size="lg" className="identity-verification-form__submit">Verify Identity</Button>
            )}
          </form>
          <Link className="text-link identity-verification-card__back" to={user?.role === "PROVIDER" ? routePaths.providerDashboard : routePaths.customerDashboard}>Back to dashboard</Link>
        </div>
      </div>
    </section>
  );
}