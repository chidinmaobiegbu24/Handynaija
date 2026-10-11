export function RatingStars({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount?: number;
}) {
  return (
    <span className="rating" aria-label={`${rating} out of 5 stars`}>
      <span aria-hidden="true">★</span> {rating.toFixed(1)}
      {reviewCount !== undefined && (
        <span className="rating__count">({reviewCount})</span>
      )}
    </span>
  );
}
