export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const message = (err as { response?: { data?: { message?: unknown } } })?.response?.data
    ?.message;

  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.map(String).join(', ');
  if (message && typeof message === 'object' && 'message' in message) {
    const nested = (message as { message?: unknown }).message;
    if (typeof nested === 'string') return nested;
    if (Array.isArray(nested)) return nested.map(String).join(', ');
  }

  return fallback;
}
