import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { LocationFields, type LocationValue } from "../components/auth/LocationFields";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { StatusBadge } from "../components/ui/StatusBadge";
import { routePaths } from "../constants/routes";
import { serviceCategories, serviceLocations } from "../data/mockData";
import { providerService } from "../services/providerService";
import { requestService } from "../services/requestService";
import { useAuth } from "../state/AuthContext";
import type { Provider, ServiceRequest } from "../types";

const DESCRIPTION_LIMIT = 1000;
const NOTES_LIMIT = 500;
const IMAGE_LIMIT_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface RequestDraft {
  providerId: string;
  serviceName: string;
  description: string;
  location: LocationValue;
  preferredDate: string;
  preferredTime: string;
  image?: string;
  imageName?: string;
  notes: string;
}

type RequestErrors = Partial<Record<
  "providerId" | "serviceName" | "description" | "location" | "preferredDate" | "preferredTime",
  string
>>;

function localDateValue() {
  const date = new Date();
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 10);
}

function formatRequestDate(date: string) {
  if (!date) return "Not selected";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "full",
  }).format(new Date(`${date}T00:00:00`));
}

function formatRequestTime(time: string) {
  if (!time) return "Not selected";
  const [hour, minute] = time.split(":").map(Number);
  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, hour, minute));
}

function providerDisplayName(provider: Provider) {
  return provider.businessName ?? provider.name;
}

export function RequestServicePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialProviderId = searchParams.get("provider") ?? "";
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [draft, setDraft] = useState<RequestDraft>({
    providerId: initialProviderId,
    serviceName: "",
    description: "",
    location: { state: "", city: "", area: "" },
    preferredDate: "",
    preferredTime: "",
    notes: "",
  });
  const [errors, setErrors] = useState<RequestErrors>({});
  const [stage, setStage] = useState<"form" | "review" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [imageError, setImageError] = useState("");
  const [createdRequest, setCreatedRequest] = useState<ServiceRequest>();
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    providerService.list()
      .then((result) => {
        if (!active) return;
        setProviders(result);
        const initialProvider = result.find((provider) => provider.id === draft.providerId);
        if (initialProvider && !draft.location.state) {
          setDraft((current) => ({
            ...current,
            location: { ...initialProvider.location },
          }));
        }
      })
      .catch(() => {
        if (active) setLoadError("Please try again. Your request form has not been changed.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  const provider = useMemo(
    () => providers.find((item) => item.id === draft.providerId),
    [providers, draft.providerId],
  );
  const category = serviceCategories.find((item) => item.id === provider?.categoryId);
  const selectedState = serviceLocations.find((item) => item.state === draft.location.state);
  const selectedCity = selectedState?.cities.find((item) => item.name === draft.location.city);
  const minimumDate = localDateValue();
  function updateDraft<K extends keyof RequestDraft>(key: K, value: RequestDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function selectProvider(providerId: string) {
    const nextProvider = providers.find((item) => item.id === providerId);
    setDraft((current) => ({
      ...current,
      providerId,
      serviceName: "",
      location: nextProvider ? { ...nextProvider.location } : { state: "", city: "", area: "" },
    }));
    setErrors((current) => ({ ...current, providerId: undefined, serviceName: undefined, location: undefined }));
  }

  function updateLocation(nextLocation: LocationValue) {
    setDraft((current) => ({ ...current, location: nextLocation }));
    setErrors((current) => ({ ...current, location: undefined }));
  }

  function validateDraft(): RequestErrors {
    const nextErrors: RequestErrors = {};
    if (!provider) nextErrors.providerId = "Please select a provider.";
    if (!provider?.services.includes(draft.serviceName)) nextErrors.serviceName = "Please select a service this provider offers.";
    if (!draft.description.trim()) nextErrors.description = "Please describe the service you need.";
    else if (draft.description.length > DESCRIPTION_LIMIT) nextErrors.description = `Keep the description under ${DESCRIPTION_LIMIT} characters.`;
    const validState = serviceLocations.find((item) => item.state === draft.location.state);
    const validCity = validState?.cities.find((item) => item.name === draft.location.city);
    const validArea = validCity?.areas.includes(draft.location.area);
    if (!validState || !validCity || !validArea) nextErrors.location = "Please select your service location.";
    if (!draft.preferredDate || draft.preferredDate < minimumDate) nextErrors.preferredDate = "Please select a valid date today or later.";
    if (!draft.preferredTime) nextErrors.preferredTime = "Please select a preferred time.";
    return nextErrors;
  }

  function continueToReview() {
    const nextErrors = validateDraft();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitError("");
    setStage("review");
  }

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setImageError("");
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Choose a PNG, JPEG, WebP or GIF image.");
      event.target.value = "";
      return;
    }
    if (file.size > IMAGE_LIMIT_BYTES) {
      setImageError("Choose an image smaller than 5 MB.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setImageError("Could not preview this image. Choose another image.");
        return;
      }
      setDraft((current) => ({ ...current, image: reader.result as string, imageName: file.name }));
    };
    reader.onerror = () => setImageError("Could not preview this image. Choose another image.");
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setDraft((current) => ({ ...current, image: undefined, imageName: undefined }));
    setImageError("");
    if (fileInput.current) fileInput.current.value = "";
  }

  async function submitRequest() {
    if (!user || user.role !== "CUSTOMER" || !provider || !category) return;
    const nextErrors = validateDraft();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStage("form");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    try {
      const request = await requestService.createRequest({
        customerId: user.id,
        providerId: provider.id,
        providerName: providerDisplayName(provider),
        serviceCategory: category.name,
        serviceName: draft.serviceName,
        description: draft.description.trim(),
        state: draft.location.state,
        city: draft.location.city,
        area: draft.location.area,
        preferredDate: draft.preferredDate,
        preferredTime: draft.preferredTime,
        image: draft.image,
        imageName: draft.imageName,
        notes: draft.notes.trim() || undefined,
      });
      setCreatedRequest(request);
      setStage("success");
    } catch {
      setSubmitError("Unable to submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <section className="page-section">
        <div className="container request-loading" aria-busy="true">
          <LoadingSpinner label="Preparing service request form" />
          <p>Preparing your request…</p>
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="page-section">
        <div className="container">
          <ErrorState title="Something went wrong while preparing your request." description={loadError}>
            <Button variant="outline" onClick={() => setRetry((value) => value + 1)}>Try again</Button>
          </ErrorState>
        </div>
      </section>
    );
  }

  if (initialProviderId && !providers.some((item) => item.id === initialProviderId)) {
    return (
      <section className="page-section">
        <div className="container provider-not-found">
          <ErrorState title="Provider not found" description="The provider you're looking for could not be found." />
          <div className="provider-not-found__actions">
            <Link className="button button--outline" to={routePaths.providers}>Back to providers</Link>
            <Link className="button button--primary" to={routePaths.services}>Browse services</Link>
          </div>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="page-section">
        <div className="container request-access-card">
          <p className="eyebrow">One quick step</p>
          <h1>Sign in to request a service</h1>
          <p>Your provider and request link will be waiting after you sign in as a customer.</p>
          <Link className="button button--primary" to={routePaths.login} state={{ from: { pathname: location.pathname, search: location.search } }}>
            Continue to customer login
          </Link>
          <Link className="text-link" to={routePaths.providers}>Back to providers</Link>
        </div>
      </section>
    );
  }

  if (user.role !== "CUSTOMER") {
    return (
      <section className="page-section">
        <div className="container request-access-card">
          <p className="eyebrow">Customer requests</p>
          <h1>Switch to a customer demo account</h1>
          <p>Service requests can only be created from the customer experience. This is a frontend demo role check.</p>
          <Link className="button button--outline" to={routePaths.providers}>Back to providers</Link>
        </div>
      </section>
    );
  }

  if (stage === "success" && createdRequest) {
    return (
      <section className="page-section request-success-page">
        <div className="container request-success">
          <span className="auth-card__icon" aria-hidden="true">✓</span>
          <p className="eyebrow">Request submitted successfully</p>
          <h1>Your request is on its way.</h1>
          <p className="page-lede">Your service request has been sent to the provider. The preferred time is not confirmed until the provider responds.</p>
          <dl className="request-summary request-summary--success">
            <div><dt>Request ID</dt><dd>{createdRequest.id}</dd></div>
            <div><dt>Provider</dt><dd>{createdRequest.providerName}</dd></div>
            <div><dt>Service</dt><dd>{createdRequest.serviceCategory} · {createdRequest.serviceName}</dd></div>
            <div><dt>Preferred date</dt><dd>{formatRequestDate(createdRequest.preferredDate)}</dd></div>
            <div><dt>Preferred time</dt><dd>{formatRequestTime(createdRequest.preferredTime)} · Requested</dd></div>
            <div><dt>Location</dt><dd>{createdRequest.area}, {createdRequest.city}, {createdRequest.state}</dd></div>
            <div><dt>Status</dt><dd><StatusBadge status={createdRequest.status} /></dd></div>
          </dl>
          <div className="request-success__actions">
            <Button onClick={() => navigate(`/requests/${encodeURIComponent(createdRequest.id)}`)}>View request</Button>
            <Link className="button button--outline" to={routePaths.providers}>Browse more providers</Link>
            <Link className="button button--text" to={routePaths.home}>Back to home</Link>
          </div>
        </div>
      </section>
    );
  }

  const providerName = provider ? providerDisplayName(provider) : "Choose a provider";

  return (
    <section className="page-section request-flow-page">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to={routePaths.providers}>Providers</Link>
          {provider && <><span aria-hidden="true">/</span><Link to={routePaths.providerProfile(provider.id)}>{providerName}</Link></>}
          <span aria-hidden="true">/</span>
          <span aria-current="page">Request service</span>
        </nav>
        <div className="request-flow-heading">
          <div>
            <p className="eyebrow">A few details to get started</p>
            <h1 className="page-title">{stage === "review" ? "Review Your Request" : "Request a service"}</h1>
            <p className="page-lede">Your preferred date and time are a request only. The provider will confirm or suggest another time.</p>
          </div>
          <ol className="request-progress" aria-label="Request steps">
            <li className={stage === "form" ? "is-current" : "is-complete"}><span>1</span><span>Details</span></li>
            <li className={stage === "review" ? "is-current" : ""} aria-current={stage === "review" ? "step" : undefined}><span>2</span><span>Review</span></li>
          </ol>
        </div>

        <div className="request-flow-layout">
          <div className="request-flow-main">
            {stage === "form" ? (
              <form className="request-form-card" noValidate onSubmit={(event) => { event.preventDefault(); continueToReview(); }}>
                <section className="request-form-section" aria-labelledby="request-service-details-title">
                  <h2 id="request-service-details-title">Service details</h2>
                  <div className="form-stack">
                    <div className="field">
                      <label htmlFor="request-provider">Provider <span className="required-mark">*</span></label>
                      <select id="request-provider" value={draft.providerId} onChange={(event) => selectProvider(event.target.value)} aria-invalid={Boolean(errors.providerId)} aria-describedby={errors.providerId ? "request-provider-error" : undefined} required>
                        <option value="">Choose a provider</option>
                        {providers.map((item) => <option value={item.id} key={item.id}>{providerDisplayName(item)} · {item.location.city}</option>)}
                      </select>
                      {errors.providerId && <p className="field-error" id="request-provider-error" role="alert">{errors.providerId}</p>}
                    </div>
                    <div className="request-selected-provider" aria-live="polite">
                      <span className="request-selected-provider__label">Service category</span>
                      {provider && category ? <Badge>{category.name}</Badge> : <span>Select a provider to see their service category</span>}
                    </div>
                    <div className="field">
                      <label htmlFor="request-service">Service you need <span className="required-mark">*</span></label>
                      <select id="request-service" value={draft.serviceName} onChange={(event) => updateDraft("serviceName", event.target.value)} disabled={!provider} aria-invalid={Boolean(errors.serviceName)} aria-describedby={errors.serviceName ? "request-service-error" : undefined} required>
                        <option value="">{provider ? "Choose a service" : "Choose a provider first"}</option>
                        {provider?.services.map((service) => <option key={service} value={service}>{service}</option>)}
                      </select>
                      {errors.serviceName && <p className="field-error" id="request-service-error" role="alert">{errors.serviceName}</p>}
                    </div>
                    <div className="field">
                      <label htmlFor="request-description">Describe what you need <span className="required-mark">*</span></label>
                      <textarea id="request-description" rows={5} maxLength={DESCRIPTION_LIMIT} value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} placeholder="Tell the provider what you need help with…" aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "request-description-error request-description-count" : "request-description-count"} required />
                      <span className="field-character-count" id="request-description-count">{draft.description.length}/{DESCRIPTION_LIMIT} characters</span>
                      {errors.description && <p className="field-error" id="request-description-error" role="alert">{errors.description}</p>}
                    </div>
                  </div>
                </section>

                <section className="request-form-section" aria-labelledby="request-location-title">
                  <h2 id="request-location-title">Where do you need help?</h2>
                  <p className="form-hint">Choose an area only. Do not enter a private street address.</p>
                  <div className="request-location-fields">
                    <LocationFields
                      idPrefix="request"
                      value={draft.location}
                      onChange={updateLocation}
                      errors={errors.location ? { state: errors.location, city: errors.location, area: errors.location } : {}}
                    />
                    {!errors.location && (
                      <span className="sr-only" aria-live="polite">
                        {selectedState && selectedCity ? `Selected location: ${selectedCity.name}, ${selectedState.state}` : ""}
                      </span>
                    )}
                  </div>
                </section>

                <section className="request-form-section" aria-labelledby="request-schedule-title">
                  <h2 id="request-schedule-title">Preferred date and time</h2>
                  <div className="form-grid">
                    <div className="field">
                      <label htmlFor="request-date">Preferred date <span className="required-mark">*</span></label>
                      <input id="request-date" type="date" min={minimumDate} value={draft.preferredDate} onChange={(event) => updateDraft("preferredDate", event.target.value)} aria-invalid={Boolean(errors.preferredDate)} aria-describedby={errors.preferredDate ? "request-date-error" : undefined} required />
                      {errors.preferredDate && <p className="field-error" id="request-date-error" role="alert">{errors.preferredDate}</p>}
                    </div>
                    <div className="field">
                      <label htmlFor="request-time">Preferred time <span className="required-mark">*</span></label>
                      <input id="request-time" type="time" value={draft.preferredTime} onChange={(event) => updateDraft("preferredTime", event.target.value)} aria-invalid={Boolean(errors.preferredTime)} aria-describedby={errors.preferredTime ? "request-time-error" : undefined} required />
                      {errors.preferredTime && <p className="field-error" id="request-time-error" role="alert">{errors.preferredTime}</p>}
                    </div>
                  </div>
                  <p className="form-hint">This is your preferred time, not a confirmed appointment.</p>
                </section>

                <section className="request-form-section" aria-labelledby="request-image-title">
                  <h2 id="request-image-title">Add a photo <span className="field__optional">(optional)</span></h2>
                  <div className="field">
                    <label htmlFor="request-image">Choose an image</label>
                    <input ref={fileInput} id="request-image" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={selectImage} aria-describedby="request-image-hint" />
                    <span className="form-hint" id="request-image-hint">PNG, JPEG, WebP or GIF · up to 5 MB. Preview stays in this browser and is not uploaded.</span>
                  </div>
                  {imageError && <p className="field-error" role="alert">{imageError}</p>}
                  {draft.image && (
                    <div className="request-image-preview">
                      <img src={draft.image} alt={`Preview of ${draft.imageName ?? "selected service request image"}`} />
                      <div><span>{draft.imageName}</span><Button type="button" variant="text" size="sm" onClick={removeImage}>Remove image</Button></div>
                    </div>
                  )}
                </section>

                <section className="request-form-section" aria-labelledby="request-notes-title">
                  <h2 id="request-notes-title">Anything else the provider should know? <span className="field__optional">(optional)</span></h2>
                  <div className="field">
                    <label className="sr-only" htmlFor="request-notes">Additional notes</label>
                    <textarea id="request-notes" rows={3} maxLength={NOTES_LIMIT} value={draft.notes} onChange={(event) => updateDraft("notes", event.target.value)} placeholder="Add useful access instructions or other context…" aria-describedby="request-notes-count" />
                    <span className="field-character-count" id="request-notes-count">{draft.notes.length}/{NOTES_LIMIT} characters</span>
                  </div>
                </section>

                <div className="request-form-actions">
                  <Link className="button button--text" to={provider ? routePaths.providerProfile(provider.id) : routePaths.providers}>Back</Link>
                  <Button type="submit">Review request <span aria-hidden="true">→</span></Button>
                </div>
              </form>
            ) : (
              <section className="request-review-card" aria-labelledby="request-review-title">
                <h2 className="sr-only" id="request-review-title">Review Your Request</h2>
                {submitError && (
                  <ErrorState title="Unable to submit your request." description={submitError}>
                    <Button variant="outline" onClick={submitRequest} disabled={submitting}>Try again</Button>
                  </ErrorState>
                )}
                <dl className="request-summary">
                  <div><dt>Provider</dt><dd>{providerName}</dd></div>
                  <div><dt>Service</dt><dd>{category?.name} · {draft.serviceName}</dd></div>
                  <div><dt>Job description</dt><dd>{draft.description}</dd></div>
                  <div><dt>Location</dt><dd>{draft.location.state}<br />{draft.location.city}<br />{draft.location.area}</dd></div>
                  <div><dt>Preferred date</dt><dd>{formatRequestDate(draft.preferredDate)}</dd></div>
                  <div><dt>Preferred time</dt><dd>{formatRequestTime(draft.preferredTime)} <span className="form-hint">(requested, not confirmed)</span></dd></div>
                  {draft.image && <div><dt>Image</dt><dd><img className="request-summary__image" src={draft.image} alt={`Preview of ${draft.imageName ?? "selected service request image"}`} /></dd></div>}
                  {draft.notes && <div><dt>Additional notes</dt><dd>{draft.notes}</dd></div>}
                </dl>
                <div className="request-review__provider">
                  {provider && <Avatar initials={provider.initials} label={`${provider.name} profile avatar`} />}
                  <span>{providerName}</span>
                  {category && <Badge>{category.name}</Badge>}
                </div>
                <div className="request-form-actions">
                  <Button variant="outline" onClick={() => { setSubmitError(""); setStage("form"); }}>Back</Button>
                  <Button onClick={submitRequest} disabled={submitting}>
                    {submitting ? <><span className="button-spinner" aria-hidden="true" /> Submitting…</> : "Submit request"}
                  </Button>
                </div>
                <p className="form-hint">Your request will be marked Pending until the provider responds. No payment is collected.</p>
              </section>
            )}
          </div>

          <aside className="request-sidebar">
            <h2>Request summary</h2>
            {provider ? (
              <div className="request-sidebar__provider">
                <Avatar initials={provider.initials} label={`${provider.name} profile avatar`} />
                <div><strong>{providerName}</strong><span>{category?.name} · {provider.location.city}</span></div>
              </div>
            ) : <p className="form-hint">Choose a provider to see your request summary.</p>}
            <dl className="request-sidebar__details">
              <div><dt>Service</dt><dd>{draft.serviceName || "Not selected"}</dd></div>
              <div><dt>Location</dt><dd>{[draft.location.area, draft.location.city, draft.location.state].filter(Boolean).join(", ") || "Not selected"}</dd></div>
              <div><dt>Preferred date</dt><dd>{draft.preferredDate ? formatRequestDate(draft.preferredDate) : "Not selected"}</dd></div>
              <div><dt>Preferred time</dt><dd>{draft.preferredTime ? `${formatRequestTime(draft.preferredTime)} · Requested` : "Not selected"}</dd></div>
            </dl>
            <p className="request-sidebar__notice">Your date and time are preferences only. The provider must confirm the appointment.</p>
          </aside>
        </div>
      </div>
    </section>
  );
}
