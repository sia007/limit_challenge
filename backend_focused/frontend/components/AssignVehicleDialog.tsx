'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';

import { useAllOffices } from '@/lib/hooks/useOffices';
import { Office } from '@/lib/types';

interface AssignVehicleDialogProps {
  open: boolean;
  currentOffice: Office;
  loading?: boolean;
  errorMessage?: string | null;
  onSubmit: (officeId: number) => void;
  onClose: () => void;
}

export default function AssignVehicleDialog({
  open,
  currentOffice,
  loading = false,
  errorMessage,
  onSubmit,
  onClose,
}: AssignVehicleDialogProps) {
  const { data: offices = [] } = useAllOffices();
  const [office, setOffice] = useState<number | ''>('');

  useEffect(() => {
    if (open) {
      setOffice('');
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Move vehicle to another office</DialogTitle>
      <DialogContent>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}
        <FormControl fullWidth sx={{ mt: 1 }}>
          <InputLabel id="assign-office-label">New office</InputLabel>
          <Select
            labelId="assign-office-label"
            label="New office"
            value={office}
            onChange={(event) => setOffice(Number(event.target.value))}
          >
            {offices
              .filter((item) => item.id !== currentOffice.id)
              .map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name} ({item.city})
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={office === '' || loading}
          onClick={() => onSubmit(office as number)}
        >
          {loading ? 'Moving…' : 'Move vehicle'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
