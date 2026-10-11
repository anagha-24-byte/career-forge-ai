# CareerForge AI — REST API Documentation

The CareerForge AI backend is built with FastAPI and runs at `http://localhost:8000`.
Interactive OpenAPI documentation is automatically available at:
- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc: `http://localhost:8000/api/redoc`
- OpenAPI JSON: `http://localhost:8000/api/openapi.json`

---

## 1. Authentication (`/api/auth`)

All state-changing authenticated requests use secure HttpOnly session cookies (`careerforge_session`) or Bearer tokens.

### `POST /api/auth/send-otp`
Sends an SMS OTP challenge or generates a secure development OTP challenge when SMS credentials are not configured.

- **Request Body**:
  ```json
  {
    "name": "Anagha Sharma",
    "phone_country_code": "+91",
    "phone_number": "9876543210"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "message": "Dev mode: Verification code generated for +919876543210",
    "phone_number": "+919876543210",
    "expires_in_seconds": 300,
    "dev_mode": true,
    "dev_otp": "123456"
  }
  ```

### `POST /api/auth/verify-otp`
Verifies the submitted 6-digit OTP, creates or retrieves the user record, and issues an authenticated session.

- **Request Body**:
  ```json
  {
    "phone_country_code": "+91",
    "phone_number": "9876543210",
    "otp_code": "123456"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "message": "Authentication successful.",
    "user": {
      "id": "uuid",
      "name": "Anagha Sharma",
      "phone_country_code": "+91",
      "phone_number": "9876543210",
      "target_role": "Software Engineering Intern",
      "experience_level": "Second Year Student",
      "created_at": "2026-10-11T12:00:00Z"
    },
    "access_token": "token-string",
    "token_type": "bearer",
    "is_new_user": false
  }
  ```

### `POST /api/auth/logout`
Revokes active session tokens and clears the session cookie.

### `GET /api/auth/me`
Returns the currently authenticated user's profile.

---

## 2. Resumes (`/api/resumes`)

### `POST /api/resumes`
Uploads a `.pdf` or `.docx` resume (up to 5MB) and extracts plain text.
- **Form Data**: `file: <binary document>`

### `GET /api/resumes`
Lists all uploaded resumes for the authenticated user.

### `GET /api/resumes/{resume_id}`
Retrieves a specific resume document.

### `DELETE /api/resumes/{resume_id}`
Deletes the resume document and cascades deletion to all associated analyses.

### `POST /api/resumes/{resume_id}/analyze`
Analyzes resume text using Anthropic Claude API (or labelled demo fallback).
- **Request Body**:
  ```json
  {
    "target_role": "Backend Engineer Intern"
  }
  ```
- **Response includes**:
  - `overall_score`: 0-100
  - `summary`: string
  - `rubric_breakdown`: Category scores, strengths, and improvement suggestions
  - `ats_readability`: Checklist of ATS parsing checks
  - `weak_bullet_points`: Original vague bullets vs improved high-impact rewrites with quantifiable metrics
  - `priority_recommendations`: Action items

### `GET /api/resumes/{resume_id}/analyses`
Returns all prior evaluations for that specific document.

---

## 3. Job Matching (`/api/job-matches`)

### `POST /api/job-matches`
Compares candidate resume qualifications against a target job description.
- **Request Body**:
  ```json
  {
    "job_title": "SDE Intern",
    "company_name": "Microsoft",
    "job_description": "We are seeking...",
    "resume_id": "optional-uuid"
  }
  ```

### `GET /api/job-matches`
Lists all saved job comparisons.

### `DELETE /api/job-matches/{match_id}`
Deletes a job match record.

---

## 4. Roadmaps (`/api/roadmaps`)

### `POST /api/roadmaps`
Generates a personalized skill-gap diagnostic and structured learning roadmap.

### `GET /api/roadmaps/latest`
Retrieves the user's latest roadmap.

### `PATCH /api/roadmap-tasks/{task_id}`
Toggles task `is_completed: boolean` and updates task details. Automatically recalculates roadmap completion %.

### `POST /api/roadmaps/{roadmap_id}/tasks`
Adds a custom student task to the roadmap.

---

## 5. Mock Interviews (`/api/interviews`)

### `POST /api/interviews`
Generates role-specific interview questions.
- **Request Body**:
  ```json
  {
    "target_role": "Backend Developer",
    "interview_type": "technical",
    "difficulty": "intermediate",
    "question_count": 3
  }
  ```

### `POST /api/interviews/{interview_id}/answers`
Submits student's response to the current question, receiving AI rubric feedback.

### `POST /api/interviews/{interview_id}/complete`
Calculates final session score across clarity, depth, and communication.

---

## 6. Applications & Dashboard (`/api/applications`, `/api/dashboard`)

### `POST /api/applications`, `GET /api/applications`, `PATCH /api/applications/{id}`, `DELETE /api/applications/{id}`
Full CRUD lifecycle for internship applications with deadline tracking.

### `GET /api/dashboard/summary`
Calculates live database statistics for the authenticated user:
- Resume score
- Job match score
- Roadmap progress percentage
- Mock interview average
- Active applications count
- Upcoming deadlines
- Recent activity timeline
