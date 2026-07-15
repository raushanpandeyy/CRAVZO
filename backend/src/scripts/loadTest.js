import "dotenv/config";

const targetUrl = (process.env.LOAD_TEST_TARGET_URL || process.env.TARGET_URL || "http://localhost:5000").replace(/\/$/, "");
const paths = (process.env.LOAD_TEST_PATHS || "/health,/api/public/home,/api/restaurants?limit=20")
  .split(",")
  .map((path) => path.trim())
  .filter(Boolean);
const concurrency = Math.max(1, Number.parseInt(process.env.LOAD_TEST_CONCURRENCY || "25", 10));
const durationSeconds = Math.max(1, Number.parseInt(process.env.LOAD_TEST_DURATION_SECONDS || "60", 10));
const timeoutMs = Math.max(100, Number.parseInt(process.env.LOAD_TEST_TIMEOUT_MS || "5000", 10));
const method = (process.env.LOAD_TEST_METHOD || "GET").toUpperCase();
const authToken = process.env.LOAD_TEST_TOKEN || "";
const maxLatencySamples = Math.max(1000, Number.parseInt(process.env.LOAD_TEST_MAX_SAMPLES || "200000", 10));

const startedAt = Date.now();
const endsAt = startedAt + durationSeconds * 1000;
const latencies = [];
const statusCounts = new Map();
const errorCounts = new Map();
let completed = 0;
let failed = 0;
let timedOut = 0;

const addCount = (map, key) => map.set(key, (map.get(key) || 0) + 1);

const percentile = (sorted, p) => {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
};

const recordLatency = (value) => {
  if (latencies.length < maxLatencySamples) {
    latencies.push(value);
  }
};

const hit = async (path) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const requestStartedAt = performance.now();

  try {
    const response = await fetch(`${targetUrl}${path}`, {
      method,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      signal: controller.signal,
    });
    const latencyMs = Math.round(performance.now() - requestStartedAt);
    recordLatency(latencyMs);
    addCount(statusCounts, String(response.status));
    completed += 1;
    await response.arrayBuffer().catch(() => null);
  } catch (error) {
    const latencyMs = Math.round(performance.now() - requestStartedAt);
    recordLatency(latencyMs);
    failed += 1;
    if (error.name === "AbortError") timedOut += 1;
    addCount(errorCounts, error.name || "Error");
  } finally {
    clearTimeout(timeout);
  }
};

const worker = async (workerId) => {
  let index = workerId % paths.length;
  while (Date.now() < endsAt) {
    await hit(paths[index]);
    index = (index + 1) % paths.length;
  }
};

console.log(JSON.stringify({
  event: "load-test-started",
  targetUrl,
  paths,
  concurrency,
  durationSeconds,
  timeoutMs,
}, null, 2));

await Promise.all(Array.from({ length: concurrency }, (_, index) => worker(index)));

const elapsedSeconds = (Date.now() - startedAt) / 1000;
const sortedLatencies = [...latencies].sort((a, b) => a - b);
const total = completed + failed;
const statusObject = Object.fromEntries([...statusCounts.entries()].sort(([a], [b]) => a.localeCompare(b)));
const errorObject = Object.fromEntries([...errorCounts.entries()].sort(([a], [b]) => a.localeCompare(b)));
const errorRate = total ? Number(((failed / total) * 100).toFixed(2)) : 0;
const requestsPerSecond = Number((total / elapsedSeconds).toFixed(2));
const successfulRequestsPerSecond = Number((completed / elapsedSeconds).toFixed(2));
const p95 = percentile(sortedLatencies, 95);

const passed = errorRate < 1 && (p95 === null || p95 < 1000);
const summary = {
  targetUrl,
  paths,
  concurrency,
  durationSeconds,
  elapsedSeconds: Number(elapsedSeconds.toFixed(2)),
  totalRequests: total,
  completed,
  failed,
  timedOut,
  requestsPerSecond,
  successfulRequestsPerSecond,
  errorRatePercent: errorRate,
  statusCounts: statusObject,
  errorCounts: errorObject,
  latencyMs: {
    samples: sortedLatencies.length,
    min: sortedLatencies[0] ?? null,
    p50: percentile(sortedLatencies, 50),
    p75: percentile(sortedLatencies, 75),
    p90: percentile(sortedLatencies, 90),
    p95,
    p99: percentile(sortedLatencies, 99),
    max: sortedLatencies[sortedLatencies.length - 1] ?? null,
  },
  passed,
  guidance: passed
    ? "Healthy for this test shape. Increase LOAD_TEST_CONCURRENCY gradually until p95 or errors degrade."
    : "Capacity limit reached for this test shape. Check /metrics, RDS CPU/connections, Redis latency, and app server CPU/RAM.",
};

console.log(JSON.stringify(summary, null, 2));
process.exit(passed ? 0 : 1);