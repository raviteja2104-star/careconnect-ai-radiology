from fastapi import APIRouter, HTTPException
from app.models.schemas import ScanAnalysisRequest
from app.services.radiology_ai import RadiologyAIService

router = APIRouter(prefix="/api/ai", tags=["AI Radiology"])


@router.post("/analyze-scan")
async def analyze_scan(request: ScanAnalysisRequest):
    """
    Analyze a medical scan using AI.
    
    Accepts scan metadata and returns AI-generated findings,
    risk level, detected issues, and recommendations.
    """
    try:
        result = RadiologyAIService.analyze_scan(
            scan_type=request.scanType.value,
            body_part=request.bodyPart,
            clinical_notes=request.clinicalNotes
        )

        return {
            "success": True,
            "message": "AI analysis completed successfully",
            "data": result
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")


@router.get("/model-info")
async def get_model_info():
    """Get information about the current AI model."""
    return {
        "success": True,
        "data": {
            "modelVersion": RadiologyAIService.MODEL_VERSION,
            "supportedScanTypes": ["CT", "MRI", "XRAY"],
            "supportedBodyParts": {
                "XRAY": list(RadiologyAIService.XRAY_FINDINGS.keys()),
                "CT": list(RadiologyAIService.CT_FINDINGS.keys()),
                "MRI": list(RadiologyAIService.MRI_FINDINGS.keys()),
            },
            "status": "operational"
        }
    }
