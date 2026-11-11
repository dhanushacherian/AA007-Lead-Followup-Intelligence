import { useEffect, useMemo, useState } from "react";
import {
  checkBackendHealth,
  getLeads,
  runWorkflow,
  type HealthResponse,
  type LeadRecord,
  type WorkflowResponse,
} from "./api";
import "./App.css";

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [result, setResult] = useState<WorkflowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

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
      setResult(null);

      const workflowResult = await runWorkflow(selectedLead);
      setResult(workflowResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Workflow execution failed.");
    } finally {
      setRunning(false);
    }
  }

  function selectLead(leadId: string) {
    setSelectedLeadId(leadId);
    setResult(null);
    setError("");
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
          <p className="eyebrow">AGENTIC AI MVP · WORKSPACE</p>
          <h1>Lead Follow-up Intelligence</h1>
          <p className="page-description">
            Evaluate lead recency, engagement, fit and follow-up commitments
            to generate evidence-based prioritization decisions.
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
              <p className="eyebrow">LEAD PROFILE</p>
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
            <div className={`recommendation-card ${recommendationClass(result.recommendation)}`}>
              <div>
                <span className="recommendation-label">RECOMMENDED ACTION</span>
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
                {result.priority_score !== null && (
                  <div className="audit-field">
                    <span>Priority score</span>
                    <strong>{result.priority_score}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="agents-panel">
              <div className="section-title-row">
                <div>
                  <p className="eyebrow">MULTI-AGENT EXECUTION</p>
                  <h3>Agent activity</h3>
                </div>
                <span className="count-badge">{result.agent_outputs.length} agents</span>
              </div>

              <div className="agent-grid">
                {result.agent_outputs.map((agent, index) => (
                  <article className="agent-card" key={`${agent.agent_name}-${index}`}>
                    <div className="agent-card-top">
                      <span className="agent-number">0{index + 1}</span>
                      <span className="agent-status">{agent.status}</span>
                    </div>
                    <h4>{agent.agent_name}</h4>
                    <p>{agent.summary}</p>
                    {agent.evidence.length > 0 && (
                      <ul>
                        {agent.evidence.map((item, evidenceIndex) => (
                          <li key={evidenceIndex}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </div>

            <div className="evidence-panel">
              <h3>Consolidated evidence</h3>
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
        <span>Phase 1.1 MVP · Deterministic agent workflow</span>
      </footer>
    </main>
  );
}

export default App;
