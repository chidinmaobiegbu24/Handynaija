import { Link } from "react-router-dom";
import { providers } from "../data/mockData";

const provider = providers[0];

export function ProviderServicesPage() {
  return (
    <section className="page-section">
      <div className="container">
        <p className="eyebrow">your services</p>
        <h1 className="page-title">Services you offer</h1>
        <p className="page-lede">Keep your listing current so customers can discover and request the right help.</p>

        <div className="provider-service-list">
          {provider.services.map((service) => (
            <article className="provider-service-card" key={service}>
              <div>
                <span className="service-tag">{provider.profession}</span>
                <h3>{service}</h3>
              </div>
              <p>{provider.description}</p>
              <div className="provider-service-card__meta">
                <span>{provider.experienceYears} years’ experience</span>
                <span>{provider.availabilityLabel}</span>
              </div>
              <div className="button-row">
                <button className="button button--secondary" type="button">Edit</button>
                <button className="button button--ghost" type="button">Remove</button>
              </div>
            </article>
          ))}
        </div>

        <div className="empty-card">
          <p>Need to add a new service?</p>
          <Link className="text-link" to="/provider/profile">Update your profile →</Link>
        </div>
      </div>
    </section>
  );
}
