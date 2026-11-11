from datetime import date, datetime, timedelta, timezone

from app.models.schemas import (
    ContactDetails,
    EngagementEvent,
    LeadRecord,
    LeadStage,
    PendingFollowUp,
)

today = date.today()
now = datetime.now(timezone.utc)


SAMPLE_LEADS: list[LeadRecord] = [
    LeadRecord(
        lead_id="AA007-HOT-001",
        contact=ContactDetails(
            name="Aarav Thomas",
            email="aarav@example.com",
            phone="+91-9000000001",
        ),
        source="Website",
        age_days=1,
        last_contact_date=today,
        engagement_events=[
            EngagementEvent(
                event_type="INQUIRY",
                occurred_at=today,
                description="Submitted a recent product inquiry",
            ),
            EngagementEvent(
                event_type="CALL_REQUEST",
                occurred_at=today,
                description="Requested a sales call",
            ),
        ],
        declared_need="Needs a product demonstration",
        declared_fit="HIGH",
        stage=LeadStage.NEW,
        pending_follow_up=PendingFollowUp(
            committed=True,
            due_at=now - timedelta(hours=2),
            description="Committed callback is overdue",
        ),
    ),
    LeadRecord(
        lead_id="AA007-WARM-001",
        contact=ContactDetails(
            name="Meera Joseph",
            email="meera@example.com",
        ),
        source="Referral",
        age_days=5,
        last_contact_date=today - timedelta(days=2),
        engagement_events=[
            EngagementEvent(
                event_type="EMAIL_REPLY",
                occurred_at=today - timedelta(days=2),
                description="Replied to a sales email",
            ),
        ],
        declared_need="Evaluating available options",
        declared_fit="MEDIUM",
        stage=LeadStage.CONTACTED,
        pending_follow_up=PendingFollowUp(
            committed=False,
            description="No committed follow-up deadline",
        ),
    ),
    LeadRecord(
        lead_id="AA007-STALE-001",
        contact=ContactDetails(
            name="Rohan Mathew",
            email="rohan@example.com",
        ),
        source="Event",
        age_days=45,
        last_contact_date=today - timedelta(days=40),
        engagement_events=[],
        declared_need="No recent need update",
        declared_fit="LOW",
        stage=LeadStage.NEW,
        pending_follow_up=PendingFollowUp(
            committed=False,
            description="No pending committed follow-up",
        ),
    ),
]


def get_seed_leads() -> list[LeadRecord]:
    """Return fresh model instances for the demo dataset."""
    return [lead.model_copy(deep=True) for lead in SAMPLE_LEADS]


def get_seed_lead(lead_id: str) -> LeadRecord | None:
    """Find one demo lead by its ID."""
    for lead in get_seed_leads():
        if lead.lead_id == lead_id:
            return lead
    return None
