// Mirrors fleet.models.MaintenanceRecord.MaintenanceType on the backend.
// Keep these in sync if the backend's choices ever change.
export const MAINTENANCE_TYPES: Array<{ value: string; label: string }> = [
  { value: 'oil_change', label: 'Oil Change' },
  { value: 'tire_rotation', label: 'Tire Rotation' },
  { value: 'tire_replacement', label: 'Tire Replacement' },
  { value: 'brake_service', label: 'Brake Service' },
  { value: 'battery_replacement', label: 'Battery Replacement' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'engine_repair', label: 'Engine Repair' },
  { value: 'transmission_service', label: 'Transmission Service' },
  { value: 'body_repair', label: 'Body Repair' },
  { value: 'other', label: 'Other' },
];

export function maintenanceTypeLabel(value: string): string {
  return MAINTENANCE_TYPES.find((option) => option.value === value)?.label ?? value;
}
