import { env } from '../config/env';
import {
  clearAccessToken,
  getAccessToken,
} from '../features/auth/auth-storage';

export const UNAUTHORIZED_EVENT =
  'dominiohub:unauthorized';

interface ApiErrorPayload {
  error?: string;
  message?: string;
  details?: unknown;
}

interface ApiRequestOptions
  extends Omit<RequestInit, 'body'> {
  body?: BodyInit | null;
  json?: unknown;
  auth?: boolean;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly requestId: string | null;
  readonly details?: unknown;

  constructor(params: {
    statusCode: number;
    code: string;
    message: string;
    requestId?: string | null;
    details?: unknown;
  }) {
    super(params.message);

    this.name = 'ApiError';
    this.statusCode = params.statusCode;
    this.code = params.code;
    this.requestId = params.requestId ?? null;
    this.details = params.details;
  }
}

function notifyUnauthorized() {
  clearAccessToken();

  window.dispatchEvent(
    new Event(UNAUTHORIZED_EVENT),
  );
}

async function parseResponseBody(
  response: Response,
): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    auth = true,
    headers: providedHeaders,
    json,
    body: providedBody,
    ...requestOptions
  } = options;

  const headers = new Headers(providedHeaders);

  headers.set('Accept', 'application/json');

  let body = providedBody;

  if (json !== undefined) {
    headers.set(
      'Content-Type',
      'application/json',
    );

    body = JSON.stringify(json);
  }

  if (auth) {
    const accessToken = getAccessToken();

    if (accessToken) {
      headers.set(
        'Authorization',
        `Bearer ${accessToken}`,
      );
    }
  }

  const normalizedPath = path.startsWith('/')
    ? path
    : `/${path}`;

  let response: Response;

  try {
    response = await fetch(
      `${env.apiUrl}${normalizedPath}`,
      {
        ...requestOptions,
        headers,
        body,
      },
    );
  } catch {
    throw new ApiError({
      statusCode: 0,
      code: 'NETWORK_ERROR',
      message:
        'Não foi possível conectar ao servidor.',
    });
  }

  const requestId =
    response.headers.get('x-request-id');

  const responseBody =
    await parseResponseBody(response);

  if (!response.ok) {
    if (response.status === 401 && auth) {
      notifyUnauthorized();
    }

    const payload =
      typeof responseBody === 'object' &&
      responseBody !== null
        ? (responseBody as ApiErrorPayload)
        : undefined;

    throw new ApiError({
      statusCode: response.status,
      code:
        payload?.error ??
        'UNKNOWN_API_ERROR',
      message:
        payload?.message ??
        'Não foi possível concluir a solicitação.',
      requestId,
      details: payload?.details,
    });
  }

  return responseBody as T;
}
