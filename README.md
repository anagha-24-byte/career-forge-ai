# CareerForge AI — Full-Stack Student Placement Platform

> **A production-oriented, AI-powered web platform engineered for engineering students and placement aspirants to audit resumes, diagnose job description gaps, practice Claude-evaluated mock interviews, and track internship applications.**

---

## 🌟 Overview & Key Features

CareerForge AI is a complete full-stack web application designed to bridge the gap between undergraduate computer science coursework and competitive campus placements or internship drives.

### Core Modules:
1. **Passwordless Mobile OTP Authentication**:
   - Secure registration & login using verified phone numbers (defaulting to India `+91`).
   - Integration with **Twilio Verify API** for production SMS dispatch.
   - Built-in secure local development challenge mode displaying simulated OTPs when credentials are absent, preventing developer lock-out.
2. **AI Resume Scoring & ATS Audit**:
   - Upload `.pdf` and `.docx` resumes with client & server-side validation.
   - Text extraction preview before requesting AI analysis.
   - Rubric-based scoring across Projects, Technical Skills, Measurable Impact, Education, and Formatting.
   - ATS readability checklist highlighting parsing blockers.
   - Quantified bullet point rewrites using the Google "X-Y-Z" framework (Accomplished [X] measured by [Y] by doing [Z]).
3. **AI Job Description Matcher**:
   - Compares candidate resume text against target job descriptions.
   - Calculates 0-100 alignment score, matching skills, missing skills, and ATS keyword coverage.
   - Suggests prioritized interview preparation topics.
4. **Skill-Gap Analysis & Personalized Learning Roadmap**:
   - Diagnoses exact skill deficiencies with resume evidence statements.
   - Generates sequenced beginner-to-advanced milestones.
   - Interactive task completion checkboxes with real-time progress percentage recalculation stored in PostgreSQL.
   - Custom task addition support.
5. **Interactive AI Mock Interviews**:
   - Select target role, round type (Technical, HR, Behavioral, Mixed), and difficulty level.
   - One-by-one question delivery.
   - Instant response evaluation scoring clarity, technical depth, and communication.
   - Constructive strengths, areas for improvement, and high-scoring sample answers.
6. **Job Application Tracker**:
   - Track applications across statuses: `Interested`, `Preparing`, `Applied`, `Assessment`, `Interview`, `Offer`, `Rejected`, `Withdrawn`.
   - Automatic deadline warnings (highlighting overdue or approaching dates).
7. **Placement History & PostgreSQL Persistence**:
   - Unified audit ledger for reopening previous analyses, comparisons, roadmaps, and interview sessions.
   - Multi-tenant security with database-level per-user isolation.

---

## 🏗️ Architecture & Technology Stack

```
CareerForge AI Architecture:
┌────────────────────────────────────────────────────────┐
│             React 19 + TypeScript Frontend             │
│   Tailwind CSS v4 • Vite • Recharts • Lucide Icons     │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / JSON (Axios, Cookies)
┌──────────────────────────▼─────────────────────────────┐
│                 FastAPI Python 3.12 Backend            │
│   Pydantic 2 • SQLAlchemy 2.0 • Rate Limiting          │
└────────────┬─────────────────────────────┬─────────────┘
             │                             │
┌────────────▼──────────────┐ ┌────────────▼─────────────┐
│   PostgreSQL 16 Database   │ │    Anthropic Claude     │
│   Alembic Migrations       │ │    Official Python SDK  │
└───────────────────────────┘ └──────────────────────────┘
```

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), React Router v7, Recharts, Lucide Icons, Axios.
- **Backend**: Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2.x, Alembic, Pytest, PyPDF, python-docx.
- **Database**: PostgreSQL 16 (production & Docker) with SQLite fallback for offline local testing.
- **AI Engine**: Anthropic Claude API (`claude-3-5-sonnet-20241022`).
- **SMS Provider**: Twilio Verify API with local development OTP fallback.

---

## 📸 Screenshots

| Placement Dashboard | AI Resume Scoring & ATS Checklist |
| :---: | :---: |
| ![Dashboard Screenshot](docs/screenshots/dashboard.png) *(Live metrics, readiness charts, upcoming deadlines)* | ![Resume Analyzer Screenshot](docs/screenshots/resume_analyzer.png) *(Rubric breakdown, bullet enhancer)* |

| Job Description Matcher | AI Mock Interview |
| :---: | :---: |
| ![Job Match Screenshot](docs/screenshots/job_match.png) *(Semantic skill comparison & keyword gaps)* | ![Mock Interview Screenshot](docs/screenshots/mock_interview.png) *(Question-by-question scoring & sample answers)* |

---

## 💻 Prerequisites (Windows / macOS / Linux)

Before starting, ensure you have the following installed:
1. **Node.js**: Version 20+ or 24+ LTS (`node --version`)
2. **Python**: Version 3.12+ (`python --version`)
3. **npm**: Version 10+ (`npm --version`)
4. **Docker** *(Optional, recommended for PostgreSQL)*: Docker Desktop

---

## ⚙️ Environment Configuration

1. In the project root, duplicate `.env.example` into `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure environment variables in `.env`:
   ```ini
   # Database Configuration (PostgreSQL 16)
   DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/careerforge

   # Security
   SECRET_KEY=generate-a-strong-random-key-here-for-sessions
   FRONTEND_ORIGIN=http://localhost:5173

   # Anthropic Claude API (Optional - Demo mode works if omitted)
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

   # Twilio Verify (Optional - Local dev OTP mode works if omitted)
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid
   ```

> **Note on Demo Fallbacks**:
> - If `ANTHROPIC_API_KEY` is not set, the platform automatically runs in a high-fidelity **Demo Mode** with explicit badges. It will never fail with unhandled errors or pretend a live API call was made.
> - If Twilio credentials are not set, the platform runs in **Development SMS Mode**, displaying the simulated 6-digit OTP code directly in the verification dialog for rapid local testing.

---

## 🚀 Step-by-Step Local Setup

### Step 1: Start PostgreSQL (Docker or Local)
If using Docker Compose:
```bash
docker compose up -d postgres
```
*If you do not have Docker installed, CareerForge AI automatically detects when PostgreSQL is unreachable and seamlessly initializes the local SQLite database `careerforge_dev.db` so you can build and test immediately.*

### Step 2: Set Up Backend & Run Migrations
1. Navigate to the backend directory and install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. Run database migrations with Alembic:
   ```bash
   python -m alembic upgrade head
   ```
3. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
   The backend API will be live at `http://127.0.0.1:8000`. You can explore interactive Swagger documentation at `http://127.0.0.1:8000/api/docs`.

### Step 3: Set Up & Start Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 🧪 Running the Test Suite

The backend includes a comprehensive Pytest test suite covering authentication, file extraction, user isolation, rate limiting, and all domain models.

Run tests from the project root:
```bash
python -m pytest backend/tests -v
```

Expected output:
```
backend/tests/test_applications.py::test_application_crud_lifecycle PASSED
backend/tests/test_auth.py::test_send_otp_success PASSED
backend/tests/test_auth.py::test_verify_otp_success_creates_user PASSED
backend/tests/test_auth.py::test_verify_otp_invalid_code PASSED
backend/tests/test_auth.py::test_returning_user_login PASSED
backend/tests/test_auth.py::test_get_me_unauthenticated_returns_401 PASSED
backend/tests/test_auth.py::test_get_me_authenticated PASSED
backend/tests/test_auth.py::test_logout_revokes_session PASSED
backend/tests/test_dashboard.py::test_dashboard_summary_reflects_actual_db_records PASSED
backend/tests/test_interviews.py::test_mock_interview_flow PASSED
backend/tests/test_job_matches.py::test_create_and_list_job_match PASSED
backend/tests/test_resumes.py::test_upload_resume_docx_success PASSED
backend/tests/test_resumes.py::test_upload_resume_invalid_format_rejected PASSED
backend/tests/test_resumes.py::test_list_resumes PASSED
backend/tests/test_resumes.py::test_analyze_resume_success PASSED
backend/tests/test_resumes.py::test_get_resume_analyses PASSED
backend/tests/test_roadmaps.py::test_generate_and_update_roadmap PASSED
backend/tests/test_user_isolation.py::test_user_b_cannot_access_user_a_resources PASSED
============================= 18 passed in 3.58s ==============================
```

To verify the frontend TypeScript and production bundle:
```bash
cd frontend
npm run build
```

---

## 🛡️ Security & Privacy Engineering

- **No Secrets in Client**: All API keys (Anthropic, Twilio) and JWT/session secrets reside strictly on the server.
- **Untrusted Input Sanitation**: Resumes and job descriptions are treated as untrusted text. They are wrapped in protective tags with strict system instructions preventing prompt injections.
- **Database User Isolation**: Every database query filters by `user_id == current_user.id` to prevent IDOR (Insecure Direct Object Reference) vulnerabilities.
- **Passwordless Session Management**: Uses secure 256-bit cryptographically random tokens stored as SHA-256 hashes in PostgreSQL and transmitted via HttpOnly, SameSite cookies.
- **Rate Limiting**: Sliding-window rate limiters prevent OTP brute-forcing and API abuse.

---

## 🔧 Troubleshooting Common Errors

### 1. `ModuleNotFoundError: No module named 'app'`
Make sure you run python commands from the `backend` folder, or set your `PYTHONPATH`:
```powershell
$env:PYTHONPATH = "d:\Anagha\career forge ai\backend"
```

### 2. `Connection to localhost:5432 failed`
If you haven't started PostgreSQL via Docker or local service, the backend automatically logs an advisory and falls back to `careerforge_dev.db` (SQLite). To use PostgreSQL, ensure Docker Desktop is running and execute:
```bash
docker compose up -d postgres
```

### 3. `File npm.ps1 cannot be loaded because running scripts is disabled`
On Windows PowerShell, use `npm.cmd` instead of `npm`, or adjust execution policy:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## 🚢 Deployment Guidance

- **Frontend**: Can be built (`npm run build`) and deployed to **Vercel**, **Netlify**, or **Cloudflare Pages**. Set `VITE_API_URL` to your production backend domain.
- **Backend**: Can be containerized via the included `backend/Dockerfile` and hosted on **Render**, **Railway**, **Fly.io**, or **AWS ECS**.
- **Database**: Use managed **Supabase**, **Neon Serverless PostgreSQL**, or **AWS RDS PostgreSQL 16**.

---

## 📄 License & Attribution

CareerForge AI is an open-source engineering portfolio project developed by Anagha for engineering internships and campus placements.
Built with ❤️ using FastAPI, React 19, PostgreSQL, and Anthropic Claude AI.
