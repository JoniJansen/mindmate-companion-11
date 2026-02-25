import { useTranslation } from "@/hooks/useTranslation";

interface ErrorMapping {
  titleKey: string;
  bodyKey: string;
  ctaKey?: string;
  action?: "retry" | "reauth" | "wait";
}

/**
 * Maps HTTP status codes to localized error messages.
 */
export function mapHttpError(status: number, errorCode?: string): ErrorMapping {
  if (status === 401 || status === 403) {
    return {
      titleKey: "error.unauthorized",
      bodyKey: "error.unauthorizedBody",
      ctaKey: "error.reauth",
      action: "reauth",
    };
  }

  if (status === 429) {
    return {
      titleKey: "error.rateLimited",
      bodyKey: "error.rateLimitedBody",
      ctaKey: "common.retry",
      action: "wait",
    };
  }

  if (status >= 500) {
    return {
      titleKey: "error.server",
      bodyKey: "error.serverBody",
      ctaKey: "common.retry",
      action: "retry",
    };
  }

  return {
    titleKey: "error.unexpected",
    bodyKey: "error.unexpectedBody",
    ctaKey: "common.retry",
    action: "retry",
  };
}

/**
 * Wraps a fetch call to an edge function with consistent error handling.
 */
export async function edgeFetch<T = any>(
  url: string,
  options: RequestInit = {},
  signal?: AbortSignal
): Promise<{ data: T | null; error: ErrorMapping | null; status: number }> {
  try {
    const resp = await fetch(url, { ...options, signal });
    
    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      return {
        data: null,
        error: mapHttpError(resp.status, errorData.code),
        status: resp.status,
      };
    }

    const data = await resp.json();
    return { data, error: null, status: resp.status };
  } catch (err: any) {
    if (err.name === "AbortError") {
      return {
        data: null,
        error: null, // Intentional abort, not an error
        status: 0,
      };
    }

    // Network error
    return {
      data: null,
      error: {
        titleKey: "error.network",
        bodyKey: "error.networkBody",
        ctaKey: "common.retry",
        action: "retry",
      },
      status: 0,
    };
  }
}
