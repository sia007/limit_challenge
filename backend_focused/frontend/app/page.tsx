'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';

import { useOfficeSummary } from '@/lib/hooks/useOffices';
import { useVehiclesNeedingMaintenance } from '@/lib/hooks/useVehicles';
import { formatCurrency, formatDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/error';
import StatCard from '@/components/StatCard';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/QueryState';

const PAGE_SIZE = 10;

export default function DashboardPage() {
  const officeSummary = useOfficeSummary();
  const [needingPage, setNeedingPage] = useState(1);
  const needingMaintenance = useVehiclesNeedingMaintenance(needingPage);

  const totals = officeSummary.data?.reduce(
    (acc, office) => ({
      offices: acc.offices + 1,
      activeVehicles: acc.activeVehicles + office.activeVehicleCount,
      costLastYear: acc.costLastYear + Number(office.maintenanceCostLastYear),
    }),
    { offices: 0, activeVehicles: 0, costLastYear: 0 },
  );

  return (
    <Stack spacing={5}>
      <Box>
        <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
          Fleet dashboard
        </Typography>
        <Typography color="text.secondary">
          A snapshot of every office, plus vehicles that are overdue for service.
        </Typography>
      </Box>

      {officeSummary.isLoading && <LoadingBlock label="Loading office summary…" />}
      {officeSummary.isError && <ErrorBlock message={getErrorMessage(officeSummary.error)} />}

      {officeSummary.data && totals && (
        <>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <StatCard label="Offices" value={totals.offices} />
            <StatCard label="Active vehicles" value={totals.activeVehicles} />
            <StatCard
              label="Maintenance cost (12 mo)"
              value={formatCurrency(totals.costLastYear)}
              helperText="Across all offices"
            />
          </Stack>

          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Offices
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Office</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell align="right">Active vehicles</TableCell>
                    <TableCell align="right">Cost (last 12 mo)</TableCell>
                    <TableCell>Last maintenance</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {officeSummary.data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <EmptyBlock message="No offices yet. Add one from the Offices tab." />
                      </TableCell>
                    </TableRow>
                  )}
                  {officeSummary.data.map((office) => (
                    <TableRow key={office.id} hover>
                      <TableCell>{office.name}</TableCell>
                      <TableCell>{office.city}</TableCell>
                      <TableCell align="right">{office.activeVehicleCount}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(office.maintenanceCostLastYear)}
                      </TableCell>
                      <TableCell>{formatDate(office.lastMaintenance)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </>
      )}

      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            Vehicles needing maintenance
          </Typography>
          <Button component={Link} href="/vehicles" size="small">
            View all vehicles
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Active vehicles that have never been serviced, or haven&apos;t been serviced in over a
          year - oldest first.
        </Typography>

        {needingMaintenance.isLoading && <LoadingBlock />}
        {needingMaintenance.isError && (
          <ErrorBlock message={getErrorMessage(needingMaintenance.error)} />
        )}

        {needingMaintenance.data && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Office</TableCell>
                  <TableCell>License plate</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {needingMaintenance.data.results.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyBlock message="Nothing overdue - the whole fleet is up to date." />
                    </TableCell>
                  </TableRow>
                )}
                {needingMaintenance.data.results.map((vehicle) => (
                  <TableRow key={vehicle.id} hover>
                    <TableCell>
                      {vehicle.year} {vehicle.make} {vehicle.model}
                      <Typography variant="caption" color="text.secondary" display="block">
                        {vehicle.vin}
                      </Typography>
                    </TableCell>
                    <TableCell>{vehicle.officeDetail.name}</TableCell>
                    <TableCell>{vehicle.licensePlate}</TableCell>
                    <TableCell>
                      <Chip size="small" color="warning" label="Overdue" />
                    </TableCell>
                    <TableCell align="right">
                      <Button component={Link} href={`/vehicles/${vehicle.id}`} size="small">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={needingMaintenance.data.count}
              page={needingPage - 1}
              onPageChange={(_event, newPage) => setNeedingPage(newPage + 1)}
              rowsPerPage={PAGE_SIZE}
              rowsPerPageOptions={[PAGE_SIZE]}
            />
          </TableContainer>
        )}
      </Box>
    </Stack>
  );
}
