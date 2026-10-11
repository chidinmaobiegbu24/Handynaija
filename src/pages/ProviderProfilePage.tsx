import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Avatar } from "../components/ui/Avatar";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { RatingStars } from "../components/ui/RatingStars";
import { routePaths } from "../constants/routes";
import { serviceCategories } from "../data/mockData";
import { providerService } from "../services/providerService";
import { reviewService } from "../services/reviewService";
import type { Provider, Review } from "../types";

export function ProviderProfilePage() {
  const { providerId = "" } = useParams();
  const [provider, setProvider] = useState<Provider>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      providerService.getById(providerId),
      reviewService.listForProvider(providerId),
    ])
      .then(([result, providerReviews]) => {
        if (!active) return;
        setProvider(result);
        setReviews(providerReviews);
      })
      .catch(() => {
        if (active) setError("Please try again. Your provider details are still available to load.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [providerId, retry]);

  if (loading) {
    return (
      <section className="page-section">
        <div className="container profile-loading" aria-busy="true">
          <LoadingSpinner label="Loading provider profile" />
          <p>Loading provider profile…</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-section">
        <div className="container">
          <ErrorState title="Unable to load provider profile." description={error}>
            <Button variant="outline" onClick={() => setRetry((value) => value + 1)}>Try again</Button>
          </ErrorState>
        </div>
      </section>
    );
  }

  if (!provider) {
    return (
      <section className="page-section">
        <div className="container provider-not-found">
          <EmptyState
            title="Provider not found"
            description="The provider you're looking for could not be found."
          />
          <div className="provider-not-found__actions">
            <Link className="button button--outline" to={routePaths.providers}>Back to providers</Link>
            <Link className="button button--primary" to={routePaths.services}>Browse services</Link>
          </div>
        </div>
      </section>
    );
  }

  const category = serviceCategories.find((item) => item.id === provider.categoryId);
  const reviewCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => review.rating === rating).length,
  }));
  const reviewTotal = reviews.length;
  const providerName = provider.businessName ?? provider.name;
  const providerLocation = [provider.location.area, provider.location.city, provider.location.state]
    .filter(Boolean).join(", ");
  const providerState = provider.location.state || "";

  return (
    <section className="page-section provider-profile-page">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link to={routePaths.providers}>Providers</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{providerName}</span>
        </nav>
        <div className="profile-layout">
          <article className="profile-card provider-profile">
            <header className="provider-profile__header">
              <Avatar initials={provider.initials} size="large" image={provider.profileImage} label={`${provider.name} profile avatar`} />
              <div className="provider-profile__identity">
                <div className="provider-profile__badges">
                  {category && <Badge>{category.name}</Badge>}
                  {provider.verificationStatus === "verified" && provider.verificationSource === "demo" && <Badge tone="warning">Demo response · not identity verified</Badge>}
                  {provider.verificationStatus === "verified" && provider.verificationSource !== "demo" && <Badge tone="success">✓ Verified Provider</Badge>}
                </div>
                <h1>{provider.name}</h1>
                {provider.businessName && <p className="provider-profile__business">{provider.businessName}</p>}
                <p className="provider-profile__profession">{provider.profession}</p>
                <p className="provider-profile__location">
                  <span aria-hidden="true">⌖</span> {providerLocation}{providerState && " State"}
                </p>
              </div>
            </header>

            <div className="provider-profile__highlights" aria-label="Provider summary">
              <div>
                <span className="provider-profile__availability" aria-hidden="true">{provider.available ? "●" : "○"}</span>
                <span>{provider.available ? "Available now" : "Unavailable"}{!provider.available && ` · ${provider.availabilityLabel}`}</span>
              </div>
              <div><RatingStars rating={provider.rating} reviewCount={provider.reviewCount} /></div>
              <div><strong>{provider.experienceYears}</strong> {provider.experienceYears === 1 ? "year" : "years"} of experience</div>
            </div>

            <section className="provider-profile__section" aria-labelledby="provider-about-title">
              <h2 id="provider-about-title">About this provider</h2>
              <p>{provider.description}</p>
              <dl className="provider-profile__facts">
                <div><dt>Primary service</dt><dd>{category?.name ?? provider.profession}</dd></div>
                <div><dt>Experience</dt><dd>{provider.experienceYears} years</dd></div>
                <div><dt>Service area</dt><dd>{provider.location.area}, {provider.location.city}, {provider.location.state}</dd></div>
              </dl>
            </section>

            <section className="provider-profile__section" aria-labelledby="provider-services-title">
              <h2 id="provider-services-title">Services offered</h2>
              <ul className="provider-service-list">
                {provider.services.map((service) => <li key={service}>{service}</li>)}
              </ul>
              <p className="form-hint">Discuss the job details and any pricing directly with the provider before work begins.</p>
            </section>

            <section className="provider-profile__section provider-reviews" id="provider-reviews" aria-labelledby="provider-reviews-title">
              <div className="provider-reviews__heading">
                <div>
                  <h2 id="provider-reviews-title">Ratings and reviews</h2>
                  <RatingStars rating={provider.rating} reviewCount={provider.reviewCount} />
                  <p className="form-hint">Ratings reflect customer feedback and are not a guarantee of service quality.</p>
                </div>
              </div>
              {reviewTotal > 0 ? (
                <>
                  <div className="review-distribution" aria-label={`Distribution among ${reviewTotal} sample reviews`}>
                    {reviewCounts.map(({ rating, count }) => (
                      <div className="review-distribution__row" key={rating}>
                        <span>{rating} stars</span>
                        <div className="review-distribution__track" aria-hidden="true">
                          <span style={{ width: `${(count / reviewTotal) * 100}%` }} />
                        </div>
                        <span>{count}</span>
                      </div>
                    ))}
                    <p className="form-hint">Distribution of the {reviewTotal} demo review{reviewTotal === 1 ? "" : "s"} shown.</p>
                  </div>
                  <ul className="provider-review-list">
                    {reviews.slice(0, 3).map((review) => (
                      <li className="provider-review" key={review.id}>
                        <div className="provider-review__top">
                          <strong>{review.customerName}</strong>
                          <span className="provider-review__rating" aria-label={`${review.rating} out of 5 stars`}>
                            <span aria-hidden="true">★★★★★</span> {review.rating}/5
                          </span>
                        </div>
                        <p>“{review.comment}”</p>
                        <span className="provider-review__date">{review.date} · Demo review</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="form-hint">Detailed demo reviews are not available for this provider yet.</p>
              )}
            </section>
          </article>

          <aside className="profile-cta provider-booking-card">
            <p className="eyebrow">Start a conversation</p>
            <h2>Need a hand?</h2>
            <p>Tell {provider.name.split(" ")[0]} what you need. Your preferred time is a request, not a confirmed booking.</p>
            <Link className="button button--primary button--full" to={`${routePaths.requestService}?provider=${encodeURIComponent(provider.id)}`}>
              Request service
            </Link>
            {provider.verificationStatus === "verified" && provider.verificationSource === "demo" && <p className="provider-booking-card__note">Demo response only — this identity has not been verified.</p>}
            {provider.verificationStatus === "verified" && provider.verificationSource !== "demo" && <p className="provider-booking-card__note">Identity verified.</p>}
          </aside>
        </div>
      </div>
    </section>
  );
}
