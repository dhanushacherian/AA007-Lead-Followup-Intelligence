from app.models.schemas import AgentResult
from app.services.workflow_context import WorkflowContext
from app.agents.common import record_result


class EngagementAgent:

    name = "Engagement Agent"

    def run(self, context: WorkflowContext) -> AgentResult:
        events = context.lead.engagement_events

        event_types = [event.event_type.upper() for event in events]

        if not events:
            status = "LOW"
            summary = "No engagement events are recorded."
        elif len(events) >= 2:
            status = "HIGH"
            summary = "Multiple engagement events are recorded."
        else:
            status = "MODERATE"
            summary = "One engagement event is recorded."

        evidence = [
            f"Recorded engagement events: {len(events)}."
        ]

        evidence.extend(
            f"Engagement event: {event_type}"
            for event_type in event_types
        )

        result = AgentResult(
            agent_name=self.name,
            status=status,
            summary=summary,
            evidence=evidence,
            details={
                "event_count": len(events),
                "event_types": event_types,
            },
        )

        return record_result(context, result)
