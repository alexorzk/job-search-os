# Minimal V1 Data Model

## Modeling principles

- Keep Notion human-friendly and avoid a database for every concept.
- Put only promoted jobs in the primary Jobs database.
- Use stable internal IDs, relations, and snapshots so an application remains auditable after a posting changes.
- Distinguish automation-owned fields from user-owned decisions.
- Represent `unknown` explicitly; blank must not imply compatible or false.
- Real records are private. Public fixtures use invented employers, people, and facts.

## Job (Notion database)

One record represents a promoted opportunity and its application lifecycle. A separate Application database is unnecessary for a one-application-per-job V1.

| Field | Type | Owner | Purpose |
| --- | --- | --- | --- |
| `Job ID` | text (stable, unique) | automation | Internal identity used for upserts |
| `Title` | title | automation | Display title |
| `Company` | text | automation | Normalized employer |
| `Canonical URL` | URL | automation | Preferred application/posting URL |
| `Source Links` | text/URLs | automation | All provenance links; compact JSON/text is acceptable in V1 |
| `Source Types` | multi-select | automation | GitHub, Gmail, Manual |
| `Location` | text | automation | Normalized display location |
| `Work Mode` | select | automation | On-site, Hybrid, Remote, Unknown |
| `Posted At` | date | automation | Publisher date when known |
| `First Seen At` | date/time | automation | First ingestion time |
| `Last Seen At` | date/time | automation | Latest source observation |
| `Description Snapshot` | rich text or private Drive link | automation | Exact text/reference used for evaluation; respect Notion limits |
| `Description Hash` | text | automation | Detects changes and binds scoring/resume inputs |
| `Role Family` | multi-select | automation | Electrical, Hardware, Embedded, Firmware, Test, etc. |
| `Experience Requirement` | text | automation | Extracted range/phrase plus evidence |
| `Seniority Signal` | select | automation | New Grad, Entry, Junior, Engineer I, Engineer II, Senior+, Unknown |
| `Visa Signal` | select | automation | Compatible Evidence, No Restriction Found, Uncertain, Restricted |
| `Restriction Flags` | multi-select | automation | Citizenship, PR, No Sponsorship, Clearance, Export Control, Seniority |
| `Score` | number | automation | Final score after penalties, 0–100 |
| `Score Version` | text | automation | Rules/weights/model traceability |
| `Fit Summary` | rich text | automation | Concise reason for promotion; not verbose skill-by-skill UI |
| `Review Flags` | multi-select | automation | Missing description, visa review, duplicate review, stale, etc. |
| `Daily Batch` | date/text | automation | Local date key for promotion |
| `Daily Rank` | number | automation | 1–10 within batch |
| `Stage` | select | user | Review, Saved, Resume Needed, Resume Draft, Ready to Apply, Applied, Networking, Interviewing, Offer, Rejected, Closed, Skipped |
| `Interest Override` | select/number | user | Optional preference adjustment for future rescoring |
| `User Notes` | rich text | user | Decision and follow-up notes |
| `Applied At` | date | user | Confirmed manual submission date |
| `Resume Versions` | relation | shared | Links exact tailored versions |
| `Selected Resume` | relation | user | Exact version actually used |

Automation must preserve `Stage`, `Interest Override`, `User Notes`, `Applied At`, and `Selected Resume` during upserts.

Job description text can exceed a convenient Notion property. V1 may store a truncated human-readable excerpt plus a private Drive text snapshot or a private staging record, while retaining a hash and link on the Job.

## User Job Search Profile (private configuration object)

V1 has one user, so this does not require a Notion database. Store it as a private structured document (for example, a private Drive JSON/Sheet or Apps Script-accessible private configuration) and expose only non-sensitive fake schema examples publicly.

| Field | Type | Purpose |
| --- | --- | --- |
| `Profile Version` | text | Bind scores/resumes to an approved profile revision |
| `Graduation Date` | month/date | New-grad timing eligibility |
| `Degree` / `Majors` | list | Education fit |
| `Work Authorization` | enum + notes | Current F-1/OPT facts stated by user; never inferred |
| `STEM Eligible` | yes/no/unknown | User-confirmed STEM OPT relevance |
| `Sponsorship Needed Now` | yes/no/unknown | Explicit application-answer support |
| `Sponsorship Needed Future` | yes/no/unknown | Long-term compatibility evaluation |
| `Target Role Families` | weighted list | Broad EE/adjacent disciplines and preference |
| `Excluded Role Families` | list | Clearly unwanted work |
| `Target Locations` | weighted list | Preferred/acceptable locations and remote policy |
| `Relocation` | yes/no/conditional | Location feasibility |
| `Compensation Constraints` | optional range | Hard minimum or preference when available |
| `Industry Interests` | weighted list | Personal-interest score input |
| `Approved Skills` | list + evidence refs | Search/evaluation vocabulary, not standalone resume claims |
| `Experience Entry IDs` | list | Relation to approved Experience Bank corpus |
| `Hard Constraints` | list | User-defined non-negotiables |

Unknown authorization facts must trigger user review. The system is an organizational aid, not legal advice.

## Experience Bank (Notion database)

An entry represents one truthful experience: employment, internship, research, project, technical team, or selected coursework/lab. Keep source facts immutable within a version; corrections create a reviewed revision.

| Field | Type | Owner | Purpose |
| --- | --- | --- | --- |
| `Experience ID` | text (stable, unique) | user/system | Traceability key |
| `Name` | title | user | Private recognizable label |
| `Type` | select | user | Employment, Internship, Research, Project, Team, Coursework/Lab |
| `Organization` | text | user | Employer/school/team where appropriate |
| `Role` | text | user | Truthful title/context |
| `Start` / `End` | date | user | Accurate dates where applicable |
| `Source Facts` | rich text/structured text | user | Atomic approved facts, each with a stable fact ID |
| `Technologies` | multi-select/text | user | Tools explicitly supported by source facts |
| `Skills/Topics` | multi-select | user | Retrieval and matching tags |
| `Metrics` | structured text | user | Verified numbers with fact IDs/context |
| `Approved Bullets` | structured text | user | Reusable truthful variants with bullet IDs and supporting fact IDs |
| `Approval Status` | select | user | Draft, Approved, Retired |
| `Evidence Notes` | private text/link | user | Optional evidence/context; never needed in public repo |
| `Version` | text | user/system | Revision used for generation |

AI can select only `Approved` entries. A proposed rewrite stores `Experience ID`, supporting fact IDs, source bullet IDs if any, and transformation type (selected, reordered, shortened, terminology-aligned). It cannot add an unsupported technology, number, responsibility, or outcome.

## Resume Version (Notion database)

Each render is a separate immutable version. The record exists before final approval and is updated with its output/QA; changes to content create a new version.

| Field | Type | Owner | Purpose |
| --- | --- | --- | --- |
| `Resume Version ID` | title/text (unique) | automation | Stable immutable version key |
| `Job` | relation | automation | Target Job |
| `Created At` | date/time | automation | Generation time |
| `Status` | select | user/system | Draft, QA Failed, Review, Approved, Used, Superseded |
| `Profile Version` | text | automation | Profile snapshot used |
| `Experience Versions` | structured text | automation | IDs/versions used |
| `Job Description Hash` | text | automation | Posting snapshot used |
| `Template Version` | text | automation | Deterministic layout version |
| `Content Manifest` | private Drive link or structured text | automation | Ordered sections/bullets and source fact references |
| `Drive File` | URL/file reference | automation | Exact generated artifact |
| `File Checksum` | text | automation | Proves exact version linkage |
| `QA Result` | select | automation | Pass, Fail, Needs Review |
| `QA Flags` | multi-select/text | automation | Page count, long bullet, orphan risk, overflow, missing section |
| `Approved At` | date/time | user | Human approval timestamp |
| `Used At` | date/time | user | Manual application association timestamp |

The Job's `Selected Resume` relation identifies the exact file used. Never replace a `Used` file in place.

## Contact (not core V1)

Do not create a Contact database during the core one-week build. If Hunter/networking stretch scope is reached, add a minimal private database only when needed:

| Field | Type | Purpose |
| --- | --- | --- |
| `Contact ID` | text | Stable key |
| `Name` | title | Professional name |
| `Company` / `Role` | text | Relevance context |
| `Public Professional Email` | email | Selectively discovered public work address |
| `Source` | URL/text | Provenance |
| `Confidence` | select/number | Provider/evidence confidence |
| `Related Job` | relation | Application context |
| `Outreach Status` | select | Not Planned, Drafted, Sent Manually, Replied, Closed |

No automated sending is allowed.

## Processing records (implementation detail)

Raw candidates and run logs should not become Notion dashboard databases. The minimal private processing representation needs:

- `run_id`, local batch date, start/end/status, counts, and sanitized errors;
- source checkpoint (`adapter`, upstream item/message ID, revision, observed time);
- normalized candidate payload and stable ID;
- filter outcome with rule IDs/evidence;
- feature vector, score, rules/config/model versions;
- publish status and Notion page ID.

Apps Script Properties/cache may suffice at tiny volume. Use a private Google Sheet only if durable checkpoints, quotas, or debugging require it.

## Lifecycle invariants

- A job cannot be `Ready to Apply` without an approved related Resume Version when a resume is required.
- A job cannot be marked `Applied` by automation.
- `Selected Resume` must reference an approved/used immutable file.
- A hard-restricted job cannot enter the Daily Top 10 unless a user explicitly overrides it with a recorded reason; V1 may omit override support.
- Score changes never reset a user-owned stage.
- Deleting or retiring Experience Bank content does not alter historical Resume Version manifests.
