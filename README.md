# AA007 — Lead Follow-up Prioritization Intelligence

**Agentic AI MVP | RealRails Agentic AI Internship | Phase 1.4 — Cloud Deployment & Phase 1 Completion**

## 1. Project Overview

AA007 is a deterministic, multi-agent lead follow-up prioritization system. It evaluates business lead information, contact recency, engagement activity, declared fit and follow-up commitments to recommend the next appropriate action.

The application helps sales operations teams understand which leads need immediate attention, which should receive follow-up soon, and which can be nurtured.

## 2. Project Objectives

- Evaluate business lead records using specialized agents.
- Execute agents in a defined sequence.
- Share information through a run-scoped shared workflow context.
- Apply deterministic decision rules.
- Generate recommendations with supporting reasons and evidence.
- Record and retrieve workflow audit information.
- Explain the decision-making process through a user-friendly interface.

## 3. Technology Stack

| Component | Technology |
|---|---|
| Backend | Python, FastAPI |
| Frontend | React, Vite, TypeScript |
| Styling | CSS |
| Data validation | Pydantic |
| Testing | Pytest |
| Version control | Git, GitHub |
| Codebase snapshot | Repomix |

## 4. Workflow Architecture

The application follows this sequence:

**Business Input → Context Builder → Run-Scoped Shared Workflow Context → Five Specialized Agents → Rules and Evidence → Final Recommendation → Explanation and Audit**

Each workflow execution creates its own context. Agents contribute their outputs and evidence to that execution.

The context is run-scoped and is not permanent memory.

## 5. Five Specialized Agents

| Order | Agent | Responsibility |
|---|---|---|
| 1 | Lead Intake Agent | Checks essential lead information and validates intake details. |
| 2 | Recency Agent | Evaluates lead age and how recently the lead was contacted. |
| 3 | Engagement Agent | Evaluates recorded engagement events. |
| 4 | Fit & SLA Agent | Evaluates declared fit and follow-up commitment status. |
| 5 | Lead Priority Decision Agent | Combines agent results and applies deterministic decision rules. |

## 6. Decision Outcomes

The workflow produces one of four recommendations:

- `FOLLOW_UP_NOW` — Immediate follow-up is required.
- `FOLLOW_UP_SOON` — Follow-up should be scheduled soon.
- `NURTURE` — Continue nurturing the lead rather than prioritizing immediate follow-up.
- `REQUEST_DATA` — Request missing mandatory information.

## 7. Deterministic Decision Rules

| Rule | Condition | Recommendation |
|---|---|---|
| AA007-RULE-01 | Mandatory lead information is missing | REQUEST_DATA |
| AA007-RULE-02 | A committed follow-up is overdue | FOLLOW_UP_NOW |
| AA007-RULE-03 | High fit, recent contact and high or moderate engagement | FOLLOW_UP_NOW |
| AA007-RULE-04 | Stale contact and low engagement | NURTURE |
| AA007-RULE-05 | Default decision when no earlier rule applies | FOLLOW_UP_SOON |

## 8. Sample Scenarios

| Sample Lead | Scenario | Expected Outcome |
|---|---|---|
| AA007-HOT-001 | Overdue committed follow-up | FOLLOW_UP_NOW |
| AA007-WARM-001 | Moderate fit and recent engagement | FOLLOW_UP_SOON |
| AA007-STALE-001 | Stale contact and no engagement | NURTURE |

These sample scenarios demonstrate the different decision paths.

## 9. Explainability and Audit

The frontend displays:

- Business lead information.
- Workflow architecture.
- Agent execution order and responsibilities.
- Important inputs for each agent.
- Structured agent outputs.
- Collected evidence.
- Triggered decision rules.
- Final recommendation and reasoning.
- Workflow ID and audit reference.

The audit endpoint retrieves the stored execution record, including its timestamp, agent sequence, outputs, triggered rules and recommendation.

**Audit storage limitation:** Records are currently held in backend memory and are cleared when the backend process restarts. This MVP does not use persistent audit storage.

## 10. Project Structure

```text
AA007-Lead-Followup-Intelligence/
|
|-- backend/
|   |-- app/
|   |   |-- agents/
|   |   |-- core/
|   |   |-- data/
|   |   |-- models/
|   |   |-- services/
|   |   |-- main.py
|   |-- tests/
|   |-- requirements.txt
|
|-- frontend/
|   |-- src/
|   |   |-- App.tsx
|   |   |-- App.css
|   |   |-- api.ts
|   |-- package.json
|
|-- AA007-Repomix.xml
|-- README.md
```

## 11. Running the Application

### Backend setup

Open PowerShell in the project root:

```powershell
python -m venv backend/.venv

.\backend\.venv\Scripts\Activate.ps1

pip install -r backend/requirements.txt
```

Start the backend:

```powershell
python -m uvicorn app.main:app --app-dir backend --reload
```

Backend URL:

http://127.0.0.1:8000

API documentation:

http://127.0.0.1:8000/docs

### Frontend setup

Open a second terminal:

```powershell
cd frontend

npm.cmd install

npm.cmd run dev -- --host 127.0.0.1
```

Frontend URL:

http://127.0.0.1:5173

## 12. API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Backend welcome information |
| GET | `/health` | Backend health check |
| GET | `/leads` | Retrieve sample leads |
| POST | `/workflow/run` | Execute the five-agent workflow |
| GET | `/audit/{audit_reference}` | Retrieve a workflow audit record |

## 13. Testing

Run the backend test suite from the project root:

```powershell
.\backend\.venv\Scripts\python.exe -m pytest -q
```

Frontend production build:

```powershell
cd frontend

npm.cmd run build
```

### Verified development results

- Backend tests: 13 passed.
- Frontend TypeScript compilation: passed.
- Vite production build: passed.
- HOT, WARM and STALE sample scenarios: passed.
- Audit record retrieval: demonstrated successfully.

## 14. Scope and Limitations

This project is a deterministic MVP.

- Agent decisions use implemented Python logic and rules.
- Workflow context is limited to an individual execution.
- Audit records are stored in memory.
- The project does not claim persistent database storage or permanent memory.

## 15. Cloud Deployment — Phase 1.4

The application is deployed on Render.

| Component | URL |
|---|---|
| Frontend Application | https://aa007-lead-followup-intelligence.onrender.com/ |
| Backend Health Endpoint | https://aa007-backend-vd1y.onrender.com/health |

### Deployment Validation

The Phase 1.4 deployment was reviewed and accepted by the RealRails maintainer.

Validated deployment capabilities:

- Public Render frontend availability.
- Backend health endpoint availability.
- Frontend-to-backend communication.
- Sample lead loading.
- Execution of all five deterministic agents.
- Correct recommendation generation.
- Explanation and supporting evidence.
- Audit record retrieval.
- Workflow completion without errors.
- No LangGraph or LLM introduced during Phase 1.

### Phase 1.4 Deployment Commit

`b9a8e2e324876515b2b8edae8e41502ac4e05737`

## 16. Repository

GitHub:

https://github.com/dhanushacherian/AA007-Lead-Followup-Intelligence

**Project status:** Phase 1.4 implementation accepted. Final repository documentation and Repomix cleanup complete the Phase 1 closure requirements.

---

**AA007 — Lead Follow-up Prioritization Intelligence**

*Explainable deterministic multi-agent workflow for sales lead prioritization.*