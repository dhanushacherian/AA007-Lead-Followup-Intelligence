from app.models.schemas import AgentResult
from app.services.workflow_context import WorkflowContext


def record_result(
    context: WorkflowContext,
    result: AgentResult,
) -> AgentResult:
    context.agent_results.append(result)
    context.evidence.extend(result.evidence)
    return result
