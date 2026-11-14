
from copy import deepcopy
from datetime import datetime, timezone
from threading import RLock
from typing import Any

from app.models.schemas import AgentResult


class AuditService:
    """Store and retrieve workflow audit records in memory."""

    def __init__(self):
        self._records: dict[str, dict[str, Any]] = {}
        self._lock = RLock()

    def record_workflow(
        self,
        workflow_id: str,
        lead_id: str,
        agent_outputs: list[AgentResult],
        triggered_rules: list[str],
        recommendation: str,
        errors: list[str],
        graph_execution_trace: list[dict[str, str]] | None = None,
    ) -> str:
        """Save a completed workflow and return its audit reference."""

        audit_reference = f"AUDIT-{workflow_id}"

        record = {
            "audit_reference": audit_reference,
            "workflow_id": workflow_id,
            "lead_id": lead_id,
            "execution_timestamp": datetime.now(timezone.utc).isoformat(),
            "agent_execution_sequence": [
                agent.agent_name for agent in agent_outputs
            ],
            "agent_outputs": [
                agent.model_dump(mode="json")
                for agent in agent_outputs
            ],
            "triggered_rules": list(triggered_rules),
            "final_recommendation": recommendation,
            "errors": list(errors),
            "graph_execution_trace": deepcopy(graph_execution_trace or []),
        }

        with self._lock:
            self._records[audit_reference] = record

        return audit_reference

    def get_audit_record(
        self,
        audit_reference: str,
    ) -> dict[str, Any] | None:
        """Retrieve a stored audit record by its reference."""

        with self._lock:
            record = self._records.get(audit_reference)

            if record is None:
                return None

            return deepcopy(record)


audit_service = AuditService()
