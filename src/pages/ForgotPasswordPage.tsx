import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthBrand } from "../components/auth/AuthBrand";
import { AuthTextField } from "../components/auth/AuthTextField";
import { Button } from "../components/ui/Button";
import { routePaths } from "../constants/routes";
import { authService } from "../services/authService";
import { validateEmailOrPhone } from "../utils/authValidation";

export function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateEmailOrPhone(identifier);
    setError(validationError ?? "");
    if (validationError || submitting) return;

    setSubmitting(true);
    try {
      await authService.forgotPassword(identifier.trim());
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-card__intro">
          <AuthBrand />
          <p className="eyebrow">A fresh start</p>
          <h1>Forgot your password?</h1>
          <p>Enter the email or phone number on your demo account. We’ll show you the next step.</p>
        </div>
        {sent ? (
          <div className="auth-feedback auth-feedback--success" role="status" aria-live="polite">
            <span aria-hidden="true">✓</span>
            <p>Check your email or phone for reset instructions.</p>
            <p className="form-hint">This is a demo confirmation. No message has been sent.</p>
            <Link className="button button--primary button--full" to={routePaths.resetPassword}>Continue to demo reset →</Link>
          </div>
        ) : (
          <form className="form-stack" onSubmit={handleSubmit} noValidate>
            <AuthTextField
              id="forgot-identifier"
              label="Email or phone"
              value={identifier}
              onChange={(value) => { setIdentifier(value); setError(""); }}
              autoComplete="username"
              placeholder="you@example.com or 080..."
              error={error}
            />
            <p className="form-hint">Reset instructions aren’t sent from this frontend demo.</p>
            <Button type="submit" className="button--full" disabled={submitting}>
              {submitting ? <><span className="button-spinner" aria-hidden="true" /> Sending...</> : "Send Reset Link"}
            </Button>
          </form>
        )}
        <p className="auth-card__foot"><Link to={routePaths.login}>← Back to sign in</Link></p>
      </div>
    </section>
  );
}
