'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';

import {
  useAssignVehicle,
  useDeleteVehicle,
  useUpdateVehicle,
  useVehicleDetail,
} from '@/lib/hooks/useVehicles';
import {
  useCreateMaintenanceRecord,
  useDeleteMaintenanceRecord,
  useUpdateMaintenanceRecord,
} from '@/lib/hooks/useMaintenanceRecords';
import { getErrorMessage } from '@/lib/error';
import { formatCurrency, formatDate } from '@/lib/format';
import { maintenanceTypeLabel } from '@/lib/constants';
import { MaintenanceRecordNested, VehicleInput } from '@/lib/types';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/QueryState';
import VehicleFormDialog from '@/components/VehicleFormDialog';
import AssignVehicleDialog from '@/components/AssignVehicleDialog';
import MaintenanceRecordFormDialog from '@/components/MaintenanceRecordFormDialog';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function VehicleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const vehicleId = Number(params.id);

  const vehicleQuery = useVehicleDetail(vehicleId);

  const updateVehicle = useUpdateVehicle();
  const deleteVehicle = useDeleteVehicle();
  const assignVehicle = useAssignVehicle();
  const createMaintenance = useCreateMaintenanceRecord(vehicleId);
  const updateMaintenance = useUpdateMaintenanceRecord(vehicleId);
  const deleteMaintenance = useDeleteMaintenanceRecord(vehicleId);

  const [editOpen, setEditOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteVehicleOpen, setDeleteVehicleOpen] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecordNested | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<MaintenanceRecordNested | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null);

  if (!Number.isFinite(vehicleId)) {
    return <ErrorBlock message="Invalid vehicle id." />;
  }

  if (vehicleQuery.isLoading) {
    return <LoadingBlock label="Loading vehicle…" />;
  }

  if (vehicleQuery.isError) {
    return <ErrorBlock message={getErrorMessage(vehicleQuery.error)} />;
  }

  const vehicle = vehicleQuery.data;
  if (!vehicle) {
    return <EmptyBlock message="Vehicle not found." />;
  }

  function handleUpdateVehicle(input: VehicleInput) {
    setFormError(null);
    updateVehicle.mutate(
      { id: vehicleId, ...input },
      {
        onSuccess: () => setEditOpen(false),
        onError: (error) => setFormError(getErrorMessage(error)),
      },
    );
  }

  function handleAssign(officeId: number) {
    setAssignError(null);
    assignVehicle.mutate(
      { id: vehicleId, office: officeId },
      {
        onSuccess: () => setAssignOpen(false),
        onError: (error) => setAssignError(getErrorMessage(error)),
      },
    );
  }

  function handleDeleteVehicle() {
    deleteVehicle.mutate(vehicleId, {
      onSuccess: () => router.push('/vehicles'),
    });
  }

  function handleOpenNewMaintenance() {
    setEditingRecord(null);
    setMaintenanceError(null);
    setMaintenanceDialogOpen(true);
  }

  function handleOpenEditMaintenance(record: MaintenanceRecordNested) {
    setEditingRecord(record);
    setMaintenanceError(null);
    setMaintenanceDialogOpen(true);
  }

  function handleSubmitMaintenance(input: {
    mechanic: number;
    maintenanceDate: string;
    maintenanceType: string;
    cost: string;
    notes: string;
  }) {
    setMaintenanceError(null);
    const mutation = editingRecord
      ? updateMaintenance.mutateAsync({ id: editingRecord.id, vehicle: vehicleId, ...input })
      : createMaintenance.mutateAsync({ vehicle: vehicleId, ...input });

    mutation
      .then(() => setMaintenanceDialogOpen(false))
      .catch((error) => setMaintenanceError(getErrorMessage(error)));
  }

  function handleDeleteMaintenance() {
    if (!deletingRecord) return;
    deleteMaintenance.mutate(deletingRecord.id, {
      onSuccess: () => setDeletingRecord(null),
    });
  }

  return (
    <Stack spacing={4}>
      <Box>
        <Button component={Link} href="/vehicles" size="small" startIcon={<ArrowBackIcon />} sx={{ mb: 1 }}>
          Back to vehicles
        </Button>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h4" component="h1" fontWeight={700}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Typography>
              <Chip
                size="small"
                label={vehicle.active ? 'Active' : 'Inactive'}
                color={vehicle.active ? 'success' : 'default'}
              />
            </Stack>
            <Typography color="text.secondary">
              VIN {vehicle.vin} &middot; Plate {vehicle.licensePlate}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => setAssignOpen(true)}>
              Move office
            </Button>
            <Button variant="outlined" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button variant="outlined" color="error" onClick={() => setDeleteVehicleOpen(true)}>
              Delete
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="overline" color="text.secondary">
          Office
        </Typography>
        <Typography variant="h6" fontWeight={600}>
          {vehicle.office.name}
        </Typography>
        <Typography color="text.secondary">{vehicle.office.city}</Typography>
      </Paper>

      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            Maintenance history ({vehicle.maintenanceRecords.length})
          </Typography>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenNewMaintenance}>
            Log maintenance
          </Button>
        </Stack>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Mechanic</TableCell>
                <TableCell align="right">Cost</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehicle.maintenanceRecords.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyBlock message="No maintenance logged yet for this vehicle." />
                  </TableCell>
                </TableRow>
              )}
              {vehicle.maintenanceRecords.map((record) => (
                <TableRow key={record.id} hover>
                  <TableCell>{formatDate(record.maintenanceDate)}</TableCell>
                  <TableCell>{maintenanceTypeLabel(record.maintenanceType)}</TableCell>
                  <TableCell>
                    {record.mechanic.name}
                    <Typography variant="caption" color="text.secondary" display="block">
                      {record.mechanic.certificationNumber}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(record.cost)}</TableCell>
                  <TableCell sx={{ maxWidth: 240 }}>
                    <Typography variant="body2" color="text.secondary" noWrap title={record.notes}>
                      {record.notes || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenEditMaintenance(record)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => setDeletingRecord(record)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {deleteVehicle.isError && (
        <Alert severity="error">{getErrorMessage(deleteVehicle.error)}</Alert>
      )}
      {deleteMaintenance.isError && (
        <Alert severity="error">{getErrorMessage(deleteMaintenance.error)}</Alert>
      )}

      <VehicleFormDialog
        open={editOpen}
        vehicle={{
          id: vehicle.id,
          vin: vehicle.vin,
          licensePlate: vehicle.licensePlate,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          office: vehicle.office.id,
          officeDetail: vehicle.office,
          active: vehicle.active,
        }}
        loading={updateVehicle.isPending}
        errorMessage={formError}
        onSubmit={handleUpdateVehicle}
        onClose={() => setEditOpen(false)}
      />

      <AssignVehicleDialog
        open={assignOpen}
        currentOffice={vehicle.office}
        loading={assignVehicle.isPending}
        errorMessage={assignError}
        onSubmit={handleAssign}
        onClose={() => setAssignOpen(false)}
      />

      <MaintenanceRecordFormDialog
        open={maintenanceDialogOpen}
        record={editingRecord}
        loading={createMaintenance.isPending || updateMaintenance.isPending}
        errorMessage={maintenanceError}
        onSubmit={handleSubmitMaintenance}
        onClose={() => setMaintenanceDialogOpen(false)}
      />

      <ConfirmDialog
        open={deleteVehicleOpen}
        title="Delete vehicle?"
        description={`This will permanently delete ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vin}) and all of its maintenance records.`}
        loading={deleteVehicle.isPending}
        onConfirm={handleDeleteVehicle}
        onCancel={() => setDeleteVehicleOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(deletingRecord)}
        title="Delete maintenance record?"
        description="This will permanently delete this maintenance record."
        loading={deleteMaintenance.isPending}
        onConfirm={handleDeleteMaintenance}
        onCancel={() => setDeletingRecord(null)}
      />
    </Stack>
  );
}
