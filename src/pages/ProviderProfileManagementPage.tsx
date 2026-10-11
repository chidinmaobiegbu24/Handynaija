import { providers } from "../data/mockData";

const provider = providers[0];

export function ProviderProfileManagementPage() {
  return (
    <section className="page-section">
      <div className="container">
        <p className="eyebrow">profile</p>
        <h1 className="page-title">Manage your professional profile</h1>
        <p className="page-lede">Keep your business details, specialties and customer trust signals up to date.</p>

        <div className="profile-card-grid">
          <article className="detail-card">
            <h2>Business overview</h2>
            <div className="profile-field">
              <label>Business name</label>
              <p>{provider.businessName}</p>
            </div>
            <div className="profile-field">
              <label>Professional title</label>
              <p>{provider.profession}</p>
            </div>
            <div className="profile-field">
              <label>Location</label>
              <p>{provider.location.city}, {provider.location.state}</p>
            </div>
            <button className="button button--primary" type="button">Edit profile</button>
          </article>

          <article className="detail-card">
            <h2>Service specialties</h2>
            <div className="tag-list">
              {provider.services.map((service) => (
                <span key={service} className="tag">{service}</span>
              ))}
            </div>
            <button className="button button--secondary" type="button">Manage services</button>
          </article>
        </div>
      </div>
    </section>
  );
}
