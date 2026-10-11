export type UserRole = "CUSTOMER" | "PROVIDER" | "ADMIN";

export type VerificationStatus = "not_verified" | "pending" | "verified" | "failed";
export type VerificationSource = "demo" | "backend";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  verificationStatus?: VerificationStatus;
  verificationSource?: VerificationSource;
  providerId?: string;
  phone?: string;
  businessName?: string;
  location?: {
    state: string;
    city: string;
    area: string;
  };
  professionalProfile?: {
    categoryId: string;
    yearsExperience: number;
    description: string;
  };
}

export interface CustomerRegistration {
  name: string;
  email: string;
  phone: string;
  location: NonNullable<User["location"]>;
}

export interface ProviderRegistration extends CustomerRegistration {
  businessName: string;
  categoryId: string;
  yearsExperience: number;
  description: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  subServices?: string[];
}

export interface Provider {
  id: string;
  name: string;
  businessName?: string;
  initials: string;
  profession: string;
  categoryId: string;
  services: string[];
  experienceYears: number;
  location: {
    state: string;
    city: string;
    area: string;
  };
  rating: number;
  reviewCount: number;
  verified: boolean;
  verificationStatus?: VerificationStatus;
  verificationSource?: VerificationSource;
  description: string;
  available: boolean;
  availabilityLabel: string;
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  providerId: string;
  providerName: string;
  serviceCategory: string;
  serviceName: string;
  description: string;
  state: string;
  city: string;
  area: string;
  preferredDate: string;
  preferredTime: string;
  urgency?: string;
  image?: string;
  imageName?: string;
  notes?: string;
  status: RequestStatus;
  createdAt: string;
}

export type RequestStatus =
  | "Pending"
  | "Accepted"
  | "Rejected"
  | "Scheduled"
  | "Rescheduled"
  | "In Progress"
  | "Completed"
  | "Cancelled";

export interface Review {
  id: string;
  providerId: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ServiceLocation {
  state: string;
  cities: {
    name: string;
    areas: string[];
  }[];
}
