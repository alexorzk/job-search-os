var JobSearchOS = JobSearchOS || {};

/** Adds only non-secret defaults and never overwrites existing values. */
function initializeSafeDefaults() {
  var store = PropertiesService.getScriptProperties();
  var added = JobSearchOS.Bootstrap.initializeSafeDefaults(store);
  return { added_property_names: Object.keys(added).sort() };
}

/**
 * Explicit, user-triggered bootstrap. Creates a private staging Sheet and the
 * three private Notion databases, then stores their IDs in Script Properties.
 */
function bootstrapPrivateFoundation() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("BOOTSTRAP_LOCKED: another bootstrap is running");
  try {
    return JobSearchOS.Bootstrap.createPrivateFoundation({
      propertyStore: PropertiesService.getScriptProperties(),
      spreadsheetApp: SpreadsheetApp
    });
  } finally {
    lock.releaseLock();
  }
}

/** Validates the ACTIVE profile row without logging or returning its contents. */
function validatePrivateProfile() {
  var runtime = JobSearchOS.createRuntime_({ requireProfile: true });
  var profile = runtime.staging.loadProfile();
  return {
    valid: true,
    schema_version: profile.schema_version,
    profile_id_present: Boolean(profile.profile_id),
    location_rule_count: profile.location_preferences.rules.length
  };
}

/** Programmatic helper; the value is written only to the private staging Sheet. */
function savePrivateProfileFromJson(profileJson) {
  var runtime = JobSearchOS.createRuntime_({ requireProfile: true });
  var profile = JSON.parse(profileJson);
  runtime.staging.saveProfile(profile);
  return { saved: true, schema_version: profile.schema_version };
}

function verifyMilestone1FakeJobInitial() {
  return JobSearchOS.runFakeVerification_("initial");
}

function verifyMilestone1FakeJobUpdate() {
  return JobSearchOS.runFakeVerification_("updated");
}

JobSearchOS.runFakeVerification_ = function (revision) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error("FOUNDATION_LOCKED: another verification run is active");
  try {
    var runtime = JobSearchOS.createRuntime_({ requireProfile: false });
    var service = new JobSearchOS.FoundationService({
      dryRun: runtime.config.dryRun,
      staging: runtime.staging,
      notion: runtime.notion,
      logger: runtime.logger
    });
    var result = service.processJob(JobSearchOS.ExampleFixtures.job(revision));
    return {
      job_id: result.job_id,
      staging_action: result.staging.action || result.staging,
      notion_action: result.notion.action,
      notion_page_id_present: Boolean(result.notion.page_id),
      dry_run: runtime.config.dryRun
    };
  } finally {
    lock.releaseLock();
  }
};

JobSearchOS.createRuntime_ = function (options) {
  options = options || {};
  var propertyStore = PropertiesService.getScriptProperties();
  var config = JobSearchOS.Config.load(propertyStore);
  JobSearchOS.Config.validate(config, options.requireProfile ? "profile" : "runtime");
  var logger = new JobSearchOS.StructuredLogger(null, config.logLevel);
  var staging = null;
  if (config.stagingSheetId) {
    var spreadsheet = SpreadsheetApp.openById(config.stagingSheetId);
    staging = new JobSearchOS.StagingStore(new JobSearchOS.GoogleSheetAdapter(spreadsheet), logger);
    if (!config.dryRun || options.requireProfile) staging.ensureSchema();
  }
  var transport = config.dryRun ? null : new JobSearchOS.AppsScriptHttpTransport(config);
  var notion = new JobSearchOS.NotionClient(transport, {
    jobsDataSourceId: config.notionJobsDataSourceId,
    dryRun: config.dryRun,
    logger: logger
  });
  return { config: config, logger: logger, staging: staging, notion: notion };
};
