import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { Mechanic, MechanicWorkload, PaginatedResponse } from '@/lib/types';
import { fetchAllPages } from '@/lib/utils/pagination';

const MECHANICS_KEY = 'mechanics';
const WORKLOAD_KEY = 'mechanic-workload';

async function fetchMechanics(page: number) {
  const response = await apiClient.get<PaginatedResponse<Mechanic>>('/mechanics/', {
    params: { page },
  });
  return response.data;
}

// Paginated on the backend; the workload table shows the full leaderboard,
// so walk every page (order is preserved: busiest mechanic first).
async function fetchWorkload() {
  return fetchAllPages<MechanicWorkload>('/mechanics/workload/');
}

export function useMechanicsList(page: number) {
  return useQuery({
    queryKey: [MECHANICS_KEY, page],
    queryFn: () => fetchMechanics(page),
  });
}

/** All mechanics across every page - for populating select dropdowns. */
export function useAllMechanics() {
  return useQuery({
    queryKey: [MECHANICS_KEY, 'all'],
    queryFn: () => fetchAllPages<Mechanic>('/mechanics/'),
    staleTime: 60_000,
  });
}

export function useMechanicWorkload() {
  return useQuery({
    queryKey: [WORKLOAD_KEY],
    queryFn: fetchWorkload,
  });
}

function useInvalidateMechanics() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [MECHANICS_KEY] });
    queryClient.invalidateQueries({ queryKey: [WORKLOAD_KEY] });
  };
}

export function useCreateMechanic() {
  const invalidate = useInvalidateMechanics();
  return useMutation({
    mutationFn: (input: Omit<Mechanic, 'id'>) => apiClient.post<Mechanic>('/mechanics/', input),
    onSuccess: invalidate,
  });
}

export function useUpdateMechanic() {
  const invalidate = useInvalidateMechanics();
  return useMutation({
    mutationFn: ({ id, ...input }: Mechanic) =>
      apiClient.put<Mechanic>(`/mechanics/${id}/`, input),
    onSuccess: invalidate,
  });
}

export function useDeleteMechanic() {
  const invalidate = useInvalidateMechanics();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/mechanics/${id}/`),
    onSuccess: invalidate,
  });
}
