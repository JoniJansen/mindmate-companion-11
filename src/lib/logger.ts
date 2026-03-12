/**
 * Structured Logging Utility — Production-Safe
 * 
 * Provides contextual logging with automatic redaction of secrets.
 * In production, only warnings and errors are emitted.
 * In development, all levels are active.
 * 
 * Usage:
 *   import { logInfo, logWarn, logError } from "@/lib/logger";
 *   logInfo("chat", "message_sent", { messageId: "abc" });
 *   logError("voice", "session_failed", { error: "timeout" });
 */

type LogLevel = "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

// Patterns that should NEVER appear in logs
const SECRET_PATTERNS = [
  /sk_live_[a-zA-Z0-9]+/g,
  /sk_test_[a-zA-Z0-9]+/g,
  /whsec_[a-zA-Z0-9]+/g,
  /eyJ[a-zA-Z0-9_-]{20,}/g, // JWTs
  /supabase_service_role_key/gi,
  /LOVABLE_API_KEY/gi,
];

function redact(value: unknown): unknown {
  if (typeof value !== "string") return value;
  let safe = value;
  for (const pattern of SECRET_PATTERNS) {
    safe = safe.replace(pattern, "[REDACTED]");
  }
  return safe;
}

function sanitizeContext(ctx: LogContext): LogContext {
  const sanitized: LogContext = {};
  for (const [key, val] of Object.entries(ctx)) {
    // Never log fields likely to contain secrets
    const lk = key.toLowerCase();
    if (lk.includes("secret") || lk.includes("password") || lk.includes("token") || lk.includes("apikey")) {
      sanitized[key] = "[REDACTED]";
      continue;
    }
    sanitized[key] = redact(val);
  }
  return sanitized;
}

function emit(level: LogLevel, feature: string, action: string, context?: LogContext) {
  // Production: only warn + error
  if (!import.meta.env.DEV && level === "info") return;

  const entry = {
    level,
    feature,
    action,
    ts: new Date().toISOString(),
    ...(context ? sanitizeContext(context) : {}),
  };

  switch (level) {
    case "info":
      console.log(`[${feature}] ${action}`, entry);
      break;
    case "warn":
      console.warn(`[${feature}] ${action}`, entry);
      break;
    case "error":
      console.error(`[${feature}] ${action}`, entry);
      break;
  }
}

export function logInfo(feature: string, action: string, context?: LogContext) {
  emit("info", feature, action, context);
}

export function logWarn(feature: string, action: string, context?: LogContext) {
  emit("warn", feature, action, context);
}

export function logError(feature: string, action: string, context?: LogContext) {
  emit("error", feature, action, context);
}
