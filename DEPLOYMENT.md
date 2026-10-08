# HumanHub Production Deployment Architecture & Readiness Guide

**Authoritative Repository Deployment Guide**  
*Stack: React + Vite (Vercel) | Node.js + Express (Render) | MongoDB Atlas (Database & Native Queues) | Cloudinary (Media Storage)*  
*Deployment Architecture: ₹0 Verified Free-Tier Configuration*

---

## 1. Executive Summary & Component Matrix

> [!NOTE]
> - **Cloud Free Deployment (Render + Vercel)**: Operates in Manual Review Mode so the backend runs on Render's 512 MB Free Tier at ₹0 cost.
> - **Local College Project Demo**: Runs real-time automatic PyTorch CLIP ViT-L/14 AI inference locally. See [`LOCAL_DEMO.md`](file:///s:/HumanHub/LOCAL_DEMO.md) for local run instructions.

This guide provides the complete, production-ready blueprint to deploy HumanHub with ₹0 monthly hosting costs.

| Component | Target Platform | Free Tier Limits | Config File | Operational Mode |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend Client** | **Vercel** (Hobby) | 100 GB/mo bandwidth, 6k build mins | [`client/vercel.json`](file:///s:/HumanHub/client/vercel.json) | **Live Edge CDN**: Vite SPA routing, immutable caching headers, zero client secrets. |
| **Backend API & WS**| **Render** (Free Web Service)| 750 free hours/month (Shared workspace pool) | [`render.yaml`](file:///s:/HumanHub/render.yaml) | **Embedded Services**: Auto-sleeps after 15m idle; embedded MongoDB worker loops; `/health` endpoint. |
| **Database & Queues**| **MongoDB Atlas** (M0 Sandbox) | 512 MB storage, shared RAM/vCPU | Server DB config | **Always On**: Multi-AZ replica set. Powers both data persistence and native atomic background queues. |
| **Media Storage** | **Cloudinary** (Free Tier) | 25 Monthly Credits (~25 GB storage / net bandwidth) | Server upload routes | **Direct Cloud Storage**: Files stream to Cloudinary folders (`humanhub/posts`, `humanhub/stories`, `humanhub/avatars`). Zero reliance on Render local disk. |
| **Transactional Email**| **Resend** (Free Tier) | 3,000 emails/month, 100/day | Server mailer utility | **HTTPS REST API**: Bypasses Render's outbound SMTP port blocking. |
| **AI Origin Detection**| Free Deployment Mode | N/A (Manual Review Mode) | Server worker fallback | **Manual Moderation**: On ₹0 cloud tiers, uploads are routed to `HELD_FOR_REVIEW` for admin approval via `/moderation`. CLIP ViT-L/14 (~2.24 GB peak RAM) is skipped on Render Free (512 MB limit). |
| **Redis Cache/Queue**| Skipped / Optional | N/A | Server config fallback | **MongoDB-Native Atomic Queue**: Redis is completely skipped. All queue jobs run via atomic `findOneAndUpdate` with lease timeouts. |

---

## 2. Environment Variables Checklist

### A. Vercel Environment Variables (`client` -> Settings -> Environment Variables)
> [!IMPORTANT]
> Do NOT add Cloudinary, MongoDB, or JWT secrets to Vercel. Frontend only requires public API/Socket endpoints.

| Variable | Required | Example / Recommended Value | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | **Yes** | `https://humanhub-backend.onrender.com/api` | Base URL for REST API calls |
| `VITE_SOCKET_URL` | **Yes** | `https://humanhub-backend.onrender.com` | Base URL for Socket.IO real-time subscriptions |

---

### B. Render Web Service Environment Variables (`server` -> Dashboard -> Environment)

| Variable | Required | Default / Example Value | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Yes** | `production` | Enables production security, CORS, and cookie policies |
| `PORT` | **Yes** | `10000` | Port bound by Express HTTP server |
| `MONGODB_URI` | **Yes** | `mongodb+srv://humanhub_app:<password>@cluster0.mongodb.net/humanhub?retryWrites=true&w=majority` | MongoDB Atlas cluster connection string |
| `JWT_SECRET` | **Yes** | Auto-generated 64-character hex | Signs 15-minute access tokens |
| `JWT_REFRESH_SECRET`| **Yes** | Auto-generated 64-character hex | Signs 7-day session refresh tokens |
| `MFA_ENCRYPTION_KEY`| **Yes** | Auto-generated 64-character hex | AES-256-GCM encryption key for TOTP 2FA secrets |
| `FRONTEND_URL` | **Yes** | `https://humanhub.vercel.app` | Allowed CORS origin and CSRF origin (no trailing slash) |
| `CORS_ORIGIN` | **Yes** | `https://humanhub.vercel.app` | Allowed cross-origin API access |
| `COOKIE_SECURE` | **Yes** | `true` | Enforces HTTPS-only cookie transmission |
| `COOKIE_SAME_SITE` | **Yes** | `none` | Allows cross-domain cookies between Vercel and Render |
| `CLOUDINARY_CLOUD_NAME`| **Yes** | `ojiggrfx` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | **Yes** | `168574571782948` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET`| **Yes** | `RHLtDPwylrd2xybhQQWAM1nPl0Y` | Cloudinary API Secret (kept strictly on server) |
| `RESEND_API_KEY` | Optional | `re_123456789...` | Optional Resend API key for email verification & password reset |
| `EMAIL_FROM` | Optional | `HumanHub <onboarding@resend.dev>` | Sender email header |
| `REDIS_URL` | *Skipped* | *(Leave blank / unset)* | Backend automatically uses native MongoDB atomic queue |
| `AI_SERVICE_URL` | *Skipped* | *(Leave blank / unset)* | Backend automatically routes media to manual moderation |

---

## 3. Step-by-Step Deployment Instructions

### Step 1: MongoDB Atlas Setup
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and deploy an **M0 Free Sandbox Cluster**.
2. Under **Database Access**, create a user `humanhub_app` with a strong random password and `readWrite@humanhub` role.
3. Under **Network Access**, add `0.0.0.0/0` (required due to Render free-tier dynamic egress IPs).
4. Copy the connection string format: `mongodb+srv://humanhub_app:<password>@cluster0.abc.mongodb.net/humanhub?retryWrites=true&w=majority`.

### Step 2: Render Backend Setup (via `render.yaml` or Manual Web Service)
#### Option A: Using Render Blueprints (Recommended)
1. Go to [Render Dashboard](https://dashboard.render.com/) -> Click **New +** -> **Blueprint**.
2. Select your repository `inderash18/HumanHub`. Render will automatically parse [`render.yaml`](file:///s:/HumanHub/render.yaml).
3. Fill in the requested secret parameters (`MONGODB_URI`, `FRONTEND_URL`, `CORS_ORIGIN`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
4. Click **Apply**.

#### Option B: Manual Web Service
1. Click **New +** -> **Web Service**.
2. Select repo `inderash18/HumanHub`.
3. Set **Root Directory**: `server`
4. Set **Runtime**: `Node`
5. Set **Build Command**: `npm install`
6. Set **Start Command**: `npm start`
7. Set **Health Check Path**: `/health`
8. Set **Plan**: `Free`
9. Add the environment variables from Section 2.B.
10. Click **Deploy Web Service** and note your backend URL (e.g., `https://humanhub-backend.onrender.com`).

### Step 3: Vercel Frontend Setup
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) -> Click **Add New...** -> **Project**.
2. Import `inderash18/HumanHub`.
3. Set **Root Directory**: `client`.
4. Framework Preset will detect **Vite**.
5. Set **Build Command**: `npm run build` | **Output Directory**: `dist`.
6. Add Environment Variables:
   - `VITE_API_URL`: `https://humanhub-backend.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://humanhub-backend.onrender.com`
7. Click **Deploy**. Vercel will build the frontend and configure SPA routes via [`client/vercel.json`](file:///s:/HumanHub/client/vercel.json).
8. Copy your production frontend URL (e.g., `https://humanhub.vercel.app`).

### Step 4: Final CORS & Cookie Verification
1. In the **Render Dashboard**, ensure `FRONTEND_URL` and `CORS_ORIGIN` match your exact Vercel production domain (`https://humanhub.vercel.app` without trailing slash).
2. Save changes (triggers automatic redeploy on Render).

---

## 4. Production Architectural Behaviors & Fallbacks

1. **Vite SPA Routing & Assets ([`client/vercel.json`](file:///s:/HumanHub/client/vercel.json))**:
   - `rewrites: [{ "source": "/(.*)", "destination": "/index.html" }]` ensures paths like `/login`, `/register`, `/profile`, `/u/:username`, `/post/:id` load seamlessly upon hard refresh.
   - `/assets/(.*)` are served with `Cache-Control: public, max-age=31536000, immutable`.

2. **Persistent Cloud Media (Cloudinary)**:
   - Media uploaded through `/api/uploads` is streamed to Cloudinary folders: `humanhub/posts`, `humanhub/stories`, and `humanhub/avatars`.
   - The ephemeral Render container filesystem is never used for permanent media. In production (`NODE_ENV=production`), temporary multer buffer files are immediately deleted.
   - Deleting a post or story triggers automatic asset deletion from Cloudinary.

3. **Zero-Redis Atomic Queuing**:
   - The backend runs background queues directly in MongoDB using atomic `findOneAndUpdate` operations on `MediaAnalysis` and `ModerationJob` collections.
   - Stale running jobs (e.g. if the free Render service spun down) are recovered automatically using lease timeout thresholds.

4. **Free-Tier AI Fallback**:
   - Without a paid GPU/CPU compute space for CLIP ViT-L/14, `AI_SERVICE_URL` is omitted.
   - Uploaded media is assigned `HELD_FOR_REVIEW` and safely routed to the admin moderation queue (`/moderation`), preventing fake detection errors or server OOM failures.

---

## 5. Verification & Health Probes

- **Liveness Probe**: `GET https://<backend-url>/health`  
  Returns `{"status":"healthy","service":"humanhub-backend"}` (HTTP 200).
- **Readiness Probe**: `GET https://<backend-url>/ready`  
  Returns `{"ready":true,"database":"connected"}` (HTTP 200).
