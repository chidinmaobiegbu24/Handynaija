const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export function getApiBaseUrl() {
  return apiBaseUrl;
}

interface RequestErrorBody {
  detail?: unknown;
}

function extractErrorMessage(status: number, body: unknown): string {
  if (body && typeof body === "object") {
    const detail = (body as RequestErrorBody).detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
    if (detail && typeof detail === "object") {
      const message = (detail as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: unknown } | undefined;
      if (first && typeof first.msg === "string" && first.msg.trim()) {
        return first.msg;
      }
    }
  }
  return `API request failed with status ${status}.`;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error("The backend API has not been configured yet.");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }
    throw new Error(extractErrorMessage(response.status, body));
  }

  return response.json() as Promise<T>;
}