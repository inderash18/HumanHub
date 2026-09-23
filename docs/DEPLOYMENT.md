# HumanHub Deployment & Operations Guide

## 1. Production Architecture & Isolated Networks

HumanHub isolates internal infrastructure services from direct internet exposure. All ingress traffic enters through the Nginx reverse proxy on ports 80/443:

```mermaid
graph LR
    subgraph Public Internet
        Browser[Client Browser]
    end

    subgraph edge_net (Bridge)
        Nginx[Nginx Reverse Proxy :80/:443]
    end

    subgraph app_net (Bridge)
        Frontend[Frontend Web App :3000]
        Backend[Express API :5000]
    end

    subgraph db_net (Internal Bridge - No External Port Exposure)
        Mongo[(MongoDB :27017)]
        Redis[(Redis :6379)]
    end

    subgraph ai_net (Internal Bridge - No External Port Exposure)
        AIService[AI Engine :8000]
    end

    Browser -->|TLS / HTTPS| Nginx
    Nginx --> Frontend
    Nginx --> Backend
    Backend --> Mongo
    Backend --> Redis
    Backend --> AIService
```

---

## 2. Environment Configuration Reference

| Variable | Purpose | Target Service | Requirement | Safe Example / Generation |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment mode | Backend | Required | `production` or `development` |
| `PORT` | Express server port | Backend | Required | `5000` |
| `MONGODB_URI` | MongoDB connection URI | Backend | Required | `mongodb://mongo:27017/humanhub` |
| `REDIS_URL` | Redis connection URI | Backend | Required | `redis://redis:6379` |
| `JWT_SECRET` | 256-bit secret for signing access JWTs | Backend | Required | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET`| Secret for refresh token handling | Backend | Required | `openssl rand -hex 32` |
| `MFA_ENCRYPTION_KEY`| 256-bit AES-GCM key for TOTP secrets | Backend | Required | `openssl rand -hex 32` |
| `ARGON2_MEMORY_COST`| Memory allocation in KiB for Argon2id | Backend | Optional | `65536` (64 MiB) |
| `ARGON2_TIME_COST` | Iteration count for Argon2id | Backend | Optional | `3` |
| `ARGON2_PARALLELISM`| Thread parallelism for Argon2id | Backend | Optional | `4` |
| `FRONTEND_URL` | Trusted origin for CORS and cookies | Backend | Required | `https://humanhub.example.com` |
| `AI_SERVICE_URL` | Internal URL for AI microservice | Backend | Optional | `http://ai_services:8000` |
| `VITE_API_URL` | Client API endpoint path | Frontend | Required | `/api` |
| `VITE_SOCKET_URL` | Client WebSocket connection path | Frontend | Required | `/` |
| `SMTP_HOST` | Outbound mail server hostname | Backend | Optional | `smtp.sendgrid.net` |
| `SMTP_PORT` | Outbound mail server port | Backend | Optional | `587` |
| `SMTP_USER` | SMTP username / API user | Backend | Optional | `apikey` |
| `SMTP_PASS` | SMTP password / API token | Backend | Optional | Configured in deployment |

---

## 3. Production Deployment Procedure

### Step 1: Generate Secrets & Environment File
```bash
# Generate 256-bit cryptographic secrets
export JWT_SECRET=$(openssl rand -hex 32)
export JWT_REFRESH_SECRET=$(openssl rand -hex 32)
export MFA_ENCRYPTION_KEY=$(openssl rand -hex 32)

# Copy and edit production environment
cp .env.example .env.production
```

### Step 2: Configure TLS Certificates
Place valid SSL certificates in the Nginx SSL directory:
* `./nginx/ssl/fullchain.pem`
* `./nginx/ssl/privkey.pem`

### Step 3: Launch Hardened Production Stack
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

---

## 4. Container Hardening Checklist

The production configuration in `docker-compose.prod.yml` applies the following defenses:
* **Dropped Capabilities:** `cap_drop: - ALL` applied across containers, granting only `NET_BIND_SERVICE` where required.
* **No New Privileges:** `security_opt: - no-new-privileges:true` active on all containers.
* **Resource Constraints:** Strict CPU quotas and memory limits (e.g. 1GB for backend, 2GB for AI service, 512MB for Redis) to prevent denial of service from rogue processes.
* **Health Probes:** Active health checks configured on MongoDB, Redis, backend, frontend, and AI services.

---

## 5. Database Operations, Seeding & Backups

### Database Seeding
To populate default communities and initialize system settings:
```bash
npm run seed
```

### Automated Database Backup
```bash
# Create a compressed snapshot of the MongoDB database
docker exec -t $(docker compose ps -q mongo) mongodump --archive=/data/db/backup-$(date +%Y%m%d).gz --gzip
```

### Snapshot Restoration
```bash
# Restore from a compressed snapshot archive
docker exec -i $(docker compose ps -q mongo) mongorestore --drop --gzip --archive=/data/db/backup-<TIMESTAMP>.gz
```
