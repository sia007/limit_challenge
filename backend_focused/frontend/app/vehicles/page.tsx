'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import { useAllOffices } from '@/lib/hooks/useOffices';
import {
  useCreateVehicle,
  useDeleteVehicle,
  useUpdateVehicle,
  useVehiclesList,
} from '@/lib/hooks/useVehicles';
import { getErrorMessage } from '@/lib/error';
import { Vehicle, VehicleFilters, VehicleInput } from '@/lib/types';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/QueryState';
import VehicleFormDialog from '@/components/VehicleFormDialog';
import ConfirmDialog from '@/components/ConfirmDialog';

const PAGE_SIZE = 10;

function parseFilters(searchParams: URLSearchParams): VehicleFilters {
  const office = searchParams.get('office');
  const active = searchParams.get('active');
  return {
    office: office ? Number(office) : '',
    active: active === 'true' ? true : active === 'false' ? false : '',
    make: searchParams.get('make') ?? '',
    model: searchParams.get('model') ?? '',
    maintenanceFrom: searchParams.get('maintenance_from') ?? '',
    maintenanceTo: searchParams.get('maintenance_to') ?? '',
    mechanicCertificationNumber: searchParams.get('mechanic_cert') ?? '',
  };
}

function parsePage(searchParams: URLSearchParams): number {
  const page = Number(searchParams.get('page'));
  return page > 0 ? page : 1;
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading vehicles…" />}>
      <VehiclesPageContent />
    </Suspense>
  );
}

// useSearchParams() requires a Suspense boundary above it in the App Router,
// hence the wrapper component above.
function VehiclesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const appliedFilters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const page = useMemo(() => parsePage(searchParams), [searchParams]);

  const [draftFilters, setDraftFilters] = useState<VehicleFilters>(appliedFilters);

  // Keep the filter inputs in sync if the URL changes from outside this form
  // (browser back/forward, or a link into /vehicles?make=... from elsewhere).
  useEffect(() => {
    setDraftFilters(appliedFilters);
  }, [appliedFilters]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: offices = [] } = useAllOffices();
  const vehiclesQuery = useVehiclesList(appliedFilters, page);
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const deleteVehicle = useDeleteVehicle();

  function pushFilters(filters: VehicleFilters, newPage: number) {
    const params = new URLSearchParams();
    if (filters.office) params.set('office', String(filters.office));
    if (filters.active !== '') params.set('active', String(filters.active));
    if (filters.make) params.set('make', filters.make);
    if (filters.model) params.set('model', filters.model);
    if (filters.maintenanceFrom) params.set('maintenance_from', filters.maintenanceFrom);
    if (filters.maintenanceTo) params.set('maintenance_to', filters.maintenanceTo);
    if (filters.mechanicCertificationNumber) {
      params.set('mechanic_cert', filters.mechanicCertificationNumber);
    }
    if (newPage > 1) params.set('page', String(newPage));
    router.push(`/vehicles${params.toString() ? `?${params}` : ''}`);
  }

  function handleApplyFilters(event: React.FormEvent) {
    event.preventDefault();
    pushFilters(draftFilters, 1);
  }

  function handleClearFilters() {
    const cleared: VehicleFilters = {
      office: '',
      active: '',
      make: '',
      model: '',
      maintenanceFrom: '',
      maintenanceTo: '',
      mechanicCertificationNumber: '',
    };
    setDraftFilters(cleared);
    pushFilters(cleared, 1);
  }

  function handleOpenCreate() {
    setEditingVehicle(null);
    setFormError(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(vehicle: Vehicle) {
    setEditingVehicle(vehicle);
    setFormError(null);
    setDialogOpen(true);
  }

  function handleSubmit(input: VehicleInput) {
    setFormError(null);
    const mutation = editingVehicle
      ? updateVehicle.mutateAsync({ id: editingVehicle.id, ...input })
      : createVehicle.mutateAsync(input);

    mutation
      .then(() => setDialogOpen(false))
      .catch((error) => setFormError(getErrorMessage(error)));
  }

  function handleDelete() {
    if (!deletingVehicle) return;
    deleteVehicle.mutate(deletingVehicle.id, {
      onSuccess: () => setDeletingVehicle(null),
    });
  }

  const isSaving = createVehicle.isPending || updateVehicle.isPending;

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            Vehicles
          </Typography>
          <Typography color="text.secondary">
            Search the fleet, or add and edit vehicles.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          New vehicle
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Box component="form" onSubmit={handleApplyFilters}>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="filter-office-label">Office</InputLabel>
              <Select
                labelId="filter-office-label"
                label="Office"
                value={draftFilters.office}
                onChange={(event) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    office: event.target.value === '' ? '' : Number(event.target.value),
                  }))
                }
              >
                <MenuItem value="">All offices</MenuItem>
                {offices.map((office) => (
                  <MenuItem key={office.id} value={office.id}>
                    {office.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="filter-active-label">Status</InputLabel>
              <Select
                labelId="filter-active-label"
                label="Status"
                value={draftFilters.active === '' ? '' : String(draftFilters.active)}
                onChange={(event) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    active: event.target.value === '' ? '' : event.target.value === 'true',
                  }))
                }
              >
                <MenuItem value="">Any status</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Make"
              value={draftFilters.make}
              onChange={(event) =>
                setDraftFilters((prev) => ({ ...prev, make: event.target.value }))
              }
            />
            <TextField
              size="small"
              label="Model"
              value={draftFilters.model}
              onChange={(event) =>
                setDraftFilters((prev) => ({ ...prev, model: event.target.value }))
              }
            />
            <TextField
              size="small"
              label="Serviced from"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={draftFilters.maintenanceFrom}
              onChange={(event) =>
                setDraftFilters((prev) => ({ ...prev, maintenanceFrom: event.target.value }))
              }
            />
            <TextField
              size="small"
              label="Serviced to"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={draftFilters.maintenanceTo}
              onChange={(event) =>
                setDraftFilters((prev) => ({ ...prev, maintenanceTo: event.target.value }))
              }
            />
            <TextField
              size="small"
              label="Mechanic cert. #"
              value={draftFilters.mechanicCertificationNumber}
              onChange={(event) =>
                setDraftFilters((prev) => ({
                  ...prev,
                  mechanicCertificationNumber: event.target.value,
                }))
              }
            />
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" size="small">
              Search
            </Button>
            <Button type="button" size="small" onClick={handleClearFilters}>
              Clear filters
            </Button>
          </Stack>
        </Box>
      </Paper>

      {vehiclesQuery.isLoading && <LoadingBlock label="Loading vehicles…" />}
      {vehiclesQuery.isError && <ErrorBlock message={getErrorMessage(vehiclesQuery.error)} />}

      {vehiclesQuery.data && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Vehicle</TableCell>
                <TableCell>VIN</TableCell>
                <TableCell>License plate</TableCell>
                <TableCell>Office</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehiclesQuery.data.results.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyBlock message="No vehicles match these filters." />
                  </TableCell>
                </TableRow>
              )}
              {vehiclesQuery.data.results.map((vehicle) => (
                <TableRow key={vehicle.id} hover>
                  <TableCell>
                    <Link href={`/vehicles/${vehicle.id}`} style={{ textDecoration: 'none' }}>
                      <Typography component="span" color="primary" fontWeight={600}>
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </Typography>
                    </Link>
                  </TableCell>
                  <TableCell>{vehicle.vin}</TableCell>
                  <TableCell>{vehicle.licensePlate}</TableCell>
                  <TableCell>{vehicle.officeDetail.name}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={vehicle.active ? 'Active' : 'Inactive'}
                      color={vehicle.active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenEdit(vehicle)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => setDeletingVehicle(vehicle)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={vehiclesQuery.data.count}
            page={page - 1}
            onPageChange={(_event, newPage) => pushFilters(appliedFilters, newPage + 1)}
            rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[PAGE_SIZE]}
          />
        </TableContainer>
      )}

      {deleteVehicle.isError && (
        <Alert severity="error">{getErrorMessage(deleteVehicle.error)}</Alert>
      )}

      <VehicleFormDialog
        open={dialogOpen}
        vehicle={editingVehicle}
        loading={isSaving}
        errorMessage={formError}
        onSubmit={handleSubmit}
        onClose={() => setDialogOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(deletingVehicle)}
        title="Delete vehicle?"
        description={
          deletingVehicle
            ? `This will permanently delete ${deletingVehicle.year} ${deletingVehicle.make} ${deletingVehicle.model} (${deletingVehicle.vin}) and all of its maintenance records.`
            : ''
        }
        loading={deleteVehicle.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeletingVehicle(null)}
      />
    </Stack>
  );
}
