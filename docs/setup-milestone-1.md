# Milestone 1 Private Setup and Verification

## What this setup creates

Running the explicit bootstrap creates private resources in the user's accounts:

- one Google Sheet named `Job Search OS - Private Staging` with `Candidates`, `Runs`, `Checkpoints`, `Errors`, and `Profile` tabs;
- three Notion databases under a private parent page: `Jobs / Applications`, `Experience Bank`, and `Resume Versions`;
- a one-way Notion relation from Jobs' `Selected Resume` property to Resume Versions;
- private Script Properties containing tokens, parent/resource IDs, and safe runtime configuration.

No source adapter, Gmail reader, scoring model, AI call, or resume generator is included in Milestone 1.

## 1. Verify the public repository locally

Requirements: Git and Node.js 20 or newer. This repository has no npm runtime dependencies.

```powershell
git status --short --branch
npm test
```

All fixtures use reserved example domains and fictional locations, employers, jobs, and interests.

## 2. Create a private Apps Script project

1. Open [Google Apps Script](https://script.google.com/) in the account that should own the private staging Sheet.
2. Create a standalone project named `Job Search OS`.
3. Copy its Script ID from Project Settings.
4. Install and authenticate `clasp` if it is not already available:

   ```powershell
   npm install --global @google/clasp
   clasp login
   ```

5. Copy `.clasp.json.example` to `.clasp.json` at the repository root and replace its fake Script ID locally. `.clasp.json` is ignored by Git.
6. Push the public Apps Script files:

   ```powershell
   clasp push
   ```

7. In the Apps Script editor, confirm the manifest requests only external-request and spreadsheet scopes.

Do not commit the Script ID or `.clasp.json`.

### Temporary owner-only `clasp run` access

The manifest declares an API executable with `executionApi.access` set to `MYSELF`. This does not publish a public endpoint: only the deploying owner can execute it. `clasp run` uses development mode by default, so it executes the latest pushed source while the owner-only API deployment exists.

Remote execution requires private setup that cannot be committed or inferred:

1. Create or select a standard Google Cloud project owned by the same account as the Apps Script project. The Apps Script default Cloud project is not sufficient for `scripts.run`.
2. Enable the Google Apps Script API in that Cloud project.
3. Configure the OAuth consent screen for private/testing use. Add only the owning Google account as a test user if Google requires one.
4. Create an OAuth client of type **Desktop app** and download its JSON to a private path outside the repository. Do not commit it.
5. In Apps Script Project Settings, change the Google Cloud Platform project to the standard project's numeric **project number**.
6. Add the standard Cloud project's textual **project ID** to the ignored local `.clasp.json` as `projectId`. Keep the existing private `scriptId` and `rootDir` unchanged.
7. Authorize a separate local credential profile using only the manifest's current runtime scopes:

   ```powershell
   clasp.cmd login --user job-search-os-run --creds C:\private\client_secret.json --use-project-scopes
   ```

   Do not add `--include-clasp-scopes`: named `clasp run` calls do not need clasp's broader deployment, Drive, logging, or Cloud-management scopes. Continue using the existing/default clasp login for `push` and deployment administration.

8. Push the manifest. If **Deploy > Manage deployments** does not already show the temporary owner-only API executable, create it once:

   ```powershell
   clasp.cmd push
   clasp.cmd create-deployment --description "Temporary owner-only clasp run"
   ```

If command-line deployment does not show an API executable under **Deploy > Manage deployments**, create it once in the Apps Script UI: **Deploy > New deployment > API executable**, choose **Only myself**, and deploy. Do not create a duplicate or choose a broader access level.

Run entrypoints by name, without parentheses. These commands use development mode unless `--nondev` is supplied:

```powershell
clasp.cmd --user job-search-os-run run initializeSafeDefaults
clasp.cmd --user job-search-os-run run bootstrapPrivateFoundation
clasp.cmd --user job-search-os-run run validatePrivateProfile
clasp.cmd --user job-search-os-run run verifyMilestone1FakeJobInitial
clasp.cmd --user job-search-os-run run verifyMilestone1FakeJobUpdate
```

For the non-mutating fake-job check, leave the private `DRY_RUN` Script Property set to `true` and run `verifyMilestone1FakeJobInitial`. Do not run the update verification until intentionally performing the documented live fake-data test.

To remove the temporary execution path, identify only the temporary deployment in `clasp.cmd list-deployments`, then run:

```powershell
clasp.cmd delete-deployment DEPLOYMENT_ID
```

Do not use `--all`, because it could remove unrelated deployments. After deletion, `clasp run` can no longer execute this project through that deployment. The owner-only manifest declaration may remain dormant, or it can be removed and pushed if API execution is permanently retired. The local named credential can be removed with `clasp.cmd logout --user job-search-os-run` after confirming no other project uses it.

## 3. Create the private Notion connection and parent page

1. In Notion, create a private page named `Job Search OS` in the intended private workspace.
2. Create an internal Notion integration/connection with read, insert, and update content capabilities.
3. Add the connection to the private parent page using the page's Connections menu. Without this share, API calls return 403/404.
4. Copy the installation token privately.
5. Copy the parent page ID privately from the page URL or Notion UI.

Do not create database IDs manually unless the bootstrap cannot be used. Do not publish the parent page or enable “anyone with the link.”

The client uses Notion API version `2026-03-11` and data-source IDs rather than the deprecated database-query model.

## 4. Initialize safe defaults and private properties

In Apps Script, run `initializeSafeDefaults()` once. It adds only missing non-secret defaults and never overwrites existing values.

Then open Project Settings → Script Properties and add:

| Property | Required now | Secret/private | How set |
| --- | --- | --- | --- |
| `NOTION_TOKEN` | yes | secret | User copies installation token |
| `NOTION_PARENT_PAGE_ID` | yes for bootstrap | private | User copies private parent page ID |
| `CONFIG_VERSION` | yes | no | Default `1` |
| `ENVIRONMENT` | yes | no | Default `development` |
| `DRY_RUN` | yes | no | Default `true` |
| `LOG_LEVEL` | yes | no | Default `INFO` |
| `NOTION_API_VERSION` | yes | no | Default `2026-03-11` |
| `NOTION_BASE_URL` | yes | no | Default `https://api.notion.com/v1` |
| `STAGING_SHEET_NAME` | yes | private-ish | Default `Job Search OS - Private Staging` |
| `PROFILE_TAB_NAME` | yes | no | Default `Profile` |

Never print or paste `NOTION_TOKEN` into source, logs, issues, chat, or screenshots intended for sharing.

## 5. Run the private bootstrap

Run `bootstrapPrivateFoundation()` from the Apps Script editor and approve the requested scopes. The function:

1. creates or opens the private staging Sheet and verifies all five tab headers;
2. creates or recovers the Experience Bank database/data source;
3. creates or recovers the Resume Versions database/data source;
4. creates or recovers Jobs / Applications with its Resume relation;
5. stores generated IDs immediately after each successful creation.

The bootstrap is restartable as long as generated properties are retained. A script lock rejects concurrent bootstrap attempts. If a partial failure occurs, do not clear IDs or delete resources; fix access/configuration and rerun.

The bootstrap generates and privately stores:

| Property | Purpose |
| --- | --- |
| `STAGING_SHEET_ID` | Private staging Sheet |
| `NOTION_EXPERIENCE_DATABASE_ID` | Experience Bank database container |
| `NOTION_EXPERIENCE_DATA_SOURCE_ID` | Experience Bank table/data source |
| `NOTION_RESUMES_DATABASE_ID` | Resume Versions database container |
| `NOTION_RESUMES_DATA_SOURCE_ID` | Resume Versions table/data source |
| `NOTION_JOBS_DATABASE_ID` | Jobs / Applications database container |
| `NOTION_JOBS_DATA_SOURCE_ID` | Jobs / Applications table/data source used for upserts |

These values are private and must not be committed. The database IDs are retained for administration; runtime page queries and creates use data-source IDs.

## 6. Review private sharing and create Notion views

1. Open the new Google Sheet and confirm it is Restricted/private.
2. Open all three Notion databases and confirm they are private and connected only to the intended integration.
3. Confirm Jobs has the properties and ownership described in [notion-schema.md](notion-schema.md).
4. Create the recommended Notion views manually. The bootstrap intentionally leaves view layout to the user.

## 7. Install the real profile privately

Do not edit the public example into a real profile inside the repository.

1. Copy [fixtures/example-profile.json](../fixtures/example-profile.json) to an untracked location outside the repository.
2. Replace fictional content with private values while retaining the schema.
3. In the private staging Sheet's `Profile` tab, add row 2:

   - `profile_key`: `ACTIVE`
   - `schema_version`: `1.0`
   - `profile_json`: the complete private JSON on one line
   - `updated_at`: current ISO 8601 timestamp

4. Run `validatePrivateProfile()`.

The function returns only schema version, profile-presence status, and location-rule count. It does not return or log profile content. The Google Sheets per-cell limit is sufficient for the intended small V1 profile; if the profile later grows materially, move it to a dedicated private Drive JSON file rather than Script Properties.

## 8. Dry-run verification

Keep `DRY_RUN=true` and run `verifyMilestone1FakeJobInitial()`.

Expected result:

- a stable fake `job_...` ID is returned;
- Notion action is `planned`;
- no staging row or Notion page is written.

Dry run validates and builds the payload without calling Notion or mutating staging.

## 9. Live fake-data verification

This step requires the private credentials/resources above but uses only the fictional job fixture.

1. Set `DRY_RUN=false`.
2. Run `verifyMilestone1FakeJobInitial()`.
3. Confirm one `Candidates` row has status `PROMOTED`, a stable Job ID, and a Notion page ID.
4. Confirm one fake Jobs page exists in Notion with score `72`.
5. Manually change its `Stage` to `SAVED` and add a clearly fake note such as `Manual private note`.
6. Run `verifyMilestone1FakeJobUpdate()`.
7. Confirm there is still exactly one staging row and one Notion page for the Job ID.
8. Confirm Overall Score changed to `82`, Technical Score changed to `88`, and the updated fake flag appears.
9. Confirm the manually edited `Stage` and `Notes` remain unchanged.
10. Run the update once more and confirm no duplicate appears.
11. Return `DRY_RUN` to `true` until future live work is explicitly approved.

This demonstrates staging, stable identity, promotion, idempotency, automation-owned updates, and user-owned preservation. Do not substitute a real job or profile during the first verification.

## Troubleshooting without leaking secrets

- `CONFIG_INVALID`: add the named property privately; do not paste its value into an issue.
- Notion 403/404: confirm the parent/database is shared with the connection and capabilities include read/insert/update.
- `NOTION_BOOTSTRAP_AMBIGUOUS`: do not guess a data-source ID; inspect the private database and set the correct ID in Script Properties.
- `STAGING_SCHEMA_MISMATCH`: do not reorder headers manually; restore the documented private tab structure.
- `PROFILE_INVALID`: validate against the public schema locally using a private copy; do not publish the failing profile.
- Partial bootstrap: preserve all generated IDs and rerun after correcting access. Clearing IDs can create duplicate private databases.

Structured logs allowlist only operational keys such as job ID, action, status, and error code. HTTP response bodies, tokens, profile JSON, notes, and request payloads are not logged.

## Live boundary

The repository's automated tests use in-memory Sheet and Notion fakes. No live Notion or Google resource has been created from this repository session because no private token, page ID, Script ID, or account authorization was supplied. Live verification begins only when the user completes the private steps above.
