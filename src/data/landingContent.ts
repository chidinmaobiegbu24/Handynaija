import type { IconName } from "../components/ui/iconData";

export type LandingStep = {
  number: string;
  title: string;
  description: string;
  icon: IconName;
};

export const marketplaceSteps: LandingStep[] = [
  {
    number: "01",
    title: "Find a service",
    description: "Choose the service you need and the State, City or Area where you want a hand.",
    icon: "search",
  },
  {
    number: "02",
    title: "Choose a professional",
    description: "Compare profiles, listed services, availability, ratings and verification details.",
    icon: "users",
  },
  {
    number: "03",
    title: "Arrange the service",
    description: "Share the job details and a time that works for you, then keep everything in one conversation.",
    icon: "calendar",
  },
];

export const trustSignals = [
  {
    icon: "verified" as IconName,
    title: "Verification details",
    description: "Any verification information is shown on the provider’s profile so you can review it before reaching out.",
  },
  {
    icon: "star" as IconName,
    title: "Ratings & reviews",
    description: "Read honest feedback from other customers as part of your decision.",
  },
  {
    icon: "flag" as IconName,
    title: "Report a concern",
    description: "Marketplace reporting and moderation are part of the experience. A listing is not a guarantee of service quality.",
  },
  {
    icon: "message" as IconName,
    title: "Keep it in the conversation",
    description: "Communicate about the job in one place so the details and updates stay together.",
  },
];

export const trustStripItems = [
  { icon: "verified" as IconName, title: "Clear profiles", description: "Compare listed services, experience, availability and location." },
  { icon: "star" as IconName, title: "Honest reviews", description: "Read customer feedback from previous jobs before you decide." },
  { icon: "shield" as IconName, title: "Report concerns", description: "Raise an issue and get marketplace moderation support." },
];

export const marketplaceFeatures = [
  { icon: "pin" as IconName, title: "Local help, close by", description: "Find professionals across the cities and areas we serve every day." },
  { icon: "search" as IconName, title: "Clear profiles", description: "See listed services, experience, availability and customer feedback." },
  { icon: "clipboard" as IconName, title: "Simple requests", description: "Share the job, agree a time, and track the details as you go." },
  { icon: "message" as IconName, title: "One conversation", description: "Keep the discussion and updates together in a single thread." },
];