# Single-server production deploy

This is the low-cost production setup for DODAGO. It runs the backend, Postgres, Valkey/Redis, and HTTPS reverse proxy on one AWS Lightsail/EC2 Ubuntu server. Use Vercel only for the frontend.

## Expected cost

A 2 GB Lightsail/EC2-sized server is a good MVP start. It should usually cost far less than ECS + ALB + RDS + ElastiCache. Keep the old AWS stack running only until this setup is tested.

## What goes where

AWS server `.env`:
- `DATABASE_URL`, `POSTGRES_*`
- `REDIS_URL`
- `JWT_SECRET`
- `GOOGLE_MAPS_API_KEY` server key, restricted by server IP
- `RAZORPAY_KEY_SECRET`
- `CLOUDINARY_API_SECRET`
- `FIREBASE_SERVICE_ACCOUNT_BASE64`
- email/SMS provider secrets

Vercel frontend env:
- frontend API URL, for example `VITE_API_BASE_URL=https://api.dodago.shop`
- Google Maps browser key, restricted by website referrer
- Razorpay public key if frontend uses checkout directly
- Firebase web config / VAPID key if frontend push notification setup needs it

Never put backend secrets like `JWT_SECRET`, `DATABASE_URL`, `RAZORPAY_KEY_SECRET`, Cloudinary secret, or Firebase service account in Vercel frontend variables.

## First server setup

1. Create Ubuntu 22.04/24.04 Lightsail or EC2 instance.
2. Open inbound ports `22`, `80`, and `443` only.
3. Point DNS A record `api.dodago.shop` to the server public IP.
4. SSH into the server and install Docker:

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-plugin git
sudo usermod -aG docker $USER
newgrp docker
```

## Deploy

From the repo root on the server:

```bash
cp deploy/single-server/.env.example deploy/single-server/.env
nano deploy/single-server/.env
```

Fill real values in `.env`. If you change `POSTGRES_PASSWORD`, update the password inside `DATABASE_URL` too.

Start everything:

```bash
docker compose -f deploy/single-server/docker-compose.yml --env-file deploy/single-server/.env up -d --build
```

Check status:

```bash
docker compose -f deploy/single-server/docker-compose.yml --env-file deploy/single-server/.env ps
curl https://api.dodago.shop/health
```

Caddy will automatically issue HTTPS certificates after DNS points to the server and ports `80/443` are open.

## Update frontend

In Vercel, set the frontend API URL to the new backend domain, for example:

```text
VITE_API_BASE_URL=https://api.dodago.shop
```

Then redeploy the frontend.

## Database backup

Create a backup:

```bash
docker compose -f deploy/single-server/docker-compose.yml --env-file deploy/single-server/.env exec -T postgres pg_dump -U dodago dodago > dodago-backup.sql
```

Restore a backup:

```bash
cat dodago-backup.sql | docker compose -f deploy/single-server/docker-compose.yml --env-file deploy/single-server/.env exec -T postgres psql -U dodago dodago
```

## After testing, reduce AWS bill

Do this only after the new backend is working and data is migrated/verified:

1. Set ECS service desired count to `0`.
2. Delete the Application Load Balancer.
3. Delete ElastiCache if Valkey in this compose is being used.
4. Snapshot/export RDS, then delete RDS only after the new Postgres data is confirmed.
5. Release unused public IPv4 / Elastic IP addresses.
6. Keep billing alerts enabled.