import { config } from '../config';
import { firebaseAuth } from '../auth/firebase';

/** Error devuelto por la API de CAPS, con el código que define el backend. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: { field: string; message: string }[],
  ) {
    super(message);
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
type Query = Record<string, string | number | boolean | undefined | null>;

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${config.apiUrl}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/**
 * Cliente HTTP único de la aplicación. Agrega el token de Firebase del
 * usuario actual (si hay sesión) y convierte los errores en `ApiError`.
 */
export async function apiRequest<T>(
  method: Method,
  path: string,
  options: { body?: unknown; query?: Query } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const user = firebaseAuth?.currentUser;
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor. Revisá tu conexión.');
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = data?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? 'Ocurrió un error inesperado',
      error?.details,
    );
  }
  return data as T;
}

/** Mensaje legible para mostrar cualquier error en pantalla. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.details?.length) {
      return `${error.message}: ${error.details.map((d) => `${d.field} ${d.message}`).join(', ')}`;
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado';
}
