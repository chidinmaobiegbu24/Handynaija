import { serviceRequests } from "../data/mockData";
import type { ServiceRequest } from "../types";

const STORAGE_KEY = "handynaija-demo-requests";
const imagePreviews = new Map<string, string>();

type NewServiceRequest = Omit<ServiceRequest, "id" | "createdAt" | "status">;

function seedDemoRequests(): ServiceRequest[] {
  const seeded = [...serviceRequests];
  const stored = readStoredRequests();
  return stored.length > 0 ? stored : seeded;
}

function pause() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, 280));
}

function readStoredRequests(): ServiceRequest[] {
  const serialized = localStorage.getItem(STORAGE_KEY);
  if (!serialized) return [];

  try {
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) throw new Error("Saved requests are not a list.");
    return parsed as ServiceRequest[];
  } catch (error) {
    throw new Error("Saved demo requests could not be read. Please clear the demo request data and try again.", { cause: error });
  }
}

function saveRequests(requests: ServiceRequest[]) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(requests.map((request) => ({ ...request, image: undefined }))),
  );
}

function withTemporaryImage(request: ServiceRequest): ServiceRequest {
  const image = imagePreviews.get(request.id);
  return image ? { ...request, image } : request;
}

function createRequestId() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `HN-${new Date().getFullYear()}-${suffix}`;
}

export const requestService = {
  async listForCurrentUser(customerId: string): Promise<ServiceRequest[]> {
    await pause();
    return seedDemoRequests()
      .filter((request) => request.customerId === customerId)
      .map(withTemporaryImage)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getRequest(requestId: string, customerId?: string): Promise<ServiceRequest | undefined> {
    await pause();
    const request = seedDemoRequests().find((item) => {
      if (item.id !== requestId) return false;
      return customerId ? item.customerId === customerId : true;
    });
    return request ? withTemporaryImage(request) : undefined;
  },

  async listForProvider(providerId: string): Promise<ServiceRequest[]> {
    await pause();
    return seedDemoRequests()
      .filter((request) => request.providerId === providerId)
      .map(withTemporaryImage)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async updateRequestStatus(requestId: string, status: ServiceRequest["status"], providerId: string): Promise<ServiceRequest> {
    await pause();
    const requests = seedDemoRequests();
    const index = requests.findIndex((item) => item.id === requestId && item.providerId === providerId);
    if (index < 0) throw new Error("Request not found.");
    const updated: ServiceRequest = { ...requests[index], status };
    requests[index] = updated;
    saveRequests(requests);
    return withTemporaryImage(updated);
  },

  async createRequest(input: NewServiceRequest): Promise<ServiceRequest> {
    await pause();
    const requests = seedDemoRequests();
    const request: ServiceRequest = {
      ...input,
      id: createRequestId(),
      status: "Pending",
      createdAt: new Date().toISOString(),
    };
    requests.push(request);
    saveRequests(requests);
    if (request.image) imagePreviews.set(request.id, request.image);
    return request;
  },

  async cancelRequest(requestId: string, customerId: string): Promise<ServiceRequest> {
    await pause();
    const requests = seedDemoRequests();
    const index = requests.findIndex(
      (item) => item.id === requestId && item.customerId === customerId,
    );
    if (index < 0) throw new Error("Request not found.");
    if (requests[index].status !== "Pending") {
      throw new Error("Only pending requests can be cancelled.");
    }
    const updated: ServiceRequest = { ...requests[index], status: "Cancelled" };
    requests[index] = updated;
    saveRequests(requests);
    return withTemporaryImage(updated);
  },

  async listDemoExamples(): Promise<ServiceRequest[]> {
    await pause();
    return seedDemoRequests();
  },
};
