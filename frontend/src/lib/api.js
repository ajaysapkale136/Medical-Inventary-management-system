const SESSION_USER_KEY = "medicalInventoryUser";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const GET_CACHE_TTL_MS = 30_000;
const REQUEST_TIMEOUT_MS = 60_000;
const getCache = new Map();

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function apiRequest(path, options = {}) {
  const targetUrl = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const method = (options.method || "GET").toUpperCase();
  const cached = getCache.get(targetUrl);
  if (method === "GET" && cached && Date.now() - cached.createdAt < GET_CACHE_TTL_MS) {
    return cached.promise;
  }
  const hasBody = options.body !== undefined && options.body !== null;
  const requestBody = hasBody && typeof options.body !== "string"
    ? JSON.stringify(options.body)
    : options.body;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const request = fetch(targetUrl, {
    credentials: "include",
    ...options,
    body: requestBody,
    signal: options.signal || controller.signal,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  }).then(async (response) => {

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const responseBody = isJson ? await response.json() : null;

    if (!response.ok) {
      if (response.status === 401) {
        clearSessionUser();
      }
      const message = responseBody?.message
        || responseBody?.error
        || (response.status === 401 ? "Incorrect email or password." : null)
        || (response.status === 403 ? "Access denied. Your account is inactive or lacks permissions." : null)
        || (response.status >= 500 ? `Server connection error (HTTP ${response.status}). Database or server may be starting up.` : null)
        || `Request failed (HTTP ${response.status})`;
      throw new ApiError(message, response.status, responseBody);
    }
    return responseBody;
  }).catch((error) => {
    if (error.name === "AbortError") {
      throw new ApiError("The server did not respond within one minute. Check the Render service and database settings.", 504);
    }
    throw error;
  }).finally(() => window.clearTimeout(timeout));

  if (method === "GET") {
    getCache.set(targetUrl, { createdAt: Date.now(), promise: request });
    request.catch(() => getCache.delete(targetUrl));
  }
  return request;
}

export function getSessionUser() {
  try {
    const value = localStorage.getItem(SESSION_USER_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function storeSessionUser(user) {
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function clearSessionUser() {
  localStorage.removeItem(SESSION_USER_KEY);
}

export async function signOut() {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } finally {
    clearSessionUser();
  }
}

export async function downloadFile(path, defaultFilename = "report.pdf") {
  const targetUrl = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const response = await fetch(targetUrl, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new ApiError("File download failed from server", response.status);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition");
  let filename = defaultFilename;
  if (disposition && disposition.includes("filename=")) {
    filename = disposition.split("filename=")[1].replace(/["']/g, "").trim();
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
