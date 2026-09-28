'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';
import { Office, OfficeSummary, PaginatedResponse } from '@/lib/types';
import { fetchAllPages } from '@/lib/utils/pagination';

const OFFICES_KEY = 'offices';
const OFFICE_SUMMARY_KEY = 'office-summary';

async function fetchOffices(page: number) {
  const response = await apiClient.get<PaginatedResponse<Office>>('/offices/', {
    params: { page },
  });
  return response.data;
}

// The summary endpoint is paginated like every other list endpoint. The
// dashboard wants the complete company overview (and its totals must cover
// every office, not just page 1), so walk every page.
async function fetchOfficeSummary() {
  return fetchAllPages<OfficeSummary>('/offices/summary/');
}

export function useOfficesList(page: number) {
  return useQuery({
    queryKey: [OFFICES_KEY, page],
    queryFn: () => fetchOffices(page),
  });
}

/** All offices across every page - for populating select dropdowns. */
export function useAllOffices() {
  return useQuery({
    queryKey: [OFFICES_KEY, 'all'],
    queryFn: () => fetchAllPages<Office>('/offices/'),
    staleTime: 60_000,
  });
}

export function useOfficeSummary() {
  return useQuery({
    queryKey: [OFFICE_SUMMARY_KEY],
    queryFn: fetchOfficeSummary,
  });
}

function useInvalidateOffices() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [OFFICES_KEY] });
    queryClient.invalidateQueries({ queryKey: [OFFICE_SUMMARY_KEY] });
  };
}

export function useCreateOffice() {
  const invalidate = useInvalidateOffices();
  return useMutation({
    mutationFn: (input: Omit<Office, 'id'>) => apiClient.post<Office>('/offices/', input),
    onSuccess: invalidate,
  });
}

export function useUpdateOffice() {
  const invalidate = useInvalidateOffices();
  return useMutation({
    mutationFn: ({ id, ...input }: Office) => apiClient.put<Office>(`/offices/${id}/`, input),
    onSuccess: invalidate,
  });
}

export function useDeleteOffice() {
  const invalidate = useInvalidateOffices();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/offices/${id}/`),
    onSuccess: invalidate,
  });
}
