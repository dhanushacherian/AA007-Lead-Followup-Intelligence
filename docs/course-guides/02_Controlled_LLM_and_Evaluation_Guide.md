# RealRails Batch 2 — Controlled LLM & Evaluation Guide
## Purpose

Use this guide for Phase 2.3.

The application already has:

- deterministic domain logic
- explainable recommendations
- audit evidence
- LangGraph orchestration
- conditional routing

The LLM should add a **specific capability**, not become the authority for the entire product.

---

# 1. Product Bible Controls the LLM Role

Read:

> **Future Controlled LLM Opportunity**

from the selected Product Bible.

Use that as the approved LLM boundary.

Do not add a different LLM use just because it is easier.

---

# 2. Appropriate LLM Roles

Examples:

- explanation generation
- summarization
- extraction from unstructured notes
- reason extraction
- approved text classification
- constrained interpretation

Use the smallest useful capability.

---

# 3. Preferred Architecture

```text
Deterministic Workflow
        ↓
Deterministic Decision
        ↓
LLM Enhancement
        ↓
Output Validation
        ↓
Fallback if Required
        ↓
Presentation / Explanation
        ↓
Audit
```

If the Product Bible defines LLM input interpretation, the LLM may sit earlier, but the structured output must be validated before deterministic processing continues.

---

# 4. LLM Adapter Boundary

Prefer one clear service boundary such as:

```text
LLMService
  ├─ build_prompt()
  ├─ invoke()
  ├─ validate_output()
  └─ fallback()
```

Do not spread raw provider calls through many agents.

Provider-specific SDK details should remain isolated.

---

# 5. Configuration

Use environment variables for:

```text
LLM_PROVIDER
LLM_MODEL
LLM_API_KEY
LLM_TIMEOUT
```

Exact names may differ.

Never commit API keys.

Provide an `.env.example` with placeholders only.

---

# 6. Prompt Contract

A controlled prompt should clearly define:

- task
- allowed input
- expected output
- forbidden assumptions
- output schema/format
- instruction not to invent missing facts

Example pattern:

```text
ROLE:
Generate a concise explanation of the supplied deterministic evidence.

INPUT:
<structured evidence>

RULES:
- do not change the decision
- do not invent facts
- mention only supplied evidence
- return the required JSON structure
```

Adapt to the Product Bible.

---

# 7. Structured Output

Prefer structured output such as:

```json
{
  "summary": "...",
  "reasons": ["..."],
  "confidence_note": "... "
}
```

Validate:

- expected fields
- type
- length/limits
- allowed categories if relevant

Reject/fallback on malformed output.

---

# 8. Failure Handling

Plan for:

- timeout
- provider unavailable
- authentication/configuration error
- malformed response
- empty response
- output outside allowed schema

A practical fallback may be:

```text
LLM Failure
   ↓
Deterministic Template Explanation
```

The workflow should not become unusable only because the LLM is unavailable when a deterministic fallback is possible.

---

# 9. Trace / Audit

Record non-secret metadata such as:

```text
llm_used
provider
model
status
fallback_used
validation_status
```

Do not record API keys.

Avoid logging sensitive raw content unnecessarily.

---

# 10. Evaluation — Keep It Small

Run 3–5 scenarios.

Suggested categories:

1. normal valid input
2. ambiguous/difficult input
3. provider failure/timeout
4. malformed output/fallback
5. Product Bible edge case

For each scenario capture:

| Field | Example |
|---|---|
| Scenario | Normal |
| Deterministic Outcome | REVIEW |
| LLM Role | Explanation |
| LLM Status | Success |
| Validation | Pass |
| Fallback | No |
| Final Result Safe? | Yes |

A GitHub comment/table is sufficient.

No long evaluation document is required.

---

# 11. Guardrails

At minimum:

- bounded LLM task
- prompt constraints
- structured/validated output
- timeout
- error handling
- fallback
- secret management
- traceability

Do not claim that these make an internship MVP production-ready.

---

# 12. Do Not Force Extra Technology

Phase 2.3 does not automatically require:

- RAG
- vector database
- MCP
- knowledge graph
- persistent memory
- fine-tuning
- local GPU hosting
- Kubernetes

Add them only if the Product Bible and current post explicitly require them.

---

# 13. Final Phase 2 Quality Check

- [ ] deterministic business authority still works
- [ ] LangGraph workflow still works
- [ ] conditional routes still work
- [ ] LLM has one clear Product Bible-aligned role
- [ ] output is validated
- [ ] fallback is demonstrated
- [ ] LLM use is traceable
- [ ] 3–5 scenarios evaluated
- [ ] secrets are not committed
- [ ] final Repomix generated
