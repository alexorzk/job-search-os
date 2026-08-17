# Private User Profile Schema

## Storage boundary

The real profile lives only in the private staging Google Sheet's `Profile` tab. It is not stored in Git and is not stored in Script Properties. The public schema is [schemas/user-profile.schema.json](../schemas/user-profile.schema.json); [fixtures/example-profile.json](../fixtures/example-profile.json) is wholly fictional.

The `Profile` tab has one active row:

| Column | Value |
| --- | --- |
| `profile_key` | `ACTIVE` |
| `schema_version` | `1.0` |
| `profile_json` | Complete private JSON object |
| `updated_at` | ISO 8601 timestamp |

`validatePrivateProfile()` reads and validates this row but returns only a safe summary. It does not log or return profile contents.

## Location model

The schema supports:

- `PREFERRED`, `ACCEPTABLE`, `LOW_INTEREST`, and `HARD_NO` tiers;
- country-, state-, metro-, and city-level rules;
- remote, hybrid, onsite, relocation, unknown-location, and multi-location policies;
- more-specific geographic overrides;
- future Hard-No rules without code changes.

Precedence is deterministic:

```text
work-mode prohibition
  > CITY rule
  > METRO rule
  > STATE rule
  > COUNTRY rule
  > unknown_location_tier
```

Within one specificity, higher numeric `priority` wins; ties use rule ID for stable behavior. A remote role uses `remote_allowed` and `remote_tier`. A disallowed work mode resolves to `HARD_NO`.

Multi-location strategies are:

- `BEST_TIER` — use the most favorable listed location;
- `WORST_TIER` — use the least favorable listed location;
- `REQUIRE_REVIEW` — mixed tiers resolve conservatively to Low-Interest and require review.

Role and industry weights range from 0 to 100 and are preference signals, not hard filters. Preferred/avoided company and industry lists are optional targeting signals; only explicit future policy should turn one into a hard filter.

## Work authorization

The private profile stores user-confirmed facts separately from job-level visa classification. It supports `requires_current_sponsorship` and `requires_future_sponsorship` with values `YES`, `NO`, or `UNKNOWN`, plus timestamped user-confirmed facts.

These values are factual inputs supplied by the user, not generated legal conclusions. Job-level visa output remains exactly `YES`, `MAYBE`, or `NO`, and is not part of the user profile schema.

## Editing safely

Create a private copy of the example JSON outside this repository, replace all fictional values privately, validate it, and paste it into the private Sheet. Never save a real profile under `fixtures/`, `schemas/`, `apps-script/`, `tests/`, or any tracked path.
