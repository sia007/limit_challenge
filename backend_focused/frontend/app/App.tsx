import { Link, Route, Routes } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';

import RootLayout from './layout';
import DashboardPage from './page';
import VehiclesPage from './vehicles/page';
import VehicleDetailPage from './vehicles/detail/page';
import OfficesPage from './offices/page';
import MechanicsPage from './mechanics/page';

function NotFoundPage() {
  return (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
        Page not found
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        That page doesn&apos;t exist.
      </Typography>
      <Button component={Link} to="/" variant="contained">
        Back to dashboard
      </Button>
    </Box>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="vehicles/:id" element={<VehicleDetailPage />} />
        <Route path="offices" element={<OfficesPage />} />
        <Route path="mechanics" element={<MechanicsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
