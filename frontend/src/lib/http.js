import { getToken } from "./auth";

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function timeoutSignal(ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { controller, id };
}

export async function request(baseUrl, path, options = {}) {
  const {
    method = "GET",
    body,
    isMultipart = false,
    auth = false,
    timeoutMs = 30000,
    headers = {},
  } = options;

  const url = `${baseUrl}${path}`;
  const finalHeaders = { ...headers };

  if (!isMultipart && body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getToken();
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`;
    }
  }

  const { controller, id } = timeoutSignal(timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : isMultipart ? body : JSON.stringify(body),
      signal: controller.signal,
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      if (response.status === 401 && unauthorizedHandler) {
        unauthorizedHandler();
      }
      const message = typeof data === "string" ? data || `Request failed (${response.status})` : data?.message || data?.detail || `Request failed (${response.status})`;
      throw new ApiError(message, response.status, data);
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ApiError("Request timed out", 408, null);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error.message || "Network error", 0, null);
  } finally {
    clearTimeout(id);
  }
}
