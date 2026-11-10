from fastapi import FastAPI

app = FastAPI(
    title="AA007 - Lead Follow-up Prioritization Intelligence",
    description="Deterministic agentic AI MVP for lead follow-up prioritization.",
    version="0.1.0",
)


@app.get("/")
def root():
    return {
        "project": "AA007 - Lead Follow-up Prioritization Intelligence",
        "status": "running",
        "message": "Welcome to the AA007 API"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AA007 Backend"
    }
