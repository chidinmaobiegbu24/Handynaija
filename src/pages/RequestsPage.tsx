import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(`${date}T00:00:00`));
}

export function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  const loadRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      setRequests(await requestService.listForCurrentUser(user.id));
    } catch {
      setError("Your request list is still available. Please try loading it again.");
    } finally {
      setLoading(false);
    }
  }, [user, retry]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  return (
    <section className="page-section">
      <div className="container">
        <p className="eyebrow">Keep it all in one place</p>
        <h1 className="page-title">Your requests</h1>
        <p className="page-lede">Track your requests and see their latest status.</p>
        {loading ? <div className="loading-state"><LoadingSpinner label="Loading your requests" /></div>
          : error ? <ErrorState title="Unable to load requests." description={error}>
            <Button variant="outline" onClick={() => setRetry((value) => value + 1)}>Try again</Button>
          </ErrorState>
            : requests.length === 0 ? <div className="request-empty">
              <EmptyState title="No service requests yet" description="When you request a service, you can track its status and details here." />
              <Link className="button button--primary" to={routePaths.providers}>Find a provider</Link>
            </div>
              : <div className="request-list">{requests.map((request) => (
                <article className="request-row" key={request.id}>
                  <div>
                    <span className="request-row__id">{request.id}</span>
                    <h2>{request.serviceCategory} · {request.serviceName}</h2>
                    <p>{request.providerName} · {displayDate(request.preferredDate)} · {request.area}, {request.city}</p>
                    <Link className="text-link" to={`/requests/${encodeURIComponent(request.id)}`}>View request details →</Link>
                  </div>
                  <StatusBadge status={request.status} />
                </article>
              ))}</div>}
      </div>
    </section>
  );
}
