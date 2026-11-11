from app.models.schemas import LeadRecord
from app.services.workflow_context import WorkflowContext, build_workflow_context


class ContextBuilder:
    """Prepare validated lead data for the agent workflow."""

    @staticmethod
    def build(lead: LeadRecord) -> WorkflowContext:
        return build_workflow_context(lead)
