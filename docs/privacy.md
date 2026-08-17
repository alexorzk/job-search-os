# Privacy and Public Repository Policy

## Core rule

This repository is public. Commit only material that would be safe to publish permanently and index publicly. Git deletion does not reliably remove data from history, forks, caches, or logs.

## Allowed to commit

- application source code that contains no secrets;
- planning and architecture documentation;
- schemas, validators, and deterministic rules;
- fake/sample job postings, profiles, Experience Bank entries, resumes, contacts, and email fixtures;
- configuration templates using obvious placeholders such as `NOTION_TOKEN=replace_me`;
- sanitized test outputs that cannot be linked to a real person or application;
- non-sensitive upstream public URLs and attribution/licensing notes;
- generated resume templates with no personal content.

Samples must use fictional people, employers, contact details, achievements, IDs, file links, and API responses. Do not “anonymize” real records by changing only a name; combinations of dates, titles, metrics, schools, and locations can still identify someone.

## Never commit

- API keys, Notion integration tokens, Hunter.io keys, webhook secrets, or bearer tokens;
- OAuth client secrets, refresh/access tokens, cookies, sessions, or Gmail credentials;
- Apps Script Properties exports containing real values;
- private Notion database/page IDs or private Drive file/folder IDs when disclosure is not necessary;
- real Gmail messages, headers, message IDs, alert payloads, or application confirmations;
- private application data, notes, statuses, interview details, or compensation negotiations;
- private contact lists or discovered email addresses;
- the user's real resume unless the user gives explicit, specific approval for the exact file and understands the repository is public;
- the user's real Experience Bank, evidence notes, metrics, or project/employment details;
- the user's full private job-search profile, immigration documents, identifiers, address, phone number, personal email, or education records;
- AI prompts/responses containing any of the above;
- raw logs, screenshots, exports, generated documents, or caches containing private data.

The `.gitignore` is a backstop, not authorization to place secrets in the repository directory.

## Where private data belongs

| Data | Private location |
| --- | --- |
| API tokens, IDs, source settings | Apps Script Properties |
| OAuth grants | Google-managed authorization store |
| Promoted jobs/application records | Private Notion databases |
| User Job Search Profile | Private Drive/Sheet or private configuration accessible to Apps Script |
| Experience Bank | Private Notion database and/or private Drive document |
| Resume manifests and exact files | Private Drive folder plus private Notion metadata |
| Gmail alerts/confirmations | Gmail; store only minimal private checkpoints |
| Contact enrichment | Private Notion/Drive data, only if stretch feature is enabled |
| Debug/run data | Sanitized private log or private Sheet with retention limits |

Notion and Drive sharing settings must be reviewed; “anyone with the link” is not private.

## Configuration pattern

- Commit `.env.example` or an equivalent property-name template only if implementation needs it.
- Put runtime secrets and resource IDs in Apps Script Properties, never constants.
- Use separate test and production properties/databases.
- Validate required property presence without printing secret values.
- Rotate a secret immediately if it appears in source, terminal output captured for sharing, CI logs, an issue, or a commit.
- Use minimum practical OAuth/API scopes and revoke unused access.

## Gmail policy

- Use a dedicated label and narrow sender/query constraints.
- Request the smallest practical read scope; do not modify, delete, forward, or send mail in V1.
- Store message IDs/checkpoints privately and only as long as operationally necessary.
- Do not copy full real messages into source fixtures or logs.
- Build fixtures from scratch with fictional content, not lightly redacted messages.

## Notion and Drive policy

- Databases and resume folders remain private to the user and explicitly trusted integrations.
- Automation should write only expected properties and preserve user-owned notes/status.
- Exact resume files are immutable after being marked used; access links remain private.
- Avoid personal details in file names and logs where a stable ID suffices.
- Define a retention/archive process before accumulating description snapshots and failed drafts.

## AI provider policy

Before sending real data to an AI provider:

- review the provider's current data-use, retention, and account settings;
- send only the minimum fields needed for the task;
- omit direct identifiers when they add no value;
- treat job descriptions and emails as untrusted data, not instructions;
- require structured outputs and validate them;
- avoid logging complete prompts/responses containing private data;
- never allow AI to invent or silently expand resume facts;
- retain enough private metadata to audit model/prompt/schema version without exposing content publicly.

If the provider policy is unacceptable or unknown, use deterministic processing or pause the AI-assisted feature.

## Test-data policy

All checked-in fixtures must be synthetic. Test values should use reserved domains such as `example.com`, obviously fake tokens, and fictional facts. Public job postings may inform parser structure, but avoid committing copyrighted full descriptions; retain only the minimal attributed fragments or synthetic equivalents needed for testing.

## Logging policy

Logs should contain stable internal IDs, stage names, counts, durations, error categories, and sanitized response codes. They should not contain secrets, full emails, full resumes, full descriptions, personal contact details, or authorization facts. Error handlers must avoid dumping complete request headers/bodies.

## Pre-commit checklist

Before every public commit:

1. Review `git status` and the full staged diff.
2. Search staged content for token/secret patterns, private email addresses, phone numbers, real IDs, and personal names/details.
3. Confirm fixtures are invented rather than redacted real data.
4. Confirm no generated resume, export, log, screenshot, local config, or credential file is staged.
5. Confirm new config values are placeholders and runtime code reads secrets from private properties.
6. Run automated secret scanning when available.

## Incident response

If private data or a secret is committed:

1. revoke/rotate the credential or restrict the exposed resource immediately;
2. stop further pushes and document the exact exposed scope privately;
3. remove the material from the current tree and, when warranted, coordinate Git history rewriting;
4. assume clones/caches may retain it—history cleanup does not replace revocation;
5. review logs and access history where available;
6. add a preventive test, ignore rule, or process check without repeating the secret in the fix or issue.

Do not paste the exposed value into a public issue, commit message, or remediation notes.
