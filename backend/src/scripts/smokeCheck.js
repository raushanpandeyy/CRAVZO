import "dotenv/config";

const targetUrl = (process.env.SMOKE_TARGET_URL || process.env.TARGET_URL || "http://localhost:5000").replace(/\/$/, "");
const metricsToken = process.env.METRICS_TOKEN || "";
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 5000);

const checks = [
  { name: "health", path: "/health", required: true },
  { name: "ready", path: "/ready", required: true },
  { name: "metrics", path: "/metrics", required: false, token: metricsToken },
];

const requestJson = async ({ path, token }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${targetUrl}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, body };
  } finally {
    clearTimeout(timeout);
  }
};

let failed = false;
const results = [];

for (const check of checks) {
  if (check.name === "metrics" && !check.token) {
    results.push({ name: check.name, skipped: true, reason: "METRICS_TOKEN not set" });
    continue;
  }

  try {
    const result = await requestJson(check);
    results.push({ name: check.name, path: check.path, ...result });
    if (check.required && !result.ok) failed = true;
  } catch (error) {
    results.push({ name: check.name, path: check.path, ok: false, error: error.message });
    if (check.required) failed = true;
  }
}

console.log(JSON.stringify({ targetUrl, passed: !failed, results }, null, 2));
process.exit(failed ? 1 : 0);