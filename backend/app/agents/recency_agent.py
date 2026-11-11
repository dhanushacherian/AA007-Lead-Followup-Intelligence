from datetime import date

from app.models.schemas import AgentResult
from app.services.workflow_context import WorkflowContext
from app.agents.common import record_result


class RecencyAgent:

    name = "Recency Agent"

    def run(self, context: WorkflowContext) -> AgentResult:
        lead = context.lead
        today = date.today()

        evidence = [f"Lead age: {lead.age_days} days."]

        if lead.last_contact_date is None:
            evidence.append("Last contact date is unavailable.")
            status = "MISSING_DATA"
            summary = "Cannot evaluate last-contact recency."
            recency_days = None
        else:
            recency_days = (today - lead.last_contact_date).days
            evidence.append(f"Days since last contact: {recency_days}.")

            if recency_days < 0:
                status = "INVALID_DATA"
                summary = "Last contact date is in the future."
            elif recency_days <= 3:
                status = "RECENT"
                summary = "Lead was contacted recently."
            elif recency_days <= 14:
                status = "MODERATE"
                summary = "Lead contact is moderately recent."
            else:
                status = "STALE"
                summary = "Lead has not been contacted recently."

        result = AgentResult(
            agent_name=self.name,
            status=status,
            summary=summary,
            evidence=evidence,
            details={
                "lead_age_days": lead.age_days,
                "days_since_last_contact": recency_days,
            },
        )
        return record_result(context, result)
