import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ProviderCard } from "../components/marketplace/ProviderCard";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { routePaths } from "../constants/routes";
import { serviceCategories, serviceLocations } from "../data/mockData";
import { providerService, type ProviderSort } from "../services/providerService";
import type { Provider } from "../types";

type SearchValues = {
  query: string;
  provider: string;
  category: string;
  state: string;
  city: string;
  area: string;
  rating: string;
  available: boolean;
};

function valuesFromParams(params: URLSearchParams): SearchValues {
  const state = params.get("state") ?? "";
  const city = params.get("city") ?? "";
  const location = params.get("location") ?? "";
  return {
    query: params.get("service") ?? params.get("q") ?? (!state && !city ? location : ""),
    provider: params.get("provider") ?? "",
    category: params.get("category") ?? "",
    state,
    city,
    area: params.get("area") ?? "",
    rating: params.get("rating") ?? "",
    available: params.get("availability") === "available",
  };
}

function criteriaParams(values: SearchValues) {
  const params = new URLSearchParams();
  if (values.query.trim()) params.set("service", values.query.trim());
  if (values.provider.trim()) params.set("provider", values.provider.trim());
  if (values.category) params.set("category", values.category);
  if (values.state) params.set("state", values.state);
  if (values.city) params.set("city", values.city);
  if (values.area) params.set("area", values.area);
  if (values.rating) params.set("rating", values.rating);
  if (values.available) params.set("availability", "available");
  return params;
}

function matchingProviders(values: SearchValues): Promise<Provider[]> {
  return providerService.searchProviders({
    query: values.query,
    provider: values.provider,
    category: values.category,
    state: values.state,
    city: values.city,
    area: values.area,
    minRating: values.rating ? Number(values.rating) : undefined,
    availableOnly: values.available,
  });
}

export function ProvidersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlValues = useMemo(() => valuesFromParams(searchParams), [searchParams]);
  const [draft, setDraft] = useState(urlValues);
  const [applied, setApplied] = useState(urlValues);
  const [sort, setSort] = useState<ProviderSort>("default");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const states = serviceLocations;
  const selectedState = states.find((location) => location.state === draft.state);
  const selectedCity = selectedState?.cities.find((location) => location.name === draft.city);
  const categoryName = serviceCategories.find((category) => category.id === applied.category)?.name;
  const locationLabel = [applied.area, applied.city, applied.state].filter(Boolean).join(", ");
  const isFiltered = Boolean(
    applied.query || applied.provider || applied.category || applied.state || applied.city
      || applied.area || applied.rating || applied.available,
  );

  useEffect(() => {
    setDraft(urlValues);
    setApplied(urlValues);
  }, [urlValues]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    matchingProviders(applied)
      .then((result) => providerService.sortProviders(result, sort))
      .then((result) => {
        if (active) setProviders(result);
      })
      .catch(() => {
        if (active) setError("Please try again. Your search filters are still here.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applied, sort]);

  function updateDraft<K extends keyof SearchValues>(key: K, value: SearchValues[K]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
      ...(key === "state" ? { city: "", area: "" } : {}),
      ...(key === "city" ? { area: "" } : {}),
    }));
  }

  function applyValues(values: SearchValues) {
    setApplied(values);
    setDraft(values);
    setSearchParams(criteriaParams(values), { replace: false });
    setFiltersOpen(false);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applyValues(draft);
  }

  function clearFilters() {
    const cleared: SearchValues = {
      query: "",
      provider: "",
      category: "",
      state: "",
      city: "",
      area: "",
      rating: "",
      available: false,
    };
    applyValues(cleared);
  }

  function removeFilter(key: keyof SearchValues) {
    const next = { ...applied, [key]: key === "available" ? false : "" };
    if (key === "state") {
      next.city = "";
      next.area = "";
    }
    if (key === "city") next.area = "";
    applyValues(next);
  }

  const stateCityLabel = applied.city || applied.state;
  const heading = categoryName && stateCityLabel
    ? `${categoryName} professionals in ${stateCityLabel}`
    : categoryName
      ? `${categoryName} professionals`
      : stateCityLabel
        ? `Local professionals in ${stateCityLabel}`
        : applied.query
          ? `Results for “${applied.query}”`
          : applied.provider
            ? `Providers matching “${applied.provider}”`
            : "Find your local pros";

  const chips: { key: keyof SearchValues; label: string }[] = [];
  if (applied.query) chips.push({ key: "query", label: `Service: ${applied.query}` });
  if (applied.provider) chips.push({ key: "provider", label: `Provider: ${applied.provider}` });
  if (categoryName) chips.push({ key: "category", label: categoryName });
  if (applied.state) chips.push({ key: "state", label: applied.state });
  if (applied.city) chips.push({ key: "city", label: applied.city });
  if (applied.area) chips.push({ key: "area", label: applied.area });
  if (applied.rating) chips.push({ key: "rating", label: `${applied.rating}+ stars` });
  if (applied.available) chips.push({ key: "available", label: "Available now" });

  return (
    <section className="page-section discovery-page">
      <div className="container">
        <p className="eyebrow">Skilled people, just around the corner</p>
        <h1 className="page-title">{heading}</h1>
        <p className="page-lede">Compare local professionals by service, location, experience and customer feedback.</p>

        <form className="discovery-search" onSubmit={handleSearch} role="search">
          <label className="discovery-search__field">
            <span>What service do you need?</span>
            <input
              list="discovery-service-suggestions"
              value={draft.query}
              onChange={(event) => updateDraft("query", event.target.value)}
              placeholder="Electrical, plumbing, cleaning..."
            />
            <datalist id="discovery-service-suggestions">
              {serviceCategories.map((category) => <option key={category.id} value={category.name} />)}
            </datalist>
          </label>
          <label className="discovery-search__field">
            <span>Search provider</span>
            <input value={draft.provider} onChange={(event) => updateDraft("provider", event.target.value)} placeholder="Name or business name" />
          </label>
          <label className="discovery-search__field discovery-search__field--location">
            <span>State</span>
            <select value={draft.state} onChange={(event) => updateDraft("state", event.target.value)}>
              <option value="">Any state</option>
              {states.map((location) => <option key={location.state} value={location.state}>{location.state}</option>)}
            </select>
          </label>
          <label className="discovery-search__field discovery-search__field--location">
            <span>City</span>
            <select value={draft.city} disabled={!selectedState} onChange={(event) => updateDraft("city", event.target.value)}>
              <option value="">{selectedState ? "Any city" : "Choose a state"}</option>
              {selectedState?.cities.map((location) => <option key={location.name} value={location.name}>{location.name}</option>)}
            </select>
          </label>
          <label className="discovery-search__field discovery-search__field--location">
            <span>Area / neighbourhood</span>
            <select value={draft.area} disabled={!selectedCity} onChange={(event) => updateDraft("area", event.target.value)}>
              <option value="">{selectedCity ? "Any area" : "Choose a city"}</option>
              {selectedCity?.areas.map((area) => <option key={area} value={area}>{area}</option>)}
            </select>
          </label>
          <Button type="submit">Search providers <span aria-hidden="true">→</span></Button>
        </form>

        <div className="discovery-toolbar">
          <button className="button button--outline filters-toggle" type="button" aria-expanded={filtersOpen} aria-controls="provider-filters" onClick={() => setFiltersOpen((open) => !open)}>
            <span aria-hidden="true">☷</span> {filtersOpen ? "Hide filters" : "Filters"}
            {chips.length > 0 && <span className="filters-toggle__count">{chips.length}</span>}
          </button>
          <label className="sort-control">
            <span>Sort by</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as ProviderSort)}>
              <option value="default">Default order</option>
              <option value="rating">Rating: high to low</option>
              <option value="experience">Experience: high to low</option>
              <option value="name">Name: A–Z</option>
            </select>
          </label>
        </div>

        {chips.length > 0 && (
          <div className="active-filters" aria-label="Active search filters">
            {chips.map((chip) => (
              <button className="filter-chip" type="button" key={`${chip.key}-${chip.label}`} onClick={() => removeFilter(chip.key)}>
                {chip.label}<span aria-hidden="true">×</span><span className="sr-only">Remove {chip.label} filter</span>
              </button>
            ))}
            <button className="clear-filters-link" type="button" onClick={clearFilters}>Clear all</button>
          </div>
        )}

        <div className="discovery-layout">
          <aside className={`filter-panel${filtersOpen ? " filter-panel--open" : ""}`} id="provider-filters" aria-label="Filter providers">
            <div className="filter-panel__heading"><h2>Filters</h2><Button variant="text" size="sm" onClick={clearFilters} disabled={!isFiltered}>Clear all</Button></div>
            <fieldset className="filter-group">
              <legend>Category</legend>
              {serviceCategories.map((category) => (
                <label className="filter-option" key={category.id}>
                  <input type="radio" name="filter-category" checked={draft.category === category.id} onChange={() => updateDraft("category", category.id)} />
                  <span>{category.name}</span>
                </label>
              ))}
              <label className="filter-option"><input type="radio" name="filter-category" checked={!draft.category} onChange={() => updateDraft("category", "")} /><span>All categories</span></label>
            </fieldset>
            <fieldset className="filter-group">
              <legend>Minimum rating</legend>
              {[["", "Any rating"], ["4", "4+ stars"], ["3", "3+ stars"], ["2", "2+ stars"]].map(([value, label]) => (
                <label className="filter-option" key={label}><input type="radio" name="filter-rating" checked={draft.rating === value} onChange={() => updateDraft("rating", value)} /><span>{label}</span></label>
              ))}
            </fieldset>
            <fieldset className="filter-group">
              <legend>Availability</legend>
              <label className="filter-option"><input type="checkbox" checked={draft.available} onChange={(event) => updateDraft("available", event.target.checked)} /><span>Available now</span></label>
            </fieldset>
            <div className="filter-panel__actions">
              <Button className="button--full" onClick={() => applyValues(draft)}>Apply filters</Button>
              <button className="clear-filters-link" type="button" onClick={clearFilters} disabled={!isFiltered}>Clear filters</button>
            </div>
          </aside>

          <div className="discovery-results" aria-live="polite" aria-busy={loading}>
            <div className="results-heading">
              <div>
                <h2>{loading ? "Finding local pros..." : `${providers.length} ${providers.length === 1 ? "provider" : "providers"} found`}</h2>
                <p>{[categoryName, locationLabel].filter(Boolean).join(" · ") || "Showing professionals across our demo locations"}</p>
              </div>
            </div>
            {loading ? (
              <div className="provider-results-grid">
                {[0, 1, 2].map((item) => <ProviderCardSkeleton key={item} />)}
              </div>
            ) : error ? (
              <ErrorState title="Unable to load providers." description={error}>
                <Button variant="outline" onClick={() => setApplied((current) => ({ ...current }))}>Retry</Button>
              </ErrorState>
            ) : providers.length ? (
              <div className="provider-results-grid">{providers.map((provider) => <ProviderCard key={provider.id} provider={provider} />)}</div>
            ) : (
              <div className="discovery-empty">
                <EmptyState title="No providers found" description="Try changing your service, location, or filters." />
                <div className="discovery-empty__actions">
                  {isFiltered && <Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
                  <Link className="button button--primary" to={routePaths.services}>Browse all services</Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProviderCardSkeleton() {
  return (
    <article className="provider-card provider-card--skeleton" aria-hidden="true">
      <div className="skeleton skeleton--avatar" />
      <div className="skeleton skeleton--line skeleton--short" />
      <div className="skeleton skeleton--line skeleton--heading" />
      <div className="skeleton skeleton--line" />
      <div className="skeleton skeleton--block" />
    </article>
  );
}
