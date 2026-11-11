from app.models.schemas import AgentResult
from app.services.workflow_context import WorkflowContext
from app.agents.common import record_result


class LeadPriorityDecisionAgent:

    name = "Lead Priority Decision Agent"

    REQUIRED_AGENTS = {
        "Lead Intake Agent",
        "Recency Agent",
        "Engagement Agent",
        "Fit & SLA Agent",
    }

    def run(self, context: WorkflowContext) -> AgentResult:

        results = {
            item.agent_name: item
            for item in context.agent_results
            if item.agent_name != self.name
        }

        completed = set(results)

        if not self.REQUIRED_AGENTS.issubset(completed):
            result = AgentResult(
                agent_name=self.name,
                status="INCOMPLETE",
                summary="Required agent results are missing.",
                evidence=[
                    f"Completed agents: {len(self.REQUIRED_AGENTS.intersection(completed))} of 4."
                ],
                details={
                    "recommendation": None,
                    "triggered_rules": [],
                },
            )
            return record_result(context, result)

        intake = results["Lead Intake Agent"]
        recency = results["Recency Agent"]
        engagement = results["Engagement Agent"]
        fit_sla = results["Fit & SLA Agent"]

        recommendation = None
        triggered_rules = []
        reasons = []

        # Rule 1: Missing mandatory lead information.
        issues = intake.details.get("issues", [])

        if intake.status != "PASS" or issues:
            recommendation = "REQUEST_DATA"
            triggered_rules.append("AA007-RULE-01")
            reasons.extend(
                issues or ["Lead intake validation did not pass."]
            )

        # Rule 2: A committed follow-up is overdue.
        elif fit_sla.details.get("overdue") is True:
            recommendation = "FOLLOW_UP_NOW"
            triggered_rules.append("AA007-RULE-02")
            reasons.append(
                "A committed follow-up is overdue."
            )

        # Rule 3: High fit, recent contact and recorded engagement.
        elif (
            fit_sla.details.get("declared_fit") == "HIGH"
            and recency.status == "RECENT"
            and engagement.status in {"HIGH", "MODERATE"}
        ):
            recommendation = "FOLLOW_UP_NOW"
            triggered_rules.append("AA007-RULE-03")
            reasons.extend([
                "Declared fit is HIGH.",
                "Lead contact is recent.",
                "Engagement activity is recorded.",
            ])

        # Rule 4: Stale contact and no engagement.
        elif (
            recency.status == "STALE"
            and engagement.status == "LOW"
        ):
            recommendation = "NURTURE"
            triggered_rules.append("AA007-RULE-04")
            reasons.extend([
                "Lead contact is stale.",
                "No engagement events are recorded.",
            ])

        # Rule 5: Default deterministic outcome.
        else:
            recommendation = "FOLLOW_UP_SOON"
            triggered_rules.append("AA007-RULE-05")
            reasons.append(
                "No immediate-follow-up or nurture rule was triggered."
            )

        evidence = [
            f"Recommendation: {recommendation}",
            *reasons,
            f"Rules triggered: {', '.join(triggered_rules)}",
        ]

        result = AgentResult(
            agent_name=self.name,
            status="DECIDED",
            summary=f"Recommendation: {recommendation}",
            evidence=evidence,
            details={
                "recommendation": recommendation,
                "triggered_rules": triggered_rules,
                "reasons": reasons,
                "agents_considered": sorted(self.REQUIRED_AGENTS),
            },
        )

        return record_result(context, result)
