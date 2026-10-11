import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { StatusBadge } from "../components/ui/StatusBadge";
import { routePaths } from "../constants/routes";
import { requestService } from "../services/requestService";
import { useAuth } from "../state/AuthContext";
import type { ServiceRequest } from "../types";

function displayDate(date: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "full" }).format(new Date(`${date}T00:00:00`));
}

function displayTime(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit" }).format(new Date(2000, 0, 1, hour, minute));
}

export function RequestDetailsPage() {
  const { requestId = "" } = useParams();
  const { user } = useAuth();
  const [request, setRequest] = useState<ServiceRequest>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  const loadRequest = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      setRequest(await requestService.getRequest(requestId, user.id));
    } catch {
      setError("Please try again. Your request details have not been changed.");
    } finally {
      setLoading(false);
    }
  }, [requestId, user, retry]);

  useEffect(() => {
    void loadRequest();
  }, [loadRequest]);

  return (
    <section className="page-section">
      <div className="container request-details-page">
        <Link className="text-link" to={routePaths.requests}>← Back to requests</Link>
        {loading ? <div className="loading-state"><LoadingSpinner label="Loading request details" /></div>
          : error ? <ErrorState title="Unable to load request details." description={error}>
            <Button variant="outline" onClick={() => setRetry((value) => value + 1)}>Try again</Button>
          </ErrorState>
            : !request ? <EmptyState title="Request not found" description="This request could not be found in your customer demo account." />
              : (
                <>
                  <div className="request-details-heading">
                    <div>
                      <p className="eyebrow">Request {request.id}</p>
                      <h1 className="page-title">{request.serviceCategory} · {request.serviceName}</h1>
                      <p className="page-lede">Your request has been saved in this browser demo.</p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                  <article className="request-details-card">
                    <dl className="request-summary">
                      <div><dt>Provider</dt><dd><Link to={routePaths.providerProfile(request.providerId)}>{request.providerName}</Link></dd></div>
                      <div><dt>Service</dt><dd>{request.serviceCategory} · {request.serviceName}</dd></div>
                      <div><dt>Job description</dt><dd>{request.description}</dd></div>
                      <div><dt>Service location</dt><dd>{request.area}, {request.city}, {request.state}</dd></div>
                      <div><dt>Preferred date</dt><dd>{displayDate(request.preferredDate)}</dd></div>
                      <div><dt>Preferred time</dt><dd>{displayTime(request.preferredTime)} <span className="form-hint">(requested, not confirmed)</span></dd></div>
                      {request.image && <div><dt>Attached image</dt><dd><img className="request-summary__image" src={request.image} alt={`Preview of ${request.imageName ?? "service request attachment"}`} /></dd></div>}
                      {request.imageName && !request.image && <div><dt>Attached image</dt><dd>{request.imageName} <span className="form-hint">(preview is temporary and no longer available)</span></dd></div>}
                      {request.notes && <div><dt>Additional notes</dt><dd>{request.notes}</dd></div>}
                      <div><dt>Request status</dt><dd><StatusBadge status={request.status} /></dd></div>
                    </dl>
                    <p className="request-sidebar__notice">The provider has not confirmed your preferred appointment time. Your request status remains {request.status} until it is updated.</p>
                  </article>
                </>
              )}
      </div>
    </section>
  );
}
