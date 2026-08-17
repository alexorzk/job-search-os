# One-Week V1 Plan

## Definition of V1

The one-week V1 is a thin, end-to-end workflow that produces a useful Daily Top 10 from [Zapply — New-Grad Hardware Engineering Jobs 2027](https://github.com/zapplyjobs/New-Grad-Hardware-Engineering-Jobs-2027) plus selected Gmail alerts, writes promoted jobs to Notion, and creates a reviewable one-page resume draft from a private Experience Bank for a selected job. The user applies and updates status manually.

One week is realistic only if setup is available on day one, the initial GitHub feed has a stable parseable format, Gmail alert formats are limited to a few representative examples, and resume output targets one controlled template. Networking, Hunter.io, browser extension work, and automated confirmation reconciliation are stretch scope.

## Scope rules

- Build vertical slices in priority order; stop adding sources before compromising ranking or resume truthfulness.
- Use fake fixtures in the public repository and private operational data in Notion, Drive, Gmail, and Script Properties.
- Prefer deterministic heuristics first. Add AI only to ambiguous classification and wording tasks where it materially improves results.
- Store promoted jobs in Notion; keep rejected/raw processing results out of the main database unless needed for debugging.
- Treat the Daily Top 10 as “up to 10”: never pad the queue with poor or disqualified roles.
- A user-visible uncertainty flag is better than an unsupported answer.
- Visa `NO` and Hard-No locations are pre-ranking discards. Missing visa evidence is normally `MAYBE`, not `YES`.
- Reserve the Top 10 for Preferred/Acceptable locations except for at most one unusually strong Low-Interest location wildcard.
- Do not integrate the broader generic Zapply new-grad repository unless the dedicated hardware/EE feed proves insufficient.

## Milestone order and acceptance criteria

### 0. Planning foundation

Deliver this specification, one-week plan, architecture, data model, scoring policy, privacy policy, and repository safeguards.

Acceptance:

- all required planning files exist and agree on V1 scope;
- public/private data boundaries and human approvals are explicit;
- no implementation or private data is committed;
- the planning commit is pushed to `origin/main`.

### 1. Notion and data foundation

Create private Notion databases and minimal Apps Script configuration/connector scaffolding. Establish stable IDs and idempotent upsert behavior.

Acceptance:

- a fake Job fixture can be created, read, and updated without duplication;
- Jobs, Experience Bank, and Resume Versions relations work;
- credentials and database IDs are in Script Properties, never source;
- a dry-run mode and structured run log exist.

### 2. User job-search profile and experience structure

Capture private targeting preferences, work authorization facts, locations, disciplines, interests, and approved experience evidence using the schemas in `docs/data-model.md`.

Acceptance:

- required profile fields are complete or explicitly `unknown`;
- every target location is classified as Preferred, Acceptable, Low-Interest, or Hard-No, including an explicit policy for remote/multi-location roles;
- at least enough approved Experience Bank entries exist to evaluate representative jobs and assemble a baseline resume;
- each fact/bullet has a stable ID and is marked approved before AI may use it;
- no real profile or Experience Bank export is committed.

### 3. GitHub job-feed ingestion

Implement one adapter for [Zapply — New-Grad Hardware Engineering Jobs 2027](https://github.com/zapplyjobs/New-Grad-Hardware-Engineering-Jobs-2027). Do not integrate the broader generic Zapply new-grad repository in the core V1.

Acceptance:

- a scheduled or manual run fetches and normalizes new entries;
- rerunning the same input is idempotent;
- source URL and observed/published timestamps are retained;
- official company application links are preserved as the preferred verification/source-of-truth when present;
- source format drift produces a visible error rather than silent empty results;
- fixtures cover normal, changed, duplicate, and malformed rows.

### 4. Gmail ingestion for LinkedIn/Handshake alerts

Read only explicitly labeled job-alert messages using narrow Gmail queries. Parse a small number of observed formats.

Acceptance:

- only messages matching configured label/query and sender constraints are read;
- representative LinkedIn and Handshake alerts produce normalized candidates;
- message IDs prevent reprocessing;
- failures are logged without altering the email;
- the connector requests the smallest practical Gmail scope.

### 5. Description retrieval, normalization, and filtering

Retrieve full descriptions from source-provided or canonical job URLs when accessible; normalize fields, merge duplicates, and run deterministic hard filters.

Acceptance:

- duplicate jobs across GitHub and Gmail resolve to one candidate with source provenance;
- obvious senior titles, visa `NO`, and Hard-No locations are rejected before ranking;
- Engineer II and ambiguous experience requirements are read, not automatically rejected;
- missing/inaccessible descriptions are flagged and scored conservatively;
- retrieval honors normal access controls and does not scrape LinkedIn.

### 6. Experience-aware scoring

Implement structured feature extraction against the approved profile, deterministic score calculation, and explanations/flags.

Acceptance:

- fixed fixtures produce repeatable scores and hard-filter outcomes;
- scoring weights and thresholds are configurable and sum to 100%;
- AI output is schema-validated and cannot override hard restrictions;
- the user-facing visa result is exactly `YES`, `MAYBE`, or `NO`; absence of language maps to `MAYBE` unless stronger evidence exists;
- technical, visa, new-grad, location, freshness, and combined interest/compensation weights default to 35/20/15/15/10/5;
- uncertain seniority and evidence cases remain explicitly reviewable;
- score records retain model/rules version and input snapshot identifiers.

### 7. Daily Top 10

Select up to ten best viable fresh candidates per local calendar day using deterministic location composition after numeric ranking.

Acceptance:

- each run promotes no more than ten viable jobs;
- reruns update the same daily batch instead of duplicating it;
- explicitly disqualified roles cannot enter the queue;
- visa `NO` and Hard-No-location jobs never enter the queue;
- at least nine jobs are from Preferred/Acceptable locations whenever at least nine viable jobs from those tiers exist;
- no more than one Low-Interest `Location Wildcard` appears, and only when it clears a higher configurable exceptional-opportunity threshold;
- a Low-Interest job cannot displace multiple viable Preferred/Acceptable jobs;
- each promoted item has rank, composite score, concise fit summary, and uncertainty flags;
- an insufficient pool results in fewer than ten items.

### 8. Notion output/dashboard

Upsert promoted items into the Jobs database and configure useful private views.

Acceptance:

- a “Today — Review” view shows rank, title, company, location tier, freshness, score, `YES`/`MAYBE`/`NO` visa status, wildcard marker, flags, and source link;
- lifecycle views support ready-to-apply and active applications;
- raw low-value listings do not flood the dashboard;
- manual edits to user-owned fields are preserved during upsert.

### 9. Resume Experience Bank

Complete the approved private evidence needed for resume assembly, including immutable facts and controlled bullet variants.

Acceptance:

- all candidate resume statements map to approved entries/facts;
- entries distinguish source facts from reusable bullet wording;
- unsupported technologies, metrics, and responsibilities are rejected;
- personal data remains private.

### 10. Resume tailoring

For one selected job, select/reorder experiences and draft modest job-aligned bullet edits through a schema-constrained workflow.

Acceptance:

- every output bullet cites its Experience Bank entry and supporting fact IDs;
- a validator rejects invented numbers, tools, responsibilities, or experience;
- the user can accept/edit/reject proposals before rendering;
- the job-description snapshot used for tailoring is retained.

### 11. Deterministic formatting QA

Render one controlled ATS-friendly template and validate layout.

Acceptance:

- default output is one page with fixed fonts, margins, spacing, and alignment;
- bullets are ideally one–two rendered lines, never more than three;
- overflow and likely orphaned final words are flagged;
- content is shortened/reworked before any typography change;
- the exact approved file is saved in private Drive and linked through a Resume Version record.

### 12. Manual Save Job / Mark Applied

Use Notion controls/status updates for the V1; a bookmarklet or extension is not required for the core week.

Acceptance:

- the user can save/skip a recommendation, request a resume, mark ready, and mark applied;
- an Applied record has date, canonical job snapshot, and exact resume relation;
- automation never submits an application.

### 13. Application-confirmation tracking (stretch)

Suggest status updates from tightly scoped Gmail confirmation messages.

Acceptance:

- matching is based on company/title/link evidence and shows confidence;
- uncertain matches require confirmation;
- no application state changes automatically;
- messages are read-only and deduplicated by message ID.

### 14. Networking / Hunter (stretch)

Only after milestones 1–12 are stable, optionally find a small number of public professional contacts and draft outreach.

Acceptance:

- enrichment is user-triggered and quota-aware;
- sources and confidence are visible;
- no private contact list is committed;
- no message is sent automatically.

## Suggested seven-day execution

| Day | Primary outcome | Scope guardrail |
| --- | --- | --- |
| 1 | Notion schemas, private configuration, profile, fake end-to-end upsert | No UI and no extra databases |
| 2 | Dedicated Zapply hardware/EE feed adapter, normalization, deduplication, tests | Do not add the generic Zapply feed |
| 3 | Narrow Gmail alerts plus description retrieval and hard filters | Support only observed alert formats |
| 4 | Experience-aware features, `YES`/`MAYBE`/`NO` visa classification, configurable scoring | AI cannot override deterministic restrictions |
| 5 | Location-constrained Daily Top 10 and Notion dashboard/views | Up to 10; at most one Low-Interest wildcard |
| 6 | Experience Bank tailoring flow and traceability | One resume template only |
| 7 | Deterministic render/QA, exact version linking, end-to-end rehearsal, documentation | Cut stretch work before core QA |

## Test and verification strategy

- Use synthetic fixtures for source rows, alert emails, job descriptions, profiles, experience entries, and AI responses.
- Unit-test canonicalization, duplicate keys, title/years parsing, hard filters, freshness decay, score arithmetic, and claim validation.
- Use contract tests for external response shapes with redacted fixtures.
- Run an end-to-end dry run that writes only fake data to a test Notion database.
- Rehearse idempotent reruns, partial connector failure, quota/rate-limit behavior, and missing-description cases.
- Visually inspect rendered resume output and retain machine-readable QA results.
- Perform a privacy scan before every public commit.

## Explicit cuts when time is constrained

Cut in this order:

1. Hunter/contact enrichment;
2. application-confirmation parsing;
3. bookmarklet/Chrome extension;
4. extra job sources or email layouts;
5. sophisticated diversity rules and employer sponsorship history;
6. automated resume rendering beyond one controlled template.

Do not cut duplicate safety, explicit restriction handling, Experience Bank traceability, human resume review, exact-version linkage, or privacy controls.

## V1 completion checklist

- A scheduled run handles at least one GitHub source and configured alert emails.
- The run is idempotent, logged, and survives individual malformed items.
- Up to ten viable jobs appear in the private Notion daily queue with simple visa status and location composition enforced.
- The user can move a job through review to applied manually.
- One selected job can produce a truthful, traceable, one-page resume draft.
- Formatting QA identifies overflow and long bullets.
- The approved resume file and job snapshot are linked to the application.
- No consequential external action occurs without user approval.
- No credentials or private operational data are present in Git history.
