# Fleet Maintenance — Frontend

React 19 + Vite + React Router + MUI 7 + TanStack Query frontend for the
Fleet Maintenance API. It talks to the Django backend in `../backend/`.

> This started from the challenge's Next.js scaffold and was converted to a
> plain React SPA (no server rendering, no `next/*` imports) — see
> **Why it's plain React now** below for what changed and why.

> For a start-to-finish walkthrough of running **both** halves together, see
> [`../RUNNING_LOCALLY.md`](../RUNNING_LOCALLY.md).

## Run it locally

**Prerequisites**

| Tool | Required version | Check with |
|---|---|---|
| Node.js | **20.19 or newer** (Vite 7 requirement; 22.12+ also fine) | `node --version` |
| npm | comes with Node | `npm --version` |
| Backend API | running on `http://localhost:8000` | see below |

The backend needs **Python 3.10 or newer** (Django 5.2 / DRF 3.17); Python
3.9, the macOS system default, will not work. Full backend setup, including
how to install a newer Python and fix `No module named 'django'`, is in
[`../backend/README.md`](../backend/README.md) and
[`../RUNNING_LOCALLY.md`](../RUNNING_LOCALLY.md).

Start the backend first (in its own terminal, from `backend_focused/backend`):

```bash
source .venv/bin/activate
python manage.py migrate
python manage.py seed_fleet        # optional demo data
python manage.py runserver 0.0.0.0:8000
```

Then, in a second terminal, from `backend_focused/frontend`:

```bash
node --version                     # must be 20.19 or newer
npm install
npm run dev
```

Open <http://localhost:3000>.

Useful scripts:

```bash
npm run dev        # dev server with hot reload (Vite)
npm run build      # type-check (tsc) then production build to dist/
npm run start      # preview the production build locally
npm run typecheck  # type-check only, no build
npm run lint       # eslint
npm run lint:fix   # eslint --fix
```

**Configuration:** the API base URL defaults to `http://localhost:8000/api`.
To point at a different backend, create `frontend/.env.local`:

```
VITE_API_BASE_URL=https://your-api-host/api
```

The challenge brief's original variable name, `NEXT_PUBLIC_API_BASE_URL`, is
also still read as a fallback (see `vite.config.ts`'s `envPrefix` and
`lib/api-client.ts`), so either name works.

**`npm install`, not `npm ci`, the first time:** converting from Next to
Vite changed `package.json`'s dependencies, so the old `package-lock.json`
was removed rather than left stale. `npm install` generates a fresh one -
commit it afterwards.

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `npm install` / `npm run dev` complains about the Node version | Node is older than 20.19. Install a current LTS (`brew install node`, or <https://nodejs.org>). |
| `npm ci` fails ("can only install with an existing package-lock.json") | Expected - the lockfile was removed since `package.json` changed. Use `npm install`, which generates a fresh one; commit it afterwards. |
| Page shows "Network error - is the API running?" | Backend isn't running on port 8000, or `VITE_API_BASE_URL` points elsewhere. Restart `npm run dev` after editing `.env.local` (Vite only reads env files at startup). |
| Browser console shows a CORS error | Backend must be running with the provided settings (`CORS_ALLOW_ALL_ORIGINS = True` for local dev). |
| Tables are empty | Run `python manage.py seed_fleet` in the backend. |
| Backend won't start: `No module named 'django'` | Backend Python is older than 3.10 or the venv isn't active - see [`../RUNNING_LOCALLY.md`](../RUNNING_LOCALLY.md). |
| Port 3000 already in use | `npm run dev -- --port 3001` |
| Refreshing `/vehicles/12` 404s once deployed as a static site | The host needs an SPA fallback (serve `index.html` for unknown paths) - see **Deploying** in `../RUNNING_LOCALLY.md`. Not an issue with `npm run dev` or `npm run start`. |
| `npm run lint` reports many `prettier/prettier` errors | Formatting only, not bugs - run `npm run lint:fix` once. |

## What's implemented

Full CRUD for every resource, the vehicle search endpoint with filters tied
to the URL's query string, and the office-summary and mechanic-workload
reporting endpoints worked into the Dashboard/Mechanics pages.

| Page | Route | Endpoints used |
|---|---|---|
| Dashboard | `/` | `GET /offices/summary/`, `GET /vehicles/needing-maintenance/` |
| Vehicles | `/vehicles` | `GET/POST /vehicles/` (search + filters, create), `PUT/DELETE /vehicles/{id}/`, `POST /vehicles/check-duplicate/` (live warning while typing a VIN/plate) |
| Vehicle detail | `/vehicles/:id` | `GET/PUT/DELETE /vehicles/{id}/` (office + full maintenance history), `POST /vehicles/{id}/assign/`, full CRUD on `/maintenance-records/` |
| Offices | `/offices` | `GET/POST/PUT/DELETE /offices/` |
| Mechanics | `/mechanics` | `GET/POST/PUT/DELETE /mechanics/`, `GET /mechanics/workload/` |

The vehicle search filters (office, active/inactive, make, model, serviced
date range, mechanic certification number) are synced to the URL's query
string (e.g. `/vehicles?make=Toyota&active=true`), so a filtered view is
shareable, bookmarkable, and survives the back button. Every data view
handles loading, error, and empty states.

## Project layout

```
frontend/
├── index.html               # Vite's HTML entry - loads app/main.tsx
├── vite.config.ts           # dev server (port 3000), @/ alias, env prefixes
├── app/
│   ├── main.tsx              # ReactDOM root + <BrowserRouter>
│   ├── App.tsx                # <Routes>: maps URLs to pages
│   ├── layout.tsx             # root layout route: Providers + AppShell + <Outlet/>
│   ├── providers.tsx          # React Query client + MUI theme (unchanged from the scaffold)
│   ├── globals.css
│   ├── page.tsx                # Dashboard ("/")
│   ├── vehicles/page.tsx       # search + list + CRUD ("/vehicles")
│   ├── vehicles/detail/page.tsx  # detail + maintenance CRUD ("/vehicles/:id")
│   ├── offices/page.tsx
│   └── mechanics/page.tsx
├── components/    # AppShell nav, form dialogs, ConfirmDialog, QueryState, StatCard
└── lib/
    ├── api-client.ts     # axios instance (provided; env var read adapted for Vite)
    ├── types.ts          # API types (camelCase)
    ├── constants.ts      # maintenance types (mirrors the backend's choices)
    ├── error.ts          # normalizes DRF error shapes into one message
    ├── format.ts         # currency/date helpers
    ├── hooks/            # React Query hooks per resource
    └── utils/pagination.ts
```

Route paths live in one place, `app/App.tsx`, rather than being implied by
folder names (Next's App Router convention) - `app/vehicles/detail/page.tsx`
is mapped to `/vehicles/:id` there, for example.

## Why it's plain React now

The challenge brief's `frontend/` started as an empty **Next.js 16 + React
19** app, and the first version of this solution was built that way. It was
converted to plain React afterwards, at the project owner's request. What
changed:

- **Routing:** `next/link`, `next/navigation` (`useRouter`, `usePathname`,
  `useSearchParams`, `useParams`) → **React Router v7** (`react-router-dom`):
  `<Link>`, `useNavigate`, `useLocation`, `useSearchParams`, `useParams`.
  Routes are declared explicitly in `app/App.tsx` instead of being inferred
  from the `app/` folder structure.
- **Build tool:** Next's bundler → **Vite**. `next.config.ts` and
  `postcss.config.mjs` were removed; `vite.config.ts`, `index.html`, and
  `app/main.tsx` (the React root) were added.
- **Rendering:** every page was already `'use client'` (client-side only,
  no server components or data fetching) - that directive is meaningless
  outside Next and was stripped; behavior is unchanged.
- **Env vars:** `process.env.NEXT_PUBLIC_API_BASE_URL` → Vite's
  `import.meta.env.VITE_API_BASE_URL`. `lib/api-client.ts` reads the new
  name first and falls back to the brief's original name, so either works.
- **Unchanged:** every component in `components/`, every hook in
  `lib/hooks/`, `lib/types.ts`, `lib/format.ts`, `lib/error.ts`,
  `lib/utils/pagination.ts`, and `app/providers.tsx` (React Query + MUI
  theme setup) - none of that code was Next-specific to begin with, so it
  carried over as-is. The port only touched routing, the build config, and
  the env-var read.

## Design decisions

- **camelCase everywhere except query strings.** The backend's
  `djangorestframework-camel-case` renderer/parser converts JSON request and
  response *bodies* to/from camelCase, so every type in `lib/types.ts` is
  camelCase. It does **not** rewrite query string keys, so the vehicle
  search filters go out snake_case (`mechanic_certification_number`) to
  match the backend's `FilterSet` - see `lib/hooks/useVehicles.ts`.
- **All list endpoints are paginated; dropdowns and overviews walk every
  page.** Tables (Offices, Mechanics, Vehicles, Needing-maintenance) use
  server-side pagination with MUI `TablePagination`. Places that need the
  complete set - office/mechanic `<Select>` dropdowns, the dashboard's
  office overview and its totals, the mechanic workload leaderboard - use
  `fetchAllPages` (`lib/utils/pagination.ts`), so a company with more than
  10 offices doesn't silently lose options or get wrong totals.
- **Layout uses `Box`/`Stack` + `sx`, not MUI `Grid`.** Deliberate: those
  primitives behave identically across MUI majors, and nothing here needs
  a 12-column grid.
- **Modern MUI prop API.** `TextField` uses `slotProps` (`htmlInput`,
  `inputLabel`) rather than the legacy `inputProps`/`InputLabelProps`.
- **Duplicate-check is advisory, not a hard gate.** The vehicle form calls
  `check-duplicate` on blur of the VIN/plate fields and shows a warning,
  but still lets you attempt to save - the backend's response on submit is
  the definitive validation either way.
- **Data flow:** React Query owns server state; mutations invalidate the
  relevant query keys (e.g. logging maintenance refreshes the vehicle
  detail, dashboard summary, needing-maintenance list, and mechanic
  workload). Local component state only holds form drafts and dialog
  open/closed flags.

## Verification status

The environment this was written in had no access to the npm registry, so
`node_modules` was never installed and `npm run dev`/`npm run build` have
never actually been run against this code. Two different kinds of checking
were done instead, and it's worth being precise about what each one does
and doesn't cover:

- **Syntax check:** every file was run through the `tsc` binary available
  locally, with `--noEmit` against a from-scratch `tsconfig.json`. This
  reliably catches malformed syntax - confirmed by deliberately breaking a
  file and checking `tsc` reported it (`error TS1005: '}' expected`), then
  removing the break and confirming zero errors. All files pass this.
- **What that check does *not* cover:** without `node_modules` present,
  this `tsc` does not perform real module resolution or type-checking -
  confirmed by adding an `import` from a package name that doesn't exist
  anywhere, which it silently accepted instead of reporting `Cannot find
  module`. So "passes the syntax check" means the files parse as valid
  TypeScript/JSX, not that every prop name, hook signature, or import
  matches the real installed packages' types.
- **To make up for that,** every cross-file reference was checked by
  script against the actual project files: every `@/...` import resolves
  to a real file, every named import matches something that file actually
  exports, every default import matches a real `export default`, there are
  no unused imports, and brackets/braces are balanced. Component prop
  shapes were also checked by hand against how each component is called.
  What neither check can verify is whether, say, `react-router-dom`'s
  actual `useParams` generic signature or MUI's actual `TextField` prop
  types line up with what's written here - that requires the real
  packages.

**The real check is `npm install && npm run build`** (or `npm run
typecheck`), which type-checks against the actual installed packages. Do
that before trusting this beyond "it's structurally consistent," and send
me anything it surfaces.

## Demo video

The challenge brief asks for a short (≤ 2 min) screen recording of the
frontend working against the backend. That has to be recorded on your
machine once both servers are running.
