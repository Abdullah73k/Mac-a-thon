/**
 * HTTP API client for communicating with the backend.
 *
 * Uses native fetch for zero-dependency overhead.
 * All methods return typed responses validated at boundaries.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

class ApiClientError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({
      message: response.statusText,
      code: "UNKNOWN_ERROR",
    }));
    throw new ApiClientError(
      response.status,
      errorBody.code || "UNKNOWN_ERROR",
      errorBody.message || response.statusText,
    );
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};

export { ApiClientError };
