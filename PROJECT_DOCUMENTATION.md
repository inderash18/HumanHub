# 📁 HumanHub Technical Dossier

This document provides a complete technical walkthrough of the HumanHub ecosystem, summarizing every "corner" of the system, its architecture, and the recent "Reddit-grade" UI/Logic overhaul.

## 🏗️ 1. System Architecture (The "Triad")

The project is split into three high-performance layers, orchestrated via **Nginx** and **Docker Compose**.

### A. Frontend (client)
- **Framework:** React + Vite + Tailwind CSS.
- **State Management:** `zustand` (Auth, Notifications).
- **UI Paradigm:** Exact Reddit 2024 Aesthetic.
- **Networking:** Axios with standardized interceptors and a robust `baseURL` fallback.

### B. Backend (server)
- **Framework:** Express.js (Node.js).
- **Database:** MongoDB (Models: User, Post, Community, Comment, Vote).
- **Caching/Queuing:** Redis (used for the Moderation job queue).
- **Real-time:** Socket.IO for instant post-verification notifications.

### C. AI Detection (ai_services)
- **Framework:** FastAPI (Python).
- **Core Models:** Transformers (RoBERTa) & PyTorch for text/media analysis.
- **Job:** Asynchronous background scanning of every user post to verify "Humanity".

---

## 🔄 2. The "Humanity" Workflow

The most advanced feature of HumanHub is its **Autonomous Moderation Pipeline**:

1. **Submission:** User posts a message. It is saved as `status: pending`.
2. **Buffering:** Post ID is pushed to the Redis `moderation:queue`.
3. **Detection:** The `moderationWorker` pulls the job and requests a scan from the Python AI service.
4. **Scoring:** The AI returns a probability score (0-1).
5. **Enforcement:** 
   - < 0.3 AI Likelihood → Published immediately.
   - \> 0.8 AI Likelihood → Rejected/Deleted.
   - Intermediate → Flagged for Manual Moderator Review.
6. **Notification:** Socket.IO pushes a `post:verified` event to the client, adding the "Verified Human" badge to the post UI.

---

## 🎨 3. UI Overhaul (Reddit Aesthetic)

We have implemented a **Premium Social UI** that matches Reddit's complexity exactly:

- **Post Cards:** Left-side voting bar, community icons (r/), relative timestamps, and action bars (Share/Save/Comments).
- **Verification Badges:** Dynamic badges (Human ✅, Flagged 🚫, Reviewing 🔍) that change in real-time.
- **Search & Navigation:** Centered Search Pill and a "Reddit Orange" action palette.
- **Error Handling:** Integrated `react-hot-toast` to provide high-quality visual feedback for API errors (e.g., "User already exists").

---

## 🛠️ 4. Resolved Blockers (Maintenance Log)

| Feature | Issue Fixed | Technical Resolution |
| :--- | :--- | :--- |
| **API Pathing** | 404/403 Errors | Fixed Nginx `proxy_pass` trailing slash and removed double `/api` in services. |
| **Feed Stability** | Infinite Loop / Screen Freeze | Stabilized Intersection Observer options in `PostFeed.jsx`. |
| **Auth Feedback** | Silent 400 Errors | Added `Toaster` and corrected `named imports` for toast notifications. |
| **Database** | Atlas IP Blocker | Reverted to local container DB to ensure 100% uptime while Atlas IP Whitelist is pending. |

---

## 🚀 5. How to Continue Development

1. **Local Run:** `docker-compose up -d --build` (Everything is configured to work out-of-the-box).
2. **AI Tuning:** Modify heuristics in `ai_services/main.py`.
3. **DB Swap:** To use your Atlas DB, simply update the `MONGODB_URI` in `docker-compose.yml` once you have whitelisted your IP in the MongoDB Atlas dashboard.
