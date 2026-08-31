# Local Setup

Get CareConnect running locally with MongoDB (single-node replica set), seeded demo data, the backend API, and the web portal.

## 1. Start MongoDB (replica set) via Docker Compose

From the repo root:

```bash
docker compose up -d mongodb mongo-init
```

- `mongodb` runs `mongod --replSet rs0` (single-node replica set, no auth — dev only).
- `mongo-init` is a one-shot sidecar that runs `rs.initiate()` once the server is healthy, then exits. It is idempotent — safe on every `up`.
- **Why a replica set?** MongoDB multi-document transactions require one. The backend's `TxRunner` probes for transaction support at runtime: on this replica set it activates real transactions automatically; on a bare standalone `mongod` it falls back to non-transactional execution. Nothing to configure either way.

Point the backend at it in `backend/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/careconnect?directConnection=true
```

> `directConnection=true` matters when connecting from the host: the replica-set member advertises itself as `mongodb:27017` (its Docker network name), which your host can't resolve. Inside the compose network, services use `mongodb://mongodb:27017/...?replicaSet=rs0` instead.

## 2. Seed demo data

```bash
cd backend
npm install   # first time only
npm run seed
```

The seed script is idempotent (clears and recreates its collections) and uses no transactions, so it also works against a standalone mongod or Atlas. It creates role users, 20 demo patients, appointments, encounters with draft/signed clinical notes, clinical orders (including medication orders with safety flags), radiology studies across every workflow status, notifications, invoices, and queue tokens, then prints a summary.

## 3. Start the backend

```bash
cd backend
npm run dev    # nodemon, http://localhost:5000
```

## 4. Start the web portal

```bash
cd web-portal
npm install    # first time only
npm run dev    # http://localhost:3000
```

## 5. Log in

Password for **all** seeded users: `CareConnect@123`

| Role        | Email                       |
| ----------- | --------------------------- |
| Patient     | patient@careconnect.dev     |
| Doctor      | doctor@careconnect.dev      |
| Radiologist | radiologist@careconnect.dev |
| Admin       | admin@careconnect.dev       |
| Lab tech    | lab_tech@careconnect.dev    |
| Pharmacist  | pharmacist@careconnect.dev  |
| Reception   | reception@careconnect.dev   |
| Emergency   | emergency@careconnect.dev   |

The 20 demo patients (e.g. `aarav.patel@example.dev`) use the same password.

## Troubleshooting

- **`NotWritablePrimary` / connection hangs from the host** — you forgot `directConnection=true` in `MONGODB_URI`.
- **Transactions not activating** — check `docker compose logs mongo-init`; it should print `replica set rs0 initialised` (or `already initialised`). Re-run `docker compose up -d mongo-init` if needed.
- **Fresh start** — `docker compose down -v` removes the `mongo_data` volume; the next `up` re-initialises the replica set and you re-run the seed.
