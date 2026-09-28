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
  Stack,
  TextField,
} from '@mui/material';

import { useAllMechanics } from '@/lib/hooks/useMechanics';
import { MAINTENANCE_TYPES } from '@/lib/constants';
import { MaintenanceRecordNested } from '@/lib/types';

interface MaintenanceRecordFormDialogProps {
  open: boolean;
  record?: MaintenanceRecordNested | null;
  loading?: boolean;
  errorMessage?: string | null;
  onSubmit: (input: {
    mechanic: number;
    maintenanceDate: string;
    maintenanceType: string;
    cost: string;
    notes: string;
  }) => void;
  onClose: () => void;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function MaintenanceRecordFormDialog({
  open,
  record,
  loading = false,
  errorMessage,
  onSubmit,
  onClose,
}: MaintenanceRecordFormDialogProps) {
  const { data: mechanics = [] } = useAllMechanics();

  const [mechanic, setMechanic] = useState<number | ''>('');
  const [maintenanceDate, setMaintenanceDate] = useState(today());
  const [maintenanceType, setMaintenanceType] = useState(MAINTENANCE_TYPES[0].value);
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setMechanic(record?.mechanic.id ?? (mechanics[0]?.id ?? ''));
      setMaintenanceDate(record?.maintenanceDate ?? today());
      setMaintenanceType(record?.maintenanceType ?? MAINTENANCE_TYPES[0].value);
      setCost(record?.cost ?? '');
      setNotes(record?.notes ?? '');
    }
    // mechanics intentionally excluded - only used to pick a default on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, record]);

  const costNumber = Number(cost);
  const isValid =
    mechanic !== '' &&
    maintenanceDate.trim().length > 0 &&
    maintenanceType.trim().length > 0 &&
    cost.trim().length > 0 &&
    !Number.isNaN(costNumber) &&
    costNumber >= 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{record ? 'Edit maintenance record' : 'New maintenance record'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          <FormControl fullWidth>
            <InputLabel id="maintenance-mechanic-label">Mechanic</InputLabel>
            <Select
              labelId="maintenance-mechanic-label"
              label="Mechanic"
              value={mechanic}
              onChange={(event) => setMechanic(Number(event.target.value))}
            >
              {mechanics.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name} ({item.certificationNumber})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Date"
              type="date"
              value={maintenanceDate}
              onChange={(event) => setMaintenanceDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="maintenance-type-label">Type</InputLabel>
              <Select
                labelId="maintenance-type-label"
                label="Type"
                value={maintenanceType}
                onChange={(event) => setMaintenanceType(event.target.value)}
              >
                {MAINTENANCE_TYPES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <TextField
            label="Cost"
            type="number"
            value={cost}
            onChange={(event) => setCost(event.target.value)}
            slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
            fullWidth
          />
          <TextField
            label="Notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            multiline
            minRows={2}
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
          onClick={() =>
            onSubmit({
              mechanic: mechanic as number,
              maintenanceDate,
              maintenanceType,
              cost: costNumber.toFixed(2),
              notes: notes.trim(),
            })
          }
        >
          {loading ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
