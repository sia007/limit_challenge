import { Outlet } from 'react-router-dom';

import AppShell from '@/components/AppShell';
import Providers from './providers';

// Root layout route: providers (React Query + MUI theme) and the nav shell wrap every page.
// <Outlet /> renders whichever page route matched.
export default function RootLayout() {
  return (
    <Providers>
      <AppShell>
        <Outlet />
      </AppShell>
    </Providers>
  );
}
