from dotenv import load_dotenv
load_dotenv("backend/.env", override=True)

from app.models.schemas import LeadRecord, LeadStage, EngagementEvent
from app.services.lead_workflow_graph import LeadWorkflowGraph
from app.services.audit_service import audit_service

lead = LeadRecord(
    lead_id="GEMINI-INTEGRATION-001",
    source="Website",
    age_days=5,
    engagement_events=[
        EngagementEvent(
            event_type="DEMO_REQUEST",
            occurred_at="2026-11-22"
        )
    ],
    sales_notes="Customer requested a product demo, asked about pricing, and plans to decide next month.",
    declared_fit="HIGH",
    stage=LeadStage.QUALIFIED
)

result = LeadWorkflowGraph().run(lead)
response = result["response"].model_dump(mode="json")
audit = audit_service.get_audit_record(response["audit_reference"])
metadata = response["llm_metadata"]

print("\n========== WORKFLOW RESULT ==========")
print("Recommendation:", response["recommendation"])
print("Priority score:", response["priority_score"])
print("Summary:", response["llm_summary"])
print("Intent tags:", response["llm_intent_tags"])
print("LLM metadata:", metadata)
print("Graph trace:", result["graph_trace"])

print("\n========== AUDIT ==========")
print("Audit found:", audit is not None)
if audit:
    print("Audit recommendation:", audit["final_recommendation"])
    print("Audit LLM metadata:", audit["llm_metadata"])

checks = {
    "Gemini provider": metadata.get("provider") == "gemini",
    "Real LLM execution": metadata.get("llm_used") == "True",
    "Success status": metadata.get("status") == "success",
    "Validation passed": metadata.get("validation_status") == "passed",
    "No fallback": metadata.get("fallback_used") == "False",
    "Audit stored": audit is not None,
    "Recommendation preserved": audit is not None and audit["final_recommendation"] == response["recommendation"],
}

print("\n========== ACCEPTANCE CHECKS ==========")
for name, passed in checks.items():
    print(("PASS" if passed else "FAIL") + ": " + name)

print("\nRESULT:", "ALL CHECKS PASSED" if all(checks.values()) else "CHECKS NEED REVIEW")

