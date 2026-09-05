# CareConnect Nearby — Master Data Analysis & Schema Plan

Source workbook: `CareConnect_Visakhapatnam_ULTIMATE_Master_All_Sources.xlsx` (26 sheets, inspected in full via openpyxl — every sheet, every column, every row counted programmatically, not sampled).

This document is the analysis-and-design deliverable requested before any migration/import code is written. It does not fabricate any provider, doctor, phone number, price, slot, review, or rating. Every number below comes directly from the workbook or from the already-built `backend/src/models/*` code.

---

## 1. What the workbook actually contains

The workbook is **not raw scraped data** — it is itself a half-built master-data design, with a stated policy in its own `README` sheet:

> "Public-source/seed records must be verified before publishing to patients." / "Only enable Book Appointment after provider verification and real schedule/availability connection." / "This workbook is a master working database, not a guarantee that every healthcare establishment in Visakhapatnam has been captured."

That policy matches exactly the honesty rules this project has been built under, so no reconciliation is needed there.

The 26 sheets fall into five groups:

**A. Provider data (three overlapping generations of the same list)**
- `Provider_Master` — 205 rows, 18 columns. The oldest/simplest schema (no address, no email, no website, no services).
- `Small_Clinics_Labs` (58), `Dental_Master` (18), `Ophthalmology_Master` (15) — specialty-filtered subsets, same 8-column shape as `Provider_Master`.
- `All_Providers_Master` — **222 rows, 32 columns**. This is the current, most complete generation — same schema as the empty `Provider_Master_Template`.
- `Current_Public_Seed` — 20 rows with public rating/review-count columns, sourced from "Business search".

**B. Reference/lookup masters**
- `Provider_Types` (20 types), `Service_Categories` (40 categories), `CareConnect_Service_Master` (239 service/test names), `Dental_Ophthalmology_Services` (41 rows), `Vizag_Areas` / `Vizag_Areas_Master` / `Vizag_Area_Coverage` (three locality lists), `Practo_Market_Reference` (18 rows — explicitly market-size context, not provider data).

**C. Doctor and pharmacy data**
- `Doctor_Master` / `All_Doctors_Master` — identical, 12 doctors.
- `Pharmacy_Master` / `All_Pharmacies_Master` — identical, 7 pharmacies (all Apollo Pharmacy branches).

**D. Onboarding/workflow state**
- `Provider_Onboarding` — 222 rows, one per provider in `All_Providers_Master`, tracking the claim→verify→connect→go-live checklist.

**E. Empty target-schema templates** (header row only, no data)
- `Service_Master` (9 cols), `Availability` (9 cols), `Verification` (7 cols), `Lab_Result_Master` (16 cols), `Provider_Import_Schema` (37 cols). These are the workbook author's own draft of where the data model should go next — useful as a cross-check against the schema below, not as data to import.

**Bottom line:** `All_Providers_Master` (222 rows / 32 cols) is the current source of truth. `Provider_Master` and the three specialty sheets are earlier drafts that have already been folded into it (see overlap numbers below) and should be treated as superseded, not merged in again.

---

## 2. Duplicates and inconsistencies found

Measured, not estimated:

| Check | Result |
|---|---|
| `Provider_Master` duplicate (name+locality) groups | 8 groups (16 rows) — e.g. Dr Lal PathLabs Gajuwaka, Vasan Eye Care Hospital (×2 localities, legitimately two branches, not a true dupe), Smiles Dental Clinic, Sai Ganesh Dental Polyclinic |
| `All_Providers_Master` duplicate (name+locality) groups | **1 group** — Dr Lal PathLabs, Gajuwaka, ×2 (already 87% deduplicated vs. `Provider_Master`) |
| Duplicate phone numbers | 0 — but 80–90% of phone fields are blank, so this check has very low statistical power and should not be read as "no duplicates exist" |
| `Provider_Master` names in `All_Providers_Master` | 151/151 (100% — `Provider_Master` is a strict subset) |
| `Small_Clinics_Labs` / `Dental_Master` / `Ophthalmology_Master` overlap with `All_Providers_Master` | 31/31, 15/15, 14/14 (100% — fully absorbed already) |

**Real duplicate-detection risk going forward:** with phone/address/lat-long this sparse, name+locality string matching is the only signal available today, and it's weak against spelling variants already visible in the data itself: `Seethammadhara` vs `Sheethammadhara`, `Chinna Waltair` vs `China Waltair`, `Old Gajuwaka` vs `Maruti Nagar / Old Gajuwaka`. A real import pipeline needs fuzzy matching (Levenshtein/soundex on name, normalized locality) with **human review**, not blind auto-merge — consistent with the explicit "do not blindly merge records" instruction.

**Schema inconsistency found:** `Service_Categories` (40 rows) mixes three different taxonomies that should not share one flat list: clinical specialties (Cardiology, Dermatology), lab disciplines (Biochemistry, Serology, Molecular Diagnostics), and non-clinical service types (Pharmacy, Emergency, Vaccination). `CareConnect_Service_Master`'s 239 rows are almost entirely lab-test/panel names grouped under lab-discipline categories — this is really the same catalogue as the `BillableItem` master already built in this project (`backend/src/data/billableCatalog.js`, 363 entries), not a separate thing. They should be unified, not run as two parallel catalogues.

---

## 3. Missing data — quantified

`All_Providers_Master` (222 rows, the current master):

| Field | Missing |
|---|---|
| Latitude / Longitude | **222/222 (100%)** |
| Email | 222/222 (100%) |
| Website | 222/222 (100%) |
| Address (street-level) | 222/222 (100%) |
| Consultation Fee | 222/222 (100%) |
| Specialties | 222/222 (100%) |
| Services | 222/222 (100%) |
| Opening Hours | 215/222 (97%) |
| Phone | 178/222 (80%) |
| Pincode | 86/222 (39%) |

**This is the single most important finding.** The 32-column schema exists, but only identity + rough-location + verification-status columns are actually populated. Every field that a real discovery/booking product needs to *function* — geocoordinates for "near me" search, phone to call, services to search by, a fee to show — is currently 80–100% empty. This is not a data-cleaning problem, it's a **data-collection problem**: the schema is ready, the enrichment work is not done. No amount of migration code fixes this; it has to be filled in by real verification (provider claim flow, phone verification calls, geocoding a real address) — never invented.

`Provider_Onboarding` confirms this from the workflow side: **100% of 222 providers are `Claimed: NO`, `Availability Connected: NO`, `Payment Enabled: NO`, `Go-Live Status: DISCOVERY ONLY`.** Zero providers are currently eligible to be bookable. That is the correct, honest state for a directory that hasn't done outreach yet — and it's exactly what `Provider.appointmentEnabled` already defaults to gating on in the built model.

Doctors and pharmacies are thin: 12 doctors total (all tied to a handful of hospitals — Medicover, Lotus, Pooja Andrology, Hussain Ortho, two dental clinics), 7 pharmacies (all one chain, Apollo). No independent/local pharmacies, no doctors outside a few large hospitals. This isn't wrong, it's just early-stage — worth naming explicitly so the roadmap doesn't imply doctor/pharmacy coverage that doesn't exist yet.

---

## 4. Locality data — three lists that disagree, plus a modeling problem

| Sheet | Rows | Unique |
|---|---|---|
| `Vizag_Areas` | 39 | 39 |
| `Vizag_Areas_Master` | 57 | 57 |
| `Vizag_Area_Coverage` | 54 | 54 |

`Vizag_Areas` is **not** a subset of `Vizag_Areas_Master`: it contains 7 localities the master list lacks — `Daba Garden`, `Lankalapalem`, `Muralinagar`, `Kothavalasa`, `China Mushidiwada`, `Anakapalli`, `Araku Valley`. Three of those (Anakapalli, Araku Valley, Kothavalasa) are wider-district/tourist-route places outside "Greater Vizag city" proper and should be a separate `region` tier rather than merged into the city locality list. `Vizag_Area_Coverage` has one spelling variant not in the master (`Lawsons Bay` vs. `Lawsons Bay Colony`).

Separately: 20 locality strings actually used on provider rows in `All_Providers_Master` don't match any entry in `Vizag_Areas_Master` at all — e.g. `Gopalapatnam / Simhachalam`, `Krishna Nagar / Maharani Peta`, `Seethammapeta / Dwaraka Nagar`, `Waltair Road / Ram Nagar`. On inspection **these are not 20 new missing places** — they're compound "X / Y" free-text values where a provider genuinely sits between two named areas, plus a few spelling variants (`Sheethammadhara`). **Root cause:** `Locality` is stored as a free-text string on the provider row instead of a foreign key into a locality master. That's the actual schema defect, not a missing-locality problem — see §5.

Cross-referencing against the user's supplied ~55-item exhaustive Greater Vizag locality list (Achutapuram, Aganampudi, Anakapalli, Anandapuram, Bheemili, Boyapalem, Chinna Waltair, Daba Gardens, Dondaparthy, Duvvada, Gopalapatnam, Hanumanthuwaka, Isukathota, Jagadamba Junction, Kancharapalem, Kapuluppada, Kommadi, Kurmannapalem, Lankelapalem, Lawsons Bay, Madhavadhara, Maddilapalem, Malkapuram, Marikavalasa, Marripalem, Old/New Gajuwaka, Pendurthi, Pedagantyada, Pedda Waltair, PM Palem, Scindia, Seethammapeta, Sheelanagar, Simhachalam, Siripuram, Sujatha Nagar, Tagarapuvalasa, Vepagunta, Waltair, Yendada, …), `Vizag_Areas_Master`'s 57 rows already cover the large majority of these by name or near-spelling. The genuinely missing ones (not present in any of the three workbook locality sheets) worth adding to the master locality table: **Achutapuram, Aganampudi, Boyapalem, Isukathota, Kapuluppada, Kommadi, Malkapuram, Marikavalasa, Scindia, Sujatha Nagar, Tagarapuvalasa, Yendada, Hanumanthuwaka** (as its own entry, currently only appears combined with Simhachalam).

**Also found:** the already-built `Provider.js` model hardcodes locality as a **13-item Mongoose enum** (`MVP Colony, Dwaraka Nagar, Madhurawada, Gajuwaka, Seethammadhara, Akkayyapalem, Asilmetta, Maharani Peta, Arilova, Rushikonda, NAD Junction, Visalakshi Nagar, Other`). That's a hard blocker against both the workbook (57 real localities) and the user's ~55-item list — any provider outside those 13 names cannot currently be saved. This has to become a real `Locality` collection (see §7), not an enum.

---

## 5. Missing healthcare categories

Comparing `Provider_Types` (20 types in the workbook) against the already-built `Provider.js` `type` enum (7 values: `hospital, clinic, diagnostic, pharmacy, blood_bank, home_healthcare, ambulance`):

Present in the workbook but **not representable** in the current model: `Government Hospital`, `Individual Doctor Clinic`, `Polyclinic`, `Laboratory` (distinct from `diagnostic`), `Dental Clinic`, `Eye Clinic`, `Eye Hospital`, `Physiotherapy Centre`, `Rehabilitation Centre`, `Imaging Centre`, `Vaccination Centre`, `Day Care Centre`, `Specialty Centre`.

Also missing from both the workbook's `Provider_Types` and the built model, but implied by the user's spec and by `CareConnect_Service_Master`'s own categories: standalone **Blood Bank services** (the workbook only has it as a provider type, not a service), **Molecular Diagnostics** as a distinct provider capability flag (not just a lab test category), and **Home Sample Collection** as a first-class service rather than a boolean.

---

## 6. Final normalized schema

This keeps everything the workbook and the already-built models got right, and fixes the gaps found above. New/changed pieces are marked.

```
Organization (NEW — chain/brand parent)
 ├─ name, type (hospital_chain | pharmacy_chain | lab_chain | independent), logo
 └─ Branch (= existing Provider, extended)
      ├─ orgId → Organization (nullable — independents have none)
      ├─ providerType → ProviderType master (was: 7-value enum → CHANGE to lookup table seeded from the workbook's 20 types, extensible)
      ├─ name, branchName (NEW — the workbook's "Branch Name" col; distinguishes "Apollo Pharmacy — Gopalapatnam 3" from the brand "Apollo Pharmacy")
      ├─ address (street-level, NEW — currently absent from Provider.js), locality → Locality master (CHANGE from enum), city, district (NEW), state, pincode
      ├─ geo (already 2dsphere-indexed — correct, just needs real coordinates once verified)
      ├─ phone, email (NEW), website (NEW)
      ├─ workingHours[], emergencyAvailable (already correct)
      ├─ specialties[], servicesOffered[] (already correct — needs real data, not schema change)
      ├─ consultationFeeRange, insuranceAccepted[] (already correct)
      ├─ homeCollection, teleconsultation, appointmentEnabled (already correct)
      ├─ publicRating, publicReviewCount (NEW, separate from CareConnect's own ProviderReview — see §22 honesty note)
      ├─ source → Source subdocument (CHANGE from free string): { type, label, url, capturedAt }
      ├─ verificationStatus: UNVERIFIED | CLAIMED | VERIFIED | SUSPENDED | CLOSED
      │   (CHANGE: rename TEMPORARILY_UNAVAILABLE → SUSPENDED to match the user's current spec; SUSPENDED covers both "temporarily unavailable" and provider-initiated pause — same field, clearer name)
      ├─ lastVerifiedAt, claimedByUserId (already correct)
      └─ active, tenantId (already correct)

ProviderType (NEW lookup) — seeded from the workbook's 20 rows, admin-extensible
Locality (NEW lookup) — replaces the 13-item enum; seeded from Vizag_Areas_Master (57) + the ~13 genuinely-missing localities from §4; fields: name, city, district, state, region (city | district-wide), active
ServiceCategory (NEW lookup) — split the workbook's mixed 40-row list into two: clinicalSpecialty[] and labDiscipline[] (labDiscipline reuses the existing BillableItem catalogue's categories rather than duplicating it)

Doctor (extends existing ProviderDoctor)
 ├─ providerId, name, specialty → ServiceCategory
 ├─ qualification, registrationNumber (already present per workbook's Doctor_Master — confirm ProviderDoctor has both)
 ├─ experienceYears, consultationFee
 └─ verificationStatus, appointmentEnabled

ProviderService (already built) — extend to reference the unified BillableItem/service catalogue instead of free text where possible, keep free text as fallback for provider-specific offerings

ProviderOnboarding (NEW model — currently only exists as a spreadsheet, not code)
 ├─ providerId
 ├─ claimed, documentsVerified, doctorsAdded, servicesAdded, pricesAdded, hoursAdded, availabilityConnected, paymentEnabled (all booleans)
 └─ goLiveStatus: DISCOVERY_ONLY | CLAIMED | VERIFIED | CONNECTED | BOOKABLE
     (this is exactly the CLAIMED→VERIFIED→CONNECTED→BOOKABLE gate from the user's spec — the workbook already tracks the checklist, it just isn't backed by a model+state-machine yet)

LabTest / LabPanel (already built as BillableItem — unify CareConnect_Service_Master's lab rows and Dental_Ophthalmology_Services into it rather than a second catalogue)

Appointment (already built as NearbyAppointment) — no structural change indicated by the workbook
```

**Mapping existing sheets → schema:**

| Sheet | Maps to |
|---|---|
| `All_Providers_Master` | `Provider` (Branch) — primary import source |
| `Provider_Master`, `Small_Clinics_Labs`, `Dental_Master`, `Ophthalmology_Master` | Superseded by `All_Providers_Master` — skip on import (already merged), keep only as historical source references |
| `Doctor_Master` / `All_Doctors_Master` | `ProviderDoctor` |
| `Pharmacy_Master` / `All_Pharmacies_Master` | `Provider` where `providerType = Pharmacy` (not a separate collection) |
| `Provider_Types` | Seeds `ProviderType` |
| `Vizag_Areas_Master` (+ gap-fill from §4) | Seeds `Locality` |
| `Service_Categories`, `CareConnect_Service_Master`, `Dental_Ophthalmology_Services` | Unify into existing `BillableItem` catalogue |
| `Provider_Onboarding` | Seeds `ProviderOnboarding` |
| `Current_Public_Seed` | Candidate rows for `Provider` **only after** `Source.url` + `Source.capturedAt` are attached — currently lacks a source URL, which the honesty rule requires before any rating is shown |
| `Practo_Market_Reference` | **Not provider data.** Store as-is in an internal `MarketReference` reference table for market-sizing context only; never used to generate or "fill up to" provider counts |
| `Provider_Master_Template`, `Provider_Import_Schema`, `Service_Master`, `Availability`, `Verification`, `Lab_Result_Master` (all empty) | Confirm target schema, no data to import |

---

## 7. Fields to remove / rename

- **Remove** `Provider_Master`'s 18-column schema entirely from future use — fully superseded by `All_Providers_Master`'s 32 columns. Keep the sheet only as a historical record.
- **Rename** `TEMPORARILY_UNAVAILABLE` → `SUSPENDED` in `Provider.js`'s `verificationStatus` enum, to match the user's current, more recent spec. (Behavior-equivalent; this is a label change, not a new state.)
- **Rename** the free-text `source: String` field on `Provider.js` → a structured `source: { type, label, url, capturedAt }` subdocument, because `Provider_Import_Schema` (the workbook's own most-detailed draft) already separates `Source URL`, `Source Type`, and implies a capture date — the current free string can't carry that.
- **Split** `Service_Categories`' mixed clinical/lab/non-clinical list into `clinicalSpecialty` vs `labDiscipline` (see §6) — a single flat category caused the "Endocrinology" ambiguity noted in §2 (appears both as a clinical specialty and, with 22 rows, as a lab-test category for hormone panels).
- **Deprecate** the 13-item `VIZAG_LOCALITIES` enum in `Provider.js` in favor of a `Locality` collection (see §6) — required regardless of import, since it already blocks any provider outside those 13 names.

---

## 8. Missing fields, by module

**Appointment booking:** `providerType`/`Locality` need to be real references (not strings) before search filters can be reliable; `geo` coordinates (currently 100% missing) are the hard blocker for "near me" sorting — `AvailabilityEngine.js`/`GeoSearch.js` are already built and correct, they just have no real data to operate on yet. Nothing else missing structurally — `ProviderSchedule`, `ScheduleException`, `NearbyAppointment` already cover slot generation and double-booking prevention.

**Lab result entry:** the workbook's empty `Lab_Result_Master` template (16 cols) is essentially a simplified version of what's already built in `LabWorkItem.js`/`LabValidation.js`/`LabIntake.js` (which additionally handle reference-range snapshotting, critical-value workflow, and amendment/locking that the spreadsheet template doesn't even attempt). No gap — the built LIS already exceeds the workbook's draft schema.

**Pharmacy/inventory:** the workbook has zero inventory/batch/stock data — only 7 pharmacy identity rows (all Apollo). No `Medicine`, `Batch`, or `Inventory` models exist yet in the codebase for the Nearby module (there is a separate EMR-side medicine catalog, but not a pharmacy-inventory one). This is a genuine gap requiring new models: `Medicine` (name, generic, form, strength, HSN/schedule), `PharmacyInventory` (pharmacyId, medicineId, batch, expiry, MRP, stock, supplier), consistent with the CDSCO/IVD regulatory-metadata pattern already established for `BillableItem`.

**Dental/ophthalmology:** well covered — `Dental_Ophthalmology_Services` (41 rows) is structurally sound (Specialty/Service/Category/Price/Provider-Specific/Active) and closely matches the user's 19-item dental / 20-item ophthalmology lists. Just needs merging into the unified service catalogue (§6) instead of staying a separate sheet, and provider-specific pricing filled in per-provider (currently null everywhere, correctly — prices are provider-specific and must not be invented centrally).

**Billing:** no billing-specific data in the workbook at all (it's a provider directory, not a billing system) — the already-built `BillableItem` master and its planned bill/invoice/payment models (per the earlier LIS spec) remain the design to follow; nothing here changes it.

**ABDM/interoperability:** the workbook has no ABDM fields anywhere. Per the user's explicit instruction not to claim compliance for an unimplemented field: current status is **Not available** — no ABDM Health ID capture, no FHIR bundle generation, no HIE-CM integration exists in the codebase today. This should be tracked as a distinct future module, explicitly labeled "Not available" in any product documentation until real integration work starts, not "Pending" (which would imply active work) or listed alongside "Implemented" features.

---

## 9. Implementation roadmap (data side only — UI/API layers already exist from the earlier build)

1. **Locality & ProviderType masters** — seed `Locality` (57 + ~13 gap-fill entries) and `ProviderType` (20 entries) collections; migrate `Provider.js` off its two hardcoded enums onto references. This unblocks importing the other ~52% of providers currently invisible to the schema.
2. **Import pipeline** (upload → validate → preview → duplicate-detection → error-report → approve → import), built against `All_Providers_Master` as the sole source sheet, with fuzzy name+locality duplicate detection surfaced for human approval, never auto-merged.
3. **Import `All_Providers_Master`, `Doctor_Master`, `Pharmacy_Master`** as `UNVERIFIED`/`source_type: import`, `appointmentEnabled: false` — matching the honesty rule and the workbook's own onboarding state (100% currently unclaimed).
4. **Seed `ProviderOnboarding`** 1:1 from `Provider_Onboarding` (all 222 already correctly `DISCOVERY_ONLY`).
5. **Unify `CareConnect_Service_Master` + `Dental_Ophthalmology_Services`** into the existing `BillableItem` catalogue rather than standing up a parallel service table.
6. **Geocoding pass** — the single highest-leverage next step, since 100% of providers lack coordinates and the entire "near me" feature depends on it. This must be a verification activity (confirming a real address, then geocoding it), not a bulk auto-geocode of unverified locality strings, per the no-fabrication rule.
7. Everything else (booking UI, provider dashboard, admin console) is **already built** from the prior turn — this roadmap only concerns getting real, defensible data into the existing pipes.

---

## 10–13. API / DB / role / onboarding architecture

No changes needed beyond what's already implemented and mounted at `/api/nearby` — the route contract, `AvailabilityEngine`, transactional double-booking prevention, and role gates (`admin`/`doctor` interim → should formalize into the user's expanded role list: Super Admin, Organization Admin, Hospital Admin, Doctor, Nurse, Lab Technician, Lab Reviewer, Pharmacist, Billing Manager, Billing Staff, Reception, Patient, Provider Staff) are sound. The DB relationship chain `Organization → Provider(Branch) → Doctor/Service → Schedule → Appointment` matches §6 with `Organization` added as the one new top-level node for chains (Apollo Pharmacy, Medicover) that the workbook's data already implies but the current schema doesn't model.

---

## 14–16. Search / booking / lab / pharmacy / AI workflows

All already implemented (`GeoSearch`, `AvailabilityEngine`, `LabIntake`, the AI Medication Suggestions endpoint with its "doctor decides" constraint) and require no workflow redesign from this data — only real data to run on, per §3.

---

## 17. Security/privacy risk from this data specifically

`Current_Public_Seed` carries public ratings/review counts sourced from "Business search" with **no source URL column** — displaying these without an attached, checkable source would violate the "distinguish verified vs. unverified" rule even though the numbers themselves look like real aggregator data. Treat as **not displayable** until a `Source.url` is attached per row.

---

## 18. Legal/regulatory (India)

Explicitly confirmed: the workbook does **not** bulk-copy Practo's data — `Practo_Market_Reference` is 18 rows of city-level aggregate counts ("1,836 doctors", "135 hospitals") labeled by the workbook's own author as "market-size/category reference, not bulk-copy data." That's the correct, already-safe use of that source and should stay exactly as-is — a market-context table, never provider records.

---

## 19. Realistic Vizag MVP given this data

Given 222 provider identities but 0% with coordinates/phone-verified/claimed, and only 12 doctors / 7 pharmacies with real depth: a defensible MVP is a **directory-first launch** (browse/search by type + locality + specialty, no booking) for a curated first batch of providers that go through real phone/address verification — not all 222 at once. Booking should switch on per-provider only once `ProviderOnboarding.goLiveStatus = BOOKABLE`, which today is true for **zero** providers — consistent with what the data actually shows, not a target to shortcut.

---

## 20. Data requiring verification before any patient-facing use

Every row in `All_Providers_Master`, `Doctor_Master`, `Pharmacy_Master`, and `Current_Public_Seed` is `UNVERIFIED` and must go through the claim/verify workflow before display as anything other than "unverified directory listing." No exceptions found in the data.

---

## Next step

This is analysis and schema design only, per the requested sequencing — no migration code or model changes have been made yet. The natural next step is implementing §9 items 1–2 (Locality/ProviderType masters + the import pipeline), which is a substantial build in its own right — say the word and it's next.
