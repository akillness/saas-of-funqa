// In-memory counters (resets on restart — acceptable for v1)
interface RequestRecord {
  latencyMs: number;
  tokensUsed: number;
  error: boolean;
  timestamp: number;
}

const records: RequestRecord[] = [];
const MAX_RECORDS = 10_000; // rolling window

export function recordRequest(latencyMs: number, tokensUsed: number, error = false): void {
  records.push({ latencyMs, tokensUsed, error, timestamp: Date.now() });
  if (records.length > MAX_RECORDS) records.shift();
}

export function getMonitoringSummary() {
  const now = Date.now();
  const day = records.filter(r => now - r.timestamp < 86_400_000);
  const week = records.filter(r => now - r.timestamp < 604_800_000);

  const successRate = day.length > 0
    ? day.filter(r => !r.error).length / day.length
    : 1.0;

  const sortedLatency = [...day].map(r => r.latencyMs).sort((a, b) => a - b);
  const p95 = sortedLatency.length > 0
    ? sortedLatency[Math.floor(sortedLatency.length * 0.95)]
    : 0;

  const totalTokens = day.reduce((s, r) => s + r.tokensUsed, 0);
  // Gemini pricing ~$0.00015 per 1K tokens (approximate)
  const dailyCostUsd = (totalTokens / 1000) * 0.00015;

  return {
    dailyCostUsd: Math.round(dailyCostUsd * 100) / 100,
    activeUsers: day.length, // proxy: requests today as active session count
    successRate: Math.round(successRate * 1000) / 1000,
    p95LatencyMs: Math.round(p95),
    totalRequestsDay: day.length,
    totalRequestsWeek: week.length,
    totalTokensDay: totalTokens,
  };
}
