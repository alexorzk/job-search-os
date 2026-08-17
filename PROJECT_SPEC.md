# Project Specification

## Product vision

Job Search OS is a personal, semi-automated workflow that reduces two daily bottlenecks:

1. finding the best fresh electrical-engineering and EE-adjacent new-graduate opportunities; and
2. producing a strong, truthful, consistently formatted resume for each selected role.

The product favors a small number of high-value recommendations over a large archive of raw listings. It should help the user decide and prepare; it should not impersonate the user or make consequential decisions without review.

The initial user is a B.S. Electrical Engineering student graduating in May 2027 and studying in the United States on F-1 status. The system must treat experience and visa fit with nuance and represent uncertainty explicitly.

## Product principles

- **Quality over volume:** promote approximately ten viable jobs per day, not hundreds of unreviewed links.
- **Freshness matters:** prefer recently posted, still-open roles while preserving excellent older opportunities.
- **Broad new-grad interpretation:** evaluate whether a new B.S. EE graduate could qualify across hardware, electronics, embedded, firmware, systems, test, validation, controls, FPGA, RF, power, semiconductor, and related work.
- **Evidence over title:** internships, engineering employment, research, substantial projects, technical teams, and coursework/labs may satisfy experience signals.
- **Truthful tailoring:** every resume claim must trace to approved source material.
- **Deterministic safeguards:** use rules for duplicates, explicit disqualifiers, score arithmetic, and document layout checks; use AI only where language understanding adds value.
- **Uncertainty is a result:** visa compatibility is shown as `YES`, `MAYBE`, or `NO`; missing or ambiguous evidence is `MAYBE`, never guessed into `YES`.
- **Location is a first-class preference:** Preferred and Acceptable locations dominate the Daily Top 10, with at most one unusually strong Low-Interest wildcard and no Hard-No locations.
- **Human control:** the user approves promoted jobs, final resumes, applications, and outreach.
- **Privacy by default:** private operational data stays out of the public repository.
- **Simple operations:** optimize for free tools, reliability, maintainability, fast setup, and visible failure states.

## Intended user workflow

### Daily discovery

1. Scheduled ingestion reads [Zapply — New-Grad Hardware Engineering Jobs 2027](https://github.com/zapplyjobs/New-Grad-Hardware-Engineering-Jobs-2027) and legitimate LinkedIn/Handshake alert emails. The broader generic Zapply new-grad repository is out of V1 unless this dedicated feed proves insufficient.
2. Source records are normalized and deduplicated.
3. Company career pages are the preferred verification/source-of-truth whenever a candidate includes an official application link.
4. Deterministic rules reject clearly irrelevant, closed, senior, visa `NO`, and Hard-No-location roles.
5. Full descriptions are retrieved when safely available. Missing descriptions remain visible as incomplete evidence.
6. AI may classify discipline, seniority, requirements, experience fit, and ambiguous visa language against the approved user profile.
7. Configurable scoring combines technical fit, visa compatibility, new-grad fit, location, freshness, interest, and compensation.
8. Top 10 composition prefers at least nine Preferred/Acceptable jobs when enough exist, permits at most one exceptional Low-Interest location wildcard, and permits no Hard-No jobs.
9. The best viable jobs are promoted to the private Notion Jobs database; low-value raw records are retained only in lightweight processing state/logs, not the main dashboard.
10. The user reviews the queue and decides whether to skip, save, or prepare an application.

### Resume preparation

1. The user selects a job and requests a resume draft.
2. The system reads the exact job description and the private, approved Experience Bank.
3. AI proposes relevant experiences, bullet selection/order, modest rewrites, shortening, and terminology alignment.
4. Every proposed statement must be attributable to Experience Bank evidence. Unsupported claims are blocked or flagged.
5. A deterministic template renders the document using fixed typography, margins, spacing, alignment, and ATS-friendly sections.
6. Automated checks flag page overflow, bullets over three rendered lines, likely orphan words, missing required sections, and unsupported content.
7. The user reviews and edits the resume. Typography is not shrunk to solve content overflow; content is shortened first.
8. The exact approved file is stored in a private Drive folder and linked to the corresponding job/application record.

### Application and follow-up

The user applies manually and marks the application state. A later V1 enhancement may suggest matches from conservative Gmail confirmation parsing. Networking begins only after discovery and resume preparation are reliable. Hunter.io, if added, is used selectively for public professional contact discovery; no message is sent automatically.

## Functional scope

### Discovery and ranking

- scheduled and manual ingestion;
- source provenance and timestamps;
- canonical URL/company/title/location normalization;
- duplicate detection with explainable merge behavior;
- broad EE and adjacent-role classification;
- seniority and years-of-experience interpretation;
- full-description retrieval where permitted and reliable;
- explicit visa, citizenship, export-control, and clearance signal extraction;
- user-facing visa classification limited to `YES`, `MAYBE`, or `NO`, with evidence retained internally;
- experience-aware scoring against a user-approved profile;
- configurable weights and thresholds;
- Preferred/Acceptable/Low-Interest/Hard-No location classification;
- Daily Top 10 selection with location composition constraints, reasons, and uncertainty flags;
- private Notion queue and status tracking.

### Resume system

- structured, private Experience Bank;
- immutable source facts plus approved bullet variants;
- job-specific selection and modest rewriting;
- claim-to-source traceability;
- deterministic one-page rendering;
- formatting and content validation;
- exact-version storage and application linkage.

### Application tracking

- manual status changes and application date;
- exact job snapshot and resume link;
- optional conservative confirmation-email suggestions;
- later reminders and networking support.

## Status model

One `Stage` field is clearer than mixing discovery and document tasks:

- `Review`
- `Saved`
- `Resume Needed`
- `Resume Draft`
- `Ready to Apply`
- `Applied`
- `Networking`
- `Interviewing`
- `Offer`
- `Rejected`
- `Closed`
- `Skipped`

Raw discoveries that are not promoted do not need a Notion stage. `Daily Batch`, `Rank`, and processing fields distinguish today's queue from lifecycle state. Transitions remain user-controlled except that ingestion may create `Review` items and a confirmed closed posting may be flagged for closure rather than silently changed.

## Architecture

- **Notion:** primary private dashboard and operational database for promoted jobs, Experience Bank entries, and Resume Versions.
- **Google Apps Script:** scheduled orchestration, connectors, normalization, deterministic rules, scoring, Notion API calls, logs, and later manual web endpoints.
- **Gmail:** legitimate job-alert inputs and, later, conservative application-confirmation suggestions.
- **GitHub job feed:** [Zapply — New-Grad Hardware Engineering Jobs 2027](https://github.com/zapplyjobs/New-Grad-Hardware-Engineering-Jobs-2027) is the primary V1 machine-friendly source. Do not add Zapply's broader generic new-grad repository unless the dedicated feed is demonstrably insufficient.
- **Google Drive:** private storage for exact resume outputs and optional private profile/config snapshots.
- **AI provider:** structured classification, comparison, tailoring, and drafting behind a replaceable adapter. AI output is untrusted until validated.
- **Manual browser capture:** later bookmarklet or small extension calling a guarded Apps Script endpoint.
- **Hunter.io:** optional, time-permitting enrichment after core workflow acceptance.

Detailed responsibilities and data flow are in [docs/architecture.md](docs/architecture.md).

## Human-approval boundaries

The system may automatically ingest, normalize, deduplicate, retrieve descriptions, compute scores, and propose a daily queue. It must not:

- submit an application;
- send an email, LinkedIn message, or other outreach;
- claim that the user has experience not present in approved source material;
- decide that ambiguous visa language is compatible;
- promote a visa `NO` or Hard-No-location job into the Daily Top 10;
- overwrite an approved resume version;
- mark an application as submitted solely from an uncertain email match;
- publish or share private data;
- delete application records without explicit user action.

AI recommendations must expose source/evidence and confidence sufficient for user review. Final resume approval, application submission, status confirmation, and outreach are always human actions.

## Non-functional requirements

- A routine daily run should be inspectable and safely rerunnable.
- Duplicate runs should not create duplicate Notion entries.
- Connector failures should be isolated and logged; one bad source item should not abort the batch.
- Configurable values should live in private Script Properties or a documented, non-secret settings layer.
- APIs should be called conservatively with caching/retry behavior appropriate to quotas.
- The system should retain source URL, source timestamp, retrieval timestamp, and a job-description snapshot/hash.
- Structured AI evidence extraction must be schema-validated, include an internal `unknown` option, and fail closed for consequential claims; unknown visa evidence maps to user-facing `MAYBE`.
- Resume generation should produce repeatable layout from the same approved inputs.

## Explicit exclusions

- LinkedIn scraping;
- automated application submission;
- automated LinkedIn or email outreach;
- custom web frontend;
- Docker or Kubernetes;
- vector databases;
- complex multi-agent systems;
- paid Zapier/Make automation;
- broad web crawling or bypassing access controls;
- unnecessary cloud infrastructure.

## Long-term direction (after V1)

Potential later work includes manual browser capture, improved employer visa evidence, confirmation-email reconciliation, follow-up reminders, selective professional-contact enrichment, analytics, and additional high-quality sources. Each addition should be justified by measured improvement to relevant applications or time saved.

## Success measures

V1 is useful when the user can complete a morning review from a compact set of fresh, credible opportunities; understand uncertainty; generate a truthful one-page resume draft for a selected job; link its exact final version; and track the manually submitted application. Longer-term measures include recommendation acceptance rate, time from discovery to ready-to-apply, duplicate/error rate, formatting QA pass rate, and interview conversion—not raw listing volume.

## Decisions required before Milestone 1

The implementation should not begin until the user confirms or supplies:

- the private Notion workspace/integration and whether the user's plan supports the desired database behavior;
- representative LinkedIn and Handshake alert emails or their observed private structures;
- the actual Preferred, Acceptable, Low-Interest, and Hard-No location lists, remote-work treatment, relocation constraints, target role/industry preferences, graduation timing, and user-confirmed work-authorization answers;
- the approved Experience Bank source material and baseline resume/template, kept outside this repository;
- the required editable/output resume formats (for example, Google Docs plus PDF) and acceptable rendering toolchain;
- the AI provider/model, data-retention settings, free-tier/quota expectations, and whether any paid usage is acceptable;
- the morning run time/timezone; the finalized Top 10 behavior is up to ten jobs above threshold, never padded;
- whether employer E-Verify/H-1B history is core enough to justify an additional reliable data source in V1.

Until confirmed, the plan assumes one user, one application per job, one resume template, the dedicated Zapply hardware/EE feed, a few supported email layouts, no paid workflow service, and `MAYBE` plus manual review for visa ambiguity.
