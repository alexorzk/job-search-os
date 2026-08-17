var JobSearchOS = JobSearchOS || {};

JobSearchOS.Constants = Object.freeze({
  CONFIG_VERSION: "1",
  PROFILE_SCHEMA_VERSION: "1.0",
  NOTION_API_VERSION: "2026-03-11",
  NOTION_BASE_URL: "https://api.notion.com/v1",
  LOCATION_TIERS: Object.freeze([
    "PREFERRED",
    "ACCEPTABLE",
    "LOW_INTEREST",
    "HARD_NO"
  ]),
  LOCATION_SCOPES: Object.freeze(["COUNTRY", "STATE", "METRO", "CITY"]),
  WORK_MODES: Object.freeze(["REMOTE", "HYBRID", "ONSITE", "UNKNOWN"]),
  VISA_STATUSES: Object.freeze(["YES", "MAYBE", "NO"]),
  JOB_STAGES: Object.freeze([
    "REVIEW",
    "SAVED",
    "RESUME_NEEDED",
    "READY_TO_APPLY",
    "APPLIED",
    "FOLLOW_UP",
    "INTERVIEWING",
    "OFFER",
    "REJECTED",
    "CLOSED",
    "SKIPPED"
  ]),
  AUTOMATION_OWNED_JOB_PROPERTIES: Object.freeze([
    "Name",
    "Job ID",
    "Company",
    "Source",
    "Source URL",
    "Official Application URL",
    "Requisition ID",
    "Location",
    "Posted At",
    "First Seen At",
    "Overall Score",
    "Technical Score",
    "Visa Status",
    "New Grad Score",
    "Location Tier",
    "Freshness Score",
    "Interest Score",
    "Flags",
    "Daily Rank",
    "Daily Batch",
    "Location Wildcard",
    "Automation Updated At"
  ]),
  USER_OWNED_JOB_PROPERTIES: Object.freeze([
    "Stage",
    "Application Date",
    "Notes",
    "Interest Override",
    "Follow-up Date",
    "Selected Resume"
  ]),
  STAGING_TABLES: Object.freeze({
    Candidates: Object.freeze([
      "job_id",
      "payload_json",
      "processing_status",
      "source_type",
      "source_id",
      "source_url",
      "first_seen_at",
      "last_seen_at",
      "notion_page_id",
      "error_code",
      "error_message",
      "updated_at"
    ]),
    Runs: Object.freeze([
      "run_id",
      "started_at",
      "finished_at",
      "status",
      "dry_run",
      "counts_json",
      "error_code",
      "error_message"
    ]),
    Checkpoints: Object.freeze([
      "checkpoint_key",
      "checkpoint_value",
      "updated_at"
    ]),
    Errors: Object.freeze([
      "error_id",
      "run_id",
      "job_id",
      "component",
      "code",
      "safe_message",
      "occurred_at"
    ]),
    Profile: Object.freeze([
      "profile_key",
      "schema_version",
      "profile_json",
      "updated_at"
    ])
  })
});
