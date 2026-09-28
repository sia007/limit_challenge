# Running the Fleet Maintenance app locally

Two processes: the Django API (port 8000) and the Next.js app (port 3000).
Open **two terminals**, one for each.

**Prerequisites**

- Python 3.10+ (developed against 3.12)
- Node.js 20+ and npm

Per-project details live in [`backend/README.md`](backend/README.md) and
[`frontend/README.md`](frontend/README.md).

---

## 1. Backend (terminal 1)

> Commands use `python3`. Once the virtualenv is activated, plain `python`
> and `pip` also work. On Windows, use `python` or `py` instead of `python3`.

```bash
cd backend

python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

python3 -m pip install -r requirements.txt

python3 manage.py migrate
python3 manage.py seed_fleet        # optional: realistic fake data
python3 manage.py runserver 0.0.0.0:8000
```

The API is now at <http://localhost:8000/api/>. Opening it in a browser shows
DRF's browsable API; a few good URLs to try:

- <http://localhost:8000/api/vehicles/>
- <http://localhost:8000/api/offices/summary/>
- <http://localhost:8000/api/mechanics/workload/>
- <http://localhost:8000/api/vehicles/needing-maintenance/>

Optional: `python3 manage.py createsuperuser` to log into
<http://localhost:8000/admin/>.

`seed_fleet` options: `--force` (wipe and reseed), `--offices N`,
`--vehicles N`, `--mechanics N`. It also gives one vehicle 300 maintenance
records so you can check the vehicle-detail endpoint stays fast.

## 2. Frontend (terminal 2)

```bash
cd frontend

npm install
npm run dev
```

Open <http://localhost:3000>. It talks to `http://localhost:8000/api` by
default; override with `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` if
your API runs elsewhere.

Use `npm install` (not `npm ci`) the first time: this solution adds
`@mui/icons-material` to `package.json`, so the lockfile needs regenerating.
Commit the updated `package-lock.json` afterwards.

---

## 3. Verify everything works

Run these once - they are the checks that could not be executed in the
sandbox this was written in (it had no PyPI/npm access):

```bash
# backend: run the test suite (from backend/, venv active)
python3 manage.py test

# frontend: type-check and production build (from frontend/)
npx tsc --noEmit
npm run build
npm run lint
```

Then click through the app:

1. **Dashboard** - office table and totals load; "needing maintenance" list
   shows vehicles.
2. **Vehicles** - filter by make/office/status/date range/mechanic cert #;
   the URL updates as you search; paginate; create/edit/delete a vehicle.
   Type an existing VIN in the form and blur the field to see the duplicate
   warning.
3. **Vehicle detail** - open the vehicle with 300 records; log, edit, and
   delete maintenance; use **Move office** to reassign it.
4. **Offices / Mechanics** - CRUD; try deleting an office that has vehicles
   (you get a clear 409 message rather than a crash).

If something fails, the error message (Django traceback, `tsc` error, or
browser console output) is all that's needed to pin down the fix.

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Frontend shows "Network error - is the API running?" | Backend isn't running on port 8000, or `NEXT_PUBLIC_API_BASE_URL` points elsewhere. Restart `npm run dev` after changing `.env.local`. |
| Browser CORS error | Backend must be running with the provided settings (`CORS_ALLOW_ALL_ORIGINS = True` for local dev). |
| `ModuleNotFoundError` on backend start | venv not active, or `python3 -m pip install -r requirements.txt` not run. |
| `no such table` errors | Run `python3 manage.py migrate`. |
| Empty tables everywhere | Run `python3 manage.py seed_fleet`. |
| `npm ci` fails on lockfile mismatch | Use `npm install` (see above). |
| Port already in use | Change ports: `python3 manage.py runserver 8001` / `npm run dev -- -p 3001` (and update `NEXT_PUBLIC_API_BASE_URL` to match). |

## Deploying

See the **Deploying** section of [`backend/README.md`](backend/README.md)
(gunicorn, Postgres, collectstatic, env-based settings, sample Dockerfile).
For the frontend, `npm run build && npm run start`, or deploy to any Next.js
host (e.g. Vercel) with `NEXT_PUBLIC_API_BASE_URL` set to the deployed API's
`/api` URL - and tighten the backend's CORS settings to that origin first.
