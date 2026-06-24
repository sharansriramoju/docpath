# DocPath / ClinicCare CRM

Clinic management system — React frontend for scheduling, patients, doctors, and locations.

## Tech Stack

- **Framework:** React 19, TypeScript 6, Vite 8
- **State:** Redux Toolkit (slices pattern) + React Context (auth, toasts)
- **Routing:** React Router v7 (`src/router.tsx`)
- **HTTP:** Axios instance at `src/utils/api.ts`, base URL `http://localhost:3000/api`, cookies (`withCredentials: true`)
- **Icons:** lucide-react
- **Styling:** Plain CSS (no CSS-in-JS, no Tailwind). CSS variables for theming defined globally in `src/index.css`.

## Commands

```bash
npm run dev          # Vite dev server on port 5173
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # Type-check without emitting
```

## Project Structure

```
src/
├── pages/            # Route-level page components (one per feature)
├── slices/           # Redux Toolkit slices (state + thunks per feature)
├── hooks/            # Custom hooks wrapping each slice (useAppointments, usePatients, etc.)
├── components/
│   ├── ui/           # Reusable UI primitives (Button, Modal, Table, Select, SearchBar, etc.)
│   └── layout/       # AppLayout, Sidebar, Header, PageHeader
├── context/          # AuthContext (login/roles/permissions), ToastContext
├── utils/            # api.ts (axios), PermissionGuard, GuestGuard, helpers
├── common/           # constants.ts (baseAPIURL)
├── assets/           # Static assets
├── router.tsx        # All route definitions
├── store.ts          # Redux store configuration
└── main.tsx          # App entry point
```

## Architecture Pattern

Each feature follows the same layered pattern:

1. **Slice** (`src/slices/FooSlice.ts`) — Redux state, reducers, async thunks that call the API
2. **Hook** (`src/hooks/useFoo.ts`) — Thin wrapper around `useDispatch`/`useSelector`, exposes actions + state
3. **Page** (`src/pages/Foo.tsx`) — Uses the hook, renders UI

When adding a new feature: create the slice → hook → page, then register the reducer in `store.ts` and add the route in `router.tsx`.

## Key Conventions

- **API responses** follow `{ data: ... }` wrapping — access via `response.data?.data`
- **Pagination** — API uses `?page=1&limit=20`, response has `{ rows, totalPages, currentPage }`
- **Roles:** admin, doctor, receptionist, nurse (defined in `AuthContext.tsx`)
- **Permissions:** RBAC via `PermissionGuard` component and `useAuth().can(action, resource)`
- **No test framework** is set up — verify changes via the dev server and browser
- **Auto-logout:** 401 responses trigger logout via axios interceptor

## Backend API

The backend runs separately at `localhost:3000`. It is NOT part of this repo. Key endpoints:

- `/api/users` — CRUD, query by `role_name`
- `/api/patients` — CRUD, search by `name`
- `/api/locations` — CRUD
- `/api/appointments` — CRUD, overview (`/overview?view=month&month=YYYY-MM`), notes, reschedule, cancel
- `/api/doctor-routines` — Doctor schedule routines
- `/api/auth/login` — Authentication (cookie-based sessions)

## Current Features

- **Dashboard** — Landing page
- **Appointments** — Month calendar overview → day timeline (Google Calendar-style) → detail modal. Drag-to-create on timeline. Auto-scrolls to 8 AM.
- **Patients** — List with search, pagination, CRUD
- **User Management** — Admin user list with role management
- **Locations** — Location management with Redux + pagination
- **Doctor Routines** — Schedule management (under "Schedule" sidebar section)
- **Settings** — App settings page
- **Medical Records / Doctor Schedule** — Placeholder pages
