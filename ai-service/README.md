# CareConnect AI Service

FastAPI service providing two tiers of AI features:

1. **Legacy deterministic engines** — `/api/ai/analyze-scan` (radiology triage)
   and `/api/ai/check-symptoms` (symptom checker). No external dependencies.
2. **Claude clinical copilot** — real LLM drafting backed by the Anthropic API
   (`claude-opus-5`). Used by the EMR encounter copilot and the teleradiology
   reporting workspace via the backend proxy.

## Running

```bash
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
# or: python -m app.main
```

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `AI_SERVICE_PORT` / `PORT` | `8000` | Listen port (the backend proxies to `AI_SERVICE_URL`, default `http://localhost:8000`). |
| `ANTHROPIC_API_KEY` | *(unset)* | Enables the Claude clinical copilot endpoints. Without it the service still runs — see fallback below. |

Do **not** commit the API key; export it in the shell or inject it via your
deployment's secret store. (`docker-compose.yml` is owned separately — wire the
env var there when composing.)

## Claude clinical endpoints

All under `/api/ai`, JSON in / JSON out (no `{success, data}` wrapper):

| Endpoint | Input | Output |
|---|---|---|
| `GET /health` | — | `{available: boolean, model?}` |
| `POST /soap-draft` | `{chiefComplaint, vitals, diagnoses, history}` | `{subjective, objective, assessment, plan}` |
| `POST /discharge-summary` | encounter data | `{summary, advice, followUp}` |
| `POST /radiology-draft` | `{modality, bodyPart, clinicalIndication, aiTriageFindings}` | `{technique, comparison, findings, impression, recommendations}` |
| `POST /explain` | `{labs}` and/or `{text}` | `{explanation, keyPoints[]}` |
| `POST /differentials` | `{presentation}` | `{differentials: [{condition, likelihood, reasoning}], note}` |

Model: `claude-opus-5`, `max_tokens: 4096`, defaults otherwise (no sampling or
thinking overrides). Every system prompt enforces JSON-only output and states
that the result is a draft requiring clinician review — outputs are never
presented as final diagnoses or signed reports.

## How the fallback works

- **No `ANTHROPIC_API_KEY` (or an invalid key):** the Claude endpoints return
  **HTTP 503** with `{"available": false, "reason": "no-api-key"}` and
  `GET /api/ai/health` reports `{"available": false}`. The service never fakes
  an AI response.
- The **backend** (`backend/src/server.js`) proxies `/api/ai/*` with a 60s
  timeout and passes the 503 through unchanged (it also answers 503 with
  `reason: "ai-service-unreachable"` if this service is down entirely).
- The **web portal** probes `/api/ai/health` on mount. When available, copilot
  actions call the real endpoints and the panel is labelled
  "Claude AI — clinician review required"; when unavailable (or a call fails),
  the UI keeps its original on-device deterministic drafting, clearly labelled
  as such. Inserting AI content into notes/reports always requires an explicit
  clinician click.
- **Safety refusals:** if Claude declines a request (`stop_reason: "refusal"`),
  the endpoint returns **HTTP 502** `{"error": "AI declined this request",
  "refused": true}` — the frontend treats this like any other failure and falls
  back to on-device drafting.
