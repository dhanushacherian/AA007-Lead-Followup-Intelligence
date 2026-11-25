# Reproducible Demo Scenarios — AA007

Use the existing seeded demonstration leads or the equivalent verified test inputs. Do not invent lead identifiers.

## Scenario 1 — Incomplete Lead Information

Business condition:
A lead is missing mandatory information.

Expected recommendation:
REQUEST_DATA.

Demonstrate:
- Lead input
- Validation result
- Recommendation
- Missing-data explanation
- Evidence and audit reference

## Scenario 2 — High-Priority Lead

Business condition:
A lead has high declared fit, recent contact and engagement, or an overdue committed follow-up.

Expected recommendation:
FOLLOW_UP_NOW.

Demonstrate:
- Lead details
- Recency and engagement evidence
- Deterministic recommendation
- Explanation and agent trace

## Scenario 3 — Stale Lead

Business condition:
A lead has stale contact and low engagement.

Expected recommendation:
NURTURE.

Demonstrate:
- Lead details
- Engagement and recency evidence
- Conditional workflow result
- Recommendation explanation

## Additional Verified Outcome

FOLLOW_UP_SOON is the default when no higher-priority rule applies. The four-outcome verification is retained in `docs/phase3-evidence/four-outcome-verification.json`.

## LLM Demonstration

Where provider configuration permits, demonstrate a successful controlled LLM enhancement and a fallback case. Verify that neither changes the deterministic recommendation.
