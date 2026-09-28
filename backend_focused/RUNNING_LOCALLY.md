# Running the Fleet Maintenance app locally

Two processes: the Django API (port 8000) and the React app served by Vite (port 3000).
Open **two terminals**, one for each.

Per-project details live in [`backend/README.md`](backend/README.md) and
[`frontend/README.md`](frontend/README.md).

## 0. Prerequisites - check these first

| Tool | Required version | Check with |
|---|---|---|
| Python | **3.10 or newer** (developed on 3.12) | `python3 --version` |
| Node.js | **20.19 or newer** (Vite 7 requirement; 22.12+ also fine) | `node --version` |
| npm | comes with Node | `npm --version` |

> **Python 3.9 or older will not work.** The project pins Django 5.2 and
> Django REST Framework 3.17, which require Python 3.10+. On 3.9,
> `pip install -r requirements.txt` fails with `No matching distribution
> found`, Django never gets installed, and you later see
> `ModuleNotFoundError: No module named 'django'` or
> `Couldn't import Django`. The `python3` that ships with macOS is 3.9, so
> this is the most common first-run problem - see
> [Installing a newer Python](#installing-a-newer-python) below.

---

## 1. Backend (terminal 1)

Run everything from `backend_focused/backend`.

```bash
cd backend

# Use a Python >= 3.10. If `python3 --version` is older, use e.g. python3.12
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

# Your prompt should now start with (.venv). Confirm the interpreter:
python --version                   # must say 3.10 or newer
which python                       # must point inside .../backend/.venv/bin/

python -m pip install -r requirements.txt
python manage.py migrate
python manage.py seed_fleet        # optional: realistic fake data
python manage.py runserver 0.0.0.0:8000
```

Once the virtualenv is active, plain `python` and `pip` are the venv's own
(so `python3` works too). On Windows use `python` or `py` instead of
`python3` to create the venv.

The API is now at <http://localhost:8000/api/>. Opening it in a browser shows
DRF's browsable API. Good URLs to try:

- <http://localhost:8000/api/vehicles/>
- <http://localhost:8000/api/offices/summary/>
- <http://localhost:8000/api/mechanics/workload/>
- <http://localhost:8000/api/vehicles/needing-maintenance/>

Optional: `python manage.py createsuperuser` to log into
<http://localhost:8000/admin/>.

`seed_fleet` options: `--force` (wipe and reseed), `--offices N`,
`--vehicles N`, `--mechanics N`. It also gives one vehicle 300 maintenance
records so you can check the vehicle-detail endpoint stays fast.

**Every new terminal needs the venv re-activated** (`source
.venv/bin/activate`) before running `manage.py` commands.

**If activation gives you trouble,** skip it and call the venv's Python
directly - this works in any terminal, active venv or not:

```bash
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python manage.py migrate
.venv/bin/python manage.py runserver 0.0.0.0:8000
```

## 2. Frontend (terminal 2)

Run from `backend_focused/frontend`.

```bash
cd frontend

node --version        # must be 20.19 or newer
npm install
npm run dev
```

Open <http://localhost:3000>. It talks to `http://localhost:8000/api` by
default; override with `VITE_API_BASE_URL` in `frontend/.env.local` if your
API runs elsewhere (restart `npm run dev` after changing it). The brief's
original name, `NEXT_PUBLIC_API_BASE_URL`, is also still honoured.

Use `npm install` (not `npm ci`) the first time: the frontend was converted
from the Next.js scaffold to plain React + Vite, so `package.json`'s
dependencies changed and the old `package-lock.json` was removed rather than
left stale. `npm install` generates a fresh one - commit it afterwards.

---

## 3. Verify everything works

These are the checks that could not be executed in the sandbox this was
written in (it had no PyPI/npm access), so please run them once:

```bash
# backend: run the test suite (from backend/, venv active)
python manage.py test

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

## Installing a newer Python

Needed if `python3 --version` reports 3.9 or older.

**macOS (Homebrew):**
```bash
brew install python@3.12
python3.12 --version
```
If `python3.12` says "command not found" afterwards, open a new terminal or
use the full path printed at the end of the `brew install` output.

**macOS/Linux (pyenv):**
```bash
pyenv install 3.12
pyenv local 3.12
```

**Any OS:** download the 3.12 installer from <https://www.python.org/downloads/>.

Then **rebuild the virtualenv** with the new interpreter. Delete the old
`.venv` first, because it is tied to the old Python version:

```bash
cd backend
rm -rf .venv
python3.12 -m venv .venv
source .venv/bin/activate
python --version                   # should say 3.12.x
python -m pip install -r requirements.txt
python manage.py migrate
```

---

## Troubleshooting

### Backend

| Symptom | Likely cause / fix |
|---|---|
| `ModuleNotFoundError: No module named 'django'` or `Couldn't import Django...` | The Python running `manage.py` has no Django. Causes, in order of likelihood: (1) Python is older than 3.10, so `pip install` failed - check `python3 --version` and see [Installing a newer Python](#installing-a-newer-python); (2) the venv isn't active in this terminal - your prompt should start with `(.venv)`, re-run `source .venv/bin/activate`; (3) `pip install` printed an error that was missed - re-run it and read the output. |
| `pip install` says `No matching distribution found for Django==5.2.12` | Python is 3.9 or older. Install 3.10+ and rebuild the venv (above). |
| `pip install` shows connection/SSL/timeout errors | Network, VPN, or proxy blocking PyPI. Try off the VPN, or configure your proxy for pip. |
| `python` / `pip` not found, or `pip` installs to a different Python | Use `python -m pip ...` (with the venv active) so the install always matches the interpreter you run. |
| Works in one terminal, fails in a new one | Each terminal needs `source .venv/bin/activate` again. |
| IDE terminal (VS Code/PyCharm) still fails | The IDE may force its own interpreter. Try the plain system terminal, or point the IDE at `.venv/bin/python`. |
| `no such table` errors | Run `python manage.py migrate`. |
| Empty tables everywhere | Run `python manage.py seed_fleet`. |
| Port 8000 already in use | `python manage.py runserver 8001` (and update `VITE_API_BASE_URL` to match). |

### Frontend

| Symptom | Likely cause / fix |
|---|---|
| `npm install` / `npm run dev` complains about the Node version (e.g. Vite says it requires Node 20.19+) | Node is too old. Install a current LTS (`brew install node`, or <https://nodejs.org>). |
| `npm ci` fails ("can only install with an existing package-lock.json") | Expected - the lockfile was removed since `package.json` changed. Use `npm install`, which generates a fresh one; commit it afterwards. |
| Frontend shows "Network error - is the API running?" | Backend isn't running on port 8000, or `VITE_API_BASE_URL` points elsewhere. Restart `npm run dev` after changing `.env.local`. |
| Browser CORS error | Backend must be running with the provided settings (`CORS_ALLOW_ALL_ORIGINS = True` for local dev). |
| Port 3000 already in use | `npm run dev -- --port 3001` |
| `npm run lint` reports many `prettier/prettier` errors | Formatting only, not bugs. Run `npm run lint:fix` once to auto-format. |

## Deploying

See the **Deploying** section of [`backend/README.md`](backend/README.md)
(gunicorn, Postgres, collectstatic, env-based settings, sample Dockerfile).
For the frontend, `npm run build` produces a static site in `frontend/dist/`
(`npm run start` previews it locally). Host it on any static host (Netlify,
Vercel, S3 + CloudFront, nginx, ...) with `VITE_API_BASE_URL` set **at build
time** to the deployed API's `/api` URL, and configure the host to serve
`index.html` for unknown paths (a single-page-app fallback) so deep links like
`/vehicles/12` work on refresh. Tighten the backend's CORS settings to the
frontend's origin first.
