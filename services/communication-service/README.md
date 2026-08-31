# Communication Service

Receives domain events from the backend's OutboxWorker (`POST /api/internal/events`,
default `COMMUNICATION_SERVICE_URL=http://localhost:4002/api/internal/events`) and routes
them to messaging providers via `@careconnect/communication`'s `NotificationRouter`.

## Channel modes

Each channel runs in one of two modes, decided at startup from environment variables:

| Mode | When | Behavior |
|---|---|---|
| `live` | Credentials present | Real API call, wrapped in an opossum circuit breaker (timeout 5s, opens at 50% error rate, resets after 15s) |
| `simulation` | Credentials absent | Logs `[SIMULATION] would send <channel> to <dest>: "<content>"`, transmits nothing, bypasses the circuit breaker |

Simulation is honest: results and stored delivery records carry `simulated: true` and
**no** provider `messageId` is ever fabricated.

## Environment variables

| Variable | Channel | Notes |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | SMS | Required (with auth token) for live SMS |
| `TWILIO_AUTH_TOKEN` | SMS | Required (with SID) for live SMS |
| `TWILIO_FROM` | SMS | Sender number (falls back to `TWILIO_FROM_NUMBER`, then `+15550000000`) |
| `GUPSHUP_API_KEY` | WhatsApp | Required (with source) for live WhatsApp via Gupshup |
| `GUPSHUP_SOURCE` | WhatsApp | Registered WhatsApp source number |
| `GUPSHUP_APP_NAME` | WhatsApp | Optional (`src.name` in the Gupshup request) |
| `SENDGRID_API_KEY` | Email | Optional — without it, email stays in console/simulation mode |
| `SENDGRID_FROM_EMAIL` | Email | Default `no-reply@careconnect.com` |
| `PORT` | — | Default `4002` |

## Event → template mapping

`eventType` maps 1:1 to a template set in the package's `TemplateEngine`
(SMS + WhatsApp + Email variants each):

- `AppointmentBooked` — booking confirmation to the patient
- `CriticalFindingDetected` — urgent alert (intended for the ordering doctor's phone)
- `PatientNotified` — imaging-report-ready message to the patient
- `AppointmentReminder` — legacy reminder

Channels are chosen from `recipient.preferences` (`sms`/`whatsapp`/`email`/`push` booleans);
without preferences, the router defaults to email + SMS where a destination exists.

## Endpoints

- `POST /api/internal/events` — `{ eventType, payload, recipient }`; responds with per-channel
  `results` (each with `success`, `status`, `messageId`, `simulated`, `error`)
- `GET /api/internal/status` — per-channel `{ provider, mode, breakerState }`
  (`breakerState` is `closed`/`open`/`half-open` for live providers, `n/a` in simulation)
- `GET /api/delivery-status/:intentId` — delivery history for an intent
- `GET /health`, `GET /ready`
