import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { MaintenanceRecord, MaintenanceRecordInput } from '@/lib/types';

/**
 * Maintenance records are always viewed nested inside a vehicle's detail
 * page, so mutations here just invalidate that vehicle's detail query (and
 * the mechanic workload figures, since those change too) rather than
 * keeping a separate maintenance-records list in the cache.
 */
function useInvalidateAfterMaintenanceChange(vehicleId: number) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['vehicles', 'detail', vehicleId] });
    queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    queryClient.invalidateQueries({ queryKey: ['mechanic-workload'] });
    queryClient.invalidateQueries({ queryKey: ['office-summary'] });
    queryClient.invalidateQueries({ queryKey: ['vehicles-needing-maintenance'] });
  };
}

export function useCreateMaintenanceRecord(vehicleId: number) {
  const invalidate = useInvalidateAfterMaintenanceChange(vehicleId);
  return useMutation({
    mutationFn: (input: MaintenanceRecordInput) =>
      apiClient.post<MaintenanceRecord>('/maintenance-records/', input),
    onSuccess: invalidate,
  });
}

export function useUpdateMaintenanceRecord(vehicleId: number) {
  const invalidate = useInvalidateAfterMaintenanceChange(vehicleId);
  return useMutation({
    mutationFn: ({ id, ...input }: MaintenanceRecordInput & { id: number }) =>
      apiClient.put<MaintenanceRecord>(`/maintenance-records/${id}/`, input),
    onSuccess: invalidate,
  });
}

export function useDeleteMaintenanceRecord(vehicleId: number) {
  const invalidate = useInvalidateAfterMaintenanceChange(vehicleId);
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/maintenance-records/${id}/`),
    onSuccess: invalidate,
  });
}
