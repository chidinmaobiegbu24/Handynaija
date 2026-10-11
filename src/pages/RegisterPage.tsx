import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthBrand } from "../components/auth/AuthBrand";
import { AuthTextField } from "../components/auth/AuthTextField";
import { LocationFields, type LocationValue } from "../components/auth/LocationFields";
import { PasswordField } from "../components/auth/PasswordField";
import { RoleChoice } from "../components/auth/RoleChoice";
import { Button } from "../components/ui/Button";
import { routePaths } from "../constants/routes";
import { serviceCategories } from "../data/mockData";
import { useAuth } from "../state/AuthContext";
import { validateEmail, validatePassword, validatePhone } from "../utils/authValidation";

type RegistrationValues = LocationValue & {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  categoryId: string;
  yearsExperience: string;
  description: string;
};

type RegistrationErrors = Partial<Record<keyof RegistrationValues | "consent" | "role" | "form", string>>;

const initialValues: RegistrationValues = {
  name: "",
  businessName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  state: "",
  city: "",
  area: "",
  categoryId: "",
  yearsExperience: "",
  description: "",
};

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState<"CUSTOMER" | "PROVIDER" | null>(
    searchParams.get("role") === "PROVIDER" ? "PROVIDER" : null,
  );
  const [step, setStep] = useState(0);
  const [values, setValues] = useState(initialValues);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { registerCustomer, registerProvider } = useAuth();
  const navigate = useNavigate();
  const stepCount = role === "PROVIDER" ? 4 : 3;
  const steps = role === "PROVIDER"
    ? ["Account type", "Your details", "Your location", "Your services"]
    : ["Account type", "Your details", "Your location"];

  useEffect(() => {
    if (!success || !role) return;
    const timer = window.setTimeout(() => navigate(routePaths.verifyIdentity, { replace: true }), 1300);
    return () => window.clearTimeout(timer);
  }, [navigate, role, success]);

  function update<K extends keyof RegistrationValues>(key: K, value: RegistrationValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function validateStep(): RegistrationErrors {
    const nextErrors: RegistrationErrors = {};
    if (step === 0) {
      if (!role) nextErrors.role = "Please select your account type.";
      return nextErrors;
    }
    if (step === 1) {
      if (values.name.trim().length < 2) nextErrors.name = "Enter your full name (at least 2 characters).";
      if (role === "PROVIDER" && values.businessName.trim().length < 2) {
        nextErrors.businessName = "Enter your business or provider name.";
      }
      nextErrors.email = validateEmail(values.email);
      nextErrors.phone = validatePhone(values.phone);
      nextErrors.password = validatePassword(values.password);
      if (!values.confirmPassword) nextErrors.confirmPassword = "Please confirm your password.";
      else if (values.confirmPassword !== values.password) nextErrors.confirmPassword = "Passwords do not match.";
      return nextErrors;
    }
    if (step === 2) {
      if (!values.state) nextErrors.state = "Please select a state.";
      if (!values.city) nextErrors.city = "Please select a city.";
      if (!values.area) nextErrors.area = "Please select an area or neighbourhood.";
      if (role === "CUSTOMER" && !consent) nextErrors.consent = "Please agree to the Terms of Service and Privacy Policy.";
      return nextErrors;
    }
    if (role === "PROVIDER") {
      if (!values.categoryId) nextErrors.categoryId = "Please select your primary service category.";
      const years = Number(values.yearsExperience);
      if (!values.yearsExperience.trim()) nextErrors.yearsExperience = "Enter your years of experience.";
      else if (!Number.isFinite(years) || years < 0) nextErrors.yearsExperience = "Enter a valid number of years (zero or more).";
      if (values.description.trim().length < 20) {
        nextErrors.description = "Add at least 20 characters about your professional experience.";
      }
      if (!consent) nextErrors.consent = "Please agree to the Terms of Service and Privacy Policy.";
    }
    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || success) return;
    const nextErrors = validateStep();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    if (step < stepCount - 1) {
      setStep((current) => current + 1);
      return;
    }
    if (!role) return;

    setSubmitting(true);
    try {
      const registrationDetails = {
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        location: { state: values.state, city: values.city, area: values.area },
      };
      if (role === "PROVIDER") {
        await registerProvider({
          ...registrationDetails,
          businessName: values.businessName.trim(),
          categoryId: values.categoryId,
          yearsExperience: Number(values.yearsExperience),
          description: values.description.trim(),
        });
      } else {
        await registerCustomer(registrationDetails);
      }
      setValues((current) => ({ ...current, password: "", confirmPassword: "" }));
      setSuccess(true);
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (success && role) {
    return (
      <section className="auth-page">
        <div className="auth-card auth-card--center" role="status" aria-live="polite">
          <span className="auth-card__icon" aria-hidden="true">✓</span>
          <p className="eyebrow">You’re all set</p>
          <h1>Your account has been created successfully.</h1>
          <p>This is a demo account. Taking you to identity verification before you continue.</p>
          <Button onClick={() => navigate(routePaths.verifyIdentity, { replace: true })}>Continue to verification →</Button>
        </div>
      </section>
    );
  }

  function updateLocation(location: LocationValue) {
    setValues((current) => ({ ...current, ...location }));
    setErrors((current) => ({ ...current, state: undefined, city: undefined, area: undefined }));
  }

  function updateConsent(checked: boolean) {
    setConsent(checked);
    if (checked) setErrors((current) => ({ ...current, consent: undefined }));
  }

  return (
    <section className="auth-page">
      <div className="auth-card auth-card--wide">
        <div className="auth-card__intro">
          <AuthBrand />
          <p className="eyebrow">A good place to start</p>
          <h1>Join your neighbourhood.</h1>
          <p>Create a demo account to explore the HandyNaija experience.</p>
        </div>
        <ol className="registration-progress" aria-label={`Step ${step + 1} of ${stepCount}: ${steps[step]}`}>
          {steps.map((label, index) => (
            <li className={index === step ? "is-current" : index < step ? "is-complete" : ""} aria-current={index === step ? "step" : undefined} key={label}>
              <span>{index < step ? "✓" : index + 1}</span><span>{label}</span>
            </li>
          ))}
        </ol>
        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          {step === 0 && (
            <>
              <RoleChoice value={role} onChange={(nextRole) => { setRole(nextRole); setErrors({}); }} />
              {errors.role && <p className="field-error" role="alert">{errors.role}</p>}
              <p className="form-hint">Choose how you’d like to use HandyNaija. You can explore the demo with either role.</p>
            </>
          )}

          {step === 1 && (
            <div className="form-grid">
              <AuthTextField id="register-name" label="Full name" value={values.name} onChange={(value) => update("name", value)} autoComplete="name" placeholder="e.g. Ada Okonkwo" error={errors.name} />
              {role === "PROVIDER" && <AuthTextField id="register-business" label="Business / provider name" value={values.businessName} onChange={(value) => update("businessName", value)} autoComplete="organization" placeholder="Name customers will recognise" error={errors.businessName} />}
              <AuthTextField id="register-email" label="Email address" type="email" value={values.email} onChange={(value) => update("email", value)} autoComplete="email" placeholder="you@example.com" error={errors.email} />
              <AuthTextField id="register-phone" label="Phone number" type="tel" inputMode="tel" value={values.phone} onChange={(value) => update("phone", value)} autoComplete="tel" placeholder="080 1234 5678" error={errors.phone} />
              <PasswordField id="register-password" name="new-password" label="Password" value={values.password} onChange={(value) => update("password", value)} autoComplete="new-password" error={errors.password} showStrength />
              <PasswordField id="register-confirm-password" name="confirm-password" label="Confirm password" value={values.confirmPassword} onChange={(value) => update("confirmPassword", value)} autoComplete="new-password" error={errors.confirmPassword} />
            </div>
          )}

          {step === 2 && (
            <>
              <p className="form-hint">Choose the general area where you need or offer services. HandyNaija does not use GPS or collect an exact address here.</p>
              <LocationFields value={values} onChange={updateLocation} errors={errors} />
              {role === "CUSTOMER" && <ConsentControl checked={consent} error={errors.consent} onChange={updateConsent} />}
            </>
          )}

          {step === 3 && role === "PROVIDER" && (
            <>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="register-category">Primary service category <span className="required-mark">*</span></label>
                  <select id="register-category" value={values.categoryId} onChange={(event) => update("categoryId", event.target.value)} aria-invalid={errors.categoryId ? true : undefined} aria-describedby={errors.categoryId ? "register-category-error" : undefined} required>
                    <option value="">Choose your main service</option>
                    {serviceCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                  {errors.categoryId && <p className="field-error" id="register-category-error" role="alert">{errors.categoryId}</p>}
                </div>
                <div className="field">
                  <label htmlFor="register-years">Years of experience <span className="required-mark">*</span></label>
                  <input id="register-years" type="number" min="0" step="1" inputMode="numeric" value={values.yearsExperience} onChange={(event) => update("yearsExperience", event.target.value)} aria-invalid={errors.yearsExperience ? true : undefined} aria-describedby={errors.yearsExperience ? "register-years-error" : undefined} required />
                  {errors.yearsExperience && <p className="field-error" id="register-years-error" role="alert">{errors.yearsExperience}</p>}
                </div>
              </div>
              <div className="field">
                <label htmlFor="register-description">Professional description <span className="required-mark">*</span></label>
                <textarea id="register-description" rows={4} maxLength={500} value={values.description} onChange={(event) => update("description", event.target.value)} placeholder="Tell customers about your experience and the work you do." aria-invalid={errors.description ? true : undefined} aria-describedby={errors.description ? "register-description-error" : "description-hint"} required />
                {errors.description && <p className="field-error" id="register-description-error" role="alert">{errors.description}</p>}
                <span className="form-hint" id="description-hint">At least 20 characters. {values.description.length}/500</span>
              </div>
              <ConsentControl checked={consent} error={errors.consent} onChange={updateConsent} />
            </>
          )}

          {errors.form && <p className="form-error" role="alert">{errors.form}</p>}
          <div className="registration-actions">
            {step > 0 && <Button type="button" variant="outline" onClick={() => { setErrors({}); setStep((current) => current - 1); }} disabled={submitting}>Back</Button>}
            <Button type="submit" className="registration-actions__next" disabled={submitting}>
              {submitting ? <><span className="button-spinner" aria-hidden="true" /> Creating account...</> : step === stepCount - 1 ? "Create Account" : "Continue →"}
            </Button>
          </div>
        </form>
        <p className="auth-card__foot">Already have an account? <Link to={routePaths.login}>Sign in</Link></p>
        <p className="auth-security-note">Demo accounts only. HandyNaija will connect to real authentication when the backend is ready.</p>
      </div>
    </section>
  );
}

function ConsentControl({
  checked,
  error,
  onChange,
}: {
  checked: boolean;
  error?: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="consent-control">
      <label className="checkbox-field">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} aria-invalid={error ? true : undefined} aria-describedby={error ? "registration-consent-error" : undefined} required />
        <span>I agree to the <Link to={routePaths.terms}>Terms of Service</Link> and <Link to={routePaths.privacy}>Privacy Policy</Link>.</span>
      </label>
      {error && <p className="field-error" id="registration-consent-error" role="alert">{error}</p>}
    </div>
  );
}
