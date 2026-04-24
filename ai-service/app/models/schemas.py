from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class ScanType(str, Enum):
    CT = "CT"
    MRI = "MRI"
    XRAY = "XRAY"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class DetectedIssue(BaseModel):
    name: str
    probability: float
    description: str
    location: str


class ScanAnalysisRequest(BaseModel):
    scanId: str
    scanType: ScanType
    bodyPart: str
    fileUrl: str
    patientId: str
    clinicalNotes: Optional[str] = None


class ScanAnalysisResponse(BaseModel):
    success: bool
    data: dict


class SymptomCheckRequest(BaseModel):
    symptoms: List[str]
    duration: Optional[str] = None
    severity: Optional[str] = "mild"
    additionalInfo: Optional[str] = None
    patientId: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None


class PossibleCondition(BaseModel):
    name: str
    probability: float
    description: str


class SymptomAnalysis(BaseModel):
    possibleConditions: List[PossibleCondition]
    severity: str
    urgencyLevel: str
    shouldSeeDoctor: bool
    recommendations: List[str]
    disclaimer: str
