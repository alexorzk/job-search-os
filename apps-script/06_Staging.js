var JobSearchOS = JobSearchOS || {};

JobSearchOS.GoogleSheetAdapter = function (spreadsheet) {
  this.spreadsheet_ = spreadsheet;
};

JobSearchOS.GoogleSheetAdapter.prototype.ensureTable = function (name, headers) {
  var sheet = this.spreadsheet_.getSheetByName(name);
  if (!sheet) sheet = this.spreadsheet_.insertSheet(name);

  var existing = sheet.getLastColumn() > 0
    ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0]
    : [];
  var isBlank = !existing.some(function (value) { return value !== ""; });
  if (isBlank) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers.slice()]);
    sheet.setFrozenRows(1);
    return;
  }
  var actual = existing.slice(0, headers.length).map(String);
  if (JSON.stringify(actual) !== JSON.stringify(headers)) {
    throw new Error("STAGING_SCHEMA_MISMATCH: " + name + " headers do not match expected schema");
  }
};

JobSearchOS.GoogleSheetAdapter.prototype.readRows = function (name, headers) {
  var sheet = this.spreadsheet_.getSheetByName(name);
  if (!sheet) throw new Error("STAGING_TABLE_MISSING: " + name);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, headers.length).getValues().map(function (values, index) {
    var row = { _rowNumber: index + 2 };
    headers.forEach(function (header, column) { row[header] = values[column]; });
    return row;
  });
};

JobSearchOS.GoogleSheetAdapter.prototype.appendRow = function (name, headers, record) {
  var sheet = this.spreadsheet_.getSheetByName(name);
  sheet.appendRow(headers.map(function (header) {
    return record[header] === undefined || record[header] === null ? "" : record[header];
  }));
  return sheet.getLastRow();
};

JobSearchOS.GoogleSheetAdapter.prototype.updateRow = function (name, headers, rowNumber, record) {
  var sheet = this.spreadsheet_.getSheetByName(name);
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([headers.map(function (header) {
    return record[header] === undefined || record[header] === null ? "" : record[header];
  })]);
};

JobSearchOS.StagingStore = function (adapter, logger, clock) {
  this.adapter_ = adapter;
  this.logger_ = logger || new JobSearchOS.StructuredLogger();
  this.clock_ = clock || function () { return new Date().toISOString(); };
};

JobSearchOS.StagingStore.prototype.ensureSchema = function () {
  var adapter = this.adapter_;
  Object.keys(JobSearchOS.Constants.STAGING_TABLES).forEach(function (name) {
    adapter.ensureTable(name, JobSearchOS.Constants.STAGING_TABLES[name]);
  });
};

JobSearchOS.StagingStore.prototype.upsertCandidate = function (job) {
  if (!job || !job.job_id) throw new Error("STAGING_INVALID: job_id is required");
  var now = this.clock_();
  var existing = this.findOne_("Candidates", "job_id", job.job_id);
  var record = Object.assign({}, existing || {}, {
    job_id: job.job_id,
    payload_json: JSON.stringify(job),
    processing_status: job.processing_status || (existing && existing.processing_status) || "STAGED",
    source_type: job.source_type || (existing && existing.source_type) || "",
    source_id: job.source_id || (existing && existing.source_id) || "",
    source_url: job.source_url || (existing && existing.source_url) || "",
    first_seen_at: (existing && existing.first_seen_at) || job.first_seen_at || now,
    last_seen_at: job.last_seen_at || now,
    notion_page_id: (existing && existing.notion_page_id) || "",
    error_code: job.error_code || "",
    error_message: job.error_message ? JobSearchOS.safeErrorMessage(job.error_message) : "",
    updated_at: now
  });
  delete record._rowNumber;
  var result = this.upsertByKey_("Candidates", "job_id", record);
  this.logger_.info("staging_candidate_upserted", { job_id: job.job_id, action: result.action });
  return result;
};

JobSearchOS.StagingStore.prototype.markPromoted = function (jobId, notionPageId) {
  var existing = this.findOne_("Candidates", "job_id", jobId);
  if (!existing) throw new Error("STAGING_NOT_FOUND: candidate " + jobId);
  existing.processing_status = "PROMOTED";
  existing.notion_page_id = notionPageId;
  existing.updated_at = this.clock_();
  delete existing._rowNumber;
  return this.upsertByKey_("Candidates", "job_id", existing);
};

JobSearchOS.StagingStore.prototype.getCandidate = function (jobId) {
  var result = this.findOne_("Candidates", "job_id", jobId);
  if (!result) return null;
  delete result._rowNumber;
  if (result.payload_json) result.payload = JSON.parse(result.payload_json);
  return result;
};

JobSearchOS.StagingStore.prototype.startRun = function (run) {
  if (!run || !run.run_id) throw new Error("STAGING_INVALID: run_id is required");
  return this.upsertByKey_("Runs", "run_id", {
    run_id: run.run_id,
    started_at: run.started_at || this.clock_(),
    finished_at: "",
    status: "RUNNING",
    dry_run: Boolean(run.dry_run),
    counts_json: JSON.stringify(run.counts || {}),
    error_code: "",
    error_message: ""
  });
};

JobSearchOS.StagingStore.prototype.finishRun = function (runId, status, counts, error) {
  var existing = this.findOne_("Runs", "run_id", runId);
  if (!existing) throw new Error("STAGING_NOT_FOUND: run " + runId);
  var record = Object.assign({}, existing, {
    finished_at: this.clock_(),
    status: status,
    counts_json: JSON.stringify(counts || {}),
    error_code: error && error.code ? String(error.code) : "",
    error_message: error ? JobSearchOS.safeErrorMessage(error) : ""
  });
  delete record._rowNumber;
  return this.upsertByKey_("Runs", "run_id", record);
};

JobSearchOS.StagingStore.prototype.setCheckpoint = function (key, value) {
  if (!key) throw new Error("STAGING_INVALID: checkpoint key is required");
  return this.upsertByKey_("Checkpoints", "checkpoint_key", {
    checkpoint_key: key,
    checkpoint_value: String(value),
    updated_at: this.clock_()
  });
};

JobSearchOS.StagingStore.prototype.getCheckpoint = function (key) {
  var row = this.findOne_("Checkpoints", "checkpoint_key", key);
  return row ? String(row.checkpoint_value) : null;
};

JobSearchOS.StagingStore.prototype.recordError = function (errorRecord) {
  var occurredAt = errorRecord.occurred_at || this.clock_();
  var errorId = errorRecord.error_id || "err_" + JobSearchOS.sha256Hex([
    errorRecord.run_id || "",
    errorRecord.job_id || "",
    errorRecord.component || "",
    errorRecord.code || "",
    occurredAt
  ].join("|")).slice(0, 20);
  return this.adapter_.appendRow("Errors", JobSearchOS.Constants.STAGING_TABLES.Errors, {
    error_id: errorId,
    run_id: errorRecord.run_id || "",
    job_id: errorRecord.job_id || "",
    component: errorRecord.component || "",
    code: errorRecord.code || "UNCLASSIFIED",
    safe_message: JobSearchOS.safeErrorMessage(errorRecord.message || "Unknown error"),
    occurred_at: occurredAt
  });
};

JobSearchOS.StagingStore.prototype.saveProfile = function (profile) {
  JobSearchOS.Profile.validate(profile);
  return this.upsertByKey_("Profile", "profile_key", {
    profile_key: "ACTIVE",
    schema_version: profile.schema_version,
    profile_json: JSON.stringify(profile),
    updated_at: this.clock_()
  });
};

JobSearchOS.StagingStore.prototype.loadProfile = function () {
  var row = this.findOne_("Profile", "profile_key", "ACTIVE");
  if (!row || !row.profile_json) throw new Error("PROFILE_MISSING: no ACTIVE private profile in staging");
  var profile;
  try {
    profile = JSON.parse(row.profile_json);
  } catch (error) {
    throw new Error("PROFILE_INVALID: stored profile_json is not valid JSON");
  }
  return JobSearchOS.Profile.validate(profile);
};

JobSearchOS.StagingStore.prototype.findOne_ = function (tableName, keyName, keyValue) {
  var headers = JobSearchOS.Constants.STAGING_TABLES[tableName];
  var matches = this.adapter_.readRows(tableName, headers).filter(function (row) {
    return String(row[keyName]) === String(keyValue);
  });
  if (matches.length > 1) {
    throw new Error("STAGING_DUPLICATE: " + tableName + "." + keyName + "=" + keyValue);
  }
  return matches[0] || null;
};

JobSearchOS.StagingStore.prototype.upsertByKey_ = function (tableName, keyName, record) {
  var headers = JobSearchOS.Constants.STAGING_TABLES[tableName];
  var existing = this.findOne_(tableName, keyName, record[keyName]);
  if (existing) {
    this.adapter_.updateRow(tableName, headers, existing._rowNumber, record);
    return { action: "updated", record: Object.assign({}, record) };
  }
  this.adapter_.appendRow(tableName, headers, record);
  return { action: "created", record: Object.assign({}, record) };
};
