import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { IdentityVerificationCard } from "../components/account/IdentityVerificationCard";
import { Avatar } from "../components/ui/Avatar";
import { StatusBadge } from "../components/ui/StatusBadge";
import { providers } from "../data/mockData";
import { requestService } from "../services/requestService";
import { useAuth } from "../state/AuthContext";
import type { ServiceRequest } from "../types";

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

function formatDisplayDate(date: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(`${date}T00:00:00`));
}

export function DashboardPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      setLoading(true);
      try {
        const nextRequests = await requestService.listForCurrentUser(user.id);
        setRequests(nextRequests);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const stats = useMemo(() => {
    const open = requests.filter((request) => ["Pending", "Accepted", "Scheduled", "In Progress"].includes(request.status)).length;
    const completed = requests.filter((request) => request.status === "Completed").length;
    const cancelled = requests.filter((request) => request.status === "Cancelled").length;
    return {
      open,
      completed,
      cancelled,
    };
  }, [requests]);

  const recentRequests = requests.slice(0, 3);
  const recommendations = providers.slice(0, 3);

  return (
    <section className="page-section">
      <div className="container">
        <div className="dashboard-greeting">
        <Avatar
          initials={initialsFor(user?.name ?? "?")}
          size="large"
          image={user?.profileImage}
          alt={`${user?.name ?? "Your"} profile picture`}
        />
        <div>
          <p className="eyebrow">{user?.role.toLowerCase()} space</p>
          <h1 className="page-title">Good day, {user?.name.split(" ")[0]}.</h1>
        </div>
      </div>
      <p className="page-lede">Here’s a quick overview of your HandyNaija activity and progress.</p>

      <IdentityVerificationCard status={user?.verificationStatus} source={user?.verificationSource} />

        <div className="dashboard-stats">
          <div className="dashboard-stat">
            <span>Open requests</span>
            <strong>{loading ? "—" : stats.open}</strong>
            <span>{stats.open > 0 ? "Needs attention" : "All clear"}</span>
          </div>
          <div className="dashboard-stat">
            <span>Completed</span>
            <strong>{loading ? "—" : stats.completed}</strong>
            <span>Successful jobs</span>
          </div>
          <div className="dashboard-stat">
            <span>Your role</span>
            <strong className="dashboard-stat__role">{user?.role}</strong>
            <span>{stats.cancelled} cancelled</span>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-panel">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="eyebrow">Your latest activity</p>
                <h2>Recent requests</h2>
              </div>
              <Link className="text-link" to="/requests">View all →</Link>
            </div>

            {loading ? (
              <p className="page-lede">Loading your latest requests…</p>
            ) : recentRequests.length === 0 ? (
              <div className="empty-card">
                <p>No service requests yet.</p>
                <Link to="/providers" className="text-link">Find a provider →</Link>
              </div>
            ) : (
              <div className="request-list">
                {recentRequests.map((request) => (
                  <article className="request-row" key={request.id}>
                    <div>
                      <span className="request-row__id">{request.id}</span>
                      <h3>{request.serviceCategory} · {request.serviceName}</h3>
                      <p>
                        {request.providerName} · {formatDisplayDate(request.preferredDate)} · {request.area}, {request.city}
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
                <h2>Get started</h2>
              </div>
            </div>
            <div className="dashboard-links">
              <Link to="/providers" className="dashboard-link">
                <span>Find a provider</span>
                <strong>Browse local experts</strong>
              </Link>
              <Link to="/requests" className="dashboard-link">
                <span>Manage requests</span>
                <strong>Track status updates</strong>
              </Link>
              <Link to="/messages" className="dashboard-link">
                <span>Messages</span>
                <strong>Chat with providers</strong>
              </Link>
              <Link to="/profile" className="dashboard-link">
                <span>Profile</span>
                <strong>Update your details</strong>
              </Link>
            </div>
          </aside>
        </div>

        <div className="section-heading section-heading--compact">
          <div>
            <p className="eyebrow">Recommended</p>
            <h2>Popular providers</h2>
          </div>
          <Link className="text-link" to="/providers">Browse all →</Link>
        </div>

        <div className="recommendation-grid">
          {recommendations.map((provider) => (
            <article className="recommendation-card" key={provider.id}>
              <div className="recommendation-card__top">
                <div className="avatar avatar--small">{provider.initials}</div>
                <div>
                  <h3>{provider.name}</h3>
                  <p>{provider.profession}</p>
                </div>
              </div>
              <p>{provider.description}</p>
              <div className="recommendation-card__meta">
                <span>⭐ {provider.rating}</span>
                <span>{provider.location.city}</span>
              </div>
              <Link className="text-link" to={`/provider/${provider.id}`}>View profile →</Link>
            </article>
          ))}
        </div>

        <div className="cta-banner">
          <div>
            <p className="eyebrow">Need something done?</p>
            <h2>Book your next job in a few steps.</h2>
          </div>
          <Link className="button button--primary" to="/providers">Find a provider</Link>
        </div>
      </div>
    </section>
  );
}
