from operator import add
from typing import Annotated, TypedDict

from langgraph.graph import END, START, StateGraph

from app.agents.lead_intake_agent import LeadIntakeAgent
from app.agents.recency_agent import RecencyAgent
from app.agents.engagement_agent import EngagementAgent
from app.agents.fit_sla_agent import FitSlaAgent
from app.agents.decision_agent import LeadPriorityDecisionAgent

from app.models.schemas import LeadRecord, WorkflowResponse
from app.services.context_builder import ContextBuilder
from app.services.workflow_context import WorkflowContext
from app.services.audit_service import audit_service


class LeadWorkflowState(TypedDict):
    """Shared state passed between AA007 LangGraph nodes."""

    lead: LeadRecord
    context: WorkflowContext | None
    graph_trace: Annotated[list[dict[str, str]], add]
    response: WorkflowResponse | None


class LeadWorkflowGraph:
    """Linear LangGraph orchestration for the AA007 lead workflow."""

    NODE_ORDER = [
        "initialize_context",
        "lead_intake",
        "recency",
        "engagement",
        "fit_sla",
        "decision",
        "finalize",
    ]

    def __init__(self):
        self.lead_intake_agent = LeadIntakeAgent()
        self.recency_agent = RecencyAgent()
        self.engagement_agent = EngagementAgent()
        self.fit_sla_agent = FitSlaAgent()
        self.decision_agent = LeadPriorityDecisionAgent()

        builder = StateGraph(LeadWorkflowState)

        builder.add_node("initialize_context", self.initialize_context)
        builder.add_node("lead_intake", self.lead_intake)
        builder.add_node("recency", self.recency)
        builder.add_node("engagement", self.engagement)
        builder.add_node("fit_sla", self.fit_sla)
        builder.add_node("decision", self.decision)
        builder.add_node("finalize", self.finalize)

        builder.add_edge(START, "initialize_context")
        builder.add_edge("initialize_context", "lead_intake")
        builder.add_edge("lead_intake", "recency")
        builder.add_edge("recency", "engagement")
        builder.add_edge("engagement", "fit_sla")
        builder.add_edge("fit_sla", "decision")
        builder.add_edge("decision", "finalize")
        builder.add_edge("finalize", END)

        self.graph = builder.compile()

    @staticmethod
    def _trace(
        node: str,
        status: str,
    ) -> dict[str, str]:
        return {
            "node": node,
            "status": status,
        }

    def initialize_context(self, state: LeadWorkflowState) -> dict:
        context = ContextBuilder.build(state["lead"])

        return {
            "context": context,
            "graph_trace": [
                self._trace("initialize_context", "started"),
                self._trace("initialize_context", "completed"),
            ],
        }

    def _run_agent(
        self,
        state: LeadWorkflowState,
        node_name: str,
        agent,
    ) -> dict:
        context = state["context"]

        if context is None:
            raise RuntimeError("Workflow context was not initialized.")

        agent.run(context)

        return {
            "context": context,
            "graph_trace": [
                self._trace(node_name, "started"),
                self._trace(node_name, "completed"),
            ],
        }

    def lead_intake(self, state: LeadWorkflowState) -> dict:
        return self._run_agent(
            state, "lead_intake", self.lead_intake_agent
        )

    def recency(self, state: LeadWorkflowState) -> dict:
        return self._run_agent(
            state, "recency", self.recency_agent
        )

    def engagement(self, state: LeadWorkflowState) -> dict:
        return self._run_agent(
            state, "engagement", self.engagement_agent
        )

    def fit_sla(self, state: LeadWorkflowState) -> dict:
        return self._run_agent(
            state, "fit_sla", self.fit_sla_agent
        )

    def decision(self, state: LeadWorkflowState) -> dict:
        return self._run_agent(
            state, "decision", self.decision_agent
        )

    def finalize(self, state: LeadWorkflowState) -> dict:
        context = state["context"]

        if context is None:
            raise RuntimeError("Workflow context was not initialized.")

        decision = context.agent_results[-1]
        details = decision.details

        recommendation = details.get("recommendation") or "REQUEST_DATA"
        reasons = details.get("reasons", [])
        triggered_rules = details.get("triggered_rules", [])

        final_trace = [
            self._trace("finalize", "started"),
            self._trace("finalize", "completed"),
        ]

        complete_trace = state["graph_trace"] + final_trace

        audit_reference = audit_service.record_workflow(
            workflow_id=context.workflow_id,
            lead_id=context.lead.lead_id,
            agent_outputs=context.agent_results,
            triggered_rules=triggered_rules,
            recommendation=recommendation,
            errors=context.errors,
            graph_execution_trace=complete_trace,
        )

        response = WorkflowResponse(
            workflow_id=context.workflow_id,
            lead_id=context.lead.lead_id,
            recommendation=recommendation,
            priority_score=decision.score,
            reasons=reasons,
            triggered_rules=triggered_rules,
            agent_outputs=context.agent_results,
            evidence=context.evidence,
            audit_reference=audit_reference,
            errors=context.errors,
        )

        return {
            "response": response,
            "graph_trace": final_trace,
        }

    def run(self, lead: LeadRecord) -> dict:
        initial_state: LeadWorkflowState = {
            "lead": lead,
            "context": None,
            "graph_trace": [],
            "response": None,
        }

        return self.graph.invoke(initial_state)


lead_workflow_graph = LeadWorkflowGraph()
