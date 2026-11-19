# AA007 — Lead Follow-up Prioritization Intelligence

**Agentic AI MVP | RealRails Agentic AI Internship | Phase 1.4 — Cloud Deployment | Phase 2.1 — LangGraph Linear Orchestration**

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

The application uses a **linear LangGraph StateGraph** to orchestrate the existing deterministic lead-prioritization workflow.

Execution follows this sequence:

**START → Initialize Context → Lead Intake → Recency → Engagement → Fit & SLA → Decision → Finalize → END**

The graph contains seven execution nodes:
- `initialize_context` — creates the run-scoped workflow context.
- `lead_intake` — validates the lead information.
- `recency` — evaluates the last contact date.
- `engagement` — evaluates engagement activity.
- `fit_sla` — evaluates lead fit and follow-up SLA.
- `decision` — applies the existing deterministic business rules.
- `finalize` — prepares the response and records the audit information.

The five existing agents and their deterministic business rules are preserved. Graph execution events are recorded in the audit trace.

The context remains run-scoped and is not permanent memory.
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

- Backend tests: 16 passed in the latest Phase 2.2 validation.
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

### Final Repository Cleanup Commit

```text
4af85737a0d5c7b2ad4718f346a83255e899be3f
```

## 16. Repository

GitHub:

https://github.com/dhanushacherian/AA007-Lead-Followup-Intelligence

**Project status:** Phase 1.4 implementation accepted. Final repository documentation and Repomix cleanup complete the Phase 1 closure requirements.

---

**AA007 — Lead Follow-up Prioritization Intelligence**

*Explainable deterministic multi-agent workflow for sales lead prioritization.*

## 16. Phase 2.1 — LangGraph Linear Orchestration

Phase 2.1 evolves the existing Phase 1 deterministic workflow into a linear LangGraph orchestration.

### Implementation

- Introduced a shared LangGraph state for workflow execution.
- Converted the existing workflow steps into seven linear graph nodes.
- Preserved all five existing agents and deterministic decision rules.
- Preserved the existing API response contract and recommendation behavior.
- Added graph execution tracing with node start and completion events.
- Extended audit records to include the graph execution trace.
- Updated the frontend architecture explanation to reflect LangGraph orchestration.

### Validation

- LangGraph graph compilation and execution verified.
- HOT, WARM and STALE lead scenarios tested.
- Expected deterministic recommendations preserved.
- Backend tests: 15 passed.
- Frontend production build: passed.
- Updated Repomix snapshot: `AA007-Repomix.xml`.

### Phase 2.1 Git Commit

`ca050826837201dd7f003fe3b68cde8c993f83ad`

**Project status:** Phase 1.4 deployment documentation retained. Phase 2.1 LangGraph linear orchestration implemented and committed.
## 17. Phase 2.2 — Meaningful Conditional Routing

Phase 2.2 extends the LangGraph workflow with deterministic conditional routing based on the existing decision-agent recommendations.

### Conditional routes

| Business condition | Recommendation | Graph route |
|---|---|---|
| Missing mandatory lead information | REQUEST_DATA | route_request_data |
| Committed follow-up overdue | FOLLOW_UP_NOW | route_follow_up_now |
| High fit, recent contact and high or moderate engagement | FOLLOW_UP_NOW | route_follow_up_now |
| Stale contact and low engagement | NURTURE | route_nurture |
| No earlier rule matched | FOLLOW_UP_SOON | route_follow_up_soon |

### Implementation

- Preserved the five existing specialized agents and their deterministic decision rules.
- Added four conditional route nodes after the decision node.
- Connected each route to the shared finalize node.
- Recorded route start and completion events in the graph execution trace and audit record.
- Preserved the existing workflow response and audit retrieval behavior.
- Did not introduce random routing or invent weighted-score thresholds.

### Latest validation

- Backend tests: 16 passed.
- Frontend TypeScript compilation: passed.
- Vite production build: passed.
- All four conditional routes verified by automated tests.
- Repomix snapshot regenerated: `AA007-Repomix.xml`.
- Repomix security check: no suspicious files detected.

**Project status:** Phase 2.2 conditional routing implemented and committed. All four conditional routes passed automated testing. Live NURTURE route execution and audit retrieval were successfully demonstrated. Backend tests, frontend compilation, production build and Repomix validation passed.

---

## 18. Phase 2.3 - Controlled LLM Enhancement

Phase 2.3 introduces an optional LLM enhancement for sales-note summarization and intent tagging.

### Architecture

The five existing specialized agents and deterministic business rules remain unchanged.

Workflow sequence:

Initialize Context -> Lead Intake -> Recency -> Engagement -> Fit & SLA -> Decision -> LLM Enhancement -> Conditional Routing -> Finalize

The LLM enhancement runs after the deterministic decision and before conditional routing. It does not replace deterministic decision authority.

### LLM responsibilities

- Summarize supplied sales notes.
- Extract supported, non-sensitive intent tags.
- Validate structured output.
- Avoid inventing facts.
- Use deterministic fallback when credentials are missing, provider calls fail, or output is invalid.

### Supported intent tags

- DEMO_INTEREST
- PRICING_INTEREST
- FUTURE_DECISION
- PRODUCT_INTEREST
- UNCLEAR

### Reliability and audit

The implementation includes a dedicated LLM service, configurable provider settings, bounded input and output lengths, structured output validation, deterministic fallback, and audit metadata.

API keys and raw sales-note content are not included in LLM audit metadata.

### Evaluation results

| Scenario | Result |
|---|---|
| Normal sales-note input | PASS |
| Ambiguous sales notes | PASS |
| Invalid structured output rejected | PASS |
| Malformed provider response fallback | PASS |
| Provider timeout fallback | PASS |

Backend tests: 21 passed.

Architecture integration and structured output validation: PASS.

### Configuration

See backend/.env.example for the optional provider configuration template.

Never commit real API credentials.

### Current limitation

Live OpenAI API execution has not yet been verified. The five evaluation scenarios used deterministic fallback and mocked provider responses.

### Evaluation evidence

See [Phase 2.3 Evaluation Evidence](docs/phase23-evidence/PHASE23_EVALUATION.md).

### Phase 2.3 commits

- Implementation: 9b9d7cc
- Evaluation evidence: 1878119

Project status: Phase 2.3 implementation and five-scenario evaluation completed. Live provider execution remains pending.
