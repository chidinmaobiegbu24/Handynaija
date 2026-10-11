import { useState } from "react";
import { Link } from "react-router-dom";
import { routePaths } from "../../constants/routes";
import { serviceCategories } from "../../data/mockData";
import type { Provider } from "../../types";
import { HandyNaijaIllustration, getProviderIllustration } from "../illustrations/HandyNaijaIllustration";
import { Badge } from "../ui/Badge";
import { Icon } from "../ui/Icon";
import { serviceIcon } from "../ui/iconData";
import { RatingStars } from "../ui/RatingStars";

export function ProviderCard({ provider, featured = false }: { provider: Provider; featured?: boolean }) {
  const category = serviceCategories.find((item) => item.id === provider.categoryId);
  const [photoFailed, setPhotoFailed] = useState(false);
  const demoBadge = provider.verificationStatus === "verified" && provider.verificationSource === "demo";
  const verifiedBadge = !demoBadge && (
    featured
      ? provider.verified || provider.verificationStatus === "verified"
      : provider.verificationStatus === "verified"
  );
  const photoSrc = provider.profileImage || `/images/provider-${provider.id}.webp`;
  const locationLabel = [provider.location.area, provider.location.city, provider.location.state]
    .filter(Boolean).join(", ") || "Nigeria";

  return (
    <article className={`provider-card provider-card--result${featured ? " provider-card--featured" : ""}`}>
      {featured ? (
        <div className={`provider-card__visual provider-card__visual--${provider.categoryId}`}>
          {!photoFailed ? (
            <img
              className="provider-card__photo"
              src={photoSrc}
              alt={provider.businessName ?? provider.name}
              loading="lazy"
              onError={() => setPhotoFailed(true)}
            />
          ) : (
            <HandyNaijaIllustration
              kind={getProviderIllustration(provider.id)}
              className="provider-card__illustration"
              label={`${provider.name}, ${provider.profession}`}
            />
          )}
          {demoBadge && <Badge tone="warning">Demo response · not identity verified</Badge>}
          {verifiedBadge && <Badge tone="success">✓ Verified Provider</Badge>}
        </div>
      ) : (
        <div className="provider-card__top">
          <div className="provider-card__portrait">
            {!photoFailed ? (
              <img
                className="provider-card__portrait-photo"
                src={photoSrc}
                alt={`${provider.name}, ${provider.profession}`}
                loading="lazy"
                onError={() => setPhotoFailed(true)}
              />
            ) : (
              <HandyNaijaIllustration
                kind={getProviderIllustration(provider.id)}
                className="provider-card__portrait-fallback"
                label={`${provider.name}, ${provider.profession}`}
              />
            )}
          </div>
          <div className="provider-card__status">
            <Badge tone={provider.available ? "success" : "neutral"}>
              <span aria-hidden="true">{provider.available ? "●" : "○"}</span> {provider.available ? "Available" : "Not available"}
            </Badge>
            {demoBadge && <Badge tone="warning">Demo response · not identity verified</Badge>}
            {verifiedBadge && <Badge tone="success">✓ Verified Provider</Badge>}
          </div>
        </div>
      )}
      {!featured && <p className="eyebrow">{provider.profession}</p>}
      <h3>{provider.businessName ?? provider.name}</h3>
      {!featured && provider.businessName && <p className="provider-card__owner">Provider: {provider.name}</p>}
      <p className="provider-card__location">
        <Icon name="pin" size={13} aria-hidden="true" /> {locationLabel}
      </p>
      <div className="provider-card__details">
        <span><Icon name={serviceIcon(provider.categoryId)} size={13} aria-hidden="true" /> {category?.name ?? provider.profession}</span>
        <span>{provider.experienceYears} {provider.experienceYears === 1 ? "year" : "years"} experience</span>
        <span className={provider.available ? "provider-card__available" : ""}>
          {provider.available && <span aria-hidden="true">● </span>}
          {featured && provider.available ? "Available now" : provider.availabilityLabel}
        </span>
      </div>
      {!featured && (
        <ul className="provider-card__services" aria-label="Services offered">
          {provider.services.slice(0, 3).map((service) => <li key={service}>{service}</li>)}
        </ul>
      )}
      {!featured && <p className="provider-card__description">{provider.description}</p>}
      <div className="provider-card__rating">
        <RatingStars rating={provider.rating} reviewCount={provider.reviewCount} />
        {!featured && provider.rating >= 4.8 && <Badge tone="warning">Highly rated</Badge>}
      </div>
      <div className="provider-card__bottom">
        <span className="provider-card__note">Compare profile details, ratings and reviews.</span>
        <Link className="button button--outline button--sm" to={routePaths.providerProfile(provider.id)} aria-label={`View profile for ${provider.businessName ?? provider.name}`}>
          View Profile <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
