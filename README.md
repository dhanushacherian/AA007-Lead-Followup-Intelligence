# AA007 — Lead Follow-up Prioritization Intelligence

**RealRails Agentic AI Internship | Agentic AI MVP | Phase 3.1**

## 1. Project Overview

AA007 is a deterministic, multi-agent lead follow-up prioritization application. It evaluates lead information, contact recency, engagement, declared fit, and follow-up commitments to recommend an appropriate business action.

## 2. Phase 3.1 Business Experience

The business-facing interface presents:
- Recommended action
- Reasons behind the recommendation
- Evidence from the lead record
- Recommended next action

Technical agent contributions, decision details, and audit information are available under the collapsed **Advanced details** section.

Customer contact remains a human decision and action.

## 3. Deterministic Recommendations

| Rule | Recommendation | Condition |
|---|---|---|
| AA007-RULE-01 | REQUEST_DATA | Mandatory lead information is incomplete |
| AA007-RULE-02 | FOLLOW_UP_NOW | A committed follow-up is overdue |
| AA007-RULE-03 | FOLLOW_UP_NOW | High fit, recent contact, and engagement |
| AA007-RULE-04 | NURTURE | Stale contact and low engagement |
| AA007-RULE-05 | FOLLOW_UP_SOON | Default when no higher-priority rule applies |

The recommendation is determined by business rules, not by the LLM.

## 4. Technology Stack

- Python, FastAPI and LangGraph
- Pydantic
- Gemini and OpenAI provider integration
- React, Vite, TypeScript and CSS
- Pytest, Git, GitHub and Repomix

## 5. Controlled LLM Enhancement

Gemini integration supports sales-note summarization and approved intent-tag extraction.

LLM output does not calculate priority, override deterministic recommendations, change business rules, or control workflow routing. Structured validation and deterministic fallback handling are retained.

Keep provider credentials in the local backend environment file. Never commit API keys.

## 6. Workflow and Audit

Specialized agents evaluate:
1. Lead intake
2. Contact recency
3. Engagement
4. Fit and SLA
5. Deterministic decision
6. Finalization and audit recording

Each execution returns a recommendation, reasons, triggered rules, agent outputs, evidence, and an audit reference.

## 7. API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | API status |
| GET | `/health` | Health check |
| GET | `/leads` | Seeded demonstration leads |
| POST | `/workflow/run` | Run lead prioritization |
| GET | `/audit/{audit_reference}` | Retrieve audit record |

Interactive API documentation: `/docs`.

## 8. Running the Application

Backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Configure environment variables using `backend/.env.example`. Keep actual credentials in `backend/.env`.

## 9. Phase 3.1 Verification

All four deterministic recommendation scenarios passed through the actual LangGraph workflow:

| Scenario | Result |
|---|---|
| Incomplete lead information | PASS — REQUEST_DATA |
| High fit and recent engagement | PASS — FOLLOW_UP_NOW |
| Stale contact and no engagement | PASS — NURTURE |
| Valid lead with no higher-priority trigger | PASS — FOLLOW_UP_SOON |

**Backend scenario result: 4/4 passed.**

Evidence: `docs/phase3-evidence/four-outcome-verification.json`

Backend regression tests:
```bash
pytest -v --tb=short
```

Frontend production build:
```bash
npm run build
```

## 10. Previous Phase Evidence

Gemini integration and LLM validation evidence are retained in `docs/phase2-evidence/`.

## 11. Product Boundary

AA007 provides evidence-based decision support. Users remain responsible for reviewing recommendations and deciding whether and how to contact customers.

**Repository:** https://github.com/dhanushacherian/AA007-Lead-Followup-Intelligence