const SESSION_USER_KEY = "medicalInventoryUser";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

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
  const hasBody = options.body !== undefined && options.body !== null;
  const requestBody = hasBody && typeof options.body !== "string"
    ? JSON.stringify(options.body)
    : options.body;
  const response = await fetch(targetUrl, {
    credentials: "include",
    ...options,
    body: requestBody,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

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
