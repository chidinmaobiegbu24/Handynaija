import { providers, serviceCategories } from "../data/mockData";
import type { Provider } from "../types";
import { apiRequest, getApiBaseUrl } from "./api/client";

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

interface BackendProviderRecord {
  id: string;
  full_name: string;
  service_category: string;
  skills: string[];
  description: string;
  location: string;
  state: string;
  years_of_experience: number;
  price: number;
  availability: string;
  profile_image: string;
  created_at: string;
}

// Backend records are merged into the search result list so a provider who
// uploads a profile picture actually appears (with that picture) in search.
// The cache is deliberately small and refreshable: mock data always remains
// the fallback when the backend is offline or the API is not configured.
let backendCache: Provider[] | null = null;
let backendUnavailable = false;

function mockResponseDelay() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, 180));
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

function categoryIdFor(name: string): string {
  const hit = serviceCategories.find(
    (category) => category.name.toLocaleLowerCase() === (name ?? "").trim().toLocaleLowerCase(),
  );
  return hit?.id ?? "";
}

function mapBackendProvider(doc: BackendProviderRecord): Provider {
  const categoryId = categoryIdFor(doc.service_category);
  return {
    id: doc.id,
    name: doc.full_name,
    initials: initialsFor(doc.full_name),
    profession: doc.service_category || "Professional",
    categoryId,
    services: Array.isArray(doc.skills) ? doc.skills : [],
    experienceYears: doc.years_of_experience ?? 0,
    location: {
      state: doc.state ?? "",
      city: doc.location ?? doc.state ?? "",
      area: "",
    },
    rating: 0,
    reviewCount: 0,
    verified: false,
    description: doc.description ?? "",
    available: (doc.availability ?? "").toLocaleLowerCase() === "available",
    availabilityLabel: doc.availability ?? "Available",
    profileImage: doc.profile_image || undefined,
  };
}

async function loadBackendProviders(): Promise<Provider[]> {
  if (!getApiBaseUrl() || backendUnavailable) {
    return [];
  }
  try {
    const records = await apiRequest<BackendProviderRecord[]>("/api/providers");
    backendCache = records.map(mapBackendProvider);
    backendUnavailable = false;
  } catch {
    // Offline or misconfigured backend: fall back to the mock list for the
    // rest of this session so the demo keeps working smoothly.
    backendUnavailable = true;
    backendCache = null;
  }
  return backendCache ?? [];
}

/** Clear the cached backend provider list (call after an upload/removal). */
export function refreshBackendProviderList() {
  backendCache = null;
  backendUnavailable = false;
}

export const providerService = {
  async list(): Promise<Provider[]> {
    await mockResponseDelay();
    const [mock, backend] = await Promise.all([Promise.resolve(providers), loadBackendProviders()]);
    return [...mock, ...backend];
  },

  async getById(id: string): Promise<Provider | undefined> {
    await mockResponseDelay();
    const mockHit = providers.find((provider) => provider.id === id);
    if (mockHit) {
      return mockHit;
    }
    const backend = (await loadBackendProviders()).find((provider) => provider.id === id);
    return backend;
  },

  async searchProviders(criteria: ProviderSearchCriteria = {}): Promise<Provider[]> {
    const all = await this.list();
    const query = criteria.query?.trim().toLocaleLowerCase() ?? "";
    const providerQuery = criteria.provider?.trim().toLocaleLowerCase() ?? "";
    return all.filter((provider) => {
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