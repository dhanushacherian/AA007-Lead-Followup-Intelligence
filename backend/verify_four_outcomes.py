import json
from datetime import date, timedelta

from app.main import workflow_service
from app.models.schemas import (
    ContactDetails,
    EngagementEvent,
    LeadRecord,
    LeadStage,
    PendingFollowUp,
    WorkflowRequest,
)

today = date.today()

scenarios = [
    {
        "name": "REQUEST_DATA",
        "expected": "REQUEST_DATA",
        "lead": LeadRecord(
            lead_id="PHASE31-REQUEST-DATA",
            contact=None,
            source="Website",
            age_days=2,
            last_contact_date=today,
            declared_fit="HIGH",
            stage=LeadStage.NEW,
        ),
    },
    {
        "name": "FOLLOW_UP_NOW",
        "expected": "FOLLOW_UP_NOW",
        "lead": LeadRecord(
            lead_id="PHASE31-FOLLOW-UP-NOW",
            contact=ContactDetails(name="Demo High Fit"),
            source="Website",
            age_days=1,
            last_contact_date=today,
            engagement_events=[
                EngagementEvent(
                    event_type="INQUIRY",
                    occurred_at=today,
                    description="Recent product inquiry",
                )
            ],
            declared_fit="HIGH",
            stage=LeadStage.NEW,
            pending_follow_up=PendingFollowUp(committed=False),
        ),
    },
    {
        "name": "NURTURE",
        "expected": "NURTURE",
        "lead": LeadRecord(
            lead_id="PHASE31-NURTURE",
            contact=ContactDetails(name="Demo Stale Lead"),
            source="Event",
            age_days=30,
            last_contact_date=today - timedelta(days=20),
            engagement_events=[],
            declared_fit="LOW",
            stage=LeadStage.NEW,
            pending_follow_up=PendingFollowUp(committed=False),
        ),
    },
    {
        "name": "FOLLOW_UP_SOON",
        "expected": "FOLLOW_UP_SOON",
        "lead": LeadRecord(
            lead_id="PHASE31-FOLLOW-UP-SOON",
            contact=ContactDetails(name="Demo Moderate Lead"),
            source="Referral",
            age_days=8,
            last_contact_date=today - timedelta(days=7),
            engagement_events=[
                EngagementEvent(
                    event_type="EMAIL_REPLY",
                    occurred_at=today - timedelta(days=7),
                    description="One recorded email reply",
                )
            ],
            declared_fit="MEDIUM",
            stage=LeadStage.CONTACTED,
            pending_follow_up=PendingFollowUp(committed=False),
        ),
    },
]

results = []
failures = 0

for scenario in scenarios:
    response = workflow_service.run(
        WorkflowRequest(lead=scenario["lead"])
    )

    actual = response.recommendation
    passed = actual == scenario["expected"]

    if not passed:
        failures += 1

    item = {
        "scenario": scenario["name"],
        "expected": scenario["expected"],
        "actual": actual,
        "passed": passed,
        "lead_id": response.lead_id,
        "triggered_rules": response.triggered_rules,
        "reasons": response.reasons,
        "evidence": response.evidence,
        "audit_reference": response.audit_reference,
        "llm_metadata": response.llm_metadata,
    }
    results.append(item)

    print(
        f"{'PASS' if passed else 'FAIL'} | "
        f"{scenario['name']} | "
        f"expected={scenario['expected']} | actual={actual}"
    )
    print(f"  Rules: {response.triggered_rules}")
    print(f"  Audit: {response.audit_reference}")

output = {
    "phase": "3.1",
    "test": "four_deterministic_recommendation_outcomes",
    "total": len(results),
    "passed": len(results) - failures,
    "failed": failures,
    "results": results,
}

with open(
    "../docs/phase3-evidence/four-outcome-verification.json",
    "w",
    encoding="utf-8",
) as file:
    json.dump(output, file, indent=2, ensure_ascii=False)

print(f"\nRESULT: {len(results) - failures}/{len(results)} passed")

if failures:
    raise SystemExit(1)

print("Evidence saved: docs/phase3-evidence/four-outcome-verification.json")

