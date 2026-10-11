import { Link, useSearchParams } from "react-router-dom";
import { ServiceCard } from "../components/marketplace/ServiceCard";
import { Icon } from "../components/ui/Icon";
import { serviceIcon } from "../components/ui/iconData";
import { providers, serviceCategories } from "../data/mockData";
import { routePaths } from "../constants/routes";

export function ServicesPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const categoryId = searchParams.get("category");
  const filtered = categoryId
    ? []
    : serviceCategories.filter((category) =>
      `${category.name} ${category.description} ${(category.subServices ?? []).join(" ")}`.toLowerCase().includes(query),
    );
  const selectedCategory = serviceCategories.find((category) => category.id === categoryId);
  return (
    <section className="page-section">
      <div className="container">
        <p className="eyebrow">The right help is closer than you think</p>
        <h1 className="page-title">Find a service</h1>
        <p className="page-lede">Browse local services and find professionals near you.</p>
        {selectedCategory && (
          <div className="category-detail">
            <span className="category-detail__icon" aria-hidden="true"><Icon name={serviceIcon(selectedCategory.id)} size={24} /></span>
            <div><h2>{selectedCategory.name}</h2><p>{selectedCategory.description}</p></div>
            <Link className="button button--primary" to={`${routePaths.providers}?category=${selectedCategory.id}`}>Find {selectedCategory.name.toLowerCase()} pros →</Link>
            {selectedCategory.subServices && <ul className="category-detail__services">{selectedCategory.subServices.map((service) => <li key={service}>{service}</li>)}</ul>}
          </div>
        )}
        {selectedCategory && <Link className="text-link category-detail__back" to={routePaths.services}>← Browse other services</Link>}
        <div className="service-grid service-grid--page">
          {filtered.map((category) => (
            <ServiceCard
              key={category.id}
              category={category}
              providerCount={providers.filter((provider) => provider.categoryId === category.id).length}
            />
          ))}
        </div>
        {filtered.length === 0 && !selectedCategory && <p className="inline-empty">No service categories match “{query}” yet.</p>}
      </div>
    </section>
  );
}
