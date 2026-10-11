import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { requestService } from "../services/requestService";
import { useAuth } from "../state/AuthContext";
import type { ServiceRequest } from "../types";
import { StatusBadge } from "../components/ui/StatusBadge";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(`${date}T00:00:00`));
}

export function ProviderRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      setLoading(true);
      try {
        const data = await requestService.listForProvider(user.id);
        setRequests(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const grouped = useMemo(
    () => ({
      pending: requests.filter((request) => request.status === "Pending"),
      accepted: requests.filter((request) => request.status === "Accepted"),
      completed: requests.filter((request) => request.status === "Completed"),
      cancelled: requests.filter((request) => request.status === "Cancelled"),
    }),
    [requests],
  );

  const updateStatus = async (requestId: string, status: ServiceRequest["status"]) => {
    if (!user) return;
    const updated = await requestService.updateRequestStatus(requestId, status, user.id);
    setRequests((current) => current.map((request) => (request.id === updated.id ? updated : request)));
  };

  return (
    <section className="page-section">
      <div className="container">
        <p className="eyebrow">provider requests</p>
        <h1 className="page-title">Manage incoming jobs</h1>
        <p className="page-lede">Review customer requests, accept assignments, and keep your schedule organized.</p>

        {loading ? (
          <p className="page-lede">Loading requests…</p>
        ) : (
          <div className="provider-request-board">
            {Object.entries(grouped).map(([key, items]) => (
              <div className="provider-request-column" key={key}>
                <div className="provider-request-column__header">
                  <h2>{key.charAt(0).toUpperCase() + key.slice(1)}</h2>
                  <span>{items.length}</span>
                </div>

                {items.length === 0 ? (
                  <div className="empty-card empty-card--tight">
                    <p>No {key} requests.</p>
                  </div>
                ) : (
                  items.map((request) => (
                    <article className="provider-request-card" key={request.id}>
                      <div className="provider-request-card__top">
                        <div>
                          <p className="request-row__id">{request.id}</p>
                          <h3>{request.serviceName}</h3>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>

                      <p>{request.customerName}</p>
                      <p>{request.area}, {request.city}</p>
                      <p>
                        {formatDate(request.preferredDate)} · {request.preferredTime}
                      </p>
                      <p className="provider-request-card__notes">{request.notes || "No additional notes."}</p>

                      {request.status === "Pending" && (
                        <div className="button-row">
                          <button className="button button--primary" onClick={() => void updateStatus(request.id, "Accepted")}>
                            Accept
                          </button>
                          <button className="button button--secondary" onClick={() => void updateStatus(request.id, "Rejected")}>
                            Reject
                          </button>
                        </div>
                      )}

                      {request.status === "Accepted" && (
                        <div className="button-row">
                          <button className="button button--primary" onClick={() => void updateStatus(request.id, "Completed")}>
                            Mark complete
                          </button>
                          <button className="button button--secondary" onClick={() => void updateStatus(request.id, "Rescheduled")}>
                            Reschedule
                          </button>
                        </div>
                      )}

                      <Link className="text-link" to={`/provider/requests/${request.id}`}>
                        View details →
                      </Link>
                    </article>
                  ))
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
