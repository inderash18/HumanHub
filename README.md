# 🌐 HumanHub

> **Human-Only Social Platform** backed by an autonomous AI detection pipeline to combat bot farms, AI-generated spam, and deepfakes with real-time "Proof of Humanity" verification.

---

## 🗺️ Project Structure

```text
HumanHub/
├── 📁 client/                # React 18 + Vite + Tailwind CSS Frontend
│   ├── 📁 src/
│   │   ├── 📁 components/    # Reusable Reddit-style UI & layout components
│   │   ├── 📁 pages/         # Feed, Communities, Reels, Messages, Mod Dashboard, etc.
│   │   ├── 📁 store/         # Zustand state management (Auth, UI)
│   │   ├── 📁 hooks/         # Custom hooks (Socket.io, API data)
│   │   └── 📁 services/      # Axios API clients
│   ├── 📄 package.json
│   └── 📄 .env.example
│
├── 📁 server/                # Node.js + Express.js API & Moderation Backend
│   ├── 📁 config/            # MongoDB & Redis connection managers
│   ├── 📁 controllers/       # Auth, Posts, Comments, Communities, Messages
│   ├── 📁 middleware/        # JWT Auth, Rate Limiter, Error Handlers
│   ├── 📁 models/            # Mongoose models (User, Post, Community, Comment, etc.)
│   ├── 📁 routes/            # REST API endpoints (/api/posts, /api/auth, etc.)
│   ├── 📁 scripts/           # Database seeding & diagnostics scripts
│   ├── 📁 services/          # AI Service integration & Cloudinary helpers
│   ├── 📁 socket/            # Real-time WebSocket event broadcaster
│   ├── 📁 workers/           # Asynchronous moderation queue consumer
│   ├── 📄 server.js          # Main entrypoint
│   ├── 📄 package.json
│   └── 📄 .env.example
│
├── 📁 ai_services/           # FastAPI Python AI Detection Microservice
│   ├── 📄 main.py            # Text, media, and behavioral scoring endpoints
│   ├── 📄 requirements.txt   # PyTorch, Transformers, FastAPI dependencies
│   └── 📄 .env.example
│
├── 📁 detection_platform/    # (Advanced) 12-Microservice Detection Pipeline Mesh
│   ├── 📁 services/          # Orchestrator, Text, Image, Audio, Behavior engines
│   └── 📄 docker-compose.yml
│
├── 📁 nginx/                 # Reverse proxy configuration
│   └── 📄 nginx.conf         # Unified gateway for API, WebSockets, and SPA
│
├── 📄 docker-compose.yml     # Production-ready stack orchestration
├── 📄 docker-compose.unified.yml # Advanced 12-layer detection pipeline stack
├── 📄 package.json           # Root workspace management scripts
└── 📄 README.md              # Project documentation
```

---

## ⚡ Quick Start

### 1. Local Native Run (Fastest for Development)

#### Install Dependencies
```bash
npm run install:all
```

#### Run All Services (in separate terminals)

* **Terminal 1: AI Detection Service (FastAPI)**
  ```bash
  cd ai_services
  pip install -r requirements.txt
  python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
  ```

* **Terminal 2: Express Backend Server**
  ```bash
  npm run dev:server
  ```

* **Terminal 3: React Frontend Client**
  ```bash
  npm run dev:client
  ```

*Open [http://localhost:3000](http://localhost:3000) in your browser.*

---

### 2. Docker Compose (Full Stack Orchestration)

If you have Docker installed, start all services (Client, Server, AI Service, Nginx, MongoDB, Redis, PostgreSQL) with:

```bash
npm run docker:up
```

To stop containers:
```bash
npm run docker:down
```

---

## 🛠️ Handy Workspace Commands

| Command | Action |
| :--- | :--- |
| `npm run dev:client` | Start the Vite frontend dev server |
| `npm run dev:server` | Start the Express backend with nodemon |
| `npm run dev:ai` | Start the FastAPI AI detection microservice |
| `npm run seed` | Seed default communities (`Technology`, `Science`, `Creativity`, etc.) and system admin |
| `npm run debug:db` | Print database diagnostics and record counts |
| `npm run docker:up` | Build and start containerized stack |
| `npm run docker:down` | Stop running containers |
| `npm run docker:unified` | Start the full 12-service AI detection mesh |

---

## 🔄 Content Verification Pipeline

1. **Submit**: A user creates a post &rarr; saved in MongoDB with `status: pending`.
2. **Buffer**: Post payload is pushed to Redis `moderation:queue`.
3. **Analyze**: The background `moderationWorker` pulls the job and sends text/media to the AI microservice (`/analyze/text`, `/analyze/media`, `/analyze/behavior`).
4. **Decision Engine**: Post status is evaluated:
   * `< 0.30` AI likelihood &rarr; `status: published`
   * `> 0.80` AI likelihood &rarr; `status: rejected`
   * Intermediate &rarr; `status: pending` (flagged for human moderator review)
5. **Live Update**: Socket.IO broadcasts `post:verified` to the author's client to render the "Verified Human ✅" badge immediately.
