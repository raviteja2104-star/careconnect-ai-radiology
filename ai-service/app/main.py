import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routers import radiology, symptoms

load_dotenv()

app = FastAPI(
    title="CareConnect AI Engine",
    description="AI-powered medical analysis engine for CareConnect Healthcare Platform. "
                "Provides radiology scan analysis and symptom checking capabilities.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(radiology.router)
app.include_router(symptoms.router)


@app.get("/")
async def root():
    return {
        "service": "CareConnect AI Engine",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "scan_analysis": "/api/ai/analyze-scan",
            "symptom_check": "/api/ai/check-symptoms",
            "model_info": "/api/ai/model-info",
            "symptom_list": "/api/ai/symptom-list",
            "documentation": "/docs",
        }
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "CareConnect AI Engine",
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
