var JobSearchOS = JobSearchOS || {};

JobSearchOS.Profile = {
  validate: function (profile) {
    var errors = [];
    var constants = JobSearchOS.Constants;
    if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
      throw new Error("PROFILE_INVALID: profile must be an object");
    }
    if (profile.schema_version !== constants.PROFILE_SCHEMA_VERSION) {
      errors.push("schema_version must be " + constants.PROFILE_SCHEMA_VERSION);
    }
    if (!this.nonEmptyString_(profile.profile_id)) errors.push("profile_id is required");

    var locations = profile.location_preferences;
    if (!locations || typeof locations !== "object") {
      errors.push("location_preferences is required");
    } else {
      ["remote_allowed", "hybrid_allowed", "onsite_allowed", "relocation_allowed"].forEach(function (key) {
        if (typeof locations[key] !== "boolean") errors.push("location_preferences." + key + " must be boolean");
      });
      ["remote_tier", "unknown_location_tier"].forEach(function (key) {
        if (constants.LOCATION_TIERS.indexOf(locations[key]) === -1) {
          errors.push("location_preferences." + key + " is invalid");
        }
      });
      if (["BEST_TIER", "WORST_TIER", "REQUIRE_REVIEW"].indexOf(locations.multi_location_strategy) === -1) {
        errors.push("location_preferences.multi_location_strategy is invalid");
      }
      if (!Array.isArray(locations.rules)) {
        errors.push("location_preferences.rules must be an array");
      } else {
        var ruleIds = {};
        locations.rules.forEach(function (rule, index) {
          var prefix = "location_preferences.rules[" + index + "]";
          if (!rule || typeof rule !== "object") {
            errors.push(prefix + " must be an object");
            return;
          }
          if (!JobSearchOS.Profile.nonEmptyString_(rule.id)) errors.push(prefix + ".id is required");
          if (rule && rule.id) {
            if (ruleIds[rule.id]) errors.push(prefix + ".id must be unique");
            ruleIds[rule.id] = true;
          }
          if (constants.LOCATION_SCOPES.indexOf(rule.scope) === -1) errors.push(prefix + ".scope is invalid");
          if (constants.LOCATION_TIERS.indexOf(rule.tier) === -1) errors.push(prefix + ".tier is invalid");
          var requiredField = { COUNTRY: "country", STATE: "state", METRO: "metro", CITY: "city" }[rule.scope];
          if (requiredField && !JobSearchOS.Profile.nonEmptyString_(rule[requiredField])) {
            errors.push(prefix + "." + requiredField + " is required for " + rule.scope);
          }
          if (rule.priority !== undefined && (!Number.isInteger(rule.priority) || rule.priority < 0)) {
            errors.push(prefix + ".priority must be a non-negative integer");
          }
        });
      }
    }

    this.validateWeightedList_(profile.role_family_weights, "role_family_weights", errors);
    this.validateWeightedList_(profile.industry_interest_weights, "industry_interest_weights", errors);
    ["preferred_companies", "preferred_industries", "avoided_companies", "avoided_industries"].forEach(function (key) {
      if (!Array.isArray(profile[key])) {
        errors.push(key + " must be an array");
      } else if (profile[key].some(function (value) { return !JobSearchOS.Profile.nonEmptyString_(value); })) {
        errors.push(key + " values must be non-empty strings");
      }
    });

    if (profile.salary_floor !== null) {
      var salary = profile.salary_floor;
      if (!salary || typeof salary !== "object" || typeof salary.amount !== "number" || salary.amount < 0) {
        errors.push("salary_floor must be null or contain a non-negative numeric amount");
      } else {
        if (!/^[A-Z]{3}$/.test(String(salary.currency || ""))) {
          errors.push("salary_floor.currency must be a three-letter uppercase code");
        }
        if (["YEAR", "HOUR"].indexOf(salary.period) === -1) {
          errors.push("salary_floor.period must be YEAR or HOUR");
        }
      }
    }

    var authorization = profile.work_authorization;
    if (!authorization || typeof authorization !== "object") {
      errors.push("work_authorization is required");
    } else {
      if (!Array.isArray(authorization.user_confirmed_facts)) {
        errors.push("work_authorization.user_confirmed_facts must be an array");
      } else {
        authorization.user_confirmed_facts.forEach(function (fact, index) {
          var prefix = "work_authorization.user_confirmed_facts[" + index + "]";
          if (!fact || !JobSearchOS.Profile.nonEmptyString_(fact.key)) errors.push(prefix + ".key is required");
          var valueType = fact && typeof fact.value;
          if (!fact || (fact.value !== null && valueType !== "string" && valueType !== "boolean")) {
            errors.push(prefix + ".value must be string, boolean, or null");
          }
          if (fact && fact.confirmed_at !== null && typeof fact.confirmed_at !== "string") {
            errors.push(prefix + ".confirmed_at must be an ISO string or null");
          }
        });
      }
      ["requires_current_sponsorship", "requires_future_sponsorship"].forEach(function (key) {
        if (["YES", "NO", "UNKNOWN"].indexOf(authorization[key]) === -1) {
          errors.push("work_authorization." + key + " must be YES, NO, or UNKNOWN");
        }
      });
    }

    if (errors.length) throw new Error("PROFILE_INVALID: " + errors.join("; "));
    return profile;
  },

  resolveLocation: function (profile, location) {
    this.validate(profile);
    location = location || {};
    var preferences = profile.location_preferences;
    var workMode = String(location.work_mode || "UNKNOWN").toUpperCase();

    if (workMode === "REMOTE") {
      return {
        tier: preferences.remote_allowed ? preferences.remote_tier : "HARD_NO",
        matched_rule_id: "WORK_MODE_REMOTE",
        requires_review: false
      };
    }
    if (workMode === "HYBRID" && !preferences.hybrid_allowed) {
      return { tier: "HARD_NO", matched_rule_id: "WORK_MODE_HYBRID", requires_review: false };
    }
    if (workMode === "ONSITE" && !preferences.onsite_allowed) {
      return { tier: "HARD_NO", matched_rule_id: "WORK_MODE_ONSITE", requires_review: false };
    }

    var specificity = { COUNTRY: 100, STATE: 200, METRO: 300, CITY: 400 };
    var matches = preferences.rules.filter(function (rule) {
      return JobSearchOS.Profile.ruleMatches_(rule, location);
    }).sort(function (a, b) {
      var specificityDifference = specificity[b.scope] - specificity[a.scope];
      if (specificityDifference) return specificityDifference;
      var priorityDifference = (b.priority || 0) - (a.priority || 0);
      if (priorityDifference) return priorityDifference;
      return String(a.id).localeCompare(String(b.id));
    });

    if (matches.length) {
      return { tier: matches[0].tier, matched_rule_id: matches[0].id, requires_review: false };
    }
    return {
      tier: preferences.unknown_location_tier,
      matched_rule_id: null,
      requires_review: true
    };
  },

  resolveMultipleLocations: function (profile, locations) {
    this.validate(profile);
    if (!Array.isArray(locations) || !locations.length) {
      return {
        tier: profile.location_preferences.unknown_location_tier,
        requires_review: true,
        results: []
      };
    }
    var results = locations.map(function (location) {
      return JobSearchOS.Profile.resolveLocation(profile, location);
    });
    var rank = { HARD_NO: 0, LOW_INTEREST: 1, ACCEPTABLE: 2, PREFERRED: 3 };
    var tiers = results.map(function (result) { return result.tier; });
    var strategy = profile.location_preferences.multi_location_strategy;
    var selected;
    if (strategy === "WORST_TIER") {
      selected = tiers.slice().sort(function (a, b) { return rank[a] - rank[b]; })[0];
    } else if (strategy === "REQUIRE_REVIEW" && tiers.some(function (tier) { return tier !== tiers[0]; })) {
      selected = "LOW_INTEREST";
    } else {
      selected = tiers.slice().sort(function (a, b) { return rank[b] - rank[a]; })[0];
    }
    return {
      tier: selected,
      requires_review: results.some(function (result) { return result.requires_review; }) ||
        (strategy === "REQUIRE_REVIEW" && tiers.some(function (tier) { return tier !== tiers[0]; })),
      results: results
    };
  },

  ruleMatches_: function (rule, location) {
    var fieldsByScope = {
      COUNTRY: ["country"],
      STATE: ["country", "state"],
      METRO: ["country", "state", "metro"],
      CITY: ["country", "state", "metro", "city"]
    };
    return fieldsByScope[rule.scope].every(function (field) {
      if (!rule[field]) return true;
      return JobSearchOS.Profile.normalize_(rule[field]) === JobSearchOS.Profile.normalize_(location[field]);
    });
  },

  validateWeightedList_: function (items, name, errors) {
    if (!Array.isArray(items)) {
      errors.push(name + " must be an array");
      return;
    }
    items.forEach(function (item, index) {
      if (!item || !JobSearchOS.Profile.nonEmptyString_(item.name)) {
        errors.push(name + "[" + index + "].name is required");
      }
      if (!item || typeof item.weight !== "number" || item.weight < 0 || item.weight > 100) {
        errors.push(name + "[" + index + "].weight must be between 0 and 100");
      }
    });
  },

  normalize_: function (value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  },

  nonEmptyString_: function (value) {
    return typeof value === "string" && value.trim().length > 0;
  }
};
