from fastapi import APIRouter, HTTPException
from app.models.schemas import SymptomCheckRequest
from app.services.symptom_checker import SymptomCheckerService

router = APIRouter(prefix="/api/ai", tags=["AI Symptom Checker"])


@router.post("/check-symptoms")
async def check_symptoms(request: SymptomCheckRequest):
    """
    Analyze patient symptoms using AI.
    
    Returns possible conditions, severity assessment,
    urgency level, and personalized recommendations.
    """
    try:
        result = SymptomCheckerService.analyze_symptoms(
            symptoms=request.symptoms,
            duration=request.duration,
            severity=request.severity,
            age=request.age,
            gender=request.gender,
            additional_info=request.additionalInfo
        )

        return {
            "success": True,
            "message": "Symptom analysis completed",
            "data": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Symptom analysis failed: {str(e)}")


@router.get("/symptom-list")
async def get_supported_symptoms():
    """Get list of symptoms the AI engine can analyze."""
    return {
        "success": True,
        "data": {
            "symptoms": list(SymptomCheckerService.SYMPTOM_DATABASE.keys()),
            "totalSupported": len(SymptomCheckerService.SYMPTOM_DATABASE)
        }
    }
