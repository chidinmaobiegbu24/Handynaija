import { useEffect, useState } from "react";
import { providers } from "../data/mockData";
import { reviewService } from "../services/reviewService";
import type { Review } from "../types";

const provider = providers[0];

export function ProviderReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    reviewService.listForProvider(provider.id)
      .then((items) => {
        if (active) setReviews(items);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Reviews could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="page-section">
      <div className="container">
        <p className="eyebrow">reviews</p>
        <h1 className="page-title">Customer feedback</h1>
        <p className="page-lede">Track reviews from completed jobs to maintain trust and improve service quality.</p>

        {loading ? (
          <p className="page-lede">Loading reviews…</p>
        ) : error ? (
          <div className="empty-card"><p>{error}</p></div>
        ) : reviews.length === 0 ? (
          <div className="empty-card"><p>No customer reviews yet.</p></div>
        ) : (
          <div className="review-list">
            {reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div className="review-card__head">
                  <div>
                    <h3>{review.customerName}</h3>
                    <p>{provider.businessName}</p>
                  </div>
                  <span className="rating-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                </div>
                <p>{review.comment}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
