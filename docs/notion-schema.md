# Milestone 1 Notion Schema and Ownership

## Database decision

V1 uses exactly three private Notion databases:

1. **Jobs / Applications** — the human-facing opportunity and application workflow;
2. **Experience Bank** — approved truthful source material for later scoring and resume tailoring;
3. **Resume Versions** — immutable metadata for exact tailored resume files.

There is no separate Application database because V1 assumes one application per job. There is no Contact database in core V1. The Jobs record contains the application lifecycle and a relation to the exact selected Resume Version.

The bootstrap uses Notion API version `2026-03-11`, creates each database with one data source, and stores both database and data-source IDs privately in Apps Script Properties.

## Jobs / Applications

### Automation-owned properties

Automation may set these on create and update:

| Property | Type | Purpose |
| --- | --- | --- |
| `Name` | title | Company and title display value |
| `Job ID` | rich text | Stable idempotency key |
| `Company` | rich text | Normalized company |
| `Source` | select | GITHUB, GMAIL, or MANUAL |
| `Source URL` | URL | Discovery provenance |
| `Official Application URL` | URL | Preferred company source-of-truth |
| `Requisition ID` | rich text | Employer requisition when available |
| `Location` | rich text | Normalized display location |
| `Posted At` | date | Credible posting date |
| `First Seen At` | date | First ingestion timestamp |
| `Overall Score` | number | Later overall score |
| `Technical Score` | number | Later technical/experience score |
| `Visa Status` | select | YES, MAYBE, or NO |
| `New Grad Score` | number | Later seniority/new-grad score |
| `Location Tier` | select | PREFERRED, ACCEPTABLE, LOW_INTEREST, or HARD_NO |
| `Freshness Score` | number | Later freshness score |
| `Interest Score` | number | Later combined interest/compensation score |
| `Flags` | rich text | Compact machine-readable flags |
| `Daily Rank` | number | Daily Top 10 rank |
| `Daily Batch` | date | Local batch date |
| `Location Wildcard` | checkbox | Single allowed Low-Interest wildcard marker |
| `Automation Updated At` | date | Last automation write |

### User-owned properties

Automation initializes `Stage` to `REVIEW` only when creating a page. Every later upsert omits all user-owned properties.

| Property | Type | Purpose |
| --- | --- | --- |
| `Stage` | select | User-controlled workflow state |
| `Application Date` | date | Confirmed manual submission date |
| `Notes` | rich text | Private decisions and context |
| `Interest Override` | number | Explicit user preference adjustment |
| `Follow-up Date` | date | Networking/follow-up reminder |
| `Selected Resume` | relation | Exact Resume Version used |

The ownership lists are centralized in `apps-script/01_Constants.js`. Update payload construction asserts that every property is automation-owned. Tests simulate manual edits before rerunning an upsert and confirm preservation.

## Simplified stage model

| Stage | Meaning |
| --- | --- |
| `REVIEW` | Newly promoted; needs a decision |
| `SAVED` | User intends to pursue or revisit |
| `RESUME_NEEDED` | Tailored resume work is required |
| `READY_TO_APPLY` | Resume/application materials are ready |
| `APPLIED` | User confirms manual submission |
| `FOLLOW_UP` | Networking or follow-up is due |
| `INTERVIEWING` | Active interview process |
| `OFFER` | Offer received |
| `REJECTED` | Employer rejected application |
| `CLOSED` | Role/application closed for another reason |
| `SKIPPED` | User chose not to pursue |

Today's arrivals are identified by `Daily Batch` and `Daily Rank`, not another workflow stage. `READY_TO_APPLY` communicates that required resume work is complete, so separate Resume Draft and Resume Ready stages are unnecessary in V1.

## Experience Bank

The bootstrap creates these minimal fields: `Name`, `Experience ID`, `Type`, `Approval Status`, `Source Facts`, `Technologies`, `Skills / Topics`, `Approved Bullets`, `Version`, and `User Notes`.

The real records are private and user-owned. Milestone 1 creates only the structure. Milestone 2 will define and enter the actual approved evidence; no real Experience Bank data belongs in Git.

## Resume Versions

The bootstrap creates: `Name`, `Resume Version ID`, `Target Job ID`, `Status`, `Created At`, `Drive File`, `File Checksum`, `QA Result`, `Template Version`, and `User Notes`.

Jobs has a one-way `Selected Resume` relation to this database. This is enough to identify the exact version used without introducing a fourth database. Resume generation and Drive integration remain out of scope.

## Recommended manual views

The API bootstrap creates standard table views. After bootstrap, create these views manually in Notion:

- **Today — Review:** filter `Daily Batch` to today and `Stage` to `REVIEW`; sort by `Daily Rank` ascending.
- **Resume Work:** filter `Stage` to `RESUME_NEEDED`.
- **Ready to Apply:** filter `Stage` to `READY_TO_APPLY`.
- **Active Applications:** include `APPLIED`, `FOLLOW_UP`, and `INTERVIEWING`.
- **Archive:** include `OFFER`, `REJECTED`, `CLOSED`, and `SKIPPED`.

View layout is user preference, so Milestone 1 does not automate it.
