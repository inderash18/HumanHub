# Production Deployment & Infrastructure Security

## 1. Production Architecture & Network Topology

In production, all external HTTP(S) and WebSocket connections enter exclusively through Nginx on ports 80/443. All internal services communicate over isolated Docker bridge networks without host port exposure:

```mermaid
graph LR
    subgraph Public Internet
        Browser[Client Browser]
    end

    subgraph edge_net
        Nginx[Nginx Reverse Proxy :80/:443]
    end

    subgraph app_net
        Frontend[Frontend Web App :3000]
        Backend[Express API :5000]
    end

    subgraph db_net (Internal Bridge)
        Mongo[(MongoDB)]
        Redis[(Redis)]
    end

    subgraph ai_net (Internal Bridge)
        AIService[AI Services :8000]
    end

    Browser -->|TLS| Nginx
    Nginx --> Frontend
    Nginx --> Backend
    Backend --> Mongo
    Backend --> Redis
    Backend --> AIService
```

---

## 2. Container Hardening Checklist
* **Non-Root Execution:** All containers run under unprivileged user IDs where possible.
* **Dropped Capabilities:** `cap_drop: - ALL` applied across containers, granting only `NET_BIND_SERVICE` where required.
* **Security Opt:** `no-new-privileges:true` active on all containers to prevent setuid privilege escalation.
* **Resource Bounds:** CPU quotas and memory limits defined in `docker-compose.prod.yml` to prevent denial of service from rogue processes.
* **Health Checks:** Container health probes configured on Redis, Mongo, backend, frontend, and AI services.

---

## 3. Secret Generation & Setup Commands

Before deploying to production, execute the following commands to generate high-entropy secrets:

```bash
# 1. Generate cryptographic secrets
export JWT_SECRET=$(openssl rand -hex 32)
export JWT_REFRESH_SECRET=$(openssl rand -hex 32)
export MFA_ENCRYPTION_KEY=$(openssl rand -hex 32)

# 2. Populate production environment file
cp .env.example .env.production
# Edit .env.production with your exact domain name and SMTP credentials

# 3. Launch hardened production stack
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

---

## 4. Operator Actions Prior to Going Live
1. **External Credential Rotation:** Confirm that any historical API keys or database strings from early repository commits have been revoked and re-issued in provider consoles.
2. **TLS Certificate Installation:** Place valid SSL certificates (`fullchain.pem` and `privkey.pem`) in `./nginx/ssl/`.
3. **Database Backups:** Configure automated snapshot backups for the `mongo_data` volume with encryption-at-rest.
