import { serviceCategories } from "../data/mockData";

export const categoryService = {
  async list() {
    return serviceCategories;
  },
};
