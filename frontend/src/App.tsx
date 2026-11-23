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

type View = "overview" | "prioritize";

const agentGuides: Record<string, string> = {
  "Lead Intake Agent": "Checks whether essential lead information is available and valid.",
  "Recency Agent": "Evaluates lead age and how recently the lead was contacted.",
  "Engagement Agent": "Measures recorded engagement from the lead.",
  "Fit & SLA Agent": "Checks declared lead fit and overdue follow-up commitments.",
  "Lead Priority Decision Agent": "Combines agent findings and applies deterministic decision rules.",
};

const recommendationCopy: Record<string, { title: string; description: string; action: string }> = {
  FOLLOW_UP_NOW: {
    title: "Follow up now",
    description: "This lead needs immediate attention based on the available follow-up signals.",
    action: "Contact the lead as soon as practical and address the overdue commitment.",
  },
  FOLLOW_UP_SOON: {
    title: "Follow up soon",
    description: "This lead should remain high on the team's upcoming follow-up list.",
    action: "Schedule the next contact and keep the lead moving through the sales process.",
  },
  NURTURE: {
    title: "Continue nurturing",
    description: "The available signals suggest a lower immediate follow-up priority.",
    action: "Continue appropriate nurturing and review again when new engagement is recorded.",
  },
  REQUEST_DATA: {
    title: "Complete lead information",
    description: "The system needs additional mandatory information before it can prioritize this lead reliably.",
    action: "Review the lead record and provide the missing contact or stage information.",
  },
};

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [result, setResult] = useState<WorkflowResponse | null>(null);
  const [auditRecord, setAuditRecord] = useState<AuditRecord | null>(null);
  const [view, setView] = useState<View>("overview");
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
        const [healthData, leadData] = await Promise.all([checkBackendHealth(), getLeads()]);
        setHealth(healthData);
        setLeads(leadData);
        if (leadData.length > 0) setSelectedLeadId(leadData[0].lead_id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load the application data.");
      } finally {
        setLoading(false);
      }
    }
    void loadDashboard();
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
      setError(err instanceof Error ? err.message : "Prioritization could not be completed.");
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
      setAuditError(err instanceof Error ? err.message : "Unable to retrieve the audit record.");
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

  function displayValue(value: string | null | undefined) {
    return value || "Not provided";
  }

  function recommendationClass(recommendation: string) {
    if (recommendation === "FOLLOW_UP_NOW") return "urgent";
    if (recommendation === "FOLLOW_UP_SOON") return "soon";
    if (recommendation === "NURTURE") return "nurture";
    return "request";
  }

  function renderAgentCard(agent: AgentResult, index: number) {
    return (
      <article className="agent-card" key={`${agent.agent_name}-${index}`}>
        <div className="agent-card-heading">
          <span className="step-number">0{index + 1}</span>
          <span className="agent-status">{agent.status}</span>
        </div>
        <h4>{agent.agent_name}</h4>
        <p>{agentGuides[agent.agent_name] || "Processes its assigned workflow information."}</p>
        <strong className="detail-label">Agent summary</strong>
        <p>{agent.summary}</p>
        {agent.score !== null && <p className="agent-score">Score: {agent.score}</p>}
        {agent.evidence.length > 0 && (
          <>
            <strong className="detail-label">Evidence</strong>
            <ul>{agent.evidence.map((item, i) => <li key={i}>{item}</li>)}</ul>
          </>
        )}
        <details className="raw-details">
          <summary>View structured output</summary>
          <pre>{JSON.stringify(agent.details, null, 2)}</pre>
        </details>
      </article>
    );
  }

  const recommendation = result ? recommendationCopy[result.recommendation] : null;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" onClick={() => setView("overview")}>
          <span className="brand-mark">A7</span>
          <span>
            <strong>Lead Follow-up Intelligence</strong>
            <small>Sales Operations Workspace</small>
          </span>
        </a>
        <div className="topbar-right">
          <span className={`connection-pill ${health ? "connected" : "disconnected"}`}>
            <span className="status-dot" />
            {health ? "System connected" : "System unavailable"}
          </span>
        </div>
      </header>

      <nav className="main-nav" aria-label="Main navigation">
        <button className={view === "overview" ? "nav-link active" : "nav-link"} onClick={() => setView("overview")}>Overview</button>
        <button className={view === "prioritize" ? "nav-link active" : "nav-link"} onClick={() => setView("prioritize")}>Prioritize a lead</button>
        {result && <span className="nav-result">Latest recommendation ready</span>}
      </nav>

      <section className="welcome-section" id="top">
        <div>
          <p className="eyebrow">AA007 · SALES OPERATIONS</p>
          <h1>Make every follow-up count.</h1>
          <p className="welcome-copy">
            Review lead signals, understand follow-up priority, and decide what your team should do next.
          </p>
        </div>
        <div className="welcome-action">
          <span className="engine-label"><span className="status-dot" /> Evidence-based prioritization</span>
          <button className="primary-button" onClick={() => setView("prioritize")}>Prioritize a lead <span aria-hidden="true">→</span></button>
        </div>
      </section>

      {error && <div className="error-banner" role="alert">{error}</div>}

      {view === "overview" && (
        <>
          <section className="metrics-grid" aria-label="Lead overview">
            <article className="metric-card">
              <span className="metric-label">SAMPLE LEADS</span>
              <strong>{loading ? "—" : leads.length}</strong>
              <small>Available records to review</small>
            </article>
            <article className="metric-card">
              <span className="metric-label">COMMITTED FOLLOW-UPS</span>
              <strong>{loading ? "—" : attentionCount}</strong>
              <small>Commitments evaluated by the workflow</small>
            </article>
            <article className="metric-card">
              <span className="metric-label">DECISION OUTCOMES</span>
              <strong>04</strong>
              <small>Four supported recommendations</small>
            </article>
          </section>

          <section className="section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">GET STARTED</p>
                <h2>Choose a lead to review</h2>
                <p className="section-copy">Select one of the available sample records to see its business information and run prioritization.</p>
              </div>
              <button className="secondary-button" onClick={() => setView("prioritize")}>Open lead workspace →</button>
            </div>
            {loading ? (
              <div className="empty-state"><span className="loader" />Loading sample leads…</div>
            ) : leads.length === 0 ? (
              <div className="empty-state">No sample leads are currently available. Check the backend connection and try again.</div>
            ) : (
              <div className="lead-grid">
                {leads.map((lead) => (
                  <button className="lead-card" key={lead.lead_id} onClick={() => { selectLead(lead.lead_id); setView("prioritize"); }}>
                    <div className="lead-card-top">
                      <span className="lead-id">{lead.lead_id}</span>
                      <span className={`fit-tag ${(lead.declared_fit || "unknown").toLowerCase()}`}>{lead.declared_fit || "Fit unknown"}</span>
                    </div>
                    <h3>{lead.contact?.name || "Unnamed lead"}</h3>
                    <p>{lead.stage || "Stage not provided"} · {lead.age_days} days old</p>
                    <span className="card-action">Review lead <span aria-hidden="true">→</span></span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="how-panel">
            <div>
              <p className="eyebrow">A CLEAR BUSINESS PROCESS</p>
              <h2>From lead information to a practical next step</h2>
              <p className="section-copy">The application evaluates recorded lead details and returns a consistent recommendation with reasons and supporting evidence.</p>
            </div>
            <div className="process-steps">
              <div><span>01</span><strong>Review input</strong><small>Lead details and engagement</small></div>
              <div><span>02</span><strong>Prioritize</strong><small>Consistent business rules</small></div>
              <div><span>03</span><strong>Understand why</strong><small>Reasons and evidence</small></div>
              <div><span>04</span><strong>Take action</strong><small>Recommended next step</small></div>
            </div>
          </section>
        </>
      )}

      {view === "prioritize" && (
        <section className="workspace">
          <div className="section-heading workspace-heading">
            <div>
              <p className="eyebrow">LEAD WORKSPACE</p>
              <h2>Review and prioritize</h2>
              <p className="section-copy">Choose a sample lead, check the information, and run the prioritization workflow.</p>
            </div>
            <button className="text-button" onClick={() => setView("overview")}>← Back to overview</button>
          </div>

          <div className="workspace-grid">
            <aside className="panel lead-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">AVAILABLE RECORDS</p><h3>Lead list</h3></div>
                <span className="count-badge">{leads.length}</span>
              </div>
              {loading ? <p className="muted">Loading leads…</p> : leads.length === 0 ? <p className="muted">No lead records available.</p> : (
                <div className="lead-list">
                  {leads.map((lead) => (
                    <button className={`lead-item ${selectedLeadId === lead.lead_id ? "selected" : ""}`} key={lead.lead_id} onClick={() => selectLead(lead.lead_id)}>
                      <span className="lead-id">{lead.lead_id}</span>
                      <strong>{lead.contact?.name || "Unnamed lead"}</strong>
                      <small>{lead.stage || "No stage"} · {lead.age_days} days old</small>
                    </button>
                  ))}
                </div>
              )}
            </aside>

            <section className="panel detail-panel">
              <div className="panel-heading">
                <div><p className="eyebrow">BUSINESS INPUT</p><h3>Lead information</h3></div>
                {selectedLead && <span className="record-label">Selected lead</span>}
              </div>
              {!selectedLead ? <div className="empty-state">Select a lead from the list to review its information.</div> : (
                <>
                  <div className="profile-header">
                    <div className="avatar">{(selectedLead.contact?.name || "L").charAt(0).toUpperCase()}</div>
                    <div><h3>{selectedLead.contact?.name || selectedLead.lead_id}</h3><p>{selectedLead.contact?.email || selectedLead.contact?.phone || "Contact details not provided"}</p></div>
                  </div>
                  <div className="detail-grid">
                    <div><span>Lead ID</span><strong>{selectedLead.lead_id}</strong></div>
                    <div><span>Lead source</span><strong>{displayValue(selectedLead.source)}</strong></div>
                    <div><span>Sales stage</span><strong>{displayValue(selectedLead.stage)}</strong></div>
                    <div><span>Lead age</span><strong>{selectedLead.age_days} days</strong></div>
                    <div><span>Declared fit</span><strong>{displayValue(selectedLead.declared_fit)}</strong></div>
                    <div><span>Last contact</span><strong>{displayValue(selectedLead.last_contact_date)}</strong></div>
                    <div className="full-width"><span>Declared need</span><strong>{displayValue(selectedLead.declared_need)}</strong></div>
                    <div className="full-width"><span>Follow-up commitment</span><strong>{selectedLead.pending_follow_up.committed ? "Committed" : "No committed follow-up"}{selectedLead.pending_follow_up.due_at ? ` · Due ${selectedLead.pending_follow_up.due_at}` : ""}</strong></div>
                  </div>
                  <div className="engagement-section">
                    <div className="subsection-heading"><h4>Recorded engagement</h4><span>{selectedLead.engagement_events.length} events</span></div>
                    {selectedLead.engagement_events.length === 0 ? <p className="muted">No engagement events recorded.</p> : (
                      <ul className="event-list">
                        {selectedLead.engagement_events.map((event, index) => <li key={`${event.event_type}-${index}`}><span className="event-dot" /><div><strong>{event.event_type}</strong><p>{event.description || "No additional description"}</p><small>{event.occurred_at}</small></div></li>)}
                      </ul>
                    )}
                  </div>
                  <button className="primary-button run-button" onClick={handleRunWorkflow} disabled={running || loading || !health}>
                    {running ? "Evaluating lead…" : "Run prioritization"} {!running && <span aria-hidden="true">→</span>}
                  </button>
                  {!health && <p className="field-note">Connect the backend before running prioritization.</p>}
                  <p className="field-note">The recommendation is based on the selected record and the existing deterministic workflow.</p>
                </>
              )}
            </section>
          </div>
        </section>
      )}

      <section className="results-section">
        <div className="section-heading">
          <div><p className="eyebrow">DECISION RESULT</p><h2>Your prioritization result</h2></div>
          <span className={`result-state ${result ? "complete" : ""}`}>{running ? "IN PROGRESS" : result ? "COMPLETE" : "AWAITING RUN"}</span>
        </div>

        {!result && !running && <div className="empty-state result-empty"><span className="empty-symbol">◎</span><h3>Your recommendation will appear here</h3><p>Choose a lead and run prioritization. The result will include a clear next step and the evidence behind it.</p></div>}
        {running && <div className="empty-state result-empty"><span className="loader" /><h3>Reviewing lead signals</h3><p>The prioritization workflow is evaluating the selected lead.</p></div>}

        {result && recommendation && (
          <div className="result-content">
            <article className={`recommendation-card ${recommendationClass(result.recommendation)}`}>
              <div>
                <span className="recommendation-label">RECOMMENDATION FOR {result.lead_id}</span>
                <h3>{recommendation.title}</h3>
                <p>{recommendation.description}</p>
              </div>
              <div className="score-box"><strong>{result.priority_score ?? "—"}</strong><span>Priority score</span></div>
            </article>

            <div className="result-grid">
              <section className="panel result-panel">
                <p className="eyebrow">WHY THIS RESULT</p>
                <h3>Reasons for the recommendation</h3>
                {result.reasons.length ? <ul className="evidence-list">{result.reasons.map((reason, i) => <li key={i}>{reason}</li>)}</ul> : <p className="muted">No additional reasons were returned.</p>}
                <div className="next-action">
                  <span className="eyebrow">RECOMMENDED NEXT ACTION</span>
                  <p>{recommendation.action}</p>
                </div>
              </section>
              <section className="panel result-panel">
                <p className="eyebrow">SUPPORTING INFORMATION</p>
                <h3>Evidence from this lead</h3>
                {result.evidence.length ? <ul className="evidence-list">{result.evidence.map((item, i) => <li key={i}>{item}</li>)}</ul> : <p className="muted">No consolidated evidence was returned.</p>}
                <div className="audit-reference"><span>Audit reference</span><strong>{result.audit_reference}</strong></div>
              </section>
            </div>

            <details className="advanced-panel">
              <summary><span><strong>Advanced details</strong><small>Agent contributions, decision rules and audit trace</small></span><span className="advanced-toggle">View details</span></summary>
              <div className="advanced-content">
                <div className="advanced-meta">
                  <div><span>Workflow ID</span><strong>{result.workflow_id}</strong></div>
                  <div><span>Lead ID</span><strong>{result.lead_id}</strong></div>
                  <div><span>Agent results</span><strong>{result.agent_outputs.length}</strong></div>
                  <div><span>Triggered rules</span><strong>{result.triggered_rules.length}</strong></div>
                </div>
                <section className="advanced-subsection">
                  <h3>Triggered decision rules</h3>
                  {result.triggered_rules.length ? <div className="rule-list">{result.triggered_rules.map((rule) => <span className="rule-chip" key={rule}>{rule}</span>)}</div> : <p className="muted">No triggered rules were returned.</p>}
                </section>
                <section className="advanced-subsection">
                  <h3>Agent contributions</h3>
                  <div className="agent-grid">{result.agent_outputs.map(renderAgentCard)}</div>
                </section>
                <section className="advanced-subsection audit-section">
                  <div className="panel-heading"><div><h3>Audit record</h3><p className="muted">Retrieve the record using the reference generated for this workflow run.</p></div><button className="secondary-button" onClick={handleLoadAudit} disabled={auditLoading}>{auditLoading ? "Retrieving…" : "Retrieve audit record"}</button></div>
                  {auditError && <div className="error-banner" role="alert">{auditError}</div>}
                  {auditRecord && (
                    <div className="audit-result">
                      <p className="success-note">Audit record retrieved.</p>
                      <div className="advanced-meta">
                        <div><span>Audit reference</span><strong>{auditRecord.audit_reference}</strong></div>
                        <div><span>Execution time (UTC)</span><strong>{auditRecord.execution_timestamp}</strong></div>
                        <div><span>Final recommendation</span><strong>{auditRecord.final_recommendation}</strong></div>
                        <div><span>Agent sequence</span><strong>{auditRecord.agent_execution_sequence.length} agents</strong></div>
                      </div>
                      <details className="raw-details"><summary>View recorded execution sequence and data</summary><ol>{auditRecord.agent_execution_sequence.map((name, i) => <li key={`${name}-${i}`}>{name}</li>)}</ol><pre>{JSON.stringify(auditRecord, null, 2)}</pre></details>
                    </div>
                  )}
                  <p className="field-note">Audit records are currently held in memory and are cleared when the backend restarts.</p>
                </section>
              </div>
            </details>
            {result.errors.length > 0 && <div className="error-banner">{result.errors.map((item, i) => <p key={i}>{item}</p>)}</div>}
          </div>
        )}
      </section>

      <footer className="footer">
        <span>AA007 · Lead Follow-up Prioritization Intelligence</span>
        <span>Recommendations are evidence-based decision support; customer contact remains a human action.</span>
      </footer>
    </main>
  );
}

export default App;
