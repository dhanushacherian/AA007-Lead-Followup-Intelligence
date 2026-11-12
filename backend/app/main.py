from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.data.seed_leads import get_seed_leads
from app.models.schemas import (
    LeadRecord,
    WorkflowRequest,
    WorkflowResponse,
)
from app.services.workflow_service import LeadWorkflowService
from app.services.audit_service import audit_service


app = FastAPI(
    title="AA007 - Lead Follow-up Prioritization Intelligence",
    description="Deterministic agentic AI MVP for lead follow-up prioritization.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

workflow_service = LeadWorkflowService()


@app.get("/")
def root():
    return {
        "project": "AA007 - Lead Follow-up Prioritization Intelligence",
        "status": "running",
        "message": "Welcome to the AA007 API",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AA007 Backend",
    }


@app.get("/leads", response_model=list[LeadRecord])
def list_leads():
    """Return the seeded sample leads."""
    return get_seed_leads()


@app.post("/workflow/run", response_model=WorkflowResponse)
def run_lead_workflow(request: WorkflowRequest):
    """Execute all five agents and return the lead decision."""
    return workflow_service.run(request)


@app.get("/audit/{audit_reference}")
def get_audit_record(audit_reference: str):
    """Retrieve an actual stored workflow audit record."""
    record = audit_service.get_audit_record(audit_reference)

    if record is None:
        raise HTTPException(
            status_code=404,
            detail="Audit record not found.",
        )

    return record
