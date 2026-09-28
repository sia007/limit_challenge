import { apiClient } from '@/lib/api-client';
import { PaginatedResponse } from '@/lib/types';

/**
 * List endpoints are paginated (PAGE_SIZE=10 on the backend), which is right
 * for browsing tables but wrong for populating a dropdown - a company with
 * more than 10 offices or mechanics would silently lose options otherwise.
 * This walks every page and returns the full collection.
 */
export async function fetchAllPages<T>(
  url: string,
  params?: Record<string, unknown>,
): Promise<T[]> {
  const results: T[] = [];
  let next: string | null = url;
  let isFirstRequest = true;

  while (next) {
    const response: { data: PaginatedResponse<T> } = await apiClient.get<PaginatedResponse<T>>(
      next,
      isFirstRequest ? { params } : undefined,
    );
    results.push(...response.data.results);
    next = response.data.next;
    isFirstRequest = false;
  }

  return results;
}
