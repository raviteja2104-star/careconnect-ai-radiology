"""
Claude clinical copilot endpoints.

All POST endpoints return the drafted JSON object directly (no wrapper) so the
backend proxy can pass responses through untouched. When no ANTHROPIC_API_KEY
is configured the endpoints answer 503 {"available": false, "reason":
"no-api-key"} and the web portal falls back to its on-device drafting.
"""

from typing import Any, Dict

from fastapi import APIRouter, Body
from fastapi.responses import JSONResponse

from app.services.claude_clinical import (
    AiBadResponseError,
    AiRefusedError,
    AiUnavailableError,
    CLAUDE_MODEL,
    call_claude_json,
    is_available,
)

router = APIRouter(prefix="/api/ai", tags=["Claude Clinical AI"])


def _run(system_prompt: str, payload: Dict[str, Any], required_keys: list):
    """Shared call-and-shape-check wrapper for every drafting endpoint."""
    try:
        data = call_claude_json(system_prompt, payload)
    except AiUnavailableError as exc:
        return JSONResponse(
            status_code=503,
            content={"available": False, "reason": exc.reason},
        )
    except AiRefusedError:
        return JSONResponse(
            status_code=502,
            content={
                "error": "AI declined this request",
                "refused": True,
                "message": "The AI safety layer declined to draft this content. "
                           "Please document manually.",
            },
        )
    except AiBadResponseError as exc:
        return JSONResponse(
            status_code=502,
            content={"error": "ai-bad-response", "message": str(exc)},
        )
    except Exception as exc:  # network / rate limit / 5xx from the API
        return JSONResponse(
            status_code=502,
            content={"error": "ai-call-failed", "message": str(exc)},
        )
    # Guarantee the advertised keys exist even if the model omitted one.
    for key in required_keys:
        data.setdefault(key, "")
    return data


@router.get("/health")
def ai_health():
    """Availability probe used by the frontend to gate real-AI features."""
    available = is_available()
    body = {"available": available}
    if available:
        body["model"] = CLAUDE_MODEL
    return body


@router.post("/soap-draft")
def soap_draft(payload: Dict[str, Any] = Body(...)):
    """
    Input: {chiefComplaint, vitals, diagnoses, history}
    Output: {subjective, objective, assessment, plan}
    """
    system = (
        "Draft the four SOAP note sections for this encounter.\n"
        "Input JSON fields: chiefComplaint, vitals (most recent measurements), "
        "diagnoses (recorded problem list), history (allergies, active "
        "medications, recent events).\n"
        "Output JSON shape (all values are strings):\n"
        '{"subjective": "...", "objective": "...", "assessment": "...", '
        '"plan": "..."}\n'
        "Guidance: subjective restates the presenting complaint in clinical "
        "prose; objective summarises only the supplied vitals/exam data; "
        "assessment lists the recorded diagnoses (numbered) without adding "
        "new confirmed diagnoses; plan proposes reasonable next steps phrased "
        "as suggestions for the clinician to confirm."
    )
    return _run(system, payload, ["subjective", "objective", "assessment", "plan"])


@router.post("/discharge-summary")
def discharge_summary(payload: Dict[str, Any] = Body(...)):
    """
    Input: {encounter data — patient, chiefComplaint, vitals, diagnoses, medications}
    Output: {summary, advice, followUp}
    """
    system = (
        "Draft a discharge / visit summary for this encounter.\n"
        "Output JSON shape (all values are strings):\n"
        '{"summary": "...", "advice": "...", "followUp": "..."}\n'
        "Guidance: summary covers presentation, key findings from supplied "
        "data, and diagnoses this visit; advice covers medication and "
        "lifestyle instructions grounded in the supplied medication list; "
        "followUp covers review timing and specific return-precaution "
        "symptoms. Write in clear clinical prose a clinician can hand to a "
        "patient after review."
    )
    return _run(system, payload, ["summary", "advice", "followUp"])


@router.post("/radiology-draft")
def radiology_draft(payload: Dict[str, Any] = Body(...)):
    """
    Input: {modality, bodyPart, clinicalIndication, aiTriageFindings}
    Output: {technique, comparison, findings, impression, recommendations}
    """
    system = (
        "Draft a structured radiology report skeleton for a radiologist to "
        "review and edit. You have NOT seen the images — you only have the "
        "study metadata and automated triage findings supplied in the input "
        "JSON (modality, bodyPart, clinicalIndication, aiTriageFindings).\n"
        "Output JSON shape (all values are strings):\n"
        '{"technique": "...", "comparison": "...", "findings": "...", '
        '"impression": "...", "recommendations": "..."}\n'
        "Guidance: technique describes the standard acquisition for this "
        "modality/body part; comparison should state that no prior study "
        "information was supplied unless the input says otherwise; findings "
        "must present each aiTriageFindings item explicitly labelled as an "
        "automated triage flag pending radiologist verification (never as a "
        "confirmed image finding), plus placeholders for the radiologist's "
        "own observations; impression must be phrased as a preliminary "
        "draft impression pending image review; recommendations suggest "
        "correlation or follow-up appropriate to the indication."
    )
    return _run(
        system,
        payload,
        ["technique", "comparison", "findings", "impression", "recommendations"],
    )


@router.post("/explain")
def explain(payload: Dict[str, Any] = Body(...)):
    """
    Input: {labs: [...]} and/or {text: "..."}
    Output: {explanation, keyPoints}
    """
    system = (
        "Explain the supplied lab results (or clinical text) in "
        "patient-friendly language.\n"
        "Output JSON shape:\n"
        '{"explanation": "...", "keyPoints": ["...", "..."]}\n'
        "Guidance: plain language at roughly an 8th-grade reading level, no "
        "alarmist phrasing, explain what each value measures and whether the "
        "supplied value is inside or outside the commonly used reference "
        "range. Do not diagnose; where a value is abnormal, say it is "
        "something to discuss with the treating clinician. keyPoints is a "
        "short bullet list (max 5) of the main takeaways."
    )
    data = _run(system, payload, ["explanation"])
    if isinstance(data, dict):
        data.setdefault("keyPoints", [])
    return data


@router.post("/differentials")
def differentials(payload: Dict[str, Any] = Body(...)):
    """
    Input: {presentation: {chiefComplaint, age, gender, vitals, history, ...}}
    Output: {differentials: [{condition, likelihood, reasoning}], note}
    """
    system = (
        "Suggest a ranked differential diagnosis list for the supplied "
        "clinical presentation, for a clinician's consideration.\n"
        "Output JSON shape:\n"
        '{"differentials": [{"condition": "...", "likelihood": '
        '"high|moderate|low", "reasoning": "..."}], "note": "..."}\n'
        "Guidance: order by pre-test probability given the supplied "
        "presentation, put cannot-miss diagnoses that need early exclusion "
        "near the top with reasoning that says why, keep the list to at most "
        "6 entries, and ground every reasoning string in the supplied data "
        "(age, vitals, history) rather than speculation. note must remind "
        "the reader this is decision support, not a diagnosis."
    )
    data = _run(system, payload, ["note"])
    if isinstance(data, dict):
        data.setdefault("differentials", [])
    return data


@router.post("/medication-suggestions")
def medication_suggestions(payload: Dict[str, Any] = Body(...)):
    """
    Input: {diagnoses: [..], symptoms, patient: {age, gender, allergies,
            currentMedications, renalImpairment, pregnant, history},
            exclude: [drug names already suggested/dismissed]}
    Output: {needsMoreInfo, missingInfo: [..], suggestions: [{name, generic,
             indication, dosage, route, frequency, duration, precautions,
             interactions}], note}
    """
    system = (
        "You are clinical decision support inside an EMR, suggesting "
        "medication OPTIONS for a qualified doctor to review. The doctor — "
        "never you — decides and prescribes.\n"
        "Output JSON shape:\n"
        '{"needsMoreInfo": false, "missingInfo": [], "suggestions": '
        '[{"name": "...", "generic": "...", "indication": "...", '
        '"dosage": "...", "route": "...", "frequency": "...", '
        '"duration": "...", "precautions": "...", "interactions": "..."}], '
        '"note": "..."}\n'
        "Rules:\n"
        "- Use ONLY the supplied patient data; never invent findings, "
        "allergies or history.\n"
        "- Suggest 2-5 evidence-based first-line options appropriate to the "
        "supplied diagnoses and context (Indian market generic names; adult "
        "or pediatric dosing per the supplied age; typical dosage RANGES).\n"
        "- indication: one concise sentence of clinical reasoning grounded in "
        "the supplied data — why this drug for this patient.\n"
        "- precautions: the important ones for THIS patient (age, renal, "
        "pregnancy, allergy-class) — say so explicitly when relevant.\n"
        "- interactions: check against the supplied currentMedications and "
        "state 'None identified with listed medications' when none.\n"
        "- If the supplied diagnoses/context are insufficient for reliable "
        "suggestions, set needsMoreInfo true, list what is missing in "
        "missingInfo, and return an empty suggestions list.\n"
        "- Never include drugs listed in exclude.\n"
        "- note must state these are decision-support suggestions requiring "
        "the doctor's review and approval."
    )
    data = _run(system, payload, ["note"])
    if isinstance(data, dict):
        data.setdefault("suggestions", [])
        data.setdefault("needsMoreInfo", False)
        data.setdefault("missingInfo", [])
    return data
