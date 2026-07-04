# DODAGO Backend Monitoring Checklist

## Daily Checks

- Check request logs for repeated `5xx` responses.
- Check `Slow request` logs and review endpoints over `500 ms`.
- Check `Database error` and `Database warning` logs.
- Confirm `/health` returns `200`.
- Confirm Redis connects successfully when `REDIS_URL` is configured.

## During Deployments

- Watch startup logs for environment, Redis, and Prisma errors.
- Hit `/health` after deploy.
- Test one public endpoint, one authenticated endpoint, and one write endpoint.
- Watch logs for validation errors or unexpected server errors.

## When Investigating An Issue

- Search by `requestId` from the API response.
- Compare `method`, `path`, `status`, and `durationMs`.
- Check nearby `Database query`, `Database warning`, and `Database error` logs.
- For slow endpoints, verify pagination, selected fields, and cache hit behavior.

## Alert Candidates

- Any sustained `5xx` rate above normal traffic baseline.
- Any repeated `Database error`.
- Any repeated `Slow request` for the same endpoint.
- `/health` returning non-`200`.
