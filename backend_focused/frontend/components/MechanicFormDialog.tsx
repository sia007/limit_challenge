'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material';

import { Mechanic } from '@/lib/types';

interface MechanicFormDialogProps {
  open: boolean;
  mechanic?: Mechanic | null;
  loading?: boolean;
  errorMessage?: string | null;
  onSubmit: (input: { name: string; certificationNumber: string; active: boolean }) => void;
  onClose: () => void;
}

export default function MechanicFormDialog({
  open,
  mechanic,
  loading = false,
  errorMessage,
  onSubmit,
  onClose,
}: MechanicFormDialogProps) {
  const [name, setName] = useState('');
  const [certificationNumber, setCertificationNumber] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (open) {
      setName(mechanic?.name ?? '');
      setCertificationNumber(mechanic?.certificationNumber ?? '');
      setActive(mechanic?.active ?? true);
    }
  }, [open, mechanic]);

  const isValid = name.trim().length > 0 && certificationNumber.trim().length > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{mechanic ? 'Edit mechanic' : 'New mechanic'}</DialogTitle>
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
            label="Certification number"
            value={certificationNumber}
            onChange={(event) => setCertificationNumber(event.target.value)}
            fullWidth
          />
          <FormControlLabel
            control={<Switch checked={active} onChange={(event) => setActive(event.target.checked)} />}
            label="Active"
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
          onClick={() =>
            onSubmit({
              name: name.trim(),
              certificationNumber: certificationNumber.trim(),
              active,
            })
          }
        >
          {loading ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
