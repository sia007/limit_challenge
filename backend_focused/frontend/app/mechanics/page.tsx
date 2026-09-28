'use client';

import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
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
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';

import {
  useCreateMechanic,
  useDeleteMechanic,
  useMechanicWorkload,
  useMechanicsList,
  useUpdateMechanic,
} from '@/lib/hooks/useMechanics';
import { getErrorMessage } from '@/lib/error';
import { formatCurrency } from '@/lib/format';
import { Mechanic } from '@/lib/types';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/QueryState';
import MechanicFormDialog from '@/components/MechanicFormDialog';
import ConfirmDialog from '@/components/ConfirmDialog';

const PAGE_SIZE = 10;

export default function MechanicsPage() {
  const [page, setPage] = useState(1);
  const mechanicsQuery = useMechanicsList(page);
  const workloadQuery = useMechanicWorkload();

  const createMechanic = useCreateMechanic();
  const updateMechanic = useUpdateMechanic();
  const deleteMechanic = useDeleteMechanic();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMechanic, setEditingMechanic] = useState<Mechanic | null>(null);
  const [deletingMechanic, setDeletingMechanic] = useState<Mechanic | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function handleOpenCreate() {
    setEditingMechanic(null);
    setFormError(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(mechanic: Mechanic) {
    setEditingMechanic(mechanic);
    setFormError(null);
    setDialogOpen(true);
  }

  function handleSubmit(input: { name: string; certificationNumber: string; active: boolean }) {
    setFormError(null);
    const mutation = editingMechanic
      ? updateMechanic.mutateAsync({ id: editingMechanic.id, ...input })
      : createMechanic.mutateAsync(input);

    mutation
      .then(() => setDialogOpen(false))
      .catch((error) => setFormError(getErrorMessage(error)));
  }

  function handleDelete() {
    if (!deletingMechanic) return;
    deleteMechanic.mutate(deletingMechanic.id, {
      onSuccess: () => setDeletingMechanic(null),
    });
  }

  const isSaving = createMechanic.isPending || updateMechanic.isPending;

  return (
    <Stack spacing={5}>
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
              Mechanics
            </Typography>
            <Typography color="text.secondary">Manage mechanics and their certifications.</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            New mechanic
          </Button>
        </Stack>

        {mechanicsQuery.isLoading && <LoadingBlock label="Loading mechanics…" />}
        {mechanicsQuery.isError && <ErrorBlock message={getErrorMessage(mechanicsQuery.error)} />}

        {mechanicsQuery.data && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Certification #</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mechanicsQuery.data.results.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <EmptyBlock message="No mechanics yet." />
                    </TableCell>
                  </TableRow>
                )}
                {mechanicsQuery.data.results.map((mechanic) => (
                  <TableRow key={mechanic.id} hover>
                    <TableCell>{mechanic.name}</TableCell>
                    <TableCell>{mechanic.certificationNumber}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={mechanic.active ? 'Active' : 'Inactive'}
                        color={mechanic.active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenEdit(mechanic)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => setDeletingMechanic(mechanic)}>
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
              count={mechanicsQuery.data.count}
              page={page - 1}
              onPageChange={(_event, newPage) => setPage(newPage + 1)}
              rowsPerPage={PAGE_SIZE}
              rowsPerPageOptions={[PAGE_SIZE]}
            />
          </TableContainer>
        )}

        {deleteMechanic.isError && (
          <Alert severity="error">{getErrorMessage(deleteMechanic.error)}</Alert>
        )}
      </Stack>

      <Box>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Workload this year
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Maintenance records completed and total cost of work performed this calendar year,
          busiest mechanic first.
        </Typography>

        {workloadQuery.isLoading && <LoadingBlock />}
        {workloadQuery.isError && <ErrorBlock message={getErrorMessage(workloadQuery.error)} />}

        {workloadQuery.data && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Mechanic</TableCell>
                  <TableCell>Certification #</TableCell>
                  <TableCell align="right">Records this year</TableCell>
                  <TableCell align="right">Total cost</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {workloadQuery.data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <EmptyBlock message="No maintenance recorded yet this year." />
                    </TableCell>
                  </TableRow>
                )}
                {workloadQuery.data.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell>{entry.name}</TableCell>
                    <TableCell>{entry.certificationNumber}</TableCell>
                    <TableCell align="right">{entry.maintenanceCount}</TableCell>
                    <TableCell align="right">{formatCurrency(entry.totalCost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      <MechanicFormDialog
        open={dialogOpen}
        mechanic={editingMechanic}
        loading={isSaving}
        errorMessage={formError}
        onSubmit={handleSubmit}
        onClose={() => setDialogOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(deletingMechanic)}
        title="Delete mechanic?"
        description={
          deletingMechanic
            ? `Deleting "${deletingMechanic.name}" will fail if they still have maintenance records on file - this preserves service history.`
            : ''
        }
        loading={deleteMechanic.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeletingMechanic(null)}
      />
    </Stack>
  );
}
