# Performance Runbook

Use this after deploying the Phase 1-4 backend changes to AWS.

## 1. Smoke check

```bash
cd backend
SMOKE_TARGET_URL=https://your-api-domain.com npm run health:check
```

Expected:
- `/health` returns 200.
- `/ready` returns 200 only when DB and Redis are reachable.
- `/metrics` is skipped unless `METRICS_TOKEN` is provided.

With metrics:

```bash
SMOKE_TARGET_URL=https://your-api-domain.com METRICS_TOKEN=your-token npm run health:check
```

## 2. Safe load test

Start small:

```bash
LOAD_TEST_TARGET_URL=https://your-api-domain.com LOAD_TEST_CONCURRENCY=25 LOAD_TEST_DURATION_SECONDS=60 npm run load:test
```

Then increase gradually:

```bash
LOAD_TEST_TARGET_URL=https://your-api-domain.com LOAD_TEST_CONCURRENCY=50 LOAD_TEST_DURATION_SECONDS=120 npm run load:test
LOAD_TEST_TARGET_URL=https://your-api-domain.com LOAD_TEST_CONCURRENCY=100 LOAD_TEST_DURATION_SECONDS=120 npm run load:test
```

Good result for public browsing traffic:
- Error rate under 1%.
- p95 latency under 1000 ms.
- No sustained memory growth in `/metrics`.
- RDS CPU and connections remain stable.

## 3. Test realistic public endpoints

```bash
LOAD_TEST_TARGET_URL=https://your-api-domain.com \
LOAD_TEST_PATHS="/health,/ready,/api/public/home,/api/restaurants?limit=20,/api/restaurants/search?q=biryani" \
LOAD_TEST_CONCURRENCY=50 \
LOAD_TEST_DURATION_SECONDS=120 \
npm run load:test
```

## 4. Interpret bottlenecks

If p95 latency rises but CPU is low:
- Check RDS connections and slow queries.
- Check Redis latency and connection errors.

If app CPU/RAM is high:
- Lower `DATABASE_CONNECTION_LIMIT` to 6.
- Keep `REQUEST_LOG_SAMPLE_RATE=0`.
- Keep `MEMORY_CACHE_MAX_ENTRIES=500` or lower.

If Redis errors appear:
- Verify ElastiCache security group allows backend access.
- Check `REDIS_URL` and TLS requirements.
- The app should fail open for rate limiting, but cache/socket fanout quality will reduce.

## 5. Suggested 1GB AWS starting values

```env
DATABASE_CONNECTION_LIMIT=8
DATABASE_POOL_TIMEOUT_SECONDS=5
DATABASE_TRANSACTION_MAX_WAIT_MS=3000
DATABASE_TRANSACTION_TIMEOUT_MS=8000
REDIS_CONNECT_TIMEOUT_MS=1500
REDIS_MAX_RECONNECT_RETRIES=5
REDIS_COMMAND_TIMEOUT_MS=1000
REQUEST_LOG_SAMPLE_RATE=0
SLOW_REQUEST_THRESHOLD_MS=500
MEMORY_CACHE_MAX_ENTRIES=500
METRICS_TOKEN=change-this-long-random-token
SERVER_SHUTDOWN_GRACE_MS=25000
HTTP_KEEP_ALIVE_TIMEOUT_MS=65000
HTTP_HEADERS_TIMEOUT_MS=66000
HTTP_REQUEST_TIMEOUT_MS=30000
```