# HumanHub

Welcome to **HumanHub**, a highly scalable, modular, and human-only discussion platform. This repository contains the complete system architecture, folder structure, API logic, frontend app, and AI detection pipeline.

See `ARCHITECTURE.md` (or the generated artifact) for detailed architecture, schemas, and diagrams.

## Quick Start
```bash
docker-compose up -d --build
```
This will launch:
- Next.js Frontend on port 3000
- Express Backend on port 5000
- FastAPI Detection Pipeline on port 8000
- Nginx Gateway on port 80
- Postgres & Mongo & Redis
