import axios from 'axios';

// Vite exposes env vars via import.meta.env. VITE_API_BASE_URL is the native name; the
// brief's original NEXT_PUBLIC_API_BASE_URL is also honoured (see envPrefix in vite.config.ts).
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:8000/api';

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15_000,
});
