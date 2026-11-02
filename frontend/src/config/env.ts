const DEFAULT_API_URL =
  'http://localhost:3000/api/v1';

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, '');
}

function resolveApiUrl() {
  const value =
    import.meta.env.VITE_API_URL?.trim() ||
    DEFAULT_API_URL;

  try {
    const parsedUrl = new URL(value);

    if (
      parsedUrl.protocol !== 'http:' &&
      parsedUrl.protocol !== 'https:'
    ) {
      throw new Error(
        'VITE_API_URL must use http or https.',
      );
    }

    return normalizeUrl(value);
  } catch {
    throw new Error(
      'Invalid VITE_API_URL configuration.',
    );
  }
}

export const env = {
  apiUrl: resolveApiUrl(),
} as const;
