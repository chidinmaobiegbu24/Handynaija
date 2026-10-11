import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { routePaths } from "../../constants/routes";
import { serviceCategories, serviceLocations } from "../../data/mockData";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

export function MarketplaceSearch() {
  const navigate = useNavigate();
  const [service, setService] = useState("");
  const [provider, setProvider] = useState("");
  const [location, setLocation] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = new URLSearchParams();
    if (service.trim()) query.set("service", service.trim());
    if (provider.trim()) query.set("provider", provider.trim());

    if (location) {
      const [state, city, area] = location.split("|");
      if (state) query.set("state", state);
      if (city) query.set("city", city);
      if (area) query.set("area", area);
    }

    navigate(`${routePaths.providers}${query.size ? `?${query.toString()}` : ""}`);
  }

  return (
    <form className="marketplace-search" id="provider-search" onSubmit={handleSubmit} role="search">
      <label className="marketplace-search__service">
        <span className="marketplace-search__label">
          <Icon name="search" size={15} aria-hidden="true" /> What service do you need?
        </span>
        <input
          list="service-suggestions"
          name="service"
          value={service}
          onChange={(event) => setService(event.target.value)}
          placeholder="e.g. plumbing, cleaning"
          autoComplete="off"
        />
        <datalist id="service-suggestions">
          {serviceCategories.map((category) => <option key={category.id} value={category.name} />)}
        </datalist>
      </label>
      <label className="marketplace-search__provider">
        <span className="marketplace-search__label">
          <Icon name="user" size={15} aria-hidden="true" /> Provider name <span className="marketplace-search__optional">(optional)</span>
        </span>
        <input
          name="provider"
          value={provider}
          onChange={(event) => setProvider(event.target.value)}
          placeholder="Search by name"
          autoComplete="off"
        />
      </label>
      <label className="marketplace-search__location">
        <span className="marketplace-search__label">
          <Icon name="pin" size={15} aria-hidden="true" /> Your location
        </span>
        <select
          aria-label="Your State, City or Area"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
        >
          <option value="">Choose a State, City or Area</option>
          {serviceLocations.map((serviceLocation) => (
            <optgroup key={serviceLocation.state} label={serviceLocation.state}>
              <option key={serviceLocation.state} value={`${serviceLocation.state}||`}>{serviceLocation.state}</option>
              {serviceLocation.cities.flatMap((city) => [
                <option key={`${serviceLocation.state}-${city.name}`} value={`${serviceLocation.state}|${city.name}|`}>
                  {city.name}
                </option>,
                ...city.areas.map((area) => (
                  <option key={`${city.name}-${area}`} value={`${serviceLocation.state}|${city.name}|${area}`}>
                    {area}, {city.name}
                  </option>
                )),
              ])}
            </optgroup>
          ))}
        </select>
      </label>
      <Button type="submit" size="lg" className="marketplace-search__submit">
        Search Services <Icon name="search" size={16} aria-hidden="true" />
      </Button>
    </form>
  );
}