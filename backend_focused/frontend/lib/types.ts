// These mirror the backend's JSON shape exactly. The API renders/parses
// camelCase in request and response *bodies* (djangorestframework-camel-case),
// so these types use camelCase throughout. Query string filter keys are the
// one exception - the API leaves those snake_case (see useVehicles.ts).

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Office {
  id: number;
  name: string;
  city: string;
}

export interface OfficeSummary extends Office {
  activeVehicleCount: number;
  maintenanceCostLastYear: string; // decimal, serialized as a string
  lastMaintenance: string | null; // ISO date, or null if never serviced
}

export interface Mechanic {
  id: number;
  name: string;
  certificationNumber: string;
  active: boolean;
}

export interface MechanicWorkload {
  id: number;
  name: string;
  certificationNumber: string;
  maintenanceCount: number;
  totalCost: string;
}

export interface MaintenanceRecordNested {
  id: number;
  mechanic: Mechanic;
  maintenanceDate: string;
  maintenanceType: string;
  cost: string;
  notes: string;
}

export interface MaintenanceRecord {
  id: number;
  vehicle: number;
  vehicleVin: string;
  mechanic: number;
  mechanicName: string;
  maintenanceDate: string;
  maintenanceType: string;
  cost: string;
  notes: string;
}

export interface Vehicle {
  id: number;
  vin: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  office: number;
  officeDetail: Office;
  active: boolean;
}

export interface VehicleDetail {
  id: number;
  vin: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  office: Office;
  active: boolean;
  maintenanceRecords: MaintenanceRecordNested[];
}

export interface VehicleInput {
  vin: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  office: number;
  active: boolean;
}

export interface MaintenanceRecordInput {
  vehicle: number;
  mechanic: number;
  maintenanceDate: string;
  maintenanceType: string;
  cost: string;
  notes: string;
}

export interface VehicleFilters {
  office?: number | '';
  active?: boolean | '';
  make?: string;
  model?: string;
  maintenanceFrom?: string;
  maintenanceTo?: string;
  mechanicCertificationNumber?: string;
}

export interface DuplicateCheckResult {
  conflicts: Array<'vin' | 'license_plate'>;
}
