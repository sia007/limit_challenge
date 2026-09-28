import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from '@mui/material';

import { useAllOffices } from '@/lib/hooks/useOffices';
import { checkVehicleDuplicate } from '@/lib/hooks/useVehicles';
import { Vehicle, VehicleInput } from '@/lib/types';

interface VehicleFormDialogProps {
  open: boolean;
  vehicle?: Vehicle | null;
  loading?: boolean;
  errorMessage?: string | null;
  onSubmit: (input: VehicleInput) => void;
  onClose: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();

export default function VehicleFormDialog({
  open,
  vehicle,
  loading = false,
  errorMessage,
  onSubmit,
  onClose,
}: VehicleFormDialogProps) {
  const { data: offices = [] } = useAllOffices();

  const [vin, setVin] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(CURRENT_YEAR);
  const [office, setOffice] = useState<number | ''>('');
  const [active, setActive] = useState(true);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setVin(vehicle?.vin ?? '');
      setLicensePlate(vehicle?.licensePlate ?? '');
      setMake(vehicle?.make ?? '');
      setModel(vehicle?.model ?? '');
      setYear(vehicle?.year ?? CURRENT_YEAR);
      setOffice(vehicle?.office ?? (offices[0]?.id ?? ''));
      setActive(vehicle?.active ?? true);
      setDuplicateWarning(null);
    }
    // offices intentionally excluded - only used to pick a default on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vehicle]);

  async function handleDuplicateCheck() {
    if (!vin.trim() && !licensePlate.trim()) {
      setDuplicateWarning(null);
      return;
    }
    try {
      const result = await checkVehicleDuplicate({
        vin: vin.trim(),
        licensePlate: licensePlate.trim(),
        excludeId: vehicle?.id,
      });
      if (result.conflicts.length === 0) {
        setDuplicateWarning(null);
      } else {
        const labels = result.conflicts.map((field) =>
          field === 'vin' ? 'VIN' : 'license plate',
        );
        setDuplicateWarning(
          `Another vehicle already uses this ${labels.join(' and ')}. Saving may fail.`,
        );
      }
    } catch {
      // Non-blocking: this is just an early warning, not a hard gate.
      setDuplicateWarning(null);
    }
  }

  const isValid =
    vin.trim().length > 0 &&
    licensePlate.trim().length > 0 &&
    make.trim().length > 0 &&
    model.trim().length > 0 &&
    office !== '' &&
    year >= 1900 &&
    year <= CURRENT_YEAR + 1;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{vehicle ? 'Edit vehicle' : 'New vehicle'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          {duplicateWarning && <Alert severity="warning">{duplicateWarning}</Alert>}
          <TextField
            label="VIN"
            value={vin}
            onChange={(event) => setVin(event.target.value.toUpperCase())}
            onBlur={handleDuplicateCheck}
            slotProps={{ htmlInput: { maxLength: 17 } }}
            helperText={`${vin.length}/17`}
            autoFocus
            fullWidth
          />
          <TextField
            label="License plate"
            value={licensePlate}
            onChange={(event) => setLicensePlate(event.target.value.toUpperCase())}
            onBlur={handleDuplicateCheck}
            fullWidth
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="Make"
              value={make}
              onChange={(event) => setMake(event.target.value)}
              fullWidth
            />
            <TextField
              label="Model"
              value={model}
              onChange={(event) => setModel(event.target.value)}
              fullWidth
            />
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField
              label="Year"
              type="number"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              slotProps={{ htmlInput: { min: 1900, max: CURRENT_YEAR + 1 } }}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel id="vehicle-office-label">Office</InputLabel>
              <Select
                labelId="vehicle-office-label"
                label="Office"
                value={office}
                onChange={(event) => setOffice(Number(event.target.value))}
              >
                {offices.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name} ({item.city})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
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
              vin: vin.trim(),
              licensePlate: licensePlate.trim(),
              make: make.trim(),
              model: model.trim(),
              year,
              office: office as number,
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
