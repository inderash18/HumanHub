# HumanHub Local Demo Guide: Automatic AI Origin Detection 🤖✨

This guide explains how to run **HumanHub** on your local machine with **automatic real-time AI image detection** using OpenAI's CLIP ViT-L/14 and UniversalFakeDetect (CVPR 2023).

---

## 🏗️ Architecture Overview

In local demo mode, the project runs 3 interconnected services:

```
┌────────────────────────┐      ┌─────────────────────────┐      ┌──────────────────────────┐
│  React + Vite Frontend │ <--> │  Node.js + Express API  │ <--> │  Python AI Microservice  │
│  http://localhost:3000 │      │  http://localhost:5000  │      │  http://localhost:8000   │
└────────────────────────┘      └─────────────────────────┘      └──────────────────────────┘
                                             │                                 │
                                    (MongoDB Atlas + Cloudinary)     (CLIP ViT-L/14 + UnivFD)
```

- **Frontend (`client`)**: React SPA for uploading, viewing feeds, and inspecting AI origin badges.
- **Backend (`server`)**: Express API with native atomic queues and Cloudinary media upload.
- **AI Microservice (`ai_services`)**: FastAPI service running real PyTorch CLIP ViT-L/14 inference.

---

## 🚀 Step-by-Step Setup & Running

Open **3 terminal windows** in `s:\HumanHub`:

### 🔹 Terminal 1: Start the Python AI Service

```powershell
cd s:\HumanHub\ai_services

# 1. Activate virtual environment (if not already activated)
.\venv\Scripts\Activate.ps1

# 2. Run the AI microservice
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```
> **Verification**: Look for `UniversalFakeDetect startup self-test PASSED: CLIP ViT-L/14 (768-dim, normalized) verified.` and visit [http://localhost:8000/health](http://localhost:8000/health).

---

### 🔹 Terminal 2: Start the Backend API

```powershell
cd s:\HumanHub\server

# Run the Node.js backend
npm run dev
```
> **Verification**: Look for `[AI Detection] Connected to AI Service at http://localhost:8000` and visit [http://localhost:5000/health](http://localhost:5000/health).

---

### 🔹 Terminal 3: Start the Frontend Client

```powershell
cd s:\HumanHub\client

# Run the Vite React client
npm run dev
```
> Open your browser at **[http://localhost:3000](http://localhost:3000)**.

---

## 🧪 Testing Image Origin & Detection

### 1. Upload a Real Photograph
- **Expected Label**: `"Likely real image"` or `"Camera capture documented"`
- **Publish Decision**: `ALLOWED` (Instantly publishes to feed)
- **Score**: Low synthetic probability ($\le 0.25$)

### 2. Upload an AI-Generated Image (e.g. Midjourney / DALL-E / Stable Diffusion)
- **Expected Label**: `"Likely AI-generated image"` or `"AI origin documented"`
- **Publish Decision**: `BLOCKED` (Direct publishing blocked; routed to manual review queue)
- **Score**: High synthetic probability ($\ge 0.85$)

### 3. Upload Ambiguous / Unsigned Images
- **Expected Label**: `"Inconclusive, review required"`
- **Publish Decision**: `HELD_FOR_REVIEW` (Option to Save Draft or Request Moderator Review)

---

## 📊 Useful Probes for Demo Presentation

- **AI Service Health**: `GET http://localhost:8000/health`
- **Backend Health**: `GET http://localhost:5000/health`
- **Backend Readiness**: `GET http://localhost:5000/ready`
- **Interactive AI Swagger Docs**: `http://localhost:8000/docs`
