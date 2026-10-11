import { marketplaceSteps } from "../../data/landingContent";
import { Icon } from "../ui/Icon";

export function MarketplaceSteps() {
  return (
    <section className="section steps-section" id="how-it-works" aria-labelledby="workflow-heading">
      <div className="container">
        <div className="section-heading section-heading--center steps-heading">
          <div>
            <p className="eyebrow">How HandyNaija works</p>
            <h2 id="workflow-heading">Sorted in three simple steps</h2>
          </div>
          <p className="section-heading__aside">Good work starts with knowing what happens next.</p>
        </div>
        <ol className="steps-grid">
          {marketplaceSteps.map((step) => (
            <li className="step-card" key={step.number}>
              <span className="step-card__number" aria-hidden="true">{step.number}</span>
              <span className="step-card__icon" aria-hidden="true">
                <Icon name={step.icon} size={24} />
              </span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
        <figure className="steps-photo">
          <img
            src="/images/how-it-works-customer.webp"
            alt="A customer relaxing at home after booking a verified HandyNaija professional"
            loading="lazy"
          />
          <figcaption className="steps-photo__caption">
            <span className="steps-photo__check" aria-hidden="true"><Icon name="check" size={14} /></span>
            Book with confidence — a verified professional handles the rest.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}