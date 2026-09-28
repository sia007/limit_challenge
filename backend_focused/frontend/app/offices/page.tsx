'use client';

import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {
  Alert,
  Box,
  Button,
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
  useCreateOffice,
  useDeleteOffice,
  useOfficesList,
  useUpdateOffice,
} from '@/lib/hooks/useOffices';
import { getErrorMessage } from '@/lib/error';
import { Office } from '@/lib/types';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/QueryState';
import OfficeFormDialog from '@/components/OfficeFormDialog';
import ConfirmDialog from '@/components/ConfirmDialog';

const PAGE_SIZE = 10;

export default function OfficesPage() {
  const [page, setPage] = useState(1);
  const officesQuery = useOfficesList(page);

  const createOffice = useCreateOffice();
  const updateOffice = useUpdateOffice();
  const deleteOffice = useDeleteOffice();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);
  const [deletingOffice, setDeletingOffice] = useState<Office | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function handleOpenCreate() {
    setEditingOffice(null);
    setFormError(null);
    setDialogOpen(true);
  }

  function handleOpenEdit(office: Office) {
    setEditingOffice(office);
    setFormError(null);
    setDialogOpen(true);
  }

  function handleSubmit(input: { name: string; city: string }) {
    setFormError(null);
    const mutation = editingOffice
      ? updateOffice.mutateAsync({ id: editingOffice.id, ...input })
      : createOffice.mutateAsync(input);

    mutation
      .then(() => setDialogOpen(false))
      .catch((error) => setFormError(getErrorMessage(error)));
  }

  function handleDelete() {
    if (!deletingOffice) return;
    deleteOffice.mutate(deletingOffice.id, {
      onSuccess: () => setDeletingOffice(null),
    });
  }

  const isSaving = createOffice.isPending || updateOffice.isPending;

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            Offices
          </Typography>
          <Typography color="text.secondary">Manage the company&apos;s offices.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          New office
        </Button>
      </Stack>

      {officesQuery.isLoading && <LoadingBlock label="Loading offices…" />}
      {officesQuery.isError && <ErrorBlock message={getErrorMessage(officesQuery.error)} />}

      {officesQuery.data && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>City</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {officesQuery.data.results.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3}>
                    <EmptyBlock message="No offices yet." />
                  </TableCell>
                </TableRow>
              )}
              {officesQuery.data.results.map((office) => (
                <TableRow key={office.id} hover>
                  <TableCell>{office.name}</TableCell>
                  <TableCell>{office.city}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenEdit(office)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => setDeletingOffice(office)}>
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
            count={officesQuery.data.count}
            page={page - 1}
            onPageChange={(_event, newPage) => setPage(newPage + 1)}
            rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[PAGE_SIZE]}
          />
        </TableContainer>
      )}

      {deleteOffice.isError && <Alert severity="error">{getErrorMessage(deleteOffice.error)}</Alert>}

      <OfficeFormDialog
        open={dialogOpen}
        office={editingOffice}
        loading={isSaving}
        errorMessage={formError}
        onSubmit={handleSubmit}
        onClose={() => setDialogOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(deletingOffice)}
        title="Delete office?"
        description={
          deletingOffice
            ? `Deleting "${deletingOffice.name}" will fail if it still has vehicles assigned to it - move or delete those vehicles first.`
            : ''
        }
        loading={deleteOffice.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeletingOffice(null)}
      />
    </Stack>
  );
}
