/**
 * Browser-side API client. Every call goes through the Next.js proxy at `/api/backend/*`,
 * which attaches the member's token from an httpOnly cookie. The token is never readable
 * from JavaScript.
 */

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }

  /** First validation message for a field, if any. */
  field(name: string): string | undefined {
    return this.errors[name]?.[0];
  }
}

type Query = Record<string, string | number | boolean | null | undefined | string[]>;

function buildQuery(query?: Query): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "" || value === false) continue;
    params.set(key, Array.isArray(value) ? value.join(",") : value === true ? "1" : String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

async function request<T>(path: string, init: RequestInit & { query?: Query } = {}): Promise<T> {
  const { query, headers, ...rest } = init;
  const isForm = typeof FormData !== "undefined" && rest.body instanceof FormData;

  const response = await fetch(`/api/backend/${path.replace(/^\//, "")}${buildQuery(query)}`, {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(rest.body && !isForm ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    credentials: "same-origin",
  });

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      response.status,
      payload?.message ?? "Something went wrong. Please try again.",
      payload?.errors ?? {},
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, query?: Query) => request<T>(path, { method: "GET", query }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string, body?: unknown) => request<T>(path, { method: "DELETE", body: body === undefined ? undefined : JSON.stringify(body) }),
};

/** Auth endpoints live on the Next.js server because they set the httpOnly session cookie. */
export async function authRequest<T>(action: "login" | "register" | "logout", body?: unknown): Promise<T> {
  const response = await fetch(`/api/auth/${action}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, payload?.message ?? "Something went wrong.", payload?.errors ?? {});
  }
  return payload as T;
}
