"""
CareConnect Health Record Capture — document classification + medical field
extraction from photographed/scanned paper documents. See
app/services/claude_vision.py for the honesty contract (never invents a
value, always carries a confidence level, LOW/null when genuinely uncertain).
"""

from typing import Any, Dict, List

from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse

from app.services.claude_vision import (
    AiBadResponseError,
    AiRefusedError,
    AiUnavailableError,
    CLAUDE_VISION_MODEL,
    call_claude_vision_json,
    is_available,
)
from app.services.claude_clinical import (
    call_claude_json,
    AiUnavailableError as TextAiUnavailableError,
    AiRefusedError as TextAiRefusedError,
    AiBadResponseError as TextAiBadResponseError,
)

router = APIRouter(prefix="/api/ai", tags=["Document Capture AI"])

DOCUMENT_TYPES = [
    "HANDWRITTEN_PRESCRIPTION", "PRINTED_PRESCRIPTION", "OPD_NOTE", "DOCTOR_NOTE",
    "LAB_REPORT", "DIAGNOSTIC_REPORT", "DISCHARGE_SUMMARY", "REFERRAL_LETTER",
    "MEDICAL_CERTIFICATE", "VACCINATION_RECORD", "PREVIOUS_MEDICAL_RECORD",
    "NURSING_NOTE", "HOSPITAL_DOCUMENT", "MEDICAL_BILL", "OTHER",
]

FIELD_VOCABULARY = (
    "Field vocabulary by documentType (use dot/bracket-path keys for list "
    "items, e.g. \"medications[0].name\", \"medications[0].strength\", "
    "\"results[1].testName\" — one flat fields[] array represents everything, "
    "there is no nested JSON beyond this):\n"
    "- HANDWRITTEN_PRESCRIPTION / PRINTED_PRESCRIPTION: patientName, "
    "doctorName, date, diagnosis, symptoms, "
    "medications[N].{name,strength,dosageForm,route,frequency,duration,"
    "instructions}, investigationsOrdered, followUpDate.\n"
    "- LAB_REPORT: labName, patientNameOnReport, patientIdOnReport, "
    "sampleDate, reportDate, reportNumber, specimen, orderingDoctor, "
    "results[N].{testName,result,unit,referenceRange,flag,comments}. "
    "referenceRange and flag must be EXACTLY what is printed on the report — "
    "never computed or inferred by you.\n"
    "- DIAGNOSTIC_REPORT: modality (one of XRAY|CT|MRI|ULTRASOUND|"
    "MAMMOGRAPHY|ECHO|ECG|OTHER), studyDescription, studyDate, providerName, "
    "clinicalHistory, findings, impression, radiologistName.\n"
    "- DISCHARGE_SUMMARY: patientName, admissionDate, dischargeDate, "
    "diagnosis, proceduresPerformed, dischargeMedications, "
    "followUpInstructions, treatingDoctor.\n"
    "- REFERRAL_LETTER: patientName, referringDoctor, referredToDoctorOrDept, "
    "reasonForReferral, date.\n"
    "- MEDICAL_CERTIFICATE: patientName, doctorName, purpose, "
    "validFrom, validTo, date.\n"
    "- VACCINATION_RECORD: patientName, vaccineName, doseNumber, "
    "dateAdministered, batchNumber, administeredBy.\n"
    "- OPD_NOTE / DOCTOR_NOTE / NURSING_NOTE: patientName, date, "
    "chiefComplaint, notes, recordedBy.\n"
    "- MEDICAL_BILL: providerName, billNumber, billDate, totalAmount, "
    "itemsSummary.\n"
    "- PREVIOUS_MEDICAL_RECORD / HOSPITAL_DOCUMENT / OTHER: extract whatever "
    "clearly-labeled fields are present using your best judgment for key "
    "names; do not force-fit the document into a vocabulary above if it "
    "does not apply."
)


def _run_vision(system: str, images: List[Dict[str, Any]], context: Dict[str, Any] = None):
    try:
        data = call_claude_vision_json(system, images, context)
    except AiUnavailableError as exc:
        return JSONResponse(status_code=503, content={"available": False, "reason": exc.reason})
    except AiRefusedError:
        return JSONResponse(
            status_code=502,
            content={
                "error": "AI declined this request",
                "refused": True,
                "message": "The AI safety layer declined to process this image. Please review the document manually.",
            },
        )
    except AiBadResponseError as exc:
        return JSONResponse(status_code=502, content={"error": "ai-bad-response", "message": str(exc)})
    except Exception as exc:  # network / rate limit / 5xx
        return JSONResponse(status_code=502, content={"error": "ai-call-failed", "message": str(exc)})
    return data


@router.get("/document-capture-health")
def document_capture_health():
    """Availability probe the frontend/backend use to gate real extraction vs. showing a clear 'AI unavailable' state."""
    available = is_available()
    body = {"available": available}
    if available:
        body["model"] = CLAUDE_VISION_MODEL
    return body


@router.post("/classify-document")
def classify_document(payload: Dict[str, Any] = Body(...)):
    """
    Input: {images: [{mediaType, data(base64), pageNumber}]}
    Output: {documentType, confidenceLevel, confidenceNote}
    Cheap, fast pass — used for the "confirm document type" step before the
    (more expensive) full extraction, and to auto-suggest a type the user can
    override, per the spec's "AI must automatically classify; user must be
    able to change it."
    """
    images = payload.get("images") or []
    if not images:
        return JSONResponse(status_code=400, content={"message": "images (non-empty array) is required."})
    system = (
        "Classify this medical document image into exactly one of these "
        f"types: {DOCUMENT_TYPES}.\n"
        "Output JSON shape:\n"
        '{"documentType": "...", "confidenceLevel": "HIGH|MEDIUM|LOW", '
        '"confidenceNote": "..."}\n'
        "If the image quality is too poor to classify confidently, still "
        "give your best-guess documentType but set confidenceLevel to LOW "
        "and explain why in confidenceNote (e.g. blurred, wrong orientation, "
        "glare obscuring the header)."
    )
    data = _run_vision(system, images)
    if isinstance(data, JSONResponse):
        return data
    if data.get("documentType") not in DOCUMENT_TYPES:
        data["documentType"] = "OTHER"
    return data


@router.post("/extract-document")
def extract_document(payload: Dict[str, Any] = Body(...)):
    """
    Input: {images: [{mediaType, data(base64), pageNumber}], documentTypeHint: "..."?}
    Output: {documentType, documentTypeConfidence, documentTypeNote,
             fields: [{key,label,value,confidenceLevel,confidenceNote,illegible}],
             overallNote}
    One combined classify+extract call (classification is re-confirmed here
    even when documentTypeHint is supplied, since a wrong hint should not
    silently force a bad field vocabulary onto the wrong document).
    """
    images = payload.get("images") or []
    if not images:
        return JSONResponse(status_code=400, content={"message": "images (non-empty array) is required."})
    hint = payload.get("documentTypeHint")

    system = (
        "Read this medical document (one or more page images of the SAME "
        "document, in order) and produce a structured extraction.\n"
        f"Confirm or determine its documentType from: {DOCUMENT_TYPES}.\n"
        + (f"The user has tentatively classified this as \"{hint}\" — use this "
           "as your starting assumption, but override it (and explain why in "
           "documentTypeNote) if the image clearly shows a different type.\n" if hint else "")
        + FIELD_VOCABULARY + "\n"
        "Output JSON shape:\n"
        '{"documentType": "...", "documentTypeConfidence": "HIGH|MEDIUM|LOW", '
        '"documentTypeNote": "...", '
        '"fields": [{"key": "...", "label": "...", "value": <string|number|null>, '
        '"confidenceLevel": "HIGH|MEDIUM|LOW|null", "confidenceNote": "...", '
        '"illegible": <bool>}], '
        '"overallNote": "..."}\n'
        "Only include a field in fields[] if it is a recognized vocabulary "
        "key for the determined documentType AND you found something on the "
        "page for it (a field that is simply absent from the document should "
        "be omitted entirely, not included as null — null is specifically "
        "for 'this field applies here and I looked for it but cannot read "
        "it'). overallNote should mention anything a human reviewer should "
        "know (poor image quality, missing pages, multiple documents in one "
        "image, etc.)."
    )
    data = _run_vision(system, images, {"documentTypeHint": hint} if hint else None)
    if isinstance(data, JSONResponse):
        return data
    data.setdefault("fields", [])
    data.setdefault("overallNote", "")
    if data.get("documentType") not in DOCUMENT_TYPES:
        data["documentType"] = hint if hint in DOCUMENT_TYPES else "OTHER"
    return data


@router.post("/normalize-medicine")
def normalize_medicine(payload: Dict[str, Any] = Body(...)):
    """
    Input: {rawText: "Amox 500", candidates: [{label, generic, brand, strength, form}, ...]}
    Output: {interpretation: "Amoxicillin 500 mg", confidenceLevel, note,
             suggestedCandidateLabels: [...]}
    This NEVER auto-confirms a medicine identity — it produces an
    interpretation plus a shortlist from the supplied CareConnect medicine
    master (candidates) for a human to pick from. See
    backend/src/services/MedicineNormalizer.js, which calls this only as a
    second pass when its own local fuzzy-match against the catalog is
    inconclusive.
    """
    raw_text = payload.get("rawText", "")
    candidates = payload.get("candidates", [])
    if not raw_text:
        return JSONResponse(status_code=400, content={"message": "rawText is required."})
    system = (
        "A prescription mentions a medicine written as this raw OCR/handwriting "
        f"text: \"{raw_text}\". Here is a shortlist of real entries from "
        f"CareConnect's medicine master to choose from: {candidates}.\n"
        "Output JSON shape:\n"
        '{"interpretation": "...", "confidenceLevel": "HIGH|MEDIUM|LOW", '
        '"note": "...", "suggestedCandidateLabels": ["...", "..."]}\n'
        "interpretation is your best plain-text reading of what medicine this "
        "likely is (e.g. expand 'Amox 500' to 'Amoxicillin 500 mg') — this is "
        "always just a SUGGESTION for a human to confirm, never a "
        "confirmation itself. suggestedCandidateLabels lists (in order of "
        "likelihood) the labels from the supplied candidates list that best "
        "match — empty if none are a good match. If the raw text is too "
        "ambiguous to interpret at all, set confidenceLevel LOW and say so "
        "in note rather than guessing a specific drug."
    )
    try:
        result = call_claude_json(system, {"rawText": raw_text, "candidates": candidates})
    except TextAiUnavailableError as exc:
        return JSONResponse(status_code=503, content={"available": False, "reason": exc.reason})
    except TextAiRefusedError:
        return JSONResponse(status_code=502, content={"error": "AI declined this request", "refused": True})
    except TextAiBadResponseError as exc:
        return JSONResponse(status_code=502, content={"error": "ai-bad-response", "message": str(exc)})
    except Exception as exc:
        return JSONResponse(status_code=502, content={"error": "ai-call-failed", "message": str(exc)})
    result.setdefault("suggestedCandidateLabels", [])
    return result
