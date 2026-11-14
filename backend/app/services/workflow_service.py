from app.models.schemas import WorkflowRequest, WorkflowResponse
from app.services.lead_workflow_graph import LeadWorkflowGraph


class LeadWorkflowService:
    """Execute the AA007 workflow through a linear LangGraph."""

    def __init__(self):
        self.workflow_graph = LeadWorkflowGraph()

    def run(self, request: WorkflowRequest) -> WorkflowResponse:
        result = self.workflow_graph.run(request.lead)
        response = result.get("response")

        if response is None:
            raise RuntimeError(
                "LangGraph workflow completed without a response."
            )

        return response
