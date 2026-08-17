var JobSearchOS = JobSearchOS || {};

JobSearchOS.NotionSchemas = {
  experienceBank: function () {
    return {
      "Name": { title: {} },
      "Experience ID": { rich_text: {} },
      "Type": this.selectSchema_(["EMPLOYMENT", "INTERNSHIP", "RESEARCH", "PROJECT", "TEAM", "COURSEWORK_LAB"]),
      "Approval Status": this.selectSchema_(["DRAFT", "APPROVED", "RETIRED"]),
      "Source Facts": { rich_text: {} },
      "Technologies": { rich_text: {} },
      "Skills / Topics": { rich_text: {} },
      "Approved Bullets": { rich_text: {} },
      "Version": { rich_text: {} },
      "User Notes": { rich_text: {} }
    };
  },

  resumeVersions: function () {
    return {
      "Name": { title: {} },
      "Resume Version ID": { rich_text: {} },
      "Target Job ID": { rich_text: {} },
      "Status": this.selectSchema_(["DRAFT", "QA_FAILED", "REVIEW", "APPROVED", "USED", "SUPERSEDED"]),
      "Created At": { date: {} },
      "Drive File": { url: {} },
      "File Checksum": { rich_text: {} },
      "QA Result": this.selectSchema_(["PASS", "FAIL", "NEEDS_REVIEW"]),
      "Template Version": { rich_text: {} },
      "User Notes": { rich_text: {} }
    };
  },

  jobs: function (resumeDataSourceId) {
    if (!resumeDataSourceId) throw new Error("NOTION_SCHEMA_INVALID: resume data source ID is required");
    return {
      "Name": { title: {} },
      "Job ID": { rich_text: {} },
      "Company": { rich_text: {} },
      "Source": this.selectSchema_(["GITHUB", "GMAIL", "MANUAL"]),
      "Source URL": { url: {} },
      "Official Application URL": { url: {} },
      "Requisition ID": { rich_text: {} },
      "Location": { rich_text: {} },
      "Posted At": { date: {} },
      "First Seen At": { date: {} },
      "Overall Score": { number: { format: "number" } },
      "Technical Score": { number: { format: "number" } },
      "Visa Status": this.selectSchema_(JobSearchOS.Constants.VISA_STATUSES),
      "New Grad Score": { number: { format: "number" } },
      "Location Tier": this.selectSchema_(JobSearchOS.Constants.LOCATION_TIERS),
      "Freshness Score": { number: { format: "number" } },
      "Interest Score": { number: { format: "number" } },
      "Flags": { rich_text: {} },
      "Daily Rank": { number: { format: "number" } },
      "Daily Batch": { date: {} },
      "Location Wildcard": { checkbox: {} },
      "Automation Updated At": { date: {} },
      "Stage": this.selectSchema_(JobSearchOS.Constants.JOB_STAGES),
      "Application Date": { date: {} },
      "Notes": { rich_text: {} },
      "Interest Override": { number: { format: "number" } },
      "Follow-up Date": { date: {} },
      "Selected Resume": {
        relation: {
          data_source_id: resumeDataSourceId,
          type: "single_property",
          single_property: {}
        }
      }
    };
  },

  selectSchema_: function (names) {
    var colors = ["default", "blue", "green", "yellow", "orange", "purple", "pink", "red", "gray", "brown"];
    return {
      select: {
        options: names.map(function (name, index) {
          return { name: name, color: colors[index % colors.length] };
        })
      }
    };
  }
};

JobSearchOS.NotionProperties = {
  buildAutomationJobProperties: function (job, now) {
    if (!job || !job.job_id) throw new Error("NOTION_JOB_INVALID: job_id is required");
    var properties = {};
    this.add_(properties, "Name", this.title_((job.company || "Unknown") + " — " + (job.title || "Untitled")));
    this.add_(properties, "Job ID", this.richText_(job.job_id));
    this.addIfDefined_(properties, "Company", job.company, this.richText_);
    this.addIfDefined_(properties, "Source", job.source_type, this.select_);
    this.addIfDefined_(properties, "Source URL", job.source_url, this.url_);
    this.addIfDefined_(properties, "Official Application URL", job.official_application_url, this.url_);
    this.addIfDefined_(properties, "Requisition ID", job.requisition_id, this.richText_);
    this.addIfDefined_(properties, "Location", job.normalized_location, this.richText_);
    this.addIfDefined_(properties, "Posted At", job.posted_at, this.date_);
    this.addIfDefined_(properties, "First Seen At", job.first_seen_at, this.date_);
    this.addIfDefined_(properties, "Overall Score", job.overall_score, this.number_);
    this.addIfDefined_(properties, "Technical Score", job.technical_score, this.number_);
    this.addIfDefined_(properties, "Visa Status", job.visa_status, this.select_);
    this.addIfDefined_(properties, "New Grad Score", job.new_grad_score, this.number_);
    this.addIfDefined_(properties, "Location Tier", job.location_tier, this.select_);
    this.addIfDefined_(properties, "Freshness Score", job.freshness_score, this.number_);
    this.addIfDefined_(properties, "Interest Score", job.interest_score, this.number_);
    if (job.flags !== undefined) {
      this.add_(properties, "Flags", this.richText_(JSON.stringify(job.flags || []).slice(0, 1800)));
    }
    this.addIfDefined_(properties, "Daily Rank", job.daily_rank, this.number_);
    this.addIfDefined_(properties, "Daily Batch", job.daily_batch, this.date_);
    this.addIfDefined_(properties, "Location Wildcard", job.location_wildcard, this.checkbox_);
    this.add_(properties, "Automation Updated At", this.date_(now || new Date().toISOString()));
    this.assertAutomationOnly_(properties);
    return properties;
  },

  buildCreateJobProperties: function (job, now) {
    var properties = this.buildAutomationJobProperties(job, now);
    properties.Stage = this.select_("REVIEW");
    return properties;
  },

  assertAutomationOnly_: function (properties) {
    var allowed = JobSearchOS.Constants.AUTOMATION_OWNED_JOB_PROPERTIES;
    Object.keys(properties).forEach(function (name) {
      if (allowed.indexOf(name) === -1) {
        throw new Error("OWNERSHIP_VIOLATION: automation attempted to write " + name);
      }
    });
  },

  add_: function (properties, name, value) {
    properties[name] = value;
  },

  addIfDefined_: function (properties, name, value, builder) {
    if (value !== undefined && value !== null && value !== "") {
      properties[name] = builder.call(this, value);
    }
  },

  title_: function (value) {
    return { title: [{ type: "text", text: { content: String(value).slice(0, 2000) } }] };
  },

  richText_: function (value) {
    return { rich_text: [{ type: "text", text: { content: String(value).slice(0, 2000) } }] };
  },

  select_: function (value) {
    return { select: { name: String(value) } };
  },

  url_: function (value) {
    return { url: String(value) };
  },

  date_: function (value) {
    return { date: { start: String(value) } };
  },

  number_: function (value) {
    return { number: Number(value) };
  },

  checkbox_: function (value) {
    return { checkbox: Boolean(value) };
  }
};
