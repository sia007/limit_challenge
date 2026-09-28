import axios from 'axios';

/**
 * DRF (via djangorestframework-camel-case) can return errors as:
 *   - {"detail": "..."}                         (custom exception handler, 404s, etc.)
 *   - {"fieldName": ["message", ...]}             (serializer field errors)
 *   - {"nonFieldErrors": ["message"]}             (serializer.validate() errors)
 *   - a plain string, in rarer cases
 * This normalizes all of them into one readable string for a Snackbar/Alert.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (!data) {
      return error.message || 'Network error - is the API running?';
    }
    if (typeof data === 'string') {
      return data;
    }
    if (typeof data === 'object' && typeof (data as { detail?: unknown }).detail === 'string') {
      return (data as { detail: string }).detail;
    }
    if (typeof data === 'object') {
      const messages: string[] = [];
      for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        const prefix = key === 'nonFieldErrors' ? '' : `${key}: `;
        if (Array.isArray(value)) {
          messages.push(`${prefix}${value.join(', ')}`);
        } else if (typeof value === 'string') {
          messages.push(`${prefix}${value}`);
        }
      }
      if (messages.length > 0) {
        return messages.join(' | ');
      }
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong.';
}
