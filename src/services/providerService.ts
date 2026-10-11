import { providers } from "../data/mockData";
import { serviceCategories } from "../data/mockData";
import type { Provider } from "../types";

export interface ProviderSearchCriteria {
  query?: string;
  provider?: string;
  category?: string;
  state?: string;
  city?: string;
  area?: string;
  minRating?: number;
  availableOnly?: boolean;
}

export type ProviderSort = "default" | "rating" | "experience" | "name";

function mockResponseDelay() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, 180));
}

export const providerService = {
  async list(): Promise<Provider[]> {
    await mockResponseDelay();
    return providers;
  },

  async getById(id: string): Promise<Provider | undefined> {
    await mockResponseDelay();
    return providers.find((provider) => provider.id === id);
  },

  async searchProviders(criteria: ProviderSearchCriteria = {}): Promise<Provider[]> {
    await mockResponseDelay();
    const query = criteria.query?.trim().toLocaleLowerCase() ?? "";
    const providerQuery = criteria.provider?.trim().toLocaleLowerCase() ?? "";
    return providers.filter((provider) => {
      const category = serviceCategories.find((item) => item.id === provider.categoryId);
      const searchable = [
        provider.name,
        provider.businessName,
        provider.profession,
        category?.name,
        ...(category?.subServices ?? []),
        ...provider.services,
        provider.description,
        provider.location.state,
        provider.location.city,
        provider.location.area,
      ].filter(Boolean).join(" ").toLocaleLowerCase();
      const providerName = `${provider.name} ${provider.businessName ?? ""}`.toLocaleLowerCase();

      return (!query || searchable.includes(query))
        && (!providerQuery || providerName.includes(providerQuery))
        && (!criteria.category || provider.categoryId === criteria.category)
        && (!criteria.state || provider.location.state.toLocaleLowerCase() === criteria.state.toLocaleLowerCase())
        && (!criteria.city || provider.location.city.toLocaleLowerCase() === criteria.city.toLocaleLowerCase())
        && (!criteria.area || provider.location.area.toLocaleLowerCase() === criteria.area.toLocaleLowerCase())
        && (criteria.minRating === undefined || provider.rating >= criteria.minRating)
        && (!criteria.availableOnly || provider.available);
    });
  },

  filterProviders(criteria: ProviderSearchCriteria = {}): Promise<Provider[]> {
    return this.searchProviders(criteria);
  },

  async sortProviders(items: Provider[], sort: ProviderSort): Promise<Provider[]> {
    const sorted = [...items];
    if (sort === "rating") sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    if (sort === "experience") sorted.sort((a, b) => b.experienceYears - a.experienceYears);
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  },
};
