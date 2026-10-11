import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthBrand } from "../components/auth/AuthBrand";
import { AuthTextField } from "../components/auth/AuthTextField";
import { PasswordField } from "../components/auth/PasswordField";
import { Button } from "../components/ui/Button";
import { getDashboardPath, routePaths } from "../constants/routes";
import { useAuth } from "../state/AuthContext";
import { validateEmailOrPhone, validatePassword } from "../utils/authValidation";
import type { UserRole } from "../types";

type LoginErrors = Partial<Record<"identifier" | "password" | "form", string>>;

function isSafeRoleDestination(pathname: string | undefined, role: UserRole) {
  if (!pathname || !pathname.startsWith("/") || pathname.startsWith("//")) return false;
  if (role === "ADMIN") return pathname === "/admin" || pathname.startsWith("/admin/");
  if (role === "PROVIDER") {
    return pathname.startsWith("/provider/") || pathname === routePaths.verifyIdentity || pathname === "/messages" || pathname === "/dashboard";
  }
  return ["/dashboard", "/requests", "/request-service", "/messages", "/profile", routePaths.verifyIdentity].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState<UserRole>("CUSTOMER");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: LoginErrors = {};
    nextErrors.identifier = validateEmailOrPhone(identifier);
    nextErrors.password = validatePassword(password);
    if (!nextErrors.identifier && !nextErrors.password) {
      setErrors({});
      setSubmitting(true);
      try {
        await login(identifier.trim(), role, remember);
        const requestedLocation = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from;
        const requestedPath = requestedLocation?.pathname;
        navigate(
          isSafeRoleDestination(requestedPath, role)
            ? `${requestedPath}${requestedLocation?.search ?? ""}${requestedLocation?.hash ?? ""}`
            : getDashboardPath(role),
          { replace: true },
        );
      } catch {
        setErrors({ form: "Unable to sign in. Please check your details." });
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setErrors(nextErrors);
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-card__intro">
          <AuthBrand />
          <p className="eyebrow">Welcome back</p>
          <h1>Welcome Back</h1>
          <p>Sign in to pick up where you left off.</p>
        </div>
        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          <AuthTextField
            id="login-identifier"
            label="Email or phone"
            type="text"
            inputMode="text"
            autoComplete="username"
            placeholder="you@example.com or 080..."
            value={identifier}
            onChange={setIdentifier}
            error={errors.identifier}
          />
          <PasswordField
            id="login-password"
            name="password"
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            error={errors.password}
          />
          <div className="login-options">
            <label className="checkbox-field">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              <span>Remember me</span>
            </label>
            <Link to={routePaths.forgotPassword}>Forgot password?</Link>
          </div>
          <label className="field">
            <span>Sign in as</span>
            <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
              <option value="CUSTOMER">Customer</option>
              <option value="PROVIDER">Service provider</option>
              <option value="ADMIN">Administrator (demo)</option>
            </select>
          </label>
          <p className="form-hint">Demo sign-in only. Use 8+ characters with a letter and a number. Passwords are not sent or stored.</p>
          {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
          <Button type="submit" className="button--full" disabled={submitting}>
            {submitting ? <><span className="button-spinner" aria-hidden="true" /> Signing in...</> : <>Sign In <span aria-hidden="true">→</span></>}
          </Button>
        </form>
        <p className="auth-card__foot">Don’t have an account? <Link to={routePaths.register}>Sign Up</Link></p>
        <p className="auth-security-note">This frontend demo does not provide production authentication or security.</p>
      </div>
    </section>
  );
}
