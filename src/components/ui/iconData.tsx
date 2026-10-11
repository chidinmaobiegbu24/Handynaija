import type { ReactNode } from "react";

export type IconName =
  | "search"
  | "pin"
  | "user"
  | "users"
  | "arrow-right"
  | "check"
  | "shield"
  | "star"
  | "flag"
  | "message"
  | "calendar"
  | "clock"
  | "lightning"
  | "wrench"
  | "car"
  | "sparkles"
  | "book"
  | "tools"
  | "home"
  | "menu"
  | "close"
  | "clipboard"
  | "verified";

export const ICON_PATHS: Record<IconName, ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21.5s-6-5.4-6-10.2a6 6 0 0 1 12 0c0 4.8-6 10.2-6 10.2Z" />
      <circle cx="12" cy="11" r="2.2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M3 19a6 6 0 0 1 12 0" />
      <path d="M15.5 7a3 3 0 0 1 .5 5.9" />
      <path d="M17 13.8a6 6 0 0 1 4 5.2" />
    </>
  ),
  "arrow-right": (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  shield: (
    <>
      <path d="M12 3 5 6v6c0 4.2 2.9 7.4 7 9 4.1-1.6 7-4.8 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  star: (
    <path d="m12 3.5 2.6 5.3 5.3 1 3.1 4.2-2.9 4.5.7 5.4-4.9-2.4-4.9 2.4.7-5.4L3 14l3.1-4.2 5.3-1L12 3.5Z" />
  ),
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4h13l-2 4 2 4H5" />
    </>
  ),
  message: <path d="M20 12a7.5 7.5 0 0 1-11 6.7L4 20l1.3-4A7.5 7.5 0 1 1 20 12Z" />,
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2.5" />
      <path d="M4 10h16M9 3.5v3M15 3.5v3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  lightning: <path d="M13 3 5.5 13.5H11l-1 7.5L18.5 10H13l0-7Z" />,
  wrench: (
    <path d="M14.5 6.5a3.7 3.7 0 0 0-4.9 4.9L4 17v3h3l5.6-5.6a3.7 3.7 0 0 0 4.9-4.9l-2.5 2.5-2-2 2.5-2.5Z" />
  ),
  car: (
    <>
      <path d="M5 15l2-5h10l2 5" />
      <path d="M5 15h14v3.5H5V15Z" />
      <circle cx="8.2" cy="16.6" r="1" />
      <circle cx="15.8" cy="16.6" r="1" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 4l1.7 4.6 4.6 1.7-4.6 1.7L12 16.6l-1.7-4.6L5.7 10.3l4.6-1.7L12 4Z" />
      <path d="M18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5Z" />
    </>
  ),
  tools: (
    <>
      <path d="M14.5 6.5a3.7 3.7 0 0 0-4.9 4.9L4 17v3h3l5.6-5.6a3.7 3.7 0 0 0 4.9-4.9l-2.5 2.5-2-2 2.5-2.5Z" />
      <path d="m16 4 4 4" />
    </>
  ),
  home: (
    <>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 10v10h12V10" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  clipboard: (
    <>
      <rect x="6" y="4.5" width="12" height="16" rx="2.5" />
      <path d="M9 4.5V3h6v1.5M9 11h6M9 15h4" />
    </>
  ),
  verified: (
    <>
      <path d="m12 3 2.1 1.6 2.6-.3 1.3 2.3 2.4 1.1-.4 2.6.4 2.6-2.4 1.1-1.3 2.3-2.6-.3L12 21l-2.1-1.6-2.6.3-1.3-2.3L3.6 16l.4-2.6-.4-2.6L6 9.7l1.3-2.3 2.6.3L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
};

export function serviceIcon(categoryId: string): IconName {
  switch (categoryId) {
    case "electrical":
      return "lightning";
    case "plumbing":
      return "wrench";
    case "mechanic":
      return "car";
    case "cleaning":
      return "sparkles";
    case "tutoring":
      return "book";
    case "technician":
      return "tools";
    default:
      return "home";
  }
}