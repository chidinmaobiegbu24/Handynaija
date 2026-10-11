import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { StatusBadge } from "../components/ui/StatusBadge";
import { requestService } from "../services/requestService";
import type { ServiceRequest } from "../types";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(`${date}T00:00:00`));
}

export function ProviderRequestDetailPage() {
  const { requestId } = useParams();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requestId) return;
    void (async () => {
      setLoading(true);
      try {
        const data = await requestService.getRequest(requestId);
        setRequest(data ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [requestId]);

  const contactLine = useMemo(() => {
    if (!request) return "";
    return `${request.customerName ?? "Customer"} · ${request.customerPhone || "No phone saved"}`;
  }, [request]);

  if (loading) {
    return <section className="page-section"><div className="container"><p className="page-lede">Loading request…</p></div></section>;
  }

  if (!request) {
    return (
      <section className="page-section">
        <div className="container">
          <div className="empty-card">
            <p>Request not found.</p>
            <Link className="text-link" to="/provider/requests">Back to requests →</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="container">
        <div className="section-heading section-heading--compact">
          <div>
            <p className="eyebrow">request details</p>
            <h1 className="page-title">{request.serviceName}</h1>
          </div>
          <Link className="text-link" to="/provider/requests">← Back to requests</Link>
        </div>

        <div className="request-detail-layout">
          <article className="detail-card">
            <div className="request-detail-header">
              <div>
                <p className="request-row__id">{request.id}</p>
                <h2>{request.serviceCategory}</h2>
              </div>
              <StatusBadge status={request.status} />
            </div>

            <div className="detail-grid">
              <div>
                <label>Customer</label>
                <p>{request.customerName ?? "Customer"}</p>
              </div>
              <div>
                <label>Contact</label>
                <p>{contactLine}</p>
              </div>
              <div>
                <label>Preferred date</label>
                <p>{formatDate(request.preferredDate)}</p>
              </div>
              <div>
                <label>Preferred time</label>
                <p>{request.preferredTime}</p>
              </div>
              <div>
                <label>Location</label>
                <p>{request.area}, {request.city}</p>
              </div>
              <div>
                <label>Urgency</label>
                <p>{request.urgency ?? "Not specified"}</p>
              </div>
            </div>

            <div className="detail-section">
              <label>Job notes</label>
              <p>{request.notes || "No notes provided."}</p>
            </div>
          </article>

          <aside className="detail-card detail-card--compact">
            <h3>Next steps</h3>
            <ul className="detail-list">
              <li>Review the task and confirm the customer’s availability.</li>
              <li>Accept, reject, or reschedule the request based on your schedule.</li>
              <li>Update the job once the work is completed.</li>
            </ul>
            <Link className="button button--primary button--full" to="/provider/requests">Open request queue</Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
