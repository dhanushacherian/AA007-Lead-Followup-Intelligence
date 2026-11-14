from datetime import date, datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.main import app
from app.data.seed_leads import get_seed_leads
from app.models.schemas import (
    ContactDetails,
    EngagementEvent,
    LeadRecord,
    LeadStage,
    PendingFollowUp,
    WorkflowRequest,
)
from app.services.workflow_service import LeadWorkflowService


client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "running"
    assert data["project"] == (
        "AA007 - Lead Follow-up Prioritization Intelligence"
    )


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "healthy"
    assert data["service"] == "AA007 Backend"


def test_hot_seed_lead_follow_up_now():
    lead = next(
        item for item in get_seed_leads()
        if item.lead_id == "AA007-HOT-001"
    )

    result = LeadWorkflowService().run(WorkflowRequest(lead=lead))

    assert result.recommendation == "FOLLOW_UP_NOW"
    assert "AA007-RULE-02" in result.triggered_rules


def test_warm_seed_lead_follow_up_soon():
    lead = next(
        item for item in get_seed_leads()
        if item.lead_id == "AA007-WARM-001"
    )

    result = LeadWorkflowService().run(WorkflowRequest(lead=lead))

    assert result.recommendation == "FOLLOW_UP_SOON"
    assert "AA007-RULE-05" in result.triggered_rules


def test_stale_seed_lead_nurture():
    lead = next(
        item for item in get_seed_leads()
        if item.lead_id == "AA007-STALE-001"
    )

    result = LeadWorkflowService().run(WorkflowRequest(lead=lead))

    assert result.recommendation == "NURTURE"
    assert "AA007-RULE-04" in result.triggered_rules


def test_missing_mandatory_data_requests_data():
    lead = LeadRecord(
        lead_id="AA007-MISSING-001",
        contact=None,
        source="Website",
        age_days=2,
        last_contact_date=date.today(),
        declared_fit="HIGH",
        stage=LeadStage.NEW,
    )

    result = LeadWorkflowService().run(WorkflowRequest(lead=lead))

    assert result.recommendation == "REQUEST_DATA"
    assert "AA007-RULE-01" in result.triggered_rules


def test_high_fit_recent_engagement_triggers_rule_03():
    today = date.today()

    lead = LeadRecord(
        lead_id="AA007-HIGH-FIT-001",
        contact=ContactDetails(
            name="Test Lead",
            email="test@example.com",
        ),
        source="Website",
        age_days=2,
        last_contact_date=today,
        engagement_events=[
            EngagementEvent(
                event_type="EMAIL_REPLY",
                occurred_at=today,
                description="Recent positive engagement",
            ),
        ],
        declared_need="Interested in a product demonstration",
        declared_fit="HIGH",
        stage=LeadStage.CONTACTED,
        pending_follow_up=PendingFollowUp(
            committed=False,
        ),
    )

    result = LeadWorkflowService().run(WorkflowRequest(lead=lead))

    assert result.recommendation == "FOLLOW_UP_NOW"
    assert "AA007-RULE-03" in result.triggered_rules


def test_workflow_executes_all_five_agents():
    lead = get_seed_leads()[0]

    result = LeadWorkflowService().run(WorkflowRequest(lead=lead))

    expected_agents = {
        "Lead Intake Agent",
        "Recency Agent",
        "Engagement Agent",
        "Fit & SLA Agent",
        "Lead Priority Decision Agent",
    }

    actual_agents = {
        agent.agent_name for agent in result.agent_outputs
    }

    assert actual_agents == expected_agents
    assert len(result.agent_outputs) == 5


def test_workflow_generates_unique_audit_reference():
    lead = get_seed_leads()[0]
    service = LeadWorkflowService()

    first = service.run(WorkflowRequest(lead=lead))
    second = service.run(WorkflowRequest(lead=lead))

    assert first.workflow_id != second.workflow_id
    assert first.audit_reference == f"AUDIT-{first.workflow_id}"
    assert second.audit_reference == f"AUDIT-{second.workflow_id}"


def test_workflow_api_returns_complete_result():
    response = client.post(
        "/workflow/run",
        json={
            "lead": get_seed_leads()[0].model_dump(mode="json")
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["recommendation"] == "FOLLOW_UP_NOW"
    assert len(data["agent_outputs"]) == 5
    assert len(data["evidence"]) > 0
    assert data["audit_reference"].startswith("AUDIT-")


def test_workflow_audit_record_is_retrievable():
    response = client.post(
        "/workflow/run",
        json={
            "lead": get_seed_leads()[0].model_dump(mode="json")
        },
    )

    assert response.status_code == 200

    workflow_data = response.json()
    audit_reference = workflow_data["audit_reference"]

    audit_response = client.get(f"/audit/{audit_reference}")

    assert audit_response.status_code == 200

    audit_data = audit_response.json()

    assert audit_data["audit_reference"] == audit_reference
    assert audit_data["workflow_id"] == workflow_data["workflow_id"]
    assert audit_data["lead_id"] == workflow_data["lead_id"]
    assert audit_data["final_recommendation"] == workflow_data["recommendation"]
    assert len(audit_data["agent_execution_sequence"]) == 5
    assert len(audit_data["agent_outputs"]) == 5
    assert isinstance(audit_data["execution_timestamp"], str)
    assert isinstance(audit_data["triggered_rules"], list)
    assert isinstance(audit_data["errors"], list)


def test_audit_record_contains_all_five_agents_in_order():
    response = client.post(
        "/workflow/run",
        json={
            "lead": get_seed_leads()[0].model_dump(mode="json")
        },
    )

    audit_reference = response.json()["audit_reference"]
    audit_response = client.get(f"/audit/{audit_reference}")

    assert audit_response.status_code == 200

    audit_data = audit_response.json()

    expected_sequence = [
        "Lead Intake Agent",
        "Recency Agent",
        "Engagement Agent",
        "Fit & SLA Agent",
        "Lead Priority Decision Agent",
    ]

    assert audit_data["agent_execution_sequence"] == expected_sequence


def test_unknown_audit_reference_returns_404():
    response = client.get("/audit/AUDIT-NOT-FOUND")

    assert response.status_code == 404
    assert response.json()["detail"] == "Audit record not found."


def test_workflow_records_langgraph_node_execution_order():
    response = client.post(
        "/workflow/run",
        json={
            "lead": get_seed_leads()[0].model_dump(mode="json")
        },
    )

    assert response.status_code == 200

    audit_reference = response.json()["audit_reference"]
    audit_response = client.get(f"/audit/{audit_reference}")

    assert audit_response.status_code == 200

    trace = audit_response.json()["graph_execution_trace"]

    expected_nodes = [
        "initialize_context",
        "lead_intake",
        "recency",
        "engagement",
        "fit_sla",
        "decision",
        "finalize",
    ]

    completed_nodes = [
        event["node"]
        for event in trace
        if event["status"] == "completed"
    ]

    assert completed_nodes == expected_nodes


def test_workflow_records_started_and_completed_for_each_node():
    response = client.post(
        "/workflow/run",
        json={
            "lead": get_seed_leads()[0].model_dump(mode="json")
        },
    )

    assert response.status_code == 200

    audit_reference = response.json()["audit_reference"]
    audit_response = client.get(f"/audit/{audit_reference}")

    assert audit_response.status_code == 200

    trace = audit_response.json()["graph_execution_trace"]

    expected_events = [
        {"node": node, "status": status}
        for node in [
            "initialize_context",
            "lead_intake",
            "recency",
            "engagement",
            "fit_sla",
            "decision",
            "finalize",
        ]
        for status in ["started", "completed"]
    ]

    assert trace == expected_events
