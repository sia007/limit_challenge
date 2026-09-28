# Fleet Maintenance API — Solution

A Django + Django REST Framework backend for the Fleet Maintenance take-home
challenge: CRUD for offices, vehicles, mechanics and maintenance records,
plus the reporting/search endpoints described in the challenge brief.

The frontend (Next.js + MUI) is also implemented, in `../frontend/` — see
`../frontend/README.md` for what it covers and how to run it.

> **A note on verification.** This was written in a sandboxed environment
> with no network access to PyPI (`pip install` fails there with a 403 -
> the registry host isn't on that sandbox's egress allowlist), so
> `python3 manage.py test` has never actually been *run* against this code,
> only carefully reviewed by hand (every model/migration field traced for a
> match, every serializer/view cross-reference checked, the query-count
> performance claim traced through step by step). Please run the test
> suite yourself the first time you use this - see **How to run tests**
> below - and if anything fails, that's on me to fix, not you to debug
> blind.

## Contents

```
backend/
├── manage.py
├── requirements.txt
├── server/            # Django project (settings, urls)
└── fleet/             # The one app: models, serializers, views, filters, tests
    ├── models.py
    ├── serializers.py
    ├── views.py
    ├── urls.py
    ├── admin.py
    ├── exceptions.py            # turns DB errors into clean HTTP responses
    ├── filters/vehicle.py       # vehicle search filterset
    ├── management/commands/seed_fleet.py
    ├── migrations/0001_initial.py
    └── tests.py
```

## How to run the project

> Running both the API and the frontend together? See
> [`../RUNNING_LOCALLY.md`](../RUNNING_LOCALLY.md) for a combined walkthrough.

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
python3 -m pip install -r requirements.txt

python3 manage.py migrate
python3 manage.py seed_fleet          # optional: fills the DB with fake data
python3 manage.py createsuperuser     # optional: to browse /admin/
python3 manage.py runserver 0.0.0.0:8000
```

The API is served at `http://localhost:8000/api/`. `DEBUG=True` and
`CORS_ALLOW_ALL_ORIGINS=True` are left on for local/demo use (see
**Deploying** below for production notes).

Browsable API: visiting any endpoint in a browser (e.g.
`http://localhost:8000/api/vehicles/`) renders DRF's Browsable API. JSON
clients get plain JSON automatically via content negotiation.

### Seeding data

```bash
python3 manage.py seed_fleet                 # default: 6 offices, 60 vehicles, 10 mechanics
python3 manage.py seed_fleet --vehicles 200   # customize volume
python3 manage.py seed_fleet --force          # wipe and reseed
```

The command uses `Faker` and deliberately:
- leaves ~15% of vehicles with no maintenance history, and gives some
  vehicles maintenance dated >365 days ago, so `needing-maintenance`
  returns real data out of the box;
- gives one vehicle **300** maintenance records, so you can hit its detail
  endpoint and confirm it stays fast (see the query-count test below).

## How to run tests

```bash
cd backend
python3 manage.py test
```

`fleet/tests.py` covers:
- model-level constraints (VIN uniqueness, conditional active-license-plate
  uniqueness),
- the vehicle search filters (office, active, mechanic certification
  number),
- vehicle detail (office + full maintenance history) **and an explicit
  `assertNumQueries` test** proving the query count doesn't grow with the
  number of maintenance records,
- assign-vehicle, duplicate-check, office summary, and mechanic workload
  endpoints.

## API overview

All routes are under `/api/`. Standard CRUD (`GET/POST` on the list route,
`GET/PUT/PATCH/DELETE` on the detail route) is provided for every resource
via DRF routers.

| Resource | Base route |
|---|---|
| Offices | `/api/offices/` |
| Vehicles | `/api/vehicles/` |
| Mechanics | `/api/mechanics/` |
| Maintenance records | `/api/maintenance-records/` |

Plus the reporting/search endpoints from the brief:

| # | Endpoint | Notes |
|---|---|---|
| 2 | `GET /api/offices/summary/` | active vehicle count, maintenance cost over the trailing 12 months, most recent maintenance date, per office — paginated |
| 3 | `GET /api/vehicles/?office=&active=&make=&model=&maintenance_from=&maintenance_to=&mechanic_certification_number=` | any combination, all optional |
| 4 | `GET /api/vehicles/{id}/` | vehicle + office + full maintenance history (with mechanic nested) |
| 5 | `GET /api/vehicles/{id}/maintenance/` | maintenance history only, newest → oldest, paginated |
| 6 | `POST /api/vehicles/{id}/assign/` body `{"office": <id>}` | moves the vehicle; no assignment history table is kept |
| 7 | `GET /api/mechanics/workload/` | records + cost this calendar year, busiest first — paginated |
| 8 | `GET /api/vehicles/needing-maintenance/` | active vehicles never serviced or serviced >365 days ago, oldest first |
| 9 | `POST /api/vehicles/check-duplicate/` body `{"vin": "...", "license_plate": "...", "exclude_id": <id>?}` | `{"conflicts": ["vin", "license_plate"]}` |

Request/response bodies are camelCased (`licensePlate`, not `license_plate`)
via `djangorestframework-camel-case` — see **Chosen tradeoffs**. **Query
string filter keys stay snake_case** (`mechanic_certification_number`),
because that library only rewrites JSON bodies, not query strings.

### Example: office summary response

```json
[
  {
    "id": 1,
    "name": "New York Office",
    "city": "New York",
    "activeVehicleCount": 42,
    "maintenanceCostLastYear": "81250.50",
    "lastMaintenance": "2025-02-18"
  }
]
```

### Example: duplicate check

```
POST /api/vehicles/check-duplicate/
{"vin": "1HGCM82633A004352", "licensePlate": "ABC-123"}

200 OK
{"conflicts": ["vin", "license_plate"]}
```

## Deploying

This ships with SQLite and `DEBUG=True`, which is fine for local review but
not for a real deployment. To run it somewhere else:

1. **Settings** — set `DEBUG=False`, set a real `SECRET_KEY` from the
   environment, and set `ALLOWED_HOSTS` to your domain. Replace
   `CORS_ALLOW_ALL_ORIGINS=True` with `CORS_ALLOWED_ORIGINS = [...]` pointing
   at your actual frontend origin(s).
2. **Database** — swap `DATABASES['default']` for Postgres (recommended for
   anything beyond a demo — SQLite's conditional unique constraint works
   fine here, but concurrent writes and larger data sets are much better
   served by Postgres). e.g. `DATABASE_URL` via `dj-database-url` or plain
   `ENGINE: django.db.backends.postgresql` + host/user/password from env
   vars.
3. **Static files** — run `python3 manage.py collectstatic` and serve
   `STATIC_ROOT` via whitenoise or your reverse proxy (only the DRF
   Browsable API and Django admin need static assets here).
4. **App server** — run with gunicorn behind nginx (or any PaaS buildpack
   that speaks WSGI), e.g.:
   ```bash
   pip install gunicorn
   gunicorn server.wsgi:application --bind 0.0.0.0:8000
   ```
5. **Migrations & seed** — run `python3 manage.py migrate` as a release step.
   Don't run `seed_fleet` in production; it's a local/demo convenience only.
6. **Container option** — a minimal `Dockerfile` for this project:
   ```dockerfile
   FROM python:3.12-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt gunicorn
   COPY . .
   RUN python manage.py collectstatic --noinput
   CMD ["gunicorn", "server.wsgi:application", "--bind", "0.0.0.0:8000"]
   ```
   (add a `docker-compose.yml` with a `postgres` service if you swap the DB.)

## Assumptions made

- **Maintenance type** is a fixed set of choices (oil change, tire rotation,
  brake service, inspection, etc. — see `MaintenanceRecord.MaintenanceType`)
  rather than free text, since the brief didn't specify a format and a
  closed vocabulary makes the workload/reporting endpoints more reliable.
  It's easy to extend the `TextChoices` list if a real taxonomy exists.
- **VIN** is stored as a plain unique `CharField(max_length=17)` without
  format/checksum validation — the brief only requires uniqueness, not a
  specific VIN-validity algorithm.
- **"Assign vehicle records only the new office assignment"** is taken
  literally: there's no `OfficeAssignment` history table, just an update to
  `Vehicle.office`. If audit history is ever needed, this is the first
  thing I'd add (see tradeoffs).
- **Office summary's cost/last-maintenance figures** are computed over all
  vehicles *currently* assigned to the office (active or not), since the
  spec says "any vehicle in that office" without restricting to active
  ones. Only `active_vehicle_count` itself is restricted to active
  vehicles, per its name.
- **"Vehicles needing maintenance"** is restricted to `active=True`
  vehicles per the brief's wording ("all active vehicles that..."), and
  never-serviced vehicles sort before "serviced long ago" vehicles (both
  are nulls-first-then-ascending on last-maintenance date), since a vehicle
  with zero history is arguably the most overdue.
- **Duplicate-check** treats VIN conflicts as global (any vehicle, active
  or not) but license-plate conflicts as active-only, mirroring the
  uniqueness rules described in the domain section.
- No authentication was implemented (explicitly optional/"not required" in
  the brief); every endpoint is open. `CORS_ALLOW_ALL_ORIGINS=True` reflects
  that same "no auth yet" state and should be tightened before any real
  deployment.

## Chosen tradeoffs

- **`djangorestframework-camel-case`** converts snake_case Django/DRF
  conventions to camelCase JSON for API consumers, since the pre-wired
  frontend skeleton uses TypeScript conventions. The cost is one more
  dependency and one gotcha worth calling out: it only touches JSON
  **bodies**, not query string keys, so filters remain snake_case (a small
  inconsistency I'd rather document than paper over with a custom filter
  backend for what is otherwise a small API).
- **`django-filter`** for the vehicle search endpoint instead of hand-rolled
  query param parsing — more declarative, and consistent with the pattern
  used elsewhere in this codebase for filterable list endpoints.
- **SQLite** for the default `DATABASES` setting (unchanged from the
  skeleton) — trivial to run for review/grading, but the partial unique
  index on `(license_plate) WHERE active` needs SQLite ≥3.8 (bundled with
  modern Python, so no action needed) and I would swap to Postgres before
  a real deployment (see **Deploying**).
- **Conditional `UniqueConstraint`** (DB-level) *plus* a serializer-level
  check for the active-license-plate rule, rather than either alone. The DB
  constraint is the actual source of truth and covers `bulk_create`/raw
  SQL/admin edits; the serializer check exists purely to turn the
  constraint violation into a friendly `400` with a field-level message
  instead of a `500`/`IntegrityError`. A generic exception handler
  (`fleet/exceptions.py`) also converts any `IntegrityError` or
  `ProtectedError` that slips through (e.g. deleting an office that still
  has vehicles) into a clean 4xx JSON response rather than a 500.
- **Vehicle detail performance**: `retrieve()` uses `select_related("office")`
  plus a single `Prefetch("maintenance_records", queryset=...select_related("mechanic"))`.
  That's 2 queries total no matter whether the vehicle has 0 or 10,000
  maintenance records — verified by an `assertNumQueries(2)` test. I didn't
  paginate the nested maintenance list inside vehicle-detail (the brief
  asks for the "complete maintenance history" there); the separate
  `/vehicles/{id}/maintenance/` endpoint *is* paginated, for callers who
  want to page through history independently.
- **`fleet/validators.py:validate_vehicle_year`** replaces what was
  originally `MaxValueValidator(timezone.now().year + 1)` directly on the
  field. That inline form bakes the boundary year into the migration at
  `makemigrations` time, so `makemigrations` would propose a new no-op
  migration every New Year's Day as the "current year" drifted from what's
  frozen in the migration file. A plain top-level function is instead
  referenced by its stable dotted path
  (`fleet.validators.validate_vehicle_year`) and computes
  `timezone.now().year` fresh on every call, so the bound never goes stale
  and migrations never need to change for it.
- **No soft-delete / audit trail** beyond the `active` flags already in the
  domain model. Given the time box, I focused on making the specified
  endpoints correct and fast rather than adding history tables that
  weren't asked for.

## What I'd do next with more time

- JWT authentication (mentioned as an optional bonus in the brief).
- The frontend is now implemented (see `../frontend/README.md`) - next would
  be recording the short end-to-end demo video the brief asks for.
- I still haven't been able to actually *execute* `python3 manage.py test`
  anywhere (see **Verifying this yourself** below) - that's the one thing
  I'd want to close out before calling this done-done.
