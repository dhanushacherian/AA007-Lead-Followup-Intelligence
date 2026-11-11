from app.models.schemas import AgentResult
from app.services.workflow_context import WorkflowContext
from app.agents.common import record_result


class LeadIntakeAgent:

    name = "Lead Intake Agent"

    def run(self, context: WorkflowContext) -> AgentResult:
        lead = context.lead
        issues = []

        if lead.contact is None:
            issues.append("Contact details are missing.")
        elif not lead.contact.name and not lead.contact.email and not lead.contact.phone:
            issues.append("At least one contact identifier is required.")

        if lead.stage is None:
            issues.append("Lead stage is missing.")

        if not lead.source:
            issues.append("Lead source is missing.")

        if issues:
            result = AgentResult(
                agent_name=self.name,
                status="NEEDS_DATA",
                summary="Required lead information is incomplete.",
                evidence=issues,
                details={"issues": issues},
            )
        else:
            evidence = [
                f"Lead ID: {lead.lead_id}",
                f"Lead stage: {lead.stage.value}",
                f"Lead source: {lead.source}",
            ]
            result = AgentResult(
                agent_name=self.name,
                status="PASS",
                summary="Lead intake validation passed.",
                evidence=evidence,
                details={"lead_id": lead.lead_id},
            )

        return record_result(context, result)
