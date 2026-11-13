# Phase 1.3 — Dockerize and Validate the Application Locally

## 1. Objective

Containerize the existing AA007 Lead Follow-up Prioritization Intelligence application and validate its end-to-end operation in a local Docker environment.

The existing deterministic business rules and five-agent workflow remain unchanged.

## 2. Application Architecture

| Component | Technology | Port |
|---|---|---:|
| Backend | Python, FastAPI, Uvicorn | 8000 |
| Frontend | React, Vite, TypeScript | 5173 |

Frontend: http://127.0.0.1:5173

Backend: http://127.0.0.1:8000

Health endpoint: http://127.0.0.1:8000/health

API documentation: http://127.0.0.1:8000/docs

## 3. Docker Configuration

The following files were created:

- backend/Dockerfile
- frontend/Dockerfile
- compose.yaml
- .dockerignore
- frontend/.dockerignore

Docker Compose manages both services. The backend has a health check, and frontend startup depends on backend health.

## 4. Docker Commands

Run from the project root.

Build images:

    docker compose build

Start services:

    docker compose up -d

Check containers:

    docker compose ps

View backend logs:

    docker compose logs --tail 40 backend

View frontend logs:

    docker compose logs --tail 40 frontend

Stop services:

    docker compose down

## 5. Validation Results

### Docker build

Both backend and frontend images built successfully.

### Container startup

Both containers started successfully:

- aa007-backend — Healthy
- aa007-frontend — Running

### Backend health

The health endpoint returned:

    {
      "status": "healthy",
      "service": "AA007 Backend"
    }

### Lead API

The /leads endpoint returned three demonstration leads:

- AA007-HOT-001
- AA007-WARM-001
- AA007-STALE-001

### End-to-end workflow

The HOT lead scenario was executed successfully through the Docker-hosted frontend.

- Lead ID: AA007-HOT-001
- Recommendation: FOLLOW_UP_NOW
- Triggered rule: AA007-RULE-02
- Reason: A committed follow-up is overdue.
- Workflow errors: 0

### Five-agent execution sequence

1. Lead Intake Agent
2. Recency Agent
3. Engagement Agent
4. Fit & SLA Agent
5. Lead Priority Decision Agent

The workflow collected 14 evidence entries and returned an audit record successfully.

Audit reference:

    AUDIT-AA007-C9BB872972EC

The audit record confirmed the recommendation, triggered rule, execution sequence, agent statuses, and empty error list.

## 6. Automated Tests

The backend test suite was executed locally:

    .\.venv\Scripts\python.exe -m pytest tests -q

Result:

    13 passed, 1 warning

The warning was a non-blocking Starlette deprecation warning.

The tests directory is not copied into the backend Docker image. Therefore, the tests were run locally, not inside the container.

## 7. Persistence

The application uses demonstration lead data.

The audit store is in memory. Audit records are cleared when the backend process restarts. No persistent database or Docker volume was introduced in this phase.

## 8. Troubleshooting

If the frontend cannot connect to the backend:

    docker compose ps

Check backend logs:

    docker compose logs --tail 40 backend

Use the exact frontend URL:

    http://127.0.0.1:5173

The browser-facing API address is:

    http://127.0.0.1:8000

If the backend is unhealthy, check:

    Invoke-RestMethod "http://127.0.0.1:8000/health"

## 9. Completion Summary

The application was successfully containerized and validated locally.

Validation confirmed:

- Successful backend and frontend image builds.
- Successful startup of both containers.
- Healthy backend service.
- Frontend-to-backend communication.
- Successful retrieval of demonstration leads.
- Successful five-agent workflow execution.
- Correct HOT lead recommendation and decision rule.
- Successful audit record retrieval.
- Thirteen backend tests passing locally.

The Docker-hosted application preserved the existing deterministic workflow behavior.

## 10. Evidence

Store Phase 1.3 screenshots in:

    docs/phase1.3-evidence/

Recommended screenshots:

1. Docker containers showing backend healthy and frontend running.
2. Application dashboard.
3. HOT lead workflow result.
4. Five-agent execution trace.
5. Audit record.
