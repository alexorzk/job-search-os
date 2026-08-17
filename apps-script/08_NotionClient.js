var JobSearchOS = JobSearchOS || {};

JobSearchOS.AppsScriptHttpTransport = function (config) {
  this.baseUrl_ = config.notionBaseUrl;
  this.token_ = config.notionToken;
  this.apiVersion_ = config.notionApiVersion;
};

JobSearchOS.AppsScriptHttpTransport.prototype.request = function (method, path, body) {
  var options = {
    method: String(method).toLowerCase(),
    muteHttpExceptions: true,
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + this.token_,
      "Notion-Version": this.apiVersion_
    }
  };
  if (body !== undefined && body !== null) options.payload = JSON.stringify(body);
  var response = UrlFetchApp.fetch(this.baseUrl_ + path, options);
  var status = response.getResponseCode();
  var text = response.getContentText();
  var parsed = {};
  try { parsed = text ? JSON.parse(text) : {}; } catch (ignored) { parsed = {}; }
  if (status < 200 || status >= 300) {
    var code = parsed.code ? String(parsed.code) : "unknown";
    var error = new Error("NOTION_REQUEST_FAILED: HTTP " + status + " (" + code + ")");
    error.code = "NOTION_REQUEST_FAILED";
    error.httpStatus = status;
    throw error;
  }
  return parsed;
};

JobSearchOS.NotionClient = function (transport, options) {
  options = options || {};
  this.transport_ = transport;
  this.jobsDataSourceId_ = options.jobsDataSourceId || "";
  this.dryRun_ = Boolean(options.dryRun);
  this.logger_ = options.logger || new JobSearchOS.StructuredLogger();
  this.clock_ = options.clock || function () { return new Date().toISOString(); };
};

JobSearchOS.NotionClient.prototype.findJobById = function (jobId) {
  if (this.dryRun_) return null;
  if (!this.jobsDataSourceId_) throw new Error("NOTION_CONFIG_INVALID: jobs data source ID is required");
  var result = this.transport_.request(
    "POST",
    "/data_sources/" + encodeURIComponent(this.jobsDataSourceId_) + "/query",
    {
      page_size: 2,
      filter: {
        property: "Job ID",
        rich_text: { equals: jobId }
      }
    }
  );
  var matches = result.results || [];
  if (matches.length > 1) throw new Error("NOTION_DUPLICATE_JOB_ID: " + jobId);
  return matches[0] || null;
};

JobSearchOS.NotionClient.prototype.upsertJob = function (job) {
  var automationProperties = JobSearchOS.NotionProperties.buildAutomationJobProperties(job, this.clock_());
  if (this.dryRun_) {
    this.logger_.info("notion_job_upsert_planned", { job_id: job.job_id, dry_run: true });
    return { action: "planned", page_id: null, properties: automationProperties };
  }
  var existing = this.findJobById(job.job_id);
  if (existing) {
    var updated = this.transport_.request("PATCH", "/pages/" + encodeURIComponent(existing.id), {
      properties: automationProperties
    });
    this.logger_.info("notion_job_updated", { job_id: job.job_id, action: "updated", page_id_present: true });
    return { action: "updated", page_id: updated.id || existing.id, page: updated };
  }
  var created = this.transport_.request("POST", "/pages", {
    parent: { type: "data_source_id", data_source_id: this.jobsDataSourceId_ },
    properties: JobSearchOS.NotionProperties.buildCreateJobProperties(job, this.clock_())
  });
  this.logger_.info("notion_job_created", { job_id: job.job_id, action: "created", page_id_present: true });
  return { action: "created", page_id: created.id, page: created };
};

JobSearchOS.NotionAdminClient = function (transport) {
  this.transport_ = transport;
};

JobSearchOS.NotionAdminClient.prototype.createDatabase = function (parentPageId, title, properties) {
  var response = this.transport_.request("POST", "/databases", {
    parent: { type: "page_id", page_id: parentPageId },
    title: [{ type: "text", text: { content: title } }],
    is_inline: false,
    initial_data_source: { properties: properties }
  });
  if (!response.id || !response.data_sources || response.data_sources.length !== 1) {
    throw new Error("NOTION_BOOTSTRAP_INVALID_RESPONSE: database/data source IDs missing");
  }
  return { databaseId: response.id, dataSourceId: response.data_sources[0].id };
};

JobSearchOS.NotionAdminClient.prototype.retrieveDatabase = function (databaseId) {
  return this.transport_.request("GET", "/databases/" + encodeURIComponent(databaseId));
};
