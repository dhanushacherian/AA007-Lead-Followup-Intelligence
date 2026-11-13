const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export interface HealthResponse {
  status: string;
  service: string;
}

export interface ContactDetails {
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface EngagementEvent {
  event_type: string;
  occurred_at: string;
  description: string | null;
}

export interface PendingFollowUp {
  committed: boolean;
  due_at: string | null;
  description: string | null;
}

export interface LeadRecord {
  lead_id: string;
  contact: ContactDetails | null;
  source: string | null;
  age_days: number;
  last_contact_date: string | null;
  engagement_events: EngagementEvent[];
  declared_need: string | null;
  declared_fit: string | null;
  stage: string | null;
  pending_follow_up: PendingFollowUp;
}

export interface AgentResult {
  agent_name: string;
  status: string;
  summary: string;
  evidence: string[];
  score: number | null;
  details: Record<string, unknown>;
}

export interface WorkflowResponse {
  workflow_id: string;
  lead_id: string;
  recommendation: string;
  priority_score: number | null;
  reasons: string[];
  triggered_rules: string[];
  agent_outputs: AgentResult[];
  evidence: string[];
  audit_reference: string;
  errors: string[];
}

export interface AuditRecord {
  audit_reference: string;
  workflow_id: string;
  lead_id: string;
  execution_timestamp: string;
  agent_execution_sequence: string[];
  agent_outputs: AgentResult[];
  triggered_rules: string[];
  final_recommendation: string;
  errors: string[];
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`API error ${response.status}: ${message}`);
  }

  return response.json() as Promise<T>;
}

export async function checkBackendHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`);
  return handleResponse<HealthResponse>(response);
}

export async function getLeads(): Promise<LeadRecord[]> {
  const response = await fetch(`${API_BASE_URL}/leads`);
  return handleResponse<LeadRecord[]>(response);
}

export async function runWorkflow(
  lead: LeadRecord
): Promise<WorkflowResponse> {
  const response = await fetch(`${API_BASE_URL}/workflow/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lead }),
  });

  return handleResponse<WorkflowResponse>(response);
}

export async function getAuditRecord(
  auditReference: string
): Promise<AuditRecord> {
  const response = await fetch(
    `${API_BASE_URL}/audit/${encodeURIComponent(auditReference)}`
  );

  return handleResponse<AuditRecord>(response);
}

