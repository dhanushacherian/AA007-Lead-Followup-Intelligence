import { useEffect, useMemo, useState } from "react";
import {
  checkBackendHealth,
  getLeads,
  runWorkflow,
  getAuditRecord,
  type HealthResponse,
  type LeadRecord,
  type WorkflowResponse,
  type AuditRecord,
  type AgentResult,
} from "./api";
import "./App.css";

const agentGuides: Record<string, { responsibility: string; inputs: string }> = {
  "Lead Intake Agent": {
    responsibility: "Checks whether essential lead information is available and valid.",
    inputs: "Contact name, email or phone, lead stage and source.",
  },
  "Recency Agent": {
    responsibility: "Evaluates how old the lead is and how recently the lead was contacted.",
    inputs: "Lead age in days and last contact date.",
  },
  "Engagement Agent": {
    responsibility: "Measures the level of recorded engagement from the lead.",
    inputs: "Engagement event count and event types.",
  },
  "Fit & SLA Agent": {
    responsibility: "Checks declared lead fit and whether a committed follow-up is overdue.",
    inputs: "Declared fit, follow-up commitment and due date.",
  },
  "Lead Priority Decision Agent": {
    responsibility: "Combines the preceding agent outputs and applies deterministic decision rules.",
    inputs: "Intake status, recency, engagement, fit and SLA results.",
  },
};

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [result, setResult] = useState<WorkflowResponse | null>(null);
  const [auditRecord, setAuditRecord] = useState<AuditRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [error, setError] = useState("");
  const [auditError, setAuditError] = useState("");

  const selectedLead = leads.find((lead) => lead.lead_id === selectedLeadId) ?? null;

  const attentionCount = useMemo(
    () => leads.filter((lead) => lead.pending_follow_up.committed).length,
    [leads]
  );

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [healthData, leadData] = await Promise.all([
          checkBackendHealth(),
          getLeads(),
        ]);

        setHealth(healthData);
        setLeads(leadData);

        if (leadData.length > 0) {
          setSelectedLeadId(leadData[0].lead_id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load dashboard.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  async function handleRunWorkflow() {
    if (!selectedLead) return;

    try {
      setRunning(true);
      setError("");
      setAuditError("");
      setResult(null);
      setAuditRecord(null);

      const workflowResult = await runWorkflow(selectedLead);
      setResult(workflowResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Workflow execution failed.");
    } finally {
      setRunning(false);
    }
  }

  async function handleLoadAudit() {
    if (!result) return;

    try {
      setAuditLoading(true);
      setAuditError("");
      setAuditRecord(null);

      const record = await getAuditRecord(result.audit_reference);
      setAuditRecord(record);
    } catch (err) {
      setAuditError(
        err instanceof Error ? err.message : "Unable to retrieve audit record."
      );
    } finally {
      setAuditLoading(false);
    }
  }

  function selectLead(leadId: string) {
    setSelectedLeadId(leadId);
    setResult(null);
    setAuditRecord(null);
    setError("");
    setAuditError("");
  }

  function recommendationClass(recommendation: string) {
    if (recommendation === "FOLLOW_UP_NOW") return "urgent";
    if (recommendation === "FOLLOW_UP_SOON") return "soon";
    if (recommendation === "NURTURE") return "nurture";
    return "request";
  }

  function displayValue(value: string | null | undefined) {
    return value || "Not provided";
  }

  function formatDetails(details: Record<string, unknown>) {
    return JSON.stringify(details, null, 2);
  }

  function renderAgentCard(agent: AgentResult, index: number) {
    const guide = agentGuides[agent.agent_name];

    return (
      <article className="agent-card" key={`${agent.agent_name}-${index}`}>
        <div className="agent-card-top">
          <span className="agent-number">STEP 0{index + 1}</span>
          <span className="agent-status">{agent.status}</span>
        </div>

        <h4>{agent.agent_name}</h4>
        <p className="agent-responsibility">
          {guide?.responsibility || "Processes its assigned workflow information."}
        </p>

        <div className="agent-input-box">
          <strong>Important inputs</strong>
          <p>{guide?.inputs || "See the structured output below."}</p>
        </div>

        <p className="agent-summary">{agent.summary}</p>

        <div className="structured-output">
          <strong>Structured output</strong>
          <pre>{formatDetails(agent.details)}</pre>
          {agent.score !== null && (
            <p className="agent-score">Score: {agent.score}</p>
          )}
        </div>

        {agent.evidence.length > 0 && (
          <div className="agent-evidence">
            <strong>Evidence produced</strong>
            <ul>
              {agent.evidence.map((item, evidenceIndex) => (
                <li key={evidenceIndex}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </article>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">A7</div>
          <div>
            <div className="brand-name">AA007 Intelligence</div>
            <div className="brand-subtitle">Sales Operations · Lead Prioritization</div>
          </div>
        </div>

        <div className="connection">
          <span className={`status-dot ${health ? "online" : "offline"}`} />
          <span>{health ? "Backend connected" : "Backend unavailable"}</span>
        </div>
      </header>

      <section className="page-heading">
        <div>
          <p className="eyebrow">AGENTIC AI MVP · PHASE 1.2</p>
          <h1>Lead Follow-up Intelligence</h1>
          <p className="page-description">
            Understand how specialized agents evaluate lead information,
            share workflow context and produce evidence-based decisions.
          </p>
        </div>
        <div className="system-label">
          <span className="system-label-dot" />
          Deterministic workflow engine
        </div>
      </section>

      {error && <div className="error-banner">{error}</div>}

      <section className="metrics-grid">
        <article className="metric-card">
          <span className="metric-label">TOTAL LEADS</span>
          <strong>{loading ? "—" : leads.length}</strong>
          <span className="metric-note">Available sample records</span>
        </article>
        <article className="metric-card">
          <span className="metric-label">COMMITTED FOLLOW-UPS</span>
          <strong>{loading ? "—" : attentionCount}</strong>
          <span className="metric-note">Require deadline evaluation</span>
        </article>
        <article className="metric-card">
          <span className="metric-label">AGENT FRAMEWORK</span>
          <strong>05</strong>
          <span className="metric-note">Specialized workflow agents</span>
        </article>
        <article className="metric-card">
          <span className="metric-label">WORKFLOW STATUS</span>
          <strong className="metric-status">
            {result ? "Complete" : running ? "Running" : "Ready"}
          </strong>
          <span className="metric-note">Current session</span>
        </article>
      </section>

      <section className="explainer-panel">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">HOW THE SYSTEM WORKS</p>
            <h2>Agent workflow architecture</h2>
          </div>
          <span className="count-badge">5 AGENTS</span>
        </div>

        <p className="workflow-intro">
          Each workflow run starts with one business lead record. The Context
          Builder prepares a run-scoped shared workflow context. Five agents
          then execute in sequence, contributing their results and evidence
          before the decision agent selects a recommendation.
        </p>

        <div className="workflow-flow">
          <div className="flow-node">
            <span>01</span>
            <strong>Business Input</strong>
            <small>Lead record</small>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-node">
            <span>02</span>
            <strong>Context Builder</strong>
            <small>Prepares context</small>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-node context-node">
            <span>03</span>
            <strong>Run-Scoped Shared Context</strong>
            <small>Shared workflow data</small>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-node agent-flow-node">
            <span>04</span>
            <strong>Five Agents</strong>
            <small>Sequential evaluation</small>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-node">
            <span>05</span>
            <strong>Rules & Evidence</strong>
            <small>Decision logic</small>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-node decision-node">
            <span>06</span>
            <strong>Recommendation</strong>
            <small>Audit record</small>
          </div>
        </div>

        <div className="workflow-note">
          <strong>Shared context:</strong> The lead data, workflow ID, agent
          results, collected evidence, errors and metadata are held in the
          current workflow context. This is run-scoped data, not permanent memory.
        </div>
      </section>

      <div className="workspace-grid">
        <aside className="panel lead-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">RECORDS</p>
              <h2>Lead directory</h2>
            </div>
            <span className="count-badge">{leads.length}</span>
          </div>

          {loading ? (
            <p className="muted">Loading leads...</p>
          ) : leads.length === 0 ? (
            <p className="muted">No lead records available.</p>
          ) : (
            <div className="lead-list">
              {leads.map((lead) => (
                <button
                  className={`lead-item ${selectedLeadId === lead.lead_id ? "selected" : ""}`}
                  key={lead.lead_id}
                  onClick={() => selectLead(lead.lead_id)}
                >
                  <div className="lead-item-top">
                    <span className="lead-id">{lead.lead_id}</span>
                    <span className={`fit-tag ${(lead.declared_fit || "unknown").toLowerCase()}`}>
                      {lead.declared_fit || "UNKNOWN"}
                    </span>
                  </div>
                  <strong>{lead.contact?.name || "Unnamed lead"}</strong>
                  <span className="lead-meta">
                    {lead.stage || "No stage"} · {lead.age_days} days old
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="directory-note">
            <span className="info-icon">i</span>
            Select a lead to inspect its details and run the prioritization workflow.
          </div>
        </aside>

        <section className="panel detail-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">BUSINESS INPUT</p>
              <h2>Lead details</h2>
            </div>
            {selectedLead && <span className="record-label">Selected record</span>}
          </div>

          {!selectedLead ? (
            <p className="muted">Select a lead to view its information.</p>
          ) : (
            <>
              <div className="profile-header">
                <div className="avatar">
                  {(selectedLead.contact?.name || "L").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3>{selectedLead.contact?.name || selectedLead.lead_id}</h3>
                  <p>{selectedLead.contact?.email || selectedLead.lead_id}</p>
                </div>
              </div>

              <div className="detail-grid">
                <div className="detail-field">
                  <span>Lead ID</span>
                  <strong>{selectedLead.lead_id}</strong>
                </div>
                <div className="detail-field">
                  <span>Source</span>
                  <strong>{displayValue(selectedLead.source)}</strong>
                </div>
                <div className="detail-field">
                  <span>Current stage</span>
                  <strong>{displayValue(selectedLead.stage)}</strong>
                </div>
                <div className="detail-field">
                  <span>Lead age</span>
                  <strong>{selectedLead.age_days} days</strong>
                </div>
                <div className="detail-field">
                  <span>Declared fit</span>
                  <strong>{displayValue(selectedLead.declared_fit)}</strong>
                </div>
                <div className="detail-field">
                  <span>Last contact</span>
                  <strong>{displayValue(selectedLead.last_contact_date)}</strong>
                </div>
                <div className="detail-field full-width">
                  <span>Declared need</span>
                  <strong>{displayValue(selectedLead.declared_need)}</strong>
                </div>
                <div className="detail-field full-width">
                  <span>Follow-up commitment</span>
                  <strong>
                    {selectedLead.pending_follow_up.committed ? "Committed" : "No committed follow-up"}
                    {selectedLead.pending_follow_up.due_at
                      ? ` · Due ${selectedLead.pending_follow_up.due_at}`
                      : ""}
                  </strong>
                </div>
              </div>

              <div className="engagement-section">
                <h3>Engagement history</h3>
                {selectedLead.engagement_events.length === 0 ? (
                  <p className="muted">No engagement events recorded.</p>
                ) : (
                  <div className="event-list">
                    {selectedLead.engagement_events.map((event, index) => (
                      <div className="event-item" key={`${event.event_type}-${index}`}>
                        <span className="event-marker" />
                        <div>
                          <strong>{event.event_type}</strong>
                          <p>{event.description || "No additional description"}</p>
                          <span>{event.occurred_at}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="run-button"
                onClick={handleRunWorkflow}
                disabled={running || loading}
              >
                {running ? "Executing five agents..." : "Run Prioritization"}
                {!running && <span aria-hidden="true">→</span>}
              </button>
              <p className="button-note">
                Runs the five-agent workflow against the selected lead record.
              </p>
            </>
          )}
        </section>
      </div>

      <section className="results-section">
        <div className="results-heading">
          <div>
            <p className="eyebrow">DECISION INTELLIGENCE</p>
            <h2>Workflow results</h2>
          </div>
          <span className={`result-state ${result ? "complete" : ""}`}>
            {running ? "PROCESSING" : result ? "COMPLETED" : "AWAITING EXECUTION"}
          </span>
        </div>

        {!result && !running && (
          <div className="empty-results">
            <div className="empty-icon">◎</div>
            <h3>No workflow results yet</h3>
            <p>Select a lead and run prioritization to see the recommendation,
              agent outputs, decision rules and supporting evidence.</p>
          </div>
        )}

        {running && (
          <div className="empty-results">
            <div className="loading-spinner" />
            <h3>Analyzing lead information</h3>
            <p>The workflow agents are evaluating the selected record.</p>
          </div>
        )}

        {result && (
          <div className="result-content">
            <section className="context-summary">
              <div className="section-title-row">
                <div>
                  <p className="eyebrow">CURRENT WORKFLOW RUN</p>
                  <h3>Run-scoped shared workflow context</h3>
                </div>
                <span className="record-label">Active run result</span>
              </div>

              <div className="context-grid">
                <div className="context-item">
                  <span>Workflow ID</span>
                  <strong>{result.workflow_id}</strong>
                </div>
                <div className="context-item">
                  <span>Lead ID</span>
                  <strong>{result.lead_id}</strong>
                </div>
                <div className="context-item">
                  <span>Agent results</span>
                  <strong>{result.agent_outputs.length}</strong>
                </div>
                <div className="context-item">
                  <span>Collected evidence</span>
                  <strong>{result.evidence.length}</strong>
                </div>
                <div className="context-item">
                  <span>Workflow errors</span>
                  <strong>{result.errors.length}</strong>
                </div>
                <div className="context-item">
                  <span>Audit reference</span>
                  <strong>{result.audit_reference}</strong>
                </div>
              </div>
              <p className="context-footnote">
                Values above come from the completed workflow response. The
                context is scoped to this execution and is not persistent memory.
              </p>
            </section>

            <div className={`recommendation-card ${recommendationClass(result.recommendation)}`}>
              <div>
                <span className="recommendation-label">FINAL RECOMMENDATION</span>
                <h3>{result.recommendation.replaceAll("_", " ")}</h3>
                <p>Lead: {result.lead_id}</p>
              </div>
              <div className="recommendation-symbol">✓</div>
            </div>

            <div className="result-columns">
              <div className="result-panel">
                <h3>Decision reasoning</h3>
                {result.reasons.length > 0 ? (
                  <ul className="evidence-list">
                    {result.reasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No additional reasons returned.</p>
                )}

                <h3 className="subheading">Triggered rules</h3>
                <div className="rule-list">
                  {result.triggered_rules.length > 0 ? result.triggered_rules.map((rule) => (
                    <span className="rule-chip" key={rule}>{rule}</span>
                  )) : <span className="muted">No rules returned.</span>}
                </div>
              </div>

              <div className="result-panel">
                <h3>Execution audit</h3>
                <div className="audit-field">
                  <span>Workflow ID</span>
                  <strong>{result.workflow_id}</strong>
                </div>
                <div className="audit-field">
                  <span>Audit reference</span>
                  <strong>{result.audit_reference}</strong>
                </div>
                <div className="audit-field">
                  <span>Agent count</span>
                  <strong>{result.agent_outputs.length}</strong>
                </div>
                <div className="audit-field">
                  <span>Priority score</span>
                  <strong>{result.priority_score ?? "Not scored"}</strong>
                </div>
              </div>
            </div>

            <div className="agents-panel">
              <div className="section-title-row">
                <div>
                  <p className="eyebrow">MULTI-AGENT EXECUTION</p>
                  <h3>Agent activity and structured outputs</h3>
                </div>
                <span className="count-badge">{result.agent_outputs.length} agents</span>
              </div>

              <p className="workflow-intro">
                Agents are displayed in the actual order returned by the workflow.
                Each agent contributes results and evidence to the shared context.
              </p>

              <div className="agent-grid">
                {result.agent_outputs.map((agent, index) =>
                  renderAgentCard(agent, index)
                )}
              </div>
            </div>

            <div className="evidence-panel">
              <h3>Consolidated decision evidence</h3>
              {result.evidence.length > 0 ? (
                <ul className="evidence-list">
                  {result.evidence.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No consolidated evidence returned.</p>
              )}
            </div>

            <section className="audit-inspector">
              <div className="section-title-row">
                <div>
                  <p className="eyebrow">RETRIEVABLE RECORD</p>
                  <h3>Stored workflow audit</h3>
                  <p className="muted">
                    Retrieve the saved execution record using its audit reference.
                  </p>
                </div>
                <button
                  className="audit-button"
                  onClick={handleLoadAudit}
                  disabled={auditLoading}
                >
                  {auditLoading ? "Retrieving..." : "Retrieve audit record"}
                </button>
              </div>

              {auditError && <div className="error-banner">{auditError}</div>}

              {auditRecord && (
                <div className="audit-record-content">
                  <div className="audit-record-status">Audit record retrieved successfully</div>
                  <div className="context-grid">
                    <div className="context-item">
                      <span>Audit reference</span>
                      <strong>{auditRecord.audit_reference}</strong>
                    </div>
                    <div className="context-item">
                      <span>Execution timestamp (UTC)</span>
                      <strong>{auditRecord.execution_timestamp}</strong>
                    </div>
                    <div className="context-item">
                      <span>Final recommendation</span>
                      <strong>{auditRecord.final_recommendation}</strong>
                    </div>
                    <div className="context-item">
                      <span>Recorded agent sequence</span>
                      <strong>{auditRecord.agent_execution_sequence.length} agents</strong>
                    </div>
                  </div>

                  <h4>Recorded execution sequence</h4>
                  <ol className="audit-sequence">
                    {auditRecord.agent_execution_sequence.map((name, index) => (
                      <li key={`${name}-${index}`}>{name}</li>
                    ))}
                  </ol>

                  <h4>Stored audit data</h4>
                  <pre className="audit-json">
                    {JSON.stringify(auditRecord, null, 2)}
                  </pre>
                </div>
              )}

              <p className="context-footnote">
                Audit storage is currently in memory. Records are available while
                the backend process remains running and are cleared when it restarts.
              </p>
            </section>

            {result.errors.length > 0 && (
              <div className="error-banner">
                {result.errors.map((item, index) => <p key={index}>{item}</p>)}
              </div>
            )}
          </div>
        )}
      </section>

      <footer className="footer">
        <span>AA007 · Lead Follow-up Prioritization Intelligence</span>
        <span>Phase 1.2 · Explainable deterministic agent workflow</span>
      </footer>
    </main>
  );
}

export default App;
