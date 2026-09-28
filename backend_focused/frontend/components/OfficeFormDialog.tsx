'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';

import { Office } from '@/lib/types';

interface OfficeFormDialogProps {
  open: boolean;
  office?: Office | null;
  loading?: boolean;
  errorMessage?: string | null;
  onSubmit: (input: { name: string; city: string }) => void;
  onClose: () => void;
}

export default function OfficeFormDialog({
  open,
  office,
  loading = false,
  errorMessage,
  onSubmit,
  onClose,
}: OfficeFormDialogProps) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    if (open) {
      setName(office?.name ?? '');
      setCity(office?.city ?? '');
    }
  }, [open, office]);

  const isValid = name.trim().length > 0 && city.trim().length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{office ? 'Edit office' : 'New office'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {errorMessage && <Stack sx={{ color: 'error.main' }}>{errorMessage}</Stack>}
          <TextField
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            fullWidth
          />
          <TextField
            label="City"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!isValid || loading}
          onClick={() => onSubmit({ name: name.trim(), city: city.trim() })}
        >
          {loading ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
