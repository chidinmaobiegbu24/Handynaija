# HandyNaija frontend

HandyNaija is a frontend-first Nigerian local-services marketplace. This repository currently contains the reusable frontend foundation and a small set of working demo flows. It does not contain a backend, database, payment flow, or production authentication.

## Run locally

Requirements: Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Create an optional `.env` file from `.env.example` when an API base URL is agreed. No API URL is assumed or configured by default.

## Quality commands

```sh
npm run build
npm run lint
npm run preview
```

## Project structure

```text
src/
  App.tsx                    Route table
  components/
    auth/                    Shared auth brand, role choice, location and password fields
    layout/                  Navbar, footer and shared page shell
    marketplace/             Provider and service cards
    routing/                 Role-aware protected-route boundary
    ui/                      Buttons, badges, avatars, ratings and empty states
  constants/                 Shared route names
  data/                      Centralized Nigerian marketplace demo data
  pages/                     Route-level screens
  services/                  Auth, provider, category, request, message and review services
  state/                     Frontend auth/session context
  styles/                    Design tokens, global styles and responsive rules
  types/                     Shared TypeScript domain types
```

## Routes

Public routes include `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/terms`, `/privacy`, `/services`, `/services/:serviceId`, `/providers`, and `/provider/:providerId`.

Customer routes include `/dashboard`, `/requests`, `/requests/:requestId`, `/request-service`, `/messages`, and `/profile`.

Provider routes include `/provider/dashboard`, `/provider/requests`, `/provider/services`, `/provider/availability`, `/provider/messages`, `/provider/profile`, and `/provider/reviews`.

Admin routes include `/admin`, `/admin/users`, `/admin/providers`, `/admin/categories`, `/admin/requests`, `/admin/reviews`, and `/admin/reports`.

Several secondary screens are intentionally route placeholders until their feature step. The React Router route table and `ProtectedRoute` define the route and role boundaries now.

## UI and design

`src/styles/tokens.css` is the shared design-token source for colors, typography, spacing, radii, shadows and focus rings. `src/styles/global.css` contains shared primitives, page patterns, interaction states, and mobile-first responsive styling. UI and marketplace components live separately so route pages can share them without duplicating presentation.

The public landing page includes the service-and-location search, popular categories, provider previews, marketplace workflow, trust guidance, feature overview and provider signup CTA. Location options use centralized mock State/City/Area data; no GPS or maps are used. The public header has desktop links and an accessible mobile menu that supports Escape to close and restores focus to its toggle.

The `/services` and `/providers` discovery pages use the same centralized categories, locations, and provider records. Provider search/filter/sort runs through `providerService` against mock records only; category, provider-name, State/City/Area, rating, and availability criteria can be composed and reflected in URL query parameters. Profile links use `/provider/:providerId`.

The provider profile uses that existing ID route to show mock provider information, service areas, listed services, ratings, and available demo reviews. Its “Request service” action opens `/request-service?provider=:providerId`. Customer requests use a frontend-only service and browser storage, are owned by the current demo customer, and begin with `Pending` status. The request form collects a supported service, job description, State/City/Area, preferred date/time, optional notes, and an optional local image preview. The image preview is temporary and is never sent to a server or written to browser storage. Review, success, customer request list, and `/requests/:requestId` details stay on the frontend; preferred appointment times are not confirmed bookings.

## Mock data and API boundary

`src/data/mockData.ts` is the single source of static categories, providers, locations, reviews and example requests. Newly submitted customer requests are handled through `src/services/requestService.ts` and stored locally in the browser for this demo.

`src/services/` is the frontend service boundary. Current services return local demo data. `src/services/api/client.ts` is the future HTTP boundary and deliberately throws a clear configuration error until `VITE_API_BASE_URL` is provided. It contains no invented backend endpoint paths. Backend integration should replace mock implementations once the team agrees on API contracts.

## Roles and demo authentication

The shared `UserRole` union uses `CUSTOMER`, `PROVIDER`, and `ADMIN`. `AuthContext` exposes mock auth state and `authService` owns login, customer/provider registration, logout, current-user lookup, and password recovery interfaces. Login offers a role selector for customer, provider, and admin route previews. Registration lets a customer or provider choose a role, enter the relevant details in a short progressive form, and select a mock State/City/Area location. The demo user shape is `id`, `name`, `email`, `role`, with optional `phone`, `businessName`, `location`, and provider-only `professionalProfile` (`categoryId`, `yearsExperience`, `description`).

Login sessions use `sessionStorage` by default; checking “Remember me” uses `localStorage`. Registration creates a session-only demo user. Logout clears both. Password fields exist only in page state for local validation; passwords and confirmation values are not passed to auth services or stored. Password reset screens show generic mock confirmations and do not send messages or change a password. The demo login identifier `error@example.com` is reserved to preview the friendly sign-in error state. Terms and privacy routes are placeholders, not legal documents.

These mechanisms are frontend-only conveniences—not secure authentication or authorization. The backend must enforce identity and permissions. Frontend route guards are for UI/navigation only.

## Working on the frontend

- Keep route-level work in `src/pages/`; put reusable presentation in `src/components/`.
- Add domain types in `src/types/`, shared constants in `src/constants/`, and mock records in `src/data/`.
- Put data access behind a domain service in `src/services/`; do not couple pages to guessed API URLs.
- Use the tokens and shared component patterns before introducing new visual styles.
- Validate changes with `npm run build` and `npm run lint`.

## Current demo coverage

The home page, service/provider discovery, provider profiles, mock login/register, request submission/review/success, customer request list/details, customer dashboard and request list are frontend previews. Other major routes exist as role-gated placeholders. There are no real messages, writes to a server, payments, live tracking, or production security controls.
