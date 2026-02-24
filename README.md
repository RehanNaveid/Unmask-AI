# Unmask – AI-Powered Candidate Credibility Analyzer

Unmask is a full-stack recruitment assistant that helps HR teams verify the credibility of candidates by cross-checking CVs, LinkedIn exports, and GitHub activity with an LLM-based “council” of models. It surfaces red/yellow flags, verifies projects, and generates structured interview questions so recruiters can make faster, better decisions. [web:442][web:446]

> Tech stack: **Spring Boot + Supabase Postgres + Redis + React (JSX + Tailwind) + JWT Auth + Python/FastAPI LLM Council** 

---

## Features

- **HR authentication & isolation**
  - HR users register and log in with JWT-based auth.
  - Each HR can only see and manage their own candidates (row-level ownership via `hr_user_id`).

- **Candidate ingestion pipeline**
  - Upload CV and optional LinkedIn PDF.
  - Provide GitHub username; backend fetches and caches profile, repos, and events.
  - Supabase Storage buckets for CV and LinkedIn files.
  - GitHub responses cached via Redis to reduce API calls. [web:435]

- **LLM council analysis**
  - FastAPI “council” service orchestrates multiple OpenRouter models.
  - Multi-stage reasoning:
    - Normalizes CV / LinkedIn / GitHub into a fact sheet.
    - Verifies flagship projects against real repositories.
    - Assigns a credibility label and confidence score.
    - Emits red/yellow flags, language alignment, and suggested questions. [web:440][web:454]

- **Modern HR dashboard (React)**
  - JWT-protected SPA built with React Router and Tailwind.
  - Dashboard metrics: total candidates, completed analyses, suspicious vs trusted.
  - Candidate list scoped to the current HR user.
  - One-click access to candidate detail and full analysis.

- **Deep candidate analysis report**
  - Final verdict label and score.
  - Red flags and yellow flags clearly separated.
  - Narrative explanation and recommendation (`human_review`, etc.).
  - Language alignment between CV tech stack and GitHub histogram.
  - Project verification timeline for each key project.
  - Suggested interview questions and consolidated reasons.
  - Top GitHub repositories snapshot when available.

---

## Architecture

- **Backend (Spring Boot)**
  - Spring Boot 3, Spring Security 6, Spring Data JPA. [web:447]
  - JWT authentication for HR users (`hr_users` table).
  - Domain entities: `candidates`, `candidate_facts`, `council_results`, `github_cache`, `job_runs`, `hr_users`.
  - Supabase Postgres as the main relational store. [web:451]
  - Redis (e.g., Upstash) for GitHub API caching.
  - `CouncilService` calls the external FastAPI council over HTTP.

- **LLM Council (FastAPI)**
  - Python + FastAPI microservice.
  - Uses OpenRouter models configured in `config.py`.
  - Exposes `/api/analyze` endpoint which:
    - Accepts `{ cv_json, linkedin_json, github_json }`.
    - Returns a structured analysis JSON consumed by the Spring backend and React frontend.

- **Frontend (React)**
  - React (JSX) + React Router v6.
  - Tailwind CSS for a sleek, glassmorphism-style UI.
  - Auth context storing JWT + HR info.
  - API client attaching `Authorization: Bearer <token>` to all backend calls. [web:438][web:449]

> You can add an architecture diagram image here once available.

---

## Getting Started

### Prerequisites

- Java 21+
- Maven
- Node.js + npm
- Postgres (Supabase instance)
- Redis (Upstash or local)
- Python 3.10+ (for the council service)
- OpenRouter API key (for LLM calls)

### Backend setup (Spring Boot)

1. Configure `application.properties` (or `application.yml`):

```
spring.datasource.url=jdbc:postgresql://<supabase-host>:5432/<db-name>
spring.datasource.username=<db-user>
spring.datasource.password=<db-password>
spring.jpa.hibernate.ddl-auto=update

app.supabase.url=https://<your-supabase-project>.supabase.co
app.supabase.service-key=<supabase-service-role-key>
app.supabase.storage-bucket-cv=cv
app.supabase.storage-bucket-linkedin=linkedin

app.jwt.secret=<your-long-random-secret>
app.jwt.expiration-ms=86400000

upstash.redis.url=<redis-url>
upstash.redis.token=<redis-token>

llm-council.url=http://localhost:8000
```


2. Run the backend:

```
./mvnw spring-boot:run
```
The API will be available at `http://localhost:8080`.

### Council service (FastAPI)

1. In the `council-service` directory:

```
pip install -r requirements.txt
```

2. Configure OpenRouter in `config.py` or via environment variables:

```
OPENROUTER_API_KEY = "sk-or-..." # or read from os.getenv
COUNCIL_MODELS = [
"tngtech/deepseek-r1t2-chimera:free",
"nvidia/nemotron-nano-12b-v2-vl:free",
"tngtech/deepseek-r1t-chimera:free"
]
CHAIRMAN_MODEL = "meta-llama/llama-3.3-70b-instruct:free"
```

3. Run FastAPI:

```
uvicorn app.main:app --reload --port 8000
```

The council endpoint will be at `http://localhost:8000/api/analyze`.

### Frontend (React)

1. In the `frontend` directory:

```
npm install
npm start
```

2. The React app runs on `http://localhost:3000` and calls the backend via `/api/...` routes (configure proxy or full URLs as needed).

---

## Core Flows

### HR Authentication

- **Register**

  `POST /api/auth/register`

```
{
"email": "hr1@example.com
",
"password": "StrongPass123",
"fullName": "HR One",
"company": "Acme Corp",
"position": "Talent Acquisition"
}
```

### Candidate Lifecycle

- **Create candidate**

`POST /api/candidates` (multipart/form-data):

- `name` (text)
- `email` (text)
- `github_username` (text)
- `cv` (file, required)
- `linkedin` (file, optional)

Returns a `CandidateDTO` with `id`, `status`, and basic info. Backend stores files in Supabase and triggers async processing.

- **List candidates for current HR**

`GET /api/candidates`  
Returns a list of `CandidateDTO` objects owned by the logged-in HR.

- **Get candidate detail**

`GET /api/candidates/{id}`  
Returns a `CandidateDTO` with latest facts and council summary (if available).

- **Get full analysis**

`GET /api/candidates/{id}/analysis`  
Returns a `CandidateAnalysisDTO` containing:

- `label`, `score`, `redFlags`, `yellowFlags`
- `explanation`, `recommendation`
- `languageAlignment` (notes, supported/missing languages)
- `suggestedQuestions`
- `consolidatedReasons`
- `projectVerification[]`
- `topRepos[]`

- **Delete candidate**

`DELETE /api/candidates/{id}`  
Deletes the candidate, related facts, council results, and associated files (CV/LinkedIn).

All candidate routes enforce ownership: HRs can only access their own candidates.

---

## UI Overview

<img width="1920" height="1080" alt="Screenshot 2025-12-07 222414" src="https://github.com/user-attachments/assets/cf1f4b2b-c6e1-4163-b920-3ad86e68d088" />
<img width="1920" height="1080" alt="Screenshot 2025-12-07 222429" src="https://github.com/user-attachments/assets/ed356e0d-4be1-433c-8e06-6059ad0424a5" />
<img width="1920" height="1080" alt="Screenshot 2025-12-07 222456" src="https://github.com/user-attachments/assets/3aa02db1-6319-4a5b-b4e2-6e4b3c6a0557" />


HR login form (email + password) with a gradient background and centered glass card.
- **Dashboard** – Metric tiles + candidates table, filters by status, action buttons.
- **New Candidate** – Multi-field upload with a visual pipeline (Upload → Process → Analyze).
- **Candidate Detail** – Core candidate info, file links, snapshot of GitHub facts.
- **Analysis Report** – Rich report showing verdict, flags, language alignment, project verification timeline, suggested questions, and top repos.

---

## Roadmap

- Support job descriptions and role-specific credibility scoring.
- Bulk import of candidates and batched council runs.
- Exportable PDF reports for each candidate.
- Fine-grained access roles (e.g., reviewer vs admin).
- More advanced analytics on candidate pool over time. [web:396][web:405]

---

## Acknowledgements

- Spring Boot & Spring Security community examples for JWT auth. [web:435][web:447]
- OpenRouter and model providers used in the LLM council. [web:440]
- Inspiration from modern HR dashboard and AI-recruitment UI concepts. [web:398][web:408]

