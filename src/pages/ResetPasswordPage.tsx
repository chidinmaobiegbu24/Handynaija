import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthBrand } from "../components/auth/AuthBrand";
import { PasswordField } from "../components/auth/PasswordField";
import { Button } from "../components/ui/Button";
import { routePaths } from "../constants/routes";
import { authService } from "../services/authService";
import { validatePassword } from "../utils/authValidation";

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [updated, setUpdated] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof errors = { password: validatePassword(password) };
    if (!confirmPassword) nextErrors.confirmPassword = "Please confirm your password.";
    else if (confirmPassword !== password) nextErrors.confirmPassword = "Passwords do not match.";
    setErrors(nextErrors);
    if (nextErrors.password || nextErrors.confirmPassword || submitting) return;

    setSubmitting(true);
    try {
      await authService.resetPassword();
      setPassword("");
      setConfirmPassword("");
      setUpdated(true);
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-card__intro">
          <AuthBrand />
          <p className="eyebrow">Choose something memorable</p>
          <h1>Set a new password.</h1>
          <p>This frontend preview does not use a reset token or change a real account password.</p>
        </div>
        {updated ? (
          <div className="auth-feedback auth-feedback--success" role="status" aria-live="polite">
            <span aria-hidden="true">✓</span>
            <h2>Your password has been updated successfully.</h2>
            <p className="form-hint">This was a mock confirmation only. Your demo account password was not saved.</p>
            <Link className="button button--primary button--full" to={routePaths.login}>Return to sign in</Link>
          </div>
        ) : (
          <form className="form-stack" onSubmit={handleSubmit} noValidate>
            <PasswordField id="reset-password" name="new-password" label="New password" value={password} onChange={(value) => { setPassword(value); setErrors((current) => ({ ...current, password: undefined, form: undefined })); }} autoComplete="new-password" error={errors.password} showStrength />
            <PasswordField id="reset-confirm-password" name="confirm-password" label="Confirm new password" value={confirmPassword} onChange={(value) => { setConfirmPassword(value); setErrors((current) => ({ ...current, confirmPassword: undefined, form: undefined })); }} autoComplete="new-password" error={errors.confirmPassword} />
            {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
            <Button type="submit" className="button--full" disabled={submitting}>
              {submitting ? <><span className="button-spinner" aria-hidden="true" /> Updating...</> : "Reset Password"}
            </Button>
          </form>
        )}
        <p className="auth-card__foot"><Link to={routePaths.login}>← Back to sign in</Link></p>
      </div>
    </section>
  );
}
