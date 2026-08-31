"""
Claude-backed clinical drafting service.

Wraps the Anthropic Messages API for the clinical copilot endpoints. Every
prompt instructs the model to (a) emit JSON only, matching the endpoint's
response shape, and (b) treat every output as a DRAFT that requires clinician
review — the model must never present its output as final or authoritative.

If no ANTHROPIC_API_KEY is configured (or the SDK is missing), callers get
AiUnavailableError so the HTTP layer can return 503 {available: false} and the
frontend can fall back to its on-device deterministic drafting. We never fake
an AI response.
"""

import json
import os
import re

try:
    import anthropic
except ImportError:  # SDK not installed — service degrades gracefully
    anthropic = None

CLAUDE_MODEL = "claude-opus-5"
MAX_TOKENS = 4096

# Every system prompt shares this safety preamble.
SAFETY_PREAMBLE = (
    "You are a clinical documentation assistant embedded in the CareConnect "
    "EMR. You produce DRAFTS for a licensed clinician to review, edit, and "
    "approve — nothing you write is final, and you must never phrase output "
    "as a confirmed diagnosis, final report, or completed medical decision. "
    "Use ONLY the structured data supplied in the request; do not invent "
    "vitals, lab values, findings, or history that were not provided. If the "
    "supplied data is insufficient for a section, say so briefly inside that "
    "section rather than fabricating content. "
    "Respond with a single JSON object and NOTHING else — no markdown fences, "
    "no prose before or after the JSON."
)


class AiUnavailableError(Exception):
    """No API key / SDK — the endpoint should answer 503 {available: false}."""

    def __init__(self, reason: str = "no-api-key"):
        super().__init__(reason)
        self.reason = reason


class AiRefusedError(Exception):
    """Claude's safety layer declined the request (stop_reason == refusal)."""


class AiBadResponseError(Exception):
    """The model reply could not be parsed into the expected JSON shape."""


def is_available() -> bool:
    return anthropic is not None and bool(os.getenv("ANTHROPIC_API_KEY"))


def _client():
    if not is_available():
        raise AiUnavailableError("no-api-key")
    return anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from the environment


def _parse_json_defensively(text: str) -> dict:
    """Parse model output into a dict, tolerating code fences / stray prose."""
    candidate = text.strip()
    # Strip ```json ... ``` fences if present despite instructions.
    fence = re.match(r"^```(?:json)?\s*(.*?)\s*```$", candidate, re.DOTALL)
    if fence:
        candidate = fence.group(1).strip()
    try:
        parsed = json.loads(candidate)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass
    # Last resort: take the outermost {...} span.
    start, end = candidate.find("{"), candidate.rfind("}")
    if start != -1 and end > start:
        try:
            parsed = json.loads(candidate[start:end + 1])
            if isinstance(parsed, dict):
                return parsed
        except json.JSONDecodeError:
            pass
    raise AiBadResponseError("Model did not return parseable JSON")


def call_claude_json(system_prompt: str, payload: dict) -> dict:
    """One Claude call: structured clinical context in, parsed JSON dict out."""
    client = _client()
    try:
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=MAX_TOKENS,
            system=f"{SAFETY_PREAMBLE}\n\n{system_prompt}",
            messages=[
                {
                    "role": "user",
                    "content": json.dumps(payload, default=str, ensure_ascii=False),
                }
            ],
        )
    except anthropic.AuthenticationError as exc:
        # Key present but invalid/revoked — same graceful-fallback path.
        raise AiUnavailableError("no-api-key") from exc

    if response.stop_reason == "refusal":
        raise AiRefusedError("AI declined this request")

    text = "".join(
        block.text for block in response.content if block.type == "text"
    )
    if not text.strip():
        raise AiBadResponseError("Model returned no text content")
    return _parse_json_defensively(text)
