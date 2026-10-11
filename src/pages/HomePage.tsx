import { useState } from "react";
import { Link } from "react-router-dom";
import { ProviderCard } from "../components/marketplace/ProviderCard";
import { ServiceCard } from "../components/marketplace/ServiceCard";
import { FeatureSection } from "../components/landing/FeatureSection";
import { MarketplaceSearch } from "../components/landing/MarketplaceSearch";
import { MarketplaceSteps } from "../components/landing/MarketplaceSteps";
import { ProviderCta } from "../components/landing/ProviderCta";
import { TrustSection } from "../components/landing/TrustSection";
import { TrustStrip } from "../components/landing/TrustStrip";
import { HeroScene } from "../components/illustrations/HeroScene";
import { Icon } from "../components/ui/Icon";
import { serviceCategories, providers } from "../data/mockData";

const HERO_PHOTO_SRC = "/images/hero-worker.webp";

export function HomePage() {
  const [heroPhotoOk, setHeroPhotoOk] = useState(true);

  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__content">
            <p className="hero__eyebrow">
              <Icon name="pin" size={15} aria-hidden="true" />
              Trusted local help across Nigeria
            </p>
            <h1>Good hands,<br /><span>close by.</span></h1>
            <p className="hero__description">
              Discover reliable professionals for everyday services — plumbing, electrical work,
              cleaning, repairs and more — near you, anywhere in Nigeria.
            </p>
            <div className="hero__trust">
              <span className="hero__trust-icon" aria-hidden="true"><Icon name="shield" size={16} /></span>
              <span>Check profiles, ratings, reviews and verification details before you reach out.</span>
            </div>
          </div>
          <div className="hero-art">
            {heroPhotoOk ? (
              <img
                className="hero-art__photo"
                src={HERO_PHOTO_SRC}
                alt="A friendly HandyNaija service professional ready to help"
                onError={() => setHeroPhotoOk(false)}
              />
            ) : (
              <HeroScene className="hero-art__image" />
            )}
            <div className="hero-art__float hero-art__float--verified">
              <Icon name="verified" size={16} aria-hidden="true" />
              <span>Verified profiles</span>
            </div>
            <div className="hero-art__tag">
              <span className="hero-art__tag-check" aria-hidden="true"><Icon name="check" size={14} /></span>
              <span><strong>Good hands, close by.</strong><br />Skilled pros in your area</span>
            </div>
          </div>
        </div>
        <div className="container hero__search-wrap">
          <MarketplaceSearch />
        </div>
      </section>

      <TrustStrip />

      <section className="section section--categories home-categories">
        <div className="container">
          <div className="section-heading">
            <div><p className="eyebrow">A little help goes a long way</p><h2>Popular Service Categories</h2></div>
            <Link className="text-link" to="/services">Explore all services <Icon name="arrow-right" size={15} aria-hidden="true" /></Link>
          </div>
          <div className="service-grid home-service-grid">
            {serviceCategories.map((category) => (
              <ServiceCard
                key={category.id}
                category={category}
                providerCount={providers.filter((provider) => provider.categoryId === category.id).length}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section section--pros home-providers">
        <div className="container">
          <div className="section-heading">
            <div><p className="eyebrow">Good people, good work</p><h2>Featured Service Providers</h2></div>
            <Link className="text-link" to="/providers">View all providers <Icon name="arrow-right" size={15} aria-hidden="true" /></Link>
          </div>
          <div className="provider-grid home-provider-grid">
            {providers.slice(0, 4).map((provider) => <ProviderCard key={provider.id} provider={provider} featured />)}
          </div>
        </div>
      </section>

      <MarketplaceSteps />

      <FeatureSection />

      <TrustSection />

      <ProviderCta />
    </>
  );
}