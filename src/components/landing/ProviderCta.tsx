import { Link } from "react-router-dom";
import { routePaths } from "../../constants/routes";
import { Icon } from "../ui/Icon";

export function ProviderCta() {
  return (
    <section className="provider-cta home-final-cta" aria-labelledby="home-cta-heading">
      <div className="container provider-cta__inner">
        <div className="provider-cta__content">
          <p className="eyebrow">Local help starts here</p>
          <h2 id="home-cta-heading">Need a hand? Or ready to lend one?</h2>
          <p>
            Find a trusted local professional for your next job — or join HandyNaija and
            reach customers near you.
          </p>
          <div className="home-final-cta__actions">
            <Link className="button button--light button--lg" to={routePaths.providers}>
              Find a Provider <Icon name="arrow-right" size={18} aria-hidden="true" />
            </Link>
            <Link className="button button--cta-outline button--lg" to={routePaths.providerSignup}>
              Become a Provider <Icon name="arrow-right" size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="provider-cta__note" aria-hidden="true">
          <span className="provider-cta__note-mark">h</span>
          <span>Good hands<br />make light work.</span>
          <span className="provider-cta__note-star">✳</span>
        </div>
      </div>
    </section>
  );
}