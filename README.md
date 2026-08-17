# Job Search OS

A privacy-conscious, semi-automated operating system for finding and prioritizing early-career electrical engineering jobs, tailoring truthful resumes, and tracking applications.

This public repository currently contains the **Milestone 0 planning foundation** for a one-week V1. It intentionally contains no application implementation, credentials, personal resume, private Experience Bank, or application data.

## V1 outcome

Each morning, the system should ingest fresh jobs from [Zapply — New-Grad Hardware Engineering Jobs 2027](https://github.com/zapplyjobs/New-Grad-Hardware-Engineering-Jobs-2027) and legitimate Gmail alerts, remove duplicates and obvious mismatches, evaluate the remaining roles, and place approximately the ten best opportunities in a private Notion review queue. Visa status stays user-facing as `YES`, `MAYBE`, or `NO`; location preferences materially shape both score and queue composition. For a selected job, the system should help assemble a truthful, job-specific resume from a structured Experience Bank while preserving deterministic formatting. The user reviews every job, resume, application, and outreach action.

The initial user profile is a senior B.S. Electrical Engineering student graduating in May 2027 who is an F-1 international student. Title matching is intentionally broad: the system asks whether a new EE graduate could reasonably qualify, not whether the title literally says “entry level.”

## Deliberate V1 boundaries

V1 uses Notion, Google Apps Script, Gmail, Google Drive, and the dedicated Zapply 2027 hardware/EE feed. The broader generic Zapply new-grad repository is excluded unless the dedicated feed proves insufficient. AI assists with classification, comparison, and wording, but deterministic rules control safety-critical filters, score calculation, deduplication, Top 10 composition, and formatting checks.

V1 does not include LinkedIn scraping, automatic applications or messaging, a custom frontend, Docker, vector databases, complex multi-agent orchestration, paid workflow automation, or unnecessary cloud infrastructure.

## Planning documents

- [PROJECT_SPEC.md](PROJECT_SPEC.md) — long-term vision, constraints, workflow, architecture, and approval boundaries
- [V1_PLAN.md](V1_PLAN.md) — one-week scope, milestone order, acceptance criteria, and explicit cuts
- [docs/architecture.md](docs/architecture.md) — end-to-end V1 flow and component responsibilities
- [docs/data-model.md](docs/data-model.md) — minimal schemas and lifecycle states
- [docs/scoring.md](docs/scoring.md) — ranking, hard filters, freshness, seniority, and visa handling
- [docs/privacy.md](docs/privacy.md) — public-repository data policy and secret handling

## Planned setup

Implementation begins only after Milestone 0 is approved. The future setup will require private Notion databases, an Apps Script project, Gmail permissions, a private Drive folder, and Script Properties for secrets and IDs. Public examples will use fake data and `.example` configuration files.

## Status

Milestone 0: planning foundation. Do not add real personal or credential data to this public repository. See [docs/privacy.md](docs/privacy.md) before contributing.
