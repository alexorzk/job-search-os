# V1 Job Scoring Policy

## Purpose

Scoring answers: “Among jobs that are not clearly disqualified, which fresh opportunities are most worth the user's review today?” It is a ranking aid, not a claim of eligibility and not legal advice.

The system first applies deterministic hard filters, then calculates component scores, then applies major penalties/uncertainty handling, and finally selects up to ten jobs. It never pads a batch to reach ten.

## Initial configurable weights

| Component | Default weight | Meaning |
| --- | ---: | --- |
| Technical / experience fit | 38% | Evidence-backed overlap between role needs and approved experience |
| Visa compatibility | 20% | Explicit restrictions, positive evidence, and uncertainty |
| New-grad / seniority fit | 17% | Degree timing, level, and experience requirement |
| Freshness | 12% | Posting/first-seen recency |
| Personal interest | 8% | Preferred role families/industries |
| Location / compensation | 5% | Geographic feasibility and known compensation preference |
| **Total** | **100%** | |

Each component is normalized from 0 to 100. Before post-score penalties:

```text
base_score = Σ(component_score × component_weight)
final_score = clamp(base_score - configured_penalties, 0, 100)
```

Weights, thresholds, freshness buckets, and penalties are versioned configuration. Changes must not silently rewrite the historical score attached to an application/resume snapshot.

## Processing order

1. Confirm minimum source identity and an application/posting URL.
2. Normalize/deduplicate.
3. Apply explicit deterministic hard filters.
4. Retrieve/read the description where safely available.
5. Extract evidence-bearing structured signals.
6. Compute the six components.
7. Apply uncertainty/quality penalties.
8. Exclude below-threshold or restricted records.
9. Rank by final score, then freshness, then stable job ID for deterministic ties.
10. Promote up to ten.

## Hard filters

Hard filters require explicit evidence, retained with the matched text/field and rule ID. Reject from automatic promotion when any of the following is clear:

- title/description indicates Senior, Staff, Principal, Lead, Manager, Director, Engineer III, Engineer IV, or equivalent senior ownership;
- explicit U.S. citizenship requirement incompatible with the approved profile;
- explicit permanent-residency/green-card requirement incompatible with the approved profile;
- explicit “no current or future sponsorship” or equivalent restriction incompatible with the approved profile;
- an active/inherently required security clearance or clearance eligibility that explicitly requires incompatible citizenship;
- role is clearly unrelated to target EE/adjacent families;
- posting is closed, expired, invalid, or has no actionable source after retry/review;
- degree/discipline requirement is clearly incompatible and cannot reasonably be satisfied by the profile.

Do not transform uncertain language into a hard filter. Flag it and lower confidence. Export-control “U.S. person” wording must be evaluated separately from a blanket citizenship requirement; ambiguity is held for review.

## Seniority interpretation

Title signals are combined with responsibilities and requirements. Title alone is not always decisive.

| Signal | Default handling |
| --- | --- |
| New Grad, Early Career, Recent Graduate, Associate, Junior, Engineer I | Strong positive |
| Unleveled Engineer | Read description; usually eligible for scoring |
| Engineer II | Lower priority, but always read before rejection |
| Senior, Staff, Principal, Lead, Manager, Engineer III/IV | Usually hard reject when clearly a level |
| Ambiguous numeral/title | Flag; use description evidence |

“Lead” used as a verb or project responsibility is not automatically a senior title. “Senior” in a company/team name or degree context is not a seniority signal.

## Experience-requirement spectrum

Years are interpreted as one signal, not a strict universal gate. Relevant internships, engineering employment, research, substantial projects, technical teams, and coursework/labs may contribute when the posting does not explicitly demand post-degree professional experience.

| Requirement | Default new-grad score guidance |
| --- | --- |
| 0 years / no minimum | 100 |
| 0–2 years | 95–100 |
| 1+ years | 85–95 |
| 1–2 years | 85–95 |
| 2 years | 70–90 based on duties and evidence |
| 2–3 years | 45–80 based on wording, level, and strong fit |
| 3+ years | 15–45; normally below promotion threshold unless clearly flexible and exceptional fit |
| 5+ years | Usually hard reject as seniority mismatch |
| Unknown | Neutral-conservative score plus `Experience requirement unknown` flag |

“Preferred” experience is less restrictive than “required.” AI may classify wording, but deterministic parsing should preserve the original phrase and required/preferred distinction. Do not automatically reject a junior role asking for one or two years.

## Component scoring

### Technical / experience fit (38%)

Score only against approved profile and Experience Bank evidence. Suggested inputs:

- fit of core responsibilities to demonstrated experience;
- required skill coverage, weighted more than preferred skills;
- depth/recency of supporting experience;
- discipline/role-family alignment;
- education requirement fit;
- severity of material gaps.

AI may produce a structured comparison listing requirement evidence, supporting Experience IDs/fact IDs, gap status, and confidence. A deterministic function converts that structure to the component score. Keyword overlap alone should not dominate, and absence of a keyword is not proof of no capability.

The Notion UI needs only a concise fit summary and important gaps/flags, not a verbose matrix. Detailed evidence can remain in processing records.

### Visa compatibility (20%)

Visa evaluation uses evidence states rather than a binary prediction:

| State | Score guidance | Handling |
| --- | ---: | --- |
| Explicit compatible sponsorship/work-authorization evidence | 90–100 | Retain source and date |
| No restriction found in full description | 55–70 | Not proof of sponsorship; label accurately |
| Description missing or material language ambiguous | 30–50 | Flag for review |
| Conflicting evidence | 10–40 | Major flag/penalty; user review |
| Explicit incompatible restriction | 0 | Hard reject from promotion |

Potential evidence includes stated sponsorship policy, current/future sponsorship questions, OPT/STEM OPT compatibility, employer E-Verify evidence, historical H-1B sponsorship, citizenship/U.S.-person wording, and clearance requirements. For V1, only posting text is required; employer E-Verify and historical H-1B enrichment are later improvements unless a reliable free source is quickly available.

No restriction found must never be displayed as “visa friendly.” Historical sponsorship is supportive, not a guarantee. E-Verify evidence matters for STEM OPT but does not establish willingness to sponsor H-1B. Legal or policy ambiguity is surfaced for human verification.

### New-grad / seniority fit (17%)

Combine title level, graduation-window eligibility, years wording, scope/ownership, and whether the role accepts a bachelor's degree. Use the experience spectrum above. Penalize roles expecting independent program ownership, people management, or deep post-degree practice even if title is vague.

### Freshness (12%)

Use publisher `Posted At` when credible; otherwise use `First Seen At` and set a lower-confidence flag. Suggested calendar-age buckets:

| Age | Score |
| --- | ---: |
| 0–1 days | 100 |
| 2–3 days | 90 |
| 4–7 days | 75 |
| 8–14 days | 50 |
| 15–30 days | 25 |
| Over 30 days | 5, normally not promoted |

Jobs confirmed closed score zero and are filtered. A repost with a new requisition/posting date may be new; a tracking-parameter change is not. Never infer a fresh posting date from a feed update alone without labeling the timestamp source.

### Personal interest (8%)

Map role family and industry to profile weights. Unknown is neutral. The user may set an interest override, but it cannot defeat a hard restriction.

### Location / compensation (5%)

Score geographic feasibility, work mode, relocation preference, and known compensation. Missing compensation is neutral, not negative. A hard geographic constraint may be configured separately from this preference score.

## Penalties and promotion threshold

Initial configurable post-score penalties:

- missing or inaccessible full description: 8–15 points and a review flag;
- unresolved possible duplicate: 5 points and a review flag;
- Engineer II / ambiguous higher level: 5–15 points depending on responsibilities;
- conflicting visa evidence: 15–30 points or manual hold;
- posting older than 30 days: normally excluded from Daily Top 10;
- material required-skill gap: reflected primarily in technical score, with an optional capped penalty for a truly mandatory gap.

Start with a promotion threshold around 65/100 and calibrate on a labeled set of real-but-private examples. Thresholds must not be tuned merely to force ten results.

## AI signals versus deterministic rules

| AI-assisted interpretation | Deterministic control |
| --- | --- |
| Role-family classification | Enumerated schema validation |
| Required vs preferred requirement extraction | Preserve quoted evidence location/hash |
| Ambiguous seniority/context interpretation | Explicit title hard-filter rules and final policy |
| Experience-to-requirement comparison | Approved Experience IDs/fact IDs only |
| Visa-language classification | Explicit restriction rules; `unknown` required |
| Concise fit summary | Component arithmetic and final score |
| Bullet selection/rewrite proposals | Claim validation and formatting constraints |

AI cannot override hard filters, create evidence, or directly set user workflow state. Prompt injection in job descriptions is treated as untrusted text: descriptions are data to classify, never instructions to execute.

## Audit and calibration

For every scored job retain:

- job and description snapshot/hash;
- profile and Experience Bank versions;
- component scores and evidence/confidence;
- hard-filter/penalty rule IDs;
- weights/configuration version;
- model and prompt/schema version when AI was used;
- final score, rank, and batch date.

After several weeks, compare recommendations with user save/apply decisions. Adjust weights only with versioned changes and a small labeled evaluation set. Optimize for useful review/application decisions, not agreement with an opaque model score.
