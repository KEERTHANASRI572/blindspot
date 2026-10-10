# 🚀 BLINDSPOT Production Deployment Guide

BLINDSPOT is live and publicly accessible for hackathon judges, learners, and administrators worldwide.

---

## 🌐 Live URLs

| Service | Platform | Live URL | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | Vercel | [https://blindspot-livid.vercel.app](https://blindspot-livid.vercel.app) | 🟢 Operational |
| **Backend REST API** | Render | [https://blindspot-api-pbim.onrender.com](https://blindspot-api-pbim.onrender.com) | 🟢 Operational |
| **API Documentation** | Swagger / OpenAPI | [https://blindspot-api-pbim.onrender.com/docs](https://blindspot-api-pbim.onrender.com/docs) | 🟢 Operational |
| **Health Check** | Fast Response | [https://blindspot-api-pbim.onrender.com/health](https://blindspot-api-pbim.onrender.com/health) | 🟢 `{"status":"ok"}` |
| **Source Code** | GitHub | [https://github.com/KEERTHANASRI572/blindspot](https://github.com/KEERTHANASRI572/blindspot) | 🟢 Main Branch |

---

## 🎯 Verification & Demonstration for Judges

### 1. Learner Journey
1. Open the [BLINDSPOT Frontend](https://blindspot-livid.vercel.app).
2. Click **"Get Started"** or **"Sign Up"** to create a learner account (e.g. `judge@hackathon.com`).
3. Switch the language freely using the top-right switcher between **English**, **தமிழ் (Tamil)**, and **हिंदी (Hindi)**.
4. Pick any of the 5 built-in core courses:
   - **Physics:** Newton's Laws & Friction in Everyday Motion
   - **Computer Science:** Operating Systems Deadlock & Resource Allocation
   - **Mathematics:** Conditional Probability & Bayes' Rule in Real Life
   - **Chemistry:** Le Chatelier's Principle & Dynamic Equilibrium
   - **Biology:** Cellular Respiration & Osmosis in Living Cells
5. Complete a **Practice** session:
   - Rate confidence before answering (0% – 100%).
   - Experience the 4-step progressive **Hint Ladder**.
   - See the real-time **Confidence Gap** calculation (Overconfident / Calibrated / Underconfident).
6. Explore **Teach a Friend**, **Viva Audio Simulation**, and **Progress History**.

### 2. Administrator Course Management
1. Click **"Admin"** in the top navigation or navigate to `/admin`.
2. Enter the Admin Password configured during deployment.
3. Manage courses with full CRUD lifecycle:
   - **Create Course:** Generate or author courses with 3-language synchronization.
   - **Update / Edit:** Change titles, descriptions, and difficulty.
   - **Cancel / Restore / Delete:** Manage published and archived courses safely.
   - **Class Analytics:** View student score distributions and calibration trends.

---

## 🛠 Architecture & Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, i18next (English, Tamil, Hindi).
- **Backend:** FastAPI (Python 3.11/3.14), SQLAlchemy ORM, Pydantic v2, PyJWT, Passlib (Bcrypt).
- **Database:** PostgreSQL (Neon Cloud) with SQLite local fallback.
- **AI & Evaluation Engines:** Bayesian Knowledge Tracing (BKT), Brier Calibration Math, Socratic Hint Ladder, Dual-Agent Verification.
