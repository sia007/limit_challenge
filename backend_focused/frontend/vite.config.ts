import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const root = fileURLToPath(new URL('./', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Keeps the existing `@/lib/...` and `@/components/...` imports working (matches tsconfig paths).
    alias: [{ find: /^@\//, replacement: root }],
  },
  // VITE_ is Vite's native prefix; NEXT_PUBLIC_ is also exposed so the original
  // NEXT_PUBLIC_API_BASE_URL variable from the challenge brief keeps working.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  // Port 3000 matches the challenge brief ("Visit http://localhost:3000").
  server: { port: 3000 },
  preview: { port: 3000 },
});
