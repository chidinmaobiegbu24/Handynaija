import { useState } from "react";
import { Link } from "react-router-dom";
import { HandyNaijaIllustration, getServiceIllustration } from "../illustrations/HandyNaijaIllustration";
import { Icon } from "../ui/Icon";
import { serviceIcon } from "../ui/iconData";
import type { ServiceCategory } from "../../types";

export function ServiceCard({
  category,
  providerCount,
}: {
  category: ServiceCategory;
  providerCount?: number;
}) {
  const [photoFailed, setPhotoFailed] = useState(false);

  return (
    <Link className="service-card" to={`/services?category=${category.id}`}>
      <span className="service-card__media">
        {!photoFailed ? (
          <img
            className="service-card__photo"
            src={`/images/category-${category.id}.webp`}
            alt={`${category.name} services`}
            loading="lazy"
            onError={() => setPhotoFailed(true)}
          />
        ) : (
          <HandyNaijaIllustration
            kind={getServiceIllustration(category.id)}
            className="service-card__image"
          />
        )}
        <span className="service-card__icon" aria-hidden="true"><Icon name={serviceIcon(category.id)} size={22} /></span>
      </span>
      <span className="service-card__copy">
        <strong>{category.name}</strong>
        <span>{category.description}</span>
        {providerCount !== undefined && <span>{providerCount} local {providerCount === 1 ? "pro" : "pros"}</span>}
      </span>
      <span className="service-card__arrow" aria-hidden="true">↗</span>
    </Link>
  );
}
