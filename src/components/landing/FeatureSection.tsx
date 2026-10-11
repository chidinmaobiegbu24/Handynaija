import { marketplaceFeatures } from "../../data/landingContent";
import { Icon } from "../ui/Icon";

export function FeatureSection() {
  return (
    <section className="section feature-section home-why" id="why-handynaija" aria-labelledby="features-heading">
      <div className="container">
        <div className="section-heading section-heading--center">
          <div><p className="eyebrow">Good help, thoughtfully found</p><h2 id="features-heading">Why choose HandyNaija</h2></div>
          <p className="section-heading__aside">A clearer, more confident way to find help close to home.</p>
        </div>
        <div className="feature-grid">
          {marketplaceFeatures.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <span className="feature-card__icon" aria-hidden="true">
                <Icon name={feature.icon} size={21} />
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}