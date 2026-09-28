'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import {
  DuplicateCheckResult,
  PaginatedResponse,
  Vehicle,
  VehicleDetail,
  VehicleFilters,
  VehicleInput,
} from '@/lib/types';

const VEHICLES_KEY = 'vehicles';
const NEEDING_MAINTENANCE_KEY = 'vehicles-needing-maintenance';

/**
 * The API's camelCase rewriting (djangorestframework-camel-case) only
 * touches JSON request/response bodies, not query string keys, so the
 * search filters have to go out snake_case to match the backend's
 * FilterSet field names exactly.
 */
function toFilterParams(filters: VehicleFilters, page: number) {
  return {
    page,
    office: filters.office || undefined,
    active: filters.active === '' ? undefined : filters.active,
    make: filters.make || undefined,
    model: filters.model || undefined,
    maintenance_from: filters.maintenanceFrom || undefined,
    maintenance_to: filters.maintenanceTo || undefined,
    mechanic_certification_number: filters.mechanicCertificationNumber || undefined,
  };
}

async function fetchVehicles(filters: VehicleFilters, page: number) {
  const response = await apiClient.get<PaginatedResponse<Vehicle>>('/vehicles/', {
    params: toFilterParams(filters, page),
  });
  return response.data;
}

async function fetchVehicleDetail(id: number | string) {
  const response = await apiClient.get<VehicleDetail>(`/vehicles/${id}/`);
  return response.data;
}

async function fetchVehiclesNeedingMaintenance(page: number) {
  const response = await apiClient.get<PaginatedResponse<Vehicle>>(
    '/vehicles/needing-maintenance/',
    { params: { page } },
  );
  return response.data;
}

export function useVehiclesList(filters: VehicleFilters, page: number) {
  return useQuery({
    queryKey: [VEHICLES_KEY, filters, page],
    queryFn: () => fetchVehicles(filters, page),
  });
}

export function useVehicleDetail(id: number | string) {
  return useQuery({
    queryKey: [VEHICLES_KEY, 'detail', id],
    queryFn: () => fetchVehicleDetail(id),
    enabled: Boolean(id),
  });
}

export function useVehiclesNeedingMaintenance(page: number) {
  return useQuery({
    queryKey: [NEEDING_MAINTENANCE_KEY, page],
    queryFn: () => fetchVehiclesNeedingMaintenance(page),
  });
}

function useInvalidateVehicles() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [VEHICLES_KEY] });
    queryClient.invalidateQueries({ queryKey: [NEEDING_MAINTENANCE_KEY] });
    queryClient.invalidateQueries({ queryKey: ['office-summary'] });
  };
}

export function useCreateVehicle() {
  const invalidate = useInvalidateVehicles();
  return useMutation({
    mutationFn: (input: VehicleInput) => apiClient.post<Vehicle>('/vehicles/', input),
    onSuccess: invalidate,
  });
}

export function useUpdateVehicle() {
  const invalidate = useInvalidateVehicles();
  return useMutation({
    mutationFn: ({ id, ...input }: VehicleInput & { id: number }) =>
      apiClient.put<Vehicle>(`/vehicles/${id}/`, input),
    onSuccess: invalidate,
  });
}

export function useDeleteVehicle() {
  const invalidate = useInvalidateVehicles();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/vehicles/${id}/`),
    onSuccess: invalidate,
  });
}

export function useAssignVehicle() {
  const invalidate = useInvalidateVehicles();
  return useMutation({
    mutationFn: ({ id, office }: { id: number; office: number }) =>
      apiClient.post<Vehicle>(`/vehicles/${id}/assign/`, { office }),
    onSuccess: invalidate,
  });
}

export async function checkVehicleDuplicate(params: {
  vin?: string;
  licensePlate?: string;
  excludeId?: number;
}): Promise<DuplicateCheckResult> {
  const response = await apiClient.post<DuplicateCheckResult>('/vehicles/check-duplicate/', {
    vin: params.vin || undefined,
    licensePlate: params.licensePlate || undefined,
    excludeId: params.excludeId,
  });
  return response.data;
}
