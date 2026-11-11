from app.agents.lead_intake_agent import LeadIntakeAgent
from app.agents.recency_agent import RecencyAgent
from app.agents.engagement_agent import EngagementAgent
from app.agents.fit_sla_agent import FitSlaAgent
from app.agents.decision_agent import LeadPriorityDecisionAgent

from app.models.schemas import WorkflowRequest, WorkflowResponse
from app.services.context_builder import ContextBuilder


class LeadWorkflowService:
    """Execute the complete AA007 lead-prioritization workflow."""

    def __init__(self):
        self.agents = [
            LeadIntakeAgent(),
            RecencyAgent(),
            EngagementAgent(),
            FitSlaAgent(),
            LeadPriorityDecisionAgent(),
        ]

    def run(self, request: WorkflowRequest) -> WorkflowResponse:
        context = ContextBuilder.build(request.lead)

        for agent in self.agents:
            agent.run(context)

        decision = context.agent_results[-1]
        details = decision.details

        recommendation = details.get("recommendation") or "REQUEST_DATA"

        return WorkflowResponse(
            workflow_id=context.workflow_id,
            lead_id=context.lead.lead_id,
            recommendation=recommendation,
            priority_score=decision.score,
            reasons=details.get("reasons", []),
            triggered_rules=details.get("triggered_rules", []),
            agent_outputs=context.agent_results,
            evidence=context.evidence,
            audit_reference=f"AUDIT-{context.workflow_id}",
            errors=context.errors,
        )
