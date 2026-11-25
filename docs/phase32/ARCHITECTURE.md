# Architecture Summary — AA007

## Business Workflow

Business Input → Validation → Shared Workflow Context → Specialized Agents → Deterministic Decision → Conditional Workflow → Controlled LLM Enhancement → Validation/Fallback → Explanation → Audit → Business UI.

## Five Agents

1. Lead Intake Agent — validates and normalizes lead information.
2. Recency Agent — evaluates contact recency.
3. Engagement Agent — evaluates approved engagement events.
4. Fit & SLA Agent — evaluates declared fit and follow-up commitments.
5. Lead Priority Decision Agent — combines agent results and applies deterministic recommendation rules.

## Orchestration

LangGraph organizes the agent workflow. Conditional routing uses business conditions rather than LLM-generated authority.

## Controlled LLM

The approved LLM role is sales-note summarization and intent-tag extraction. Output is validated. Provider failure or invalid output must not change the deterministic recommendation.

## Explanation and Audit

The workflow exposes recommendation reasons, evidence, agent results and an audit reference.

## Authority Boundary

The deterministic decision is authoritative. The LLM cannot calculate priority, override the recommendation or control workflow routing.
