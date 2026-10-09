---
title: Site Scanning Product Management Guide
description: Product charter, stakeholders, outcomes, measurement, prioritization, roadmap, and operating cadence.
status: draft
tier: 2
last_updated: 2026-10-09
---

# Site Scanning Product Management Guide

## 1. Product Charter

### Mission

Help federal digital leaders and website teams understand the public federal web
presence and take evidence-based action to improve inventory, adoption,
accessibility, performance, security, discoverability, and service quality.

### Product Of Interest

The product is the complete information service, not only the scanner code. It
includes the Federal Website Index relationship, scan engine, API, bulk
snapshots, data definitions, reports, support, outreach, and feedback loops.

### In Scope

- Maintaining repeatable observations about public federal websites.
- Publishing understandable, reusable, and appropriately caveated data.
- Supporting stakeholders who use the data for recurring decisions.
- Prototyping and sustaining scans with verified user value.
- Measuring coverage, data quality, reliability, use, and outcomes.

### Out Of Scope Without A Separate Decision

- Certifying legal, policy, accessibility, privacy, or security compliance.
- Penetration testing or active exploitation.
- Crawling entire sites without a bounded scope and load analysis.
- Determining that a site should be retired without agency validation.
- Collecting non-public or authenticated website content.
- Adding detectors without a named consumer and maintenance owner.

### Constraints

- Public federal website content is untrusted and operationally unpredictable.
- Cloud.gov, GitHub Actions, PostgreSQL, Redis/Valkey, S3, Node.js, and Chrome
  define the current technical environment.
- Public output is consumed across repositories and organizations, making field
  compatibility and communication important.
- Historical program documentation reports a small team and limited budget;
  priorities must minimize recurring operational and maintenance burden.
- ATO and federal security obligations constrain system and dependency changes.

## 2. Value Proposition

Site Scanning provides a government-wide inventory with more than 100 data
points about public websites. It allows a program or agency to answer portfolio
questions without each organization standing up its own crawler, source-list
pipeline, publication service, and support function.

The program's public documentation reports 5,841 downloads in FY24, a budget of
approximately $420,000, and 1.5 FTE for the period described. It estimates value
through avoided duplication and a hypothetical licensed-data comparison. These
figures are useful context but should be refreshed and paired with outcome
evidence before being used for current investment decisions.

## 3. Stakeholder Register

| Stakeholder                            | Authority or role               | Need                                         | Desired outcome                               | Engagement                             |
| -------------------------------------- | ------------------------------- | -------------------------------------------- | --------------------------------------------- | -------------------------------------- |
| Program sponsor and GSA/TTS leadership | Funding and strategic direction | Evidence of impact, risk, and sustainability | Continued investment tied to outcomes         | Quarterly portfolio review             |
| OMB OFCIO and DX Council               | Policy and portfolio oversight  | Comparable government-wide measures          | Prioritized policy and rationalization action | Monthly/quarterly briefing             |
| Agency digital councils and web owners | Validate and act on site data   | Accurate inventory and actionable findings   | Remediation, consolidation, adoption          | Agency briefing and office hours       |
| DAP                                    | Shared-service owner            | Installation/configuration intelligence      | More correct and current adoption             | Campaign co-design and data review     |
| USWDS                                  | Shared-service owner            | Adoption and version signals                 | Better-targeted support and roadmap evidence  | Quarterly analysis review              |
| Search.gov                             | Shared-service owner            | Market and readiness signals                 | Adoption and migration opportunities          | Report feedback sessions               |
| Touchpoints and Feedback Analytics     | Product consumers               | Website status and form/service signals      | Better status cards and outreach              | Integration check-in                   |
| CISA and agency security teams         | Security stakeholders           | Third-party and HTTPS/HSTS intelligence      | Prioritized investigation                     | Controlled use-case reviews            |
| NIST and standards teams               | Standards stakeholders          | Measurable public implementation signals     | Standards adoption evidence                   | Scan co-design                         |
| Researchers and data users             | Independent consumers           | Stable, reproducible access                  | Reuse and external insight                    | Documentation, examples, issue intake  |
| Operators and maintainers              | Service delivery                | Reliable runs and safe changes               | Predictable operation at low toil             | Weekly operating review                |
| Authorizing officials                  | Risk acceptance                 | Boundary, controls, evidence, changes        | Continued authorization                       | ATO cadence and material-change review |

Decision authority must be made explicit for each initiative. A subject-matter
expert can validate a detector while only the product sponsor can decide whether
its recurring cost belongs in program scope.

## 4. Outcome Model

```text
Reliable inventory and observations
  -> understandable, trusted data products
  -> stakeholders integrate data into recurring workflows
  -> outreach and decisions become better targeted
  -> agencies improve websites or rationalize portfolios
  -> the public experiences more usable and trustworthy digital services
```

The major measurement gap is between downloads and the decisions or changes
those downloads produce. Product management should prioritize closing that gap.

## 5. Goal-Question-Metric Framework

| Goal                               | Question                                                                     | Metric                                                                                     | Collection                                  | Cadence                        | Accountable role            |
| ---------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------- | ------------------------------ | --------------------------- |
| Maintain comprehensive inventory   | How much of the known public federal web is represented and correctly owned? | Source coverage, validated additions/removals, ownership completeness                      | Index analysis plus agency validation       | Monthly                        | Index product owner         |
| Publish fresh data                 | Are observations and secondary sources current?                              | Age distribution by scan group, stale-row count, source-data age                           | Database/snapshot analysis                  | Daily dashboard, weekly review | Operations lead             |
| Operate reliably                   | Do scheduled stages complete and recover?                                    | Workflow success rate, queue age, retry/failure rate, snapshot completion                  | Actions, Bull, structured logs, S3 checks   | Daily/weekly                   | Operations lead             |
| Make data trustworthy              | Can users understand provenance and limitations?                             | Dictionary coverage, contract drift, support questions, documented caveats                 | Contract checks and support log             | Release and monthly            | Data product owner          |
| Increase meaningful use            | Which teams use data repeatedly and for what decisions?                      | Active consuming teams, repeat usage, integrations, use cases                              | Privacy-respecting analytics and interviews | Quarterly                      | Product manager             |
| Produce outcomes                   | What actions changed because of the data?                                    | Validated inventories, outreach actions, remediations, adoptions, retirements reviewed     | Partner outcome log                         | Quarterly                      | Product manager and partner |
| Control maintenance cost           | Is new capability sustainable?                                               | Toil hours, detector failures, dependency age, mean repair time                            | Work tracking and operations                | Monthly                        | Technical lead              |
| Improve equity and service quality | Are analyses and outreach covering agencies and user needs fairly?           | Agency coverage, missing ownership, underserved cohorts, accessibility/performance cohorts | Portfolio analysis                          | Quarterly                      | Product manager             |

Avoid using raw API requests, download counts, field count, or websites scanned
as stand-alone success metrics. They measure activity or reach, not value.

## 6. Product Discovery And Delivery

The program's public stakeholder process is sound and should be treated as the
default lifecycle:

1. **Hypothesis:** name the user, decision, and expected action.
2. **Research:** validate frequency, present workaround, value, and scanning
   feasibility.
3. **Prototype:** create the smallest representative scan or report on a bounded
   sample.
4. **Feedback:** review both useful results and false positives with the user.
5. **Iterate:** implement only agreed changes.
6. **User acceptance:** obtain explicit confirmation that the output supports
   the intended workflow.
7. **Sustain:** add tests, monitoring, definitions, ownership, and a review
   cadence.

### Required Discovery Evidence

No candidate should enter committed delivery without:

- A named stakeholder team and product contact.
- A recurring decision or workflow, not general interest.
- A bounded target scope and observation method.
- Examples of positive, negative, and ambiguous cases.
- Acceptance targets for precision, coverage, freshness, and explanation.
- A response plan for false positives and sensitive findings.
- A maintenance owner and estimated recurring cost.
- An exit condition if the hypothesis does not produce use.

## 7. Prioritization Model

Score candidates from 1 to 5 on each dimension.

| Dimension           | Question                                                            | Weight |
| ------------------- | ------------------------------------------------------------------- | ------ |
| User value          | How material and frequent is the decision?                          | 25%    |
| Reach               | How many sites, agencies, or programs benefit?                      | 15%    |
| Actionability       | Will a positive/negative result lead to a defined action?           | 20%    |
| Evidence confidence | Can the signal be measured accurately and explained?                | 15%    |
| Strategic alignment | Does it advance current program and federal priorities?             | 10%    |
| Delivery cost       | How small is implementation and validation effort?                  | 5%     |
| Operating cost      | How low is ongoing browser, storage, support, and maintenance cost? | 10%    |

Use weighted scoring to structure discussion, not replace judgment. Security or
authorization requirements may override ranking. A high-interest idea with no
defined action should remain in discovery.

## 8. Recommended Roadmap

### Horizon 1: Trust And Operability

- Establish API/snapshot/data-dictionary contract tests.
- Correct API filtering and align generated OpenAPI documentation.
- Define freshness and workflow reliability dashboards.
- Validate and document a recovery runbook for each scheduled stage.
- Reconcile public schedule documentation with actual workflows.
- Restore locally testable snapshot storage or provide a supported alternative.

### Horizon 2: Adoption And Outcomes

- Publish three supported analysis recipes: agency inventory, shared-service
  adoption, and third-party exposure.
- Pilot agency portfolio briefings and capture validation/actions.
- Establish quarterly partner reviews with DAP, USWDS, Search.gov, and one
  security stakeholder.
- Add privacy-respecting measures of repeat use and integration.
- Publish two outcome-oriented case studies.

### Horizon 3: Historical Intelligence

- Decide on a stable site identity and historical architecture.
- Provide trend-ready datasets and selected change events.
- Measure program-driven adoption and remediation over time.
- Prototype one alerting use case with an explicit response owner.

### Horizon 4: Co-designed Capability Growth

- Deliver one bounded, partner-accepted scan at a time.
- Retire detectors or reports with no active user or owner.
- Reassess browser cost and architecture as scan breadth grows.

This is a sequence of outcomes, not calendar commitments. Estimate dates only
after staffing, dependencies, and acceptance scope are confirmed.

## 9. Operating Cadence

| Cadence                      | Forum                          | Inputs                                                        | Decisions                                     |
| ---------------------------- | ------------------------------ | ------------------------------------------------------------- | --------------------------------------------- |
| Daily automated              | Operational checks             | Workflow results, queue, freshness, snapshot existence        | Escalate failed or stale stages               |
| Weekly                       | Product/engineering operations | Incidents, support, delivery, risks                           | Recovery, near-term priorities, ownership     |
| Monthly                      | Data quality review            | Contract drift, field quality, false positives, index changes | Definition/detector changes                   |
| Quarterly                    | Stakeholder outcome review     | Usage, actions, adoption trends, case studies                 | Continue, change, expand, or retire offerings |
| Quarterly or material change | Security/ATO review            | Dependencies, architecture, controls, incidents               | Authorization evidence and risk response      |
| Annually                     | Strategy and portfolio review  | Outcomes, cost, stakeholder demand, risks                     | Investment and capability direction           |

## 10. Communication Plan

| Audience              | Content                                       | Format                        | Cadence                           |
| --------------------- | --------------------------------------------- | ----------------------------- | --------------------------------- |
| Operators             | Failures, queue/freshness, recovery ownership | Dashboard and issue/alert     | Daily                             |
| Program team          | Delivery, support, risks, decisions           | Short operating review        | Weekly                            |
| Data consumers        | Field changes, known limitations, examples    | Changelog, docs, mailing list | Before release and monthly digest |
| Agency partners       | Their inventory and action opportunities      | Briefing/report               | Quarterly or campaign             |
| Leadership            | Outcomes, active users, risk, cost, roadmap   | One-page scorecard            | Quarterly                         |
| Authorizing officials | Boundary/control/material changes             | ATO artifacts and review      | Required cadence                  |

Every public field change should include advance notice, effective date,
definition, example, compatibility impact, and migration advice.

## 11. Definition Of Done

A new scan or public field is not done when code merges. It is done when:

- The named stakeholder accepts the result against representative examples.
- Success, absence, ambiguity, and failure behavior are tested.
- Database, API, snapshot, and dictionary contracts agree.
- A live end-to-end scan and publication path is verified.
- Metrics, logs, runbook, and support ownership exist.
- Security, privacy, load, accessibility, and ATO impacts are reviewed.
- Consumers receive change communication.
- A review or retirement date is recorded.

## 12. Immediate Management Questions

1. Who currently owns product decisions, technical decisions, operations,
   source-index quality, public data definitions, outreach, and ATO evidence?
2. Which reported stakeholders are still active users in 2026, and what
   decisions do they make with the data now?
3. What are current costs, staffing, download/API use, and recurring support
   demands?
4. What service levels are promised for scan freshness, API availability, and
   snapshot publication?
5. Which downstream products depend on exact fields or file names?
6. Which candidate capability has a committed stakeholder ready to validate a
   prototype and act on the result?

Answering these questions should precede schedule commitments for capability
growth.
