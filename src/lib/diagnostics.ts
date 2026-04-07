/**
 * Production Diagnostics — Lightweight operational metrics collector.
 * 
 * Tracks latency, error rates, and session counts for critical paths.
 * Stored in memory with a rolling window. Accessible via /diagnostics (DEV only).
 */

interface MetricEntry {
  feature: string;
  action: string;
  durationMs?: number;
  success: boolean;
  ts: number;
  meta?: Record<string, unknown>;
}

const MAX_ENTRIES = 200;
let _entries: MetricEntry[] = [];

export function recordMetric(
  feature: string,
  action: string,
  opts: { durationMs?: number; success?: boolean; meta?: Record<string, unknown> } = {}
) {
  _entries.push({
    feature,
    action,
    durationMs: opts.durationMs,
    success: opts.success !== false,
    ts: Date.now(),
    meta: opts.meta,
  });
  if (_entries.length > MAX_ENTRIES) {
    _entries = _entries.slice(-MAX_ENTRIES);
  }
}

/** Convenience: time an async operation and record it */
export async function withMetric<T>(
  feature: string,
  action: string,
  fn: () => Promise<T>,
  meta?: Record<string, unknown>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    recordMetric(feature, action, { durationMs: Math.round(performance.now() - start), success: true, meta });
    return result;
  } catch (err) {
    recordMetric(feature, action, { durationMs: Math.round(performance.now() - start), success: false, meta: { ...meta, error: String(err) } });
    throw err;
  }
}

/** Get summary stats for diagnostics page */
export function getDiagnosticsSummary() {
  const now = Date.now();
  const last5min = _entries.filter(e => now - e.ts < 5 * 60 * 1000);
  const last1h = _entries.filter(e => now - e.ts < 60 * 60 * 1000);

  const summarize = (entries: MetricEntry[]) => {
    const byFeature: Record<string, { total: number; errors: number; avgMs: number }> = {};
    for (const e of entries) {
      if (!byFeature[e.feature]) byFeature[e.feature] = { total: 0, errors: 0, avgMs: 0 };
      byFeature[e.feature].total++;
      if (!e.success) byFeature[e.feature].errors++;
      if (e.durationMs) {
        byFeature[e.feature].avgMs =
          (byFeature[e.feature].avgMs * (byFeature[e.feature].total - 1) + e.durationMs) / byFeature[e.feature].total;
      }
    }
    return byFeature;
  };

  return {
    last5min: summarize(last5min),
    last1h: summarize(last1h),
    recentEntries: _entries.slice(-20),
  };
}

export function getMetricEntries(): MetricEntry[] {
  return [..._entries];
}
