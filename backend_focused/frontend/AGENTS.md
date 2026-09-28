# Frontend notes

This is a plain **React 19 + Vite + React Router** single-page app (it started life as a
Next.js scaffold and was converted). There is no server rendering and no `next/*` imports.

- Entry point: `app/main.tsx` -> `app/App.tsx` (routes) -> `app/layout.tsx` (providers + nav shell).
- Pages live under `app/` (`page.tsx` per route folder); shared UI in `components/`; data hooks in `lib/hooks/`.
- The `@/` import alias points at the project root (see `vite.config.ts` and `tsconfig.json`).
- API base URL: `VITE_API_BASE_URL` (or the legacy `NEXT_PUBLIC_API_BASE_URL`), default `http://localhost:8000/api`.
