import { mockReviews } from "../data/mockData";

export const reviewService = {
  async listForProvider(providerId: string) {
    return mockReviews.filter((review) => review.providerId === providerId);
  },
};
