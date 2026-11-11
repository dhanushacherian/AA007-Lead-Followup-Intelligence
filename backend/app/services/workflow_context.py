from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, Field

from app.models.schemas import AgentResult, LeadRecord


class WorkflowContext(BaseModel):
    workflow_id: str
    created_at: datetime
    lead: LeadRecord
    agent_results: list[AgentResult] = Field(default_factory=list)
    evidence: list[str] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
    metadata: dict[str, str] = Field(default_factory=dict)


def build_workflow_context(lead: LeadRecord) -> WorkflowContext:
    """
    Create an isolated shared context for one lead-analysis run.

    Each run receives a unique ID and its own copy of the lead.
    """
    return WorkflowContext(
        workflow_id=f"AA007-{uuid4().hex[:12].upper()}",
        created_at=datetime.now(timezone.utc),
        lead=lead.model_copy(deep=True),
        metadata={
            "case_id": "AA007",
            "case_name": "Lead Follow-up Prioritization Intelligence",
            "workflow_status": "INITIALIZED",
        },
    )


def add_agent_result(
    context: WorkflowContext,
    result: AgentResult,
) -> None:
    """Add one agent's structured result to the shared context."""
    context.agent_results.append(result)
    context.evidence.extend(result.evidence)


def add_workflow_error(
    context: WorkflowContext,
    message: str,
) -> None:
    """Record an error without losing the workflow context."""
    context.errors.append(message)
