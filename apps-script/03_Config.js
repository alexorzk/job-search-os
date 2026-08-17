var JobSearchOS = JobSearchOS || {};

JobSearchOS.Config = {
  defaults: function () {
    return {
      CONFIG_VERSION: JobSearchOS.Constants.CONFIG_VERSION,
      ENVIRONMENT: "development",
      DRY_RUN: "true",
      LOG_LEVEL: "INFO",
      NOTION_API_VERSION: JobSearchOS.Constants.NOTION_API_VERSION,
      NOTION_BASE_URL: JobSearchOS.Constants.NOTION_BASE_URL,
      STAGING_SHEET_NAME: "Job Search OS - Private Staging",
      PROFILE_TAB_NAME: "Profile"
    };
  },

  initializeDefaults: function (propertyStore) {
    var existing = propertyStore.getProperties();
    var defaults = this.defaults();
    var missing = {};
    Object.keys(defaults).forEach(function (key) {
      if (existing[key] === undefined || existing[key] === null || existing[key] === "") {
        missing[key] = defaults[key];
      }
    });
    if (Object.keys(missing).length) propertyStore.setProperties(missing, false);
    return missing;
  },

  load: function (propertyStore) {
    var raw = Object.assign({}, this.defaults(), propertyStore.getProperties());
    return {
      configVersion: raw.CONFIG_VERSION,
      environment: raw.ENVIRONMENT,
      dryRun: this.parseBoolean_(raw.DRY_RUN, "DRY_RUN"),
      logLevel: raw.LOG_LEVEL,
      notionApiVersion: raw.NOTION_API_VERSION,
      notionBaseUrl: raw.NOTION_BASE_URL,
      notionToken: raw.NOTION_TOKEN || "",
      notionParentPageId: raw.NOTION_PARENT_PAGE_ID || "",
      notionJobsDatabaseId: raw.NOTION_JOBS_DATABASE_ID || "",
      notionJobsDataSourceId: raw.NOTION_JOBS_DATA_SOURCE_ID || "",
      notionExperienceDatabaseId: raw.NOTION_EXPERIENCE_DATABASE_ID || "",
      notionExperienceDataSourceId: raw.NOTION_EXPERIENCE_DATA_SOURCE_ID || "",
      notionResumesDatabaseId: raw.NOTION_RESUMES_DATABASE_ID || "",
      notionResumesDataSourceId: raw.NOTION_RESUMES_DATA_SOURCE_ID || "",
      stagingSheetId: raw.STAGING_SHEET_ID || "",
      stagingSheetName: raw.STAGING_SHEET_NAME,
      profileTabName: raw.PROFILE_TAB_NAME
    };
  },

  validate: function (config, mode) {
    var errors = [];
    var required = [];
    mode = mode || "runtime";

    if (config.configVersion !== JobSearchOS.Constants.CONFIG_VERSION) {
      errors.push("CONFIG_VERSION must be " + JobSearchOS.Constants.CONFIG_VERSION);
    }
    if (["DEBUG", "INFO", "WARN", "ERROR"].indexOf(config.logLevel) === -1) {
      errors.push("LOG_LEVEL must be DEBUG, INFO, WARN, or ERROR");
    }
    if (config.notionApiVersion !== JobSearchOS.Constants.NOTION_API_VERSION) {
      errors.push("NOTION_API_VERSION must be " + JobSearchOS.Constants.NOTION_API_VERSION);
    }

    if (mode === "bootstrap") required = ["notionToken", "notionParentPageId"];
    if (mode === "runtime" && !config.dryRun) {
      required = ["notionToken", "notionJobsDataSourceId", "stagingSheetId"];
    }
    if (mode === "profile") required = ["stagingSheetId"];

    required.forEach(function (key) {
      if (!config[key] || JobSearchOS.Config.isPlaceholder_(config[key])) {
        errors.push(key + " is required and must not be a placeholder");
      }
    });

    if (errors.length) throw new Error("CONFIG_INVALID: " + errors.join("; "));
    return config;
  },

  parseBoolean_: function (value, key) {
    if (value === true || String(value).toLowerCase() === "true") return true;
    if (value === false || String(value).toLowerCase() === "false") return false;
    throw new Error("CONFIG_INVALID: " + key + " must be true or false");
  },

  isPlaceholder_: function (value) {
    var normalized = String(value || "").toLowerCase();
    return normalized.indexOf("replace_") === 0 ||
      normalized.indexOf("example") !== -1 ||
      normalized === "changeme";
  }
};
