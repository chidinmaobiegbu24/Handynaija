import { Link } from "react-router-dom";
import { IdentityVerificationCard } from "../components/account/IdentityVerificationCard";
import { StatusBadge } from "../components/ui/StatusBadge";
import { providers } from "../data/mockData";
import { requestService } from "../services/requestService";
import { useAuth } from "../state/AuthContext";
import { useEffect, useMemo, useState } from "react";
import type { ServiceRequest } from "../types";

const providerPreview = providers[0];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(`${date}T00:00:00`));
}

export function ProviderDashboardPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      setLoading(true);
      try {
        const nextRequests = await requestService.listForProvider(user.id);
        setRequests(nextRequests);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const stats = useMemo(() => {
    const pending = requests.filter((request) => request.status === "Pending").length;
    const accepted = requests.filter((request) => request.status === "Accepted").length;
    const completed = requests.filter((request) => request.status === "Completed").length;
    return { pending, accepted, completed };
  }, [requests]);

  const recentRequests = requests.slice(0, 3);

  return (
    <section className="page-section">
      <div className="container">
        <p className="eyebrow">provider workspace</p>
        <h1 className="page-title">Welcome back, {user?.name.split(" ")[0] ?? "provider"}.</h1>
        <p className="page-lede">Stay on top of your new requests, your schedule and your recent customer activity.</p>

        <IdentityVerificationCard status={user?.verificationStatus} source={user?.verificationSource} provider />

        <div className="dashboard-stats">
          <div className="dashboard-stat">
            <span>New requests</span>
            <strong>{loading ? "—" : stats.pending}</strong>
            <span>Awaiting review</span>
          </div>
          <div className="dashboard-stat">
            <span>Accepted</span>
            <strong>{loading ? "—" : stats.accepted}</strong>
            <span>Confirmed jobs</span>
          </div>
          <div className="dashboard-stat">
            <span>Completed</span>
            <strong>{loading ? "—" : stats.completed}</strong>
            <span>Finished work</span>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-panel">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="eyebrow">Incoming</p>
                <h2>Latest requests</h2>
              </div>
              <Link className="text-link" to="/provider/requests">Manage all →</Link>
            </div>

            {loading ? (
              <p className="page-lede">Loading your incoming requests…</p>
            ) : recentRequests.length === 0 ? (
              <div className="empty-card">
                <p>No incoming requests right now.</p>
                <Link to="/provider/services" className="text-link">Update your services →</Link>
              </div>
            ) : (
              <div className="request-list">
                {recentRequests.map((request) => (
                  <article className="request-row" key={request.id}>
                    <div>
                      <span className="request-row__id">{request.id}</span>
                      <h3>{request.serviceCategory} · {request.serviceName}</h3>
                      <p>
                        {request.area}, {request.city} · {formatDate(request.preferredDate)} · {request.preferredTime}
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="dashboard-panel dashboard-panel--side">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="eyebrow">Quick actions</p>
                <h2>Run your day</h2>
              </div>
            </div>
            <div className="dashboard-links">
              <Link to="/provider/requests" className="dashboard-link">
                <span>Incoming jobs</span>
                <strong>Review new requests</strong>
              </Link>
              <Link to="/provider/services" className="dashboard-link">
                <span>Your services</span>
                <strong>Refresh your offer list</strong>
              </Link>
              <Link to="/provider/availability" className="dashboard-link">
                <span>Availability</span>
                <strong>Update your schedule</strong>
              </Link>
              <Link to="/provider/profile" className="dashboard-link">
                <span>Profile</span>
                <strong>Manage your profile</strong>
              </Link>
            </div>
          </aside>
        </div>

        <div className="section-heading section-heading--compact">
          <div>
            <p className="eyebrow">Profile snapshot</p>
            <h2>Professional summary</h2>
          </div>
        </div>

        <div className="recommendation-grid">
          <article className="recommendation-card">
            <div className="recommendation-card__top">
              <div className="avatar avatar--small">{providerPreview.initials}</div>
              <div>
                <h3>{providerPreview.businessName}</h3>
                <p>{providerPreview.profession}</p>
              </div>
            </div>
            <p>{providerPreview.description}</p>
            <div className="recommendation-card__meta">
              <span>⭐ {providerPreview.rating}</span>
              <span>{providerPreview.location.city}</span>
            </div>
            <Link className="text-link" to="/provider/profile">Edit profile →</Link>
          </article>
          <article className="recommendation-card">
            <div className="recommendation-card__top">
              <div className="avatar avatar--small">FS</div>
              <div>
                <h3>Service setup</h3>
                <p>Package details</p>
              </div>
            </div>
            <p>Review your service list, response times and customer-facing notes to keep your profile strong.</p>
            <div className="recommendation-card__meta">
              <span>{providerPreview.services.length} services</span>
              <span>{providerPreview.experienceYears} yrs</span>
            </div>
            <Link className="text-link" to="/provider/services">Manage services →</Link>
          </article>
          <article className="recommendation-card">
            <div className="recommendation-card__top">
              <div className="avatar avatar--small">RV</div>
              <div>
                <h3>Reviews</h3>
                <p>Customer feedback</p>
              </div>
            </div>
            <p>Keep an eye on recent reviews and improve response quality so customers trust your work.</p>
            <div className="recommendation-card__meta">
              <span>⭐ {providerPreview.rating}</span>
              <span>{providerPreview.reviewCount} reviews</span>
            </div>
            <Link className="text-link" to="/provider/reviews">View reviews →</Link>
          </article>
        </div>
      </div>
    </section>
  );
}
