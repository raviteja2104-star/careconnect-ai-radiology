"""
Claude-backed document vision service — OCR + handwriting recognition +
medical field extraction for CareConnect Health Record Capture.

This is the first real image-understanding code path in ai-service: every
other AI call in this service (see claude_clinical.py, radiology_ai.py) sends
plain JSON text, never image bytes. radiology_ai.py's "AI analysis" is
explicitly a randomized simulation per its own docstring — this module is
NOT that; it sends real image bytes to Claude's vision input and returns
whatever Claude actually reads, including "I cannot read this" when true.

Same honesty contract as claude_clinical.py: no ANTHROPIC_API_KEY configured
-> AiUnavailableError -> the endpoint answers 503 {available: false}. We
never fake an extraction result.
"""

import base64
import json
import os
import re
from typing import List, Dict, Any

try:
    import anthropic
except ImportError:
    anthropic = None

CLAUDE_VISION_MODEL = "claude-opus-5"
MAX_TOKENS = 4096
MAX_IMAGE_BYTES = 20 * 1024 * 1024  # matches the backend's per-page upload limit

SAFETY_PREAMBLE = (
    "You are a medical document transcription assistant inside CareConnect's "
    "Health Record Capture feature. Patients, nurses, receptionists, and "
    "attendants use you to digitize paper medical documents (handwritten or "
    "printed prescriptions, lab reports, diagnostic reports, discharge "
    "summaries, and similar). You are reading real people's medical "
    "documents — precision and honesty matter more than completeness.\n\n"
    "HARD RULES — violating any of these is a safety failure, not a style "
    "preference:\n"
    "1. NEVER diagnose the patient, recommend treatment, or suggest a "
    "medication change. You transcribe and structure what is written; you do "
    "not practice medicine.\n"
    "2. NEVER invent a value you cannot actually read in the image. If a "
    "field is illegible, cut off, or simply absent from the document, its "
    "value MUST be null and confidenceLevel MUST be \"LOW\", with "
    "confidenceNote explaining why (e.g. \"handwriting illegible\", \"field "
    "not present on this document\", \"obscured by fold/glare\"). Guessing a "
    "plausible-sounding medicine name or dose because it is common is "
    "exactly the failure mode to avoid.\n"
    "3. NEVER invent a lab reference range that is not printed on the "
    "document. If the report does not show a reference range for a test, "
    "leave it null.\n"
    "4. Every field you DO extract must carry an honest confidenceLevel: "
    "\"HIGH\" only when the text is clearly legible and unambiguous, "
    "\"MEDIUM\" when legible but you are inferring intent (e.g. an "
    "abbreviation), \"LOW\" when you are genuinely uncertain. Do not default "
    "everything to HIGH.\n"
    "5. Respond with a single JSON object and NOTHING else — no markdown "
    "fences, no prose before or after the JSON."
)


class AiUnavailableError(Exception):
    def __init__(self, reason: str = "no-api-key"):
        super().__init__(reason)
        self.reason = reason


class AiRefusedError(Exception):
    pass


class AiBadResponseError(Exception):
    pass


def is_available() -> bool:
    return anthropic is not None and bool(os.getenv("ANTHROPIC_API_KEY"))


def _client():
    if not is_available():
        raise AiUnavailableError("no-api-key")
    return anthropic.Anthropic()


def _parse_json_defensively(text: str) -> dict:
    candidate = text.strip()
    fence = re.match(r"^```(?:json)?\s*(.*?)\s*```$", candidate, re.DOTALL)
    if fence:
        candidate = fence.group(1).strip()
    try:
        parsed = json.loads(candidate)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass
    start, end = candidate.find("{"), candidate.rfind("}")
    if start != -1 and end > start:
        try:
            parsed = json.loads(candidate[start:end + 1])
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            pass
    raise AiBadResponseError("Model did not return parseable JSON")


def call_claude_vision_json(system_prompt: str, images: List[Dict[str, Any]], context: Dict[str, Any] = None) -> dict:
    """
    images: list of {"mediaType": "image/jpeg"|"application/pdf", "data": "<base64 str>", "pageNumber": 1}
            A page whose mediaType is "application/pdf" is sent as an
            Anthropic "document" content block (Claude reads/renders it
            natively), NOT an "image" block — the Messages API only accepts
            image/jpeg|png|gif|webp under content type "image"; sending a PDF
            that way is a real, silent-failure-prone mistake, not a style
            choice. Every other mediaType goes through as an "image" block.
    context: optional extra JSON context (e.g. {"documentTypeHint": "..."})
             sent alongside the images as a trailing text block.
    """
    client = _client()

    content = []
    for img in images:
        media_type = img.get("mediaType", "image/jpeg")
        block_type = "document" if media_type == "application/pdf" else "image"
        content.append({
            "type": block_type,
            "source": {"type": "base64", "media_type": media_type, "data": img["data"]},
        })
    trailer = {"pageCount": len(images)}
    if context:
        trailer.update(context)
    content.append({"type": "text", "text": json.dumps(trailer, default=str, ensure_ascii=False)})

    try:
        response = client.messages.create(
            model=CLAUDE_VISION_MODEL,
            max_tokens=MAX_TOKENS,
            system=f"{SAFETY_PREAMBLE}\n\n{system_prompt}",
            messages=[{"role": "user", "content": content}],
        )
    except anthropic.AuthenticationError as exc:
        raise AiUnavailableError("no-api-key") from exc

    if response.stop_reason == "refusal":
        raise AiRefusedError("AI declined this request")

    text = "".join(block.text for block in response.content if block.type == "text")
    if not text.strip():
        raise AiBadResponseError("Model returned no text content")
    return _parse_json_defensively(text)
