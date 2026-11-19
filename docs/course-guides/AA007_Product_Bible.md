# AA007 — Lead Follow-up Prioritization Intelligence
## RealRails Agentic AI Batch 2 — Product Bible

> **Role of this file:** This Product Bible is the domain source of truth for this case study.
> **Architecture rule:** Implement this case using the standard RealRails deterministic Agentic AI architecture.
> **Phase rule:** Do not introduce LangGraph or LLM features before the relevant later phase.

| Field | Value |
|---|---|
| Case ID | `AA007` |
| Domain | Sales Operations |
| Complexity | Easy |
| Core Pattern | Business Input → Context → Domain Agents → Deterministic Rules → Decision → Explanation → Audit |

---

## 1. Product / Case Name

**Lead Follow-up Prioritization Intelligence**

## 2. Business Problem

Sales teams need a consistent way to prioritize lead follow-up using recency, engagement, fit, and pending actions rather than manual guesswork.

## 3. Primary Users / Actors

- Sales coordinator
- Inside sales representative
- Sales operations lead

## 4. MVP Objective

Recommend follow-up priority and next operational action using transparent deterministic scoring.

## 5. Business Input

Lead record with source, age, last-contact date, engagement events, declared need, lead stage, and pending follow-up.

## 6. Expected Final Output / Recommendation

Recommended action: FOLLOW_UP_NOW / FOLLOW_UP_SOON / NURTURE / REQUEST_DATA, with score, reasons, and evidence.

## 7. Domain Data Required

- Seeded lead records
- Engagement events
- Lead stage rules
- Follow-up SLA rules
- Configured scoring weights

Use seeded/sample data for the internship MVP unless the current GitHub post explicitly allows an external integration.

## 8. Agent Definitions

The case should use the following agent responsibilities. Agent names may be adapted slightly in code, but their business responsibility must remain clear.

| Agent | Responsibility | Main Input | Main Output |
|---|---|---|---|
| Lead Intake Agent | Validates lead fields and normalizes stage/source. | `lead_record` | `validated_lead` |
| Recency Agent | Scores lead age and last-contact recency. | `validated_lead` | `recency_score` |
| Engagement Agent | Scores approved interaction events. | `validated_lead + engagement_events` | `engagement_score` |
| Fit & SLA Agent | Applies declared-fit and pending-follow-up SLA rules. | `validated_lead + rules` | `fit_score, sla_flags` |
| Lead Priority Decision Agent | Combines scores into a follow-up recommendation. | `all agent outputs` | `final_recommendation` |

## 9. Agent Responsibilities

Each specialized agent must:

- perform one clear business responsibility
- consume structured input from the current workflow context
- produce a structured output
- avoid making decisions outside its boundary
- expose enough evidence for later explanation and audit

The **Decision Agent** combines prior agent outputs into the final structured recommendation.

## 10. Agent Inputs and Outputs

Use explicit structured models for:

- original business input
- validated/normalized input
- each agent output
- decision result
- explanation/evidence
- audit reference

Do not pass unstructured blobs between agents when a small structured contract is practical.

## 11. Run-Scoped Shared Workflow Context

The workflow context should contain at least:

- `workflow_id`
- `lead_record`
- `validated_lead`
- `recency_score`
- `engagement_score`
- `fit_score`
- `sla_flags`
- `agent_outputs`
- `final_recommendation`
- `explanation`
- `audit_reference`
- `errors`

This is **run-scoped shared workflow context**, not long-term AI memory.

## 12. Deterministic Rules / Validation / Scoring

1. Overdue committed follow-up → FOLLOW_UP_NOW.
2. High fit + recent engagement → high priority.
3. Low engagement and old lead → NURTURE.
4. Missing mandatory contact/stage data → REQUEST_DATA.
5. Use only business engagement data; no sensitive personal profiling.

The same valid input and the same configured rules should produce the same result.

## 13. Decision / Recommendation Logic

Calculate weighted priority score and apply SLA overrides before mapping to a follow-up action.

The final response should contain:

- `status` / recommended action
- score or priority where relevant
- short reasons
- triggered rules / evidence
- agent output references where useful
- audit reference

## 14. Execution Flow

```text
Business Input
    ↓
Input Validation / Adapter
    ↓
Context Builder
    ↓
Run-Scoped Shared Workflow Context
    ↓
Specialized Domain Agents
    ↓
Deterministic Rules / Scoring
    ↓
Decision / Recommendation Agent
    ↓
Structured Recommendation
    ↓
Explanation + Evidence
    ↓
Audit Trail
    ↓
Business UI
```

The implementation may run agents sequentially in Phase 1. Later phases will evolve orchestration using LangGraph.

## 15. Explanation and Evidence Requirements

The application must make it possible to understand:

- which agents executed
- what each agent concluded
- which rules or thresholds triggered
- why the final recommendation was selected
- what important limitations or missing data affected the result

The explanation must not invent evidence that is not present in the workflow state.

## 16. Audit Requirements

Record at minimum:

- `workflow_id`
- request/input reference
- execution timestamp
- agent execution sequence
- major agent outputs
- triggered decision rules
- final recommendation
- errors or fallback state

An in-memory audit store is acceptable for the internship MVP unless a later phase explicitly requires persistence.

## 17. Sample Scenarios

| Scenario | Input / Condition | Expected Behaviour |
|---|---|---|
| Hot lead | Recent inquiry + high fit + overdue follow-up | FOLLOW_UP_NOW |
| Warm lead | Moderate engagement and valid fit | FOLLOW_UP_SOON |
| Stale lead | Old, low engagement | NURTURE |

These scenarios should be implemented as seeded/demo data or reproducible test inputs.

## 18. Expected MVP UI

The basic Phase 1 UI should make the business workflow usable and explainable.

- Lead card
- Score breakdown
- Agent trace
- Recommended next action
- Evidence/audit

Keep the UI functional and clear. Heavy product polish belongs to optional Phase 3.

## 19. MVP Boundaries / Non-Goals

- No automatic pricing or contracting
- No sensitive demographic scoring
- No autonomous customer contact

Also:

- no production credentials
- no hidden external dependencies
- no unsupported claims of production readiness
- no future-phase technology added early

## 20. Future Conditional-Routing Opportunity

OVERDUE_SLA → immediate follow-up; HIGH_SCORE → follow-up soon; LOW_SCORE → nurture; MISSING_DATA → request data.

This should be used later in **Phase 2.2 — LangGraph Conditional Routing**.

## 21. Future Controlled LLM Opportunity

Optional summarization of sales notes into structured non-sensitive intent tags or readable explanation.

The LLM is an enhancement layer. It must not replace deterministic authority where deterministic rules already provide the business decision.

## 22. Acceptance Criteria

The case is ready for core internship progression when:

- [ ] The supplied business input can be submitted through the application.
- [ ] Input is validated and normalized.
- [ ] 3–5 meaningful agent responsibilities are implemented.
- [ ] Agents use structured inputs and outputs.
- [ ] Run-scoped shared workflow context is visible in code and/or UI.
- [ ] Deterministic rules/scoring are implemented and testable.
- [ ] A structured recommendation is produced.
- [ ] Explanation/evidence is available.
- [ ] Audit information is recorded.
- [ ] At least the three sample scenarios can be demonstrated.
- [ ] The case can later map existing agents to LangGraph nodes without redesigning the domain.
- [ ] The Product Bible remains the domain source of truth through later phases.

---

## AI Execution Reminder

When this Product Bible is given to an AI assistant together with a RealRails GitHub post and generic feeder documents:

1. Treat the **current GitHub post** as the immediate task boundary.
2. Treat this **Product Bible** as the domain/product source of truth.
3. Use the **generic RealRails feeder documents** as the engineering method.
4. Use the latest **Repomix** as the implementation truth.
5. Use **ABIP only as an architecture-learning reference**.
6. Do not invent unrelated features, agents, data, or future-phase technologies.
