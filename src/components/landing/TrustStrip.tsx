import { trustStripItems } from "../../data/landingContent";
import { Icon } from "../ui/Icon";

export function TrustStrip() {
  return (
    <section className="trust-strip" aria-label="Why customers trust HandyNaija">
      <div className="container">
        <div className="trust-strip__inner">
          {trustStripItems.map((item) => (
            <div className="trust-strip__item" key={item.title}>
              <span className="trust-strip__icon" aria-hidden="true">
                <Icon name={item.icon} size={19} />
              </span>
              <div>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="trust-strip__note">
          Verification details and customer reviews are useful context, not a guarantee of service quality.
        </p>
      </div>
    </section>
  );
}
