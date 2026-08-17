# V1 Architecture

## Architecture objective

V1 is a small scheduled pipeline, not a general job-search platform. Google Apps Script orchestrates ingestion and ranking; Notion is the human-facing system of record for promoted opportunities; Gmail and one public GitHub feed provide inputs; Drive holds private resume artifacts. Each stage is idempotent and inspectable.

## End-to-end data flow

```text
GitHub 2027 hardware/EE feed ─┐
                              ├─> ingest + source checkpoints
Labeled Gmail job alerts ─────┘
                                      │
                                      v
                         normalize + canonicalize
                                      │
                                      v
                         deduplicate + merge provenance
                                      │
                                      v
                   deterministic relevance/hard restrictions
                                      │
                                      v
                     retrieve/snapshot descriptions if allowed
                                      │
                                      v
             extract signals + compare with private user profile
                                      │
                                      v
                    deterministic weighted score + flags
                                      │
                                      v
                       select up to Daily Top 10
                                      │
                                      v
                           private Notion Jobs queue
                                      │
                              human selects job
                                      │
                                      v
         job snapshot + private Experience Bank -> AI proposal
                                      │
                         traceability/content validation
                                      │
                                      v
                  deterministic resume render + layout QA
                                      │
                          human reviews and approves
                                      │
                                      v
                exact file in Drive + Resume Version relation
                                      │
                            human applies manually
                                      │
                                      v
                         Notion lifecycle tracking
```

## Component responsibilities

### Google Apps Script

Apps Script is the V1 backend and scheduler. It owns:

- time-based triggers and manual run entry points;
- GitHub and Gmail adapters;
- source checkpoints and idempotency keys;
- field normalization and URL canonicalization;
- duplicate detection and provenance merging;
- description retrieval where safely accessible;
- deterministic hard filters and score calculation;
- the replaceable AI adapter and output schema validation;
- Daily Top 10 selection;
- Notion upserts that preserve user-owned fields;
- Drive file creation/linking for resume versions;
- structured run summaries and item-level errors.

Secrets, database IDs, Drive folder IDs, model configuration, thresholds, and source settings live in Apps Script Properties. Script code contains only safe defaults and example property names.

Apps Script execution-time and quota limits require bounded batches. A run stores a checkpoint and can resume; connector fetch, classification, and Notion writes should be separable so one failure does not require repeating all work.

### Notion

Notion is the private operational interface, not the raw ingestion store. It contains:

- promoted Jobs/Application records;
- the approved Experience Bank;
- Resume Version metadata and Drive links;
- views for today's review queue and application stages.

Automation owns normalized source facts, computed scores, batch/rank, and flags. The user owns stage, notes, interest overrides, decisions, and final approval fields. Upserts must never erase user-owned values.

### Gmail

Gmail is read-only input. V1 uses narrow label/query and sender rules for legitimate LinkedIn and Handshake job-alert emails; it does not scrape LinkedIn pages. The connector records message IDs as checkpoints and parses only supported observed layouts.

Application-confirmation detection is stretch scope. If implemented, it creates a suggested match for human confirmation and never changes application state directly.

### GitHub job feed

One dedicated 2027 new-grad hardware/electrical jobs repository is the primary source. Its exact repository, file, schema, update behavior, and license must be verified before implementation. The adapter records the upstream URL and revision/observation time, detects format drift, and converts rows to the normalized Job candidate shape.

### Google Drive

Drive stores exact approved resume files in a private folder. File names should use non-sensitive stable IDs and dates rather than full personal/job details where practical. Resume Version records contain the Drive file ID/link, template version, input snapshot IDs, checksum, and QA result. Existing approved versions are immutable; revisions create a new version.

### AI provider

AI may extract ambiguous requirements, classify role families, compare job evidence with approved experiences, summarize fit, select content, and propose modest bullet rewrites. Every call uses structured output with enumerated `unknown` states.

AI does not own:

- explicit restriction enforcement;
- final score arithmetic;
- duplicate identity;
- application status;
- unsupported factual claims;
- layout policy;
- any external communication.

If AI is unavailable or invalid, deterministic processing continues where possible and the item is flagged for review. Model/provider calls should be batched or limited to viable candidates to control cost and latency.

### Manual capture and Hunter.io

Manual capture is post-core work. A bookmarklet or minimal extension may later submit the current URL plus optional selected text to a guarded Apps Script endpoint. It must require a private token and still pass through normalization/deduplication.

Hunter.io is optional and user-triggered after an application is recorded. It may discover public professional contact information; it does not send messages.

## Pipeline stages and persisted state

1. **Ingest:** adapter emits a source item with source ID and observed timestamp.
2. **Normalize:** convert company, title, URL, location, dates, and text to stable fields.
3. **Deduplicate:** match exact canonical IDs first; use cautious normalized fallback keys second.
4. **Prefilter:** reject clear non-EE/adjacent work, obvious seniority, and explicit incompatible restrictions.
5. **Enrich:** retrieve accessible description and extract structured signals.
6. **Score:** apply configured feature weights and penalties; retain evidence and version metadata.
7. **Select:** choose up to ten viable items for the local daily batch.
8. **Publish:** upsert promotions to Notion and emit a run summary.
9. **Tailor:** on user request, assemble a traceable proposal from approved evidence.
10. **Render:** produce and validate a deterministic file, then save the approved version to Drive.

For V1, intermediate candidates may be held in Apps Script Properties/cache only for small checkpoints or recomputed from source fixtures. If volume or quotas make that unreliable, a private Google Sheet is the simplest fallback staging store. It should not become a second user-facing system of record.

## Identity and deduplication

Preferred identity order:

1. source-provided stable job/requisition ID plus employer;
2. normalized canonical application URL with tracking parameters removed;
3. conservative fingerprint of normalized employer + title + location + requisition ID/date.

Fuzzy similarity may flag a possible duplicate but should not merge records automatically in V1. A merged record retains all source links, first/last-seen timestamps, and the best available description. Reposted jobs may be separate when the requisition or posting date materially changes.

## Scheduling and failure behavior

- Run once each morning in the configured local timezone, with a manual rerun option.
- Use a script lock to prevent overlapping daily runs.
- Attach a `run_id`, rules version, and configuration version to outputs.
- Retry transient network failures with bounded exponential backoff; do not retry invalid data indefinitely.
- Record connector-level and item-level errors without logging secrets or full private content.
- Alert visibly (run summary/log and optionally a user-owned notification) when a source unexpectedly yields zero results, parsing changes, or publishing fails.
- Make reruns idempotent through source checkpoints, stable candidate IDs, daily batch keys, and Notion upserts.

## Security boundaries

- OAuth grants and API tokens remain in Google/Apps Script and Notion private configuration.
- Public GitHub contains code, schemas, fake fixtures, and documentation only.
- Gmail reads are restricted by configured query/labels and are never written or forwarded.
- Notion/Drive sharing is private and reviewed manually.
- Prompt inputs are minimized; provider data-handling settings must be reviewed before real personal data is sent.
- External content is untrusted input and cannot issue instructions to the automation.

See [privacy.md](privacy.md) for the full repository policy.

## V1 operational views

Minimum Notion views:

- **Today — Review:** current daily batch ordered by rank;
- **Resume Work:** Resume Needed and Resume Draft;
- **Ready to Apply:** approved resumes awaiting manual submission;
- **Active Applications:** Applied, Networking, and Interviewing;
- **Archive:** Offer, Rejected, Closed, Skipped.

No custom frontend is needed.
