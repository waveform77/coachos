# CoachOS — Deployment Guide

## Environments

| Environment | Purpose | Infrastructure |
|---|---|---|
| local | Development | Docker Compose |
| staging | Pre-production testing | VPS / Fly.io |
| production | Live product | VPS / Render / Railway |

---

## Local Development

### Prerequisites
- Docker Desktop 4.x+
- Go 1.22+
- Node.js 20+
- Make

### Quick Start

```bash
# 1. Clone repo
git clone <repo> && cd football-coach-platform

# 2. Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Edit backend/.env (set passwords)

# 4. Start everything
make dev

# 5. Apply migrations + seed
make migrate-up
make seed

# 6. Access
# Frontend: http://localhost:5173
# Backend API: http://localhost:8080
# API Health: http://localhost:8080/health
```

### Docker Compose Services

```yaml
# docker-compose.yml exposes:
# postgres: localhost:5432
# backend:  localhost:8080
# frontend: localhost:5173 (Vite dev server)
```

---

## Docker Compose (Full Stack)

```bash
# Production-like local stack
docker compose up -d

# View logs
docker compose logs -f backend

# Stop
docker compose down

# Reset everything (including volumes)
docker compose down -v
```

---

## Database Migrations

```bash
# Apply all migrations
make migrate-up

# Rollback last migration
make migrate-down

# Create new migration
make migrate-create name=add_player_photos

# Check current version
make migrate-version
```

---

## Deploying to VPS

### Minimal VPS Requirements
- Ubuntu 22.04 LTS
- 2 vCPU, 2GB RAM (для MVP)
- 20GB SSD
- Open ports: 80, 443

### Setup Steps

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER

# 2. Install Caddy (reverse proxy + auto TLS)
apt install caddy

# 3. Copy files to server
scp docker-compose.prod.yml user@server:/opt/coachos/

# 4. Set environment variables
nano /opt/coachos/.env  # production values

# 5. Start
cd /opt/coachos && docker compose -f docker-compose.prod.yml up -d

# 6. Apply migrations
docker compose exec backend ./api migrate-up
```

### Caddyfile (docker/caddy/Caddyfile.prod)

```
api.coachos.dev {
    reverse_proxy backend:8080
}

app.coachos.dev {
    reverse_proxy frontend:3000
    # OR: serve static files
    root * /var/www/coachos
    file_server
}
```

---

## Deploying to Railway

Railway — рекомендуется для диплома (бесплатный tier, CI/CD из коробки).

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Create project
railway init

# 4. Add PostgreSQL
railway add postgresql

# 5. Deploy backend
cd backend && railway up

# 6. Set env vars
railway variables set JWT_SECRET=... DB_HOST=${{PGHOST}} ...

# 7. Deploy frontend
cd frontend && railway up
```

---

## Deploying to Fly.io

```bash
# Install flyctl
brew install flyctl

# Login
fly auth login

# Backend
cd backend
fly launch --name coachos-api
fly deploy

# Frontend (as static site)
cd frontend
npm run build
fly launch --name coachos-app
fly deploy
```

---

## CI/CD — GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: coachos_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: '1.22' }
      - run: cd backend && go test ./...
      - run: cd backend && go build ./cmd/api

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci
      - run: cd frontend && npm test
      - run: cd frontend && npm run build
```

---

## Environment Variables Reference

### Backend

| Variable | Required | Default | Description |
|---|---|---|---|
| APP_ENV | Yes | development | development/staging/production |
| APP_PORT | No | 8080 | HTTP server port |
| APP_NAME | No | coachos-api | Service name for logging |
| JWT_SECRET | Yes | — | ≥32 char secret for HS256 |
| JWT_ACCESS_TTL_MINUTES | No | 15 | Access token TTL |
| JWT_REFRESH_TTL_DAYS | No | 7 | Refresh token TTL |
| DB_HOST | Yes | localhost | PostgreSQL host |
| DB_PORT | No | 5432 | PostgreSQL port |
| DB_USER | Yes | — | PostgreSQL user |
| DB_PASSWORD | Yes | — | PostgreSQL password |
| DB_NAME | Yes | — | PostgreSQL database name |
| DB_SSL_MODE | No | disable | disable/require/verify-full |
| DB_MAX_OPEN_CONNS | No | 25 | Connection pool size |
| DB_MAX_IDLE_CONNS | No | 5 | Idle connections |
| CORS_ORIGINS | No | * | Allowed origins (comma-sep) |
| RATE_LIMIT_MAX | No | 100 | Requests per window |
| AI_PROVIDER | No | mock | mock/openai/anthropic |
| LOG_LEVEL | No | debug | debug/info/warn/error |

### Frontend

| Variable | Required | Default | Description |
|---|---|---|---|
| VITE_API_URL | Yes | http://localhost:8080/api/v1 | Backend API URL |

---

## Health Checks

```bash
# Backend
curl http://localhost:8080/health
# Expected: {"status":"ok","service":"coachos-api","version":"1.0.0"}

# Database connectivity
docker compose exec backend ./api health-db

# Full stack smoke test
make smoke-test
```

---

## Backup & Recovery

```bash
# Backup PostgreSQL
docker compose exec postgres pg_dump -U coachos coachos_db > backup_$(date +%Y%m%d).sql

# Restore
cat backup.sql | docker compose exec -T postgres psql -U coachos coachos_db
```
