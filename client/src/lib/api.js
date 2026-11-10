const BASE_URL = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "spendly.token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** Error thrown for any non-2xx API response. `fields` holds per-field validation messages. */
export class ApiError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    // null when the error isn't tied to specific form fields
    this.fields = fields && Object.keys(fields).length ? fields : null;
  }
}

let onUnauthorized = () => {};
/** Registers a callback fired when an authenticated request gets a 401. */
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

async function request(method, path, { body, query, signal } = {}) {
  let url = BASE_URL + path;
  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") params.set(k, v);
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = { Accept: "application/json" };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, signal });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new ApiError(0, "NETWORK", "Can't reach the Spendly server. Check that it's running and try again.");
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = data?.error ?? {};
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(res.status, e.code ?? "UNKNOWN", e.message ?? `Request failed (${res.status}).`, e.details?.fields);
  }
  return data;
}

export const api = {
  get: (path, opts) => request("GET", path, opts),
  post: (path, body, opts) => request("POST", path, { ...opts, body }),
  put: (path, body, opts) => request("PUT", path, { ...opts, body }),
  patch: (path, body, opts) => request("PATCH", path, { ...opts, body }),
  delete: (path, opts) => request("DELETE", path, opts),
};
