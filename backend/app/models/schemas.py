from datetime import date, datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class LeadStage(str, Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    QUALIFIED = "QUALIFIED"
    PROPOSAL = "PROPOSAL"
    NEGOTIATION = "NEGOTIATION"
    WON = "WON"
    LOST = "LOST"


class ContactDetails(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str | None = None
    email: str | None = None
    phone: str | None = None


class EngagementEvent(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    event_type: str = Field(min_length=1)
    occurred_at: date
    description: str | None = None


class PendingFollowUp(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    committed: bool = False
    due_at: datetime | None = None
    description: str | None = None


class LeadRecord(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    lead_id: str = Field(min_length=1)
    contact: ContactDetails | None = None
    source: str | None = None
    age_days: int = Field(ge=0)
    last_contact_date: date | None = None
    engagement_events: list[EngagementEvent] = Field(default_factory=list)
    declared_need: str | None = None
    declared_fit: str | None = None
    stage: LeadStage | None = None
    pending_follow_up: PendingFollowUp = Field(default_factory=PendingFollowUp)


class WorkflowRequest(BaseModel):
    lead: LeadRecord


class AgentResult(BaseModel):
    agent_name: str
    status: str
    summary: str
    evidence: list[str] = Field(default_factory=list)
    score: float | None = None
    details: dict[str, Any] = Field(default_factory=dict)


class WorkflowResponse(BaseModel):
    workflow_id: str
    lead_id: str
    recommendation: str
    priority_score: float | None = None
    reasons: list[str] = Field(default_factory=list)
    triggered_rules: list[str] = Field(default_factory=list)
    agent_outputs: list[AgentResult] = Field(default_factory=list)
    evidence: list[str] = Field(default_factory=list)
    audit_reference: str
    errors: list[str] = Field(default_factory=list)
