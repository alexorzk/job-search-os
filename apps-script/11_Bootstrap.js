var JobSearchOS = JobSearchOS || {};

JobSearchOS.Bootstrap = {
  initializeSafeDefaults: function (propertyStore) {
    return JobSearchOS.Config.initializeDefaults(propertyStore);
  },

  createPrivateFoundation: function (services) {
    var propertyStore = services.propertyStore;
    this.initializeSafeDefaults(propertyStore);
    var config = JobSearchOS.Config.validate(JobSearchOS.Config.load(propertyStore), "bootstrap");
    var logger = services.logger || new JobSearchOS.StructuredLogger(null, config.logLevel);

    var spreadsheet;
    if (config.stagingSheetId) {
      spreadsheet = services.spreadsheetApp.openById(config.stagingSheetId);
    } else {
      spreadsheet = services.spreadsheetApp.create(config.stagingSheetName);
      propertyStore.setProperty("STAGING_SHEET_ID", spreadsheet.getId());
      logger.info("staging_sheet_created", { action: "created" });
    }
    var staging = new JobSearchOS.StagingStore(new JobSearchOS.GoogleSheetAdapter(spreadsheet), logger);
    staging.ensureSchema();

    var transport = services.notionTransport || new JobSearchOS.AppsScriptHttpTransport(config);
    var notionAdmin = new JobSearchOS.NotionAdminClient(transport);
    var experience = this.ensureNotionDatabase_(
      propertyStore,
      notionAdmin,
      config.notionParentPageId,
      "Experience Bank",
      JobSearchOS.NotionSchemas.experienceBank(),
      "NOTION_EXPERIENCE_DATABASE_ID",
      "NOTION_EXPERIENCE_DATA_SOURCE_ID"
    );
    var resumes = this.ensureNotionDatabase_(
      propertyStore,
      notionAdmin,
      config.notionParentPageId,
      "Resume Versions",
      JobSearchOS.NotionSchemas.resumeVersions(),
      "NOTION_RESUMES_DATABASE_ID",
      "NOTION_RESUMES_DATA_SOURCE_ID"
    );
    var jobs = this.ensureNotionDatabase_(
      propertyStore,
      notionAdmin,
      config.notionParentPageId,
      "Jobs / Applications",
      JobSearchOS.NotionSchemas.jobs(resumes.dataSourceId),
      "NOTION_JOBS_DATABASE_ID",
      "NOTION_JOBS_DATA_SOURCE_ID"
    );
    logger.info("private_foundation_ready", { status: "READY", count: 3 });
    return {
      stagingSheetConfigured: true,
      experienceConfigured: Boolean(experience.dataSourceId),
      resumesConfigured: Boolean(resumes.dataSourceId),
      jobsConfigured: Boolean(jobs.dataSourceId)
    };
  },

  ensureNotionDatabase_: function (
    propertyStore,
    notionAdmin,
    parentPageId,
    title,
    properties,
    databasePropertyKey,
    dataSourcePropertyKey
  ) {
    var existing = propertyStore.getProperties();
    if (existing[dataSourcePropertyKey]) {
      return {
        databaseId: existing[databasePropertyKey] || "",
        dataSourceId: existing[dataSourcePropertyKey]
      };
    }
    if (existing[databasePropertyKey]) {
      var database = notionAdmin.retrieveDatabase(existing[databasePropertyKey]);
      if (!database.data_sources || database.data_sources.length !== 1) {
        throw new Error("NOTION_BOOTSTRAP_AMBIGUOUS: expected one data source for " + title);
      }
      propertyStore.setProperty(dataSourcePropertyKey, database.data_sources[0].id);
      return { databaseId: existing[databasePropertyKey], dataSourceId: database.data_sources[0].id };
    }

    var created = notionAdmin.createDatabase(parentPageId, title, properties);
    var saved = {};
    saved[databasePropertyKey] = created.databaseId;
    saved[dataSourcePropertyKey] = created.dataSourceId;
    propertyStore.setProperties(saved, false);
    return created;
  }
};
