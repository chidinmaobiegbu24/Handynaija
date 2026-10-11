import { trustSignals } from "../../data/landingContent";
import { Icon } from "../ui/Icon";

export function TrustSection() {
  return (
    <section className="section trust-section" id="trust-safety" aria-labelledby="trust-heading">
      <div className="container trust-section__layout">
        <div className="trust-section__intro">
          <p className="eyebrow">Trust &amp; safety</p>
          <h2 id="trust-heading">Confidence in every connection</h2>
          <p>
            HandyNaija is built around transparency: clear profiles, honest reviews and simple ways
            to raise a concern. Check the details that matter before you arrange help.
          </p>
          <p className="trust-disclaimer">
            Verification information and customer reviews are useful context, not a guarantee of service quality.
          </p>
        </div>
        <ul className="trust-list">
          {trustSignals.map((signal) => (
            <li className="trust-card" key={signal.title}>
              <span className="trust-card__icon" aria-hidden="true">
                <Icon name={signal.icon} size={21} />
              </span>
              <div>
                <h3>{signal.title}</h3>
                <p>{signal.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}