from datetime import datetime, timezone

from app.models.schemas import AgentResult
from app.services.workflow_context import WorkflowContext
from app.agents.common import record_result


class FitSlaAgent:

    name = "Fit & SLA Agent"

    def run(self, context: WorkflowContext) -> AgentResult:
        lead = context.lead
        fit = (lead.declared_fit or "").upper()
        follow_up = lead.pending_follow_up

        evidence = [
            f"Declared fit: {fit or 'NOT PROVIDED'}.",
            f"Follow-up committed: {follow_up.committed}.",
        ]

        if follow_up.due_at is None:
            overdue = False
            evidence.append("No follow-up due date is available.")
        else:
            due_at = follow_up.due_at

            if due_at.tzinfo is None:
                due_at = due_at.replace(tzinfo=timezone.utc)

            overdue = (
                follow_up.committed
                and due_at < datetime.now(timezone.utc)
            )

            evidence.append(
                f"Follow-up due date: {due_at.isoformat()}."
            )

        if overdue:
            sla_status = "OVERDUE"
        elif follow_up.committed:
            sla_status = "COMMITTED"
        else:
            sla_status = "NO_COMMITMENT"

        result = AgentResult(
            agent_name=self.name,
            status="PASS",
            summary="Lead fit and follow-up commitment evaluated.",
            evidence=evidence,
            details={
                "declared_fit": fit or None,
                "sla_status": sla_status,
                "overdue": overdue,
            },
        )

        return record_result(context, result)
