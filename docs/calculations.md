# Calculations

This document is the source of truth for vitality, dissolution risk, and rebate estimates. `src/config/defaults.ts` holds the thresholds and dollar amounts. `src/domain/` implements the rules. Change this document and the code together, and update the tests.

Amounts are US dollars. The allowances come from the MGA geographic-unit rebate table (base, per-member rebate, and required minimums). These figures are estimates for planning. They are not an official payment.

The annual-plan deadline day is whatever MGA publishes for that cycle. This app does not invent a calendar date.

## Columns

Headers are matched exactly after trimming.

| Pattern | Meaning |
| --- | --- |
| `Total Members` | Current student-branch membership |
| `Dec YYYY Members` | Membership at 31 December of YYYY |
| `YYYY Events` | Events reported for YYYY |
| `YYYY Unreported Events` | Events created but not reported. Shown, never counted |
| `YYYY Annual Plan` | Annual plan for YYYY |
| `Region`, `Section Name`, `School Name`, `SPOID` | Identity |
| `Vitality Status` | The sheet's own label. Stored and shown as sheet status. Not used in any calculation |
| `Chair Email`, `Vice Chair Email`, `Treasurer Email`, `Secretary Email` | Student branch Executive Committee (ExCom) officers (up to 4). Non-empty cells count toward reported officers. MGA requires at least one officer or counselor reported for rebate compliance. Email addresses themselves are not rendered |
| `Counselor Email` | Student branch counselor. Counts as a reported officer for rebate compliance. Student branches are strongly recommended to maintain both a Chair and a Counselor at all times. Also tracked as a Yes/No presence indicator and in summary counts of branches without a counselor |
| `Section Chair Email`, `Section SAC Email`, `Section Student Rep Email` | Section Chair, Section SAC Chair, and Section Student Representative (SSR). A section is counted as having a SAC Chair or SSR when any branch row in that section has a non-empty email for that role (shown as section counts in the region table and `Yes` / `No` in the section table). On a section view, non-empty contact emails for these three roles are displayed in the page header with a comma-separated clipboard copy action |
| `RSAC Email`, `Region Student Rep Email`, `Additional RSAC Email`, `Additional Region Student Rep Email` | Region student-activities leadership. On a region view, non-empty contact emails for RSAC and Region Student Rep (plus Additional RSAC and Additional Region Student Rep when present) are displayed in the page header with a comma-separated clipboard copy action |

A blank cell in `Total Members`, `Dec YYYY Members`, or `YYYY Annual Plan` is missing. It is not zero. A cell that is not a number is also missing. `Yes` and `No` (any case, also `Y` / `N` and `Submitted` / `Not submitted`) are the plan values. Any other plan text is unrecognized and is treated as missing.

Membership blanks are never treated as zero. Student branches chartered or reactivated in recent years do not have historical December membership records. Treating blank historical membership counts as zero would falsely register those units as having failed minimum membership requirements in years prior to their establishment, causing spurious delinquency and dissolution warnings. Keeping them as missing (`null`) correctly evaluates them as Incomplete history for those completed cycles, ensuring newly established branches are not penalized for history that predates them.

A blank cell in `YYYY Events` or `YYYY Unreported Events` is treated as 0 reported events. In the reporting system, branches that have never reported events have blank cells rather than zeros; treating them as 0 allows vitality standing, dissolution watchlists, and rebate-at-risk calculations to evaluate these inactive branches accurately rather than treating them as missing data.

`R0` is Region 10. `R10`, `Region 10`, and `10` are the same region. Other numeric region codes stay `R1` through `R9`.

## Cycles

The latest `YYYY Events` column is the activity year. The open rebate year is the activity year plus one.

For the sample layout, the activity year is 2026 and the open rebate year is 2027.

**Open cycle**

- Members: `Dec {activity year} Members` when that column exists. Otherwise `Total Members`, and the events for that year are labeled year to date.
- Events: reported events for the activity year. Unreported events are not added.
- Officers: at least one officer or counselor (`Chair Email`, `Vice Chair Email`, `Treasurer Email`, `Secretary Email`, or `Counselor Email`) is non-empty. (Maintaining at least a Chair and a Counselor is recommended for branch vitality).
- Plan: the annual plan for the open rebate year.

**Completed cycles**

A completed rebate year Y is evaluable when all three columns exist: `Dec {Y-1} Members`, `{Y-1} Events`, and `{Y} Annual Plan`, and Y is not the open rebate year. Because the CSV contains only current officer emails, completed cycles evaluate historical members, reported events, and the annual plan without applying current officer emails retroactively. The dashboard uses the two most recent evaluable years. With today's columns those are 2026 and 2025.

| Rebate year | Members | Reported events | Annual plan |
| --- | --- | --- | --- |
| 2027 projected (open) | `Total Members` until a Dec 2026 column exists | 2026 | 2027 |
| 2026 | Dec 2025 | 2025 | 2026 |
| 2025 | Dec 2024 | 2024 | 2025 |

Official 2024 vitality is not calculated. That cycle needs Dec 2023 members, 2023 events, and the 2024 plan, and those columns are not in the current export.

Active student branches for prior snapshots are derived from units having recorded December membership for that year (units chartered or reactivated later have blank snapshot cells). Branch change compares the current roster count with the latest prior December snapshot across the branches in view. Member and event trends use the branches in the current file.

Member change compares the summed open-cycle membership with the summed latest earlier December snapshot across the branches in view.

## Good standing

Minimums: **12** members, **4** reported events, and (for the open cycle) **at least one reported officer or counselor** (`Chair Email`, `Vice Chair Email`, `Treasurer Email`, `Secretary Email`, or `Counselor Email`). While any reported officer satisfies rebate compliance under the MGA Operations Manual, maintaining both a Chair and a Counselor at all times is recommended for branch vitality.

The checkbox "annual plan is not due yet" defaults to on. It is stored in this browser. It changes only the open cycle. Every completed cycle requires its own plan. Dissolution risk ignores the checkbox.

When the plan is required:

- **Incomplete data** if members, events, or the plan are missing, or the plan value is unrecognized.
- **Good standing** if members are at least 12, reported events are at least 4, the plan is Yes, and (for the open cycle) at least one officer or counselor is reported.
- **Inactive** if reported events are 0 and the plan is not Yes.
- **Needs support** for every other complete row. A branch with members and a plan but no events is Needs support, because a plan was submitted.

When the open-cycle plan is set aside:

- **Incomplete data** if members or events are missing.
- **Good standing** if members are at least 12, reported events are at least 4, and at least one officer or counselor is reported.
- **Inactive** if reported events are 0.
- **Needs support** for every other complete row.

For the open cycle, good standing rates divide branches in good standing by the total branches in view, including incomplete rows. For completed cycles, rates divide branches in good standing by the active branches in that cycle (units having a December membership snapshot for that year). Branches chartered or reactivated in later cycles are marked as "Not established" for prior cycles and are excluded from those earlier denominators so historical qualification rates accurately reflect the active units of each year. Incomplete rows among active branches are counted on their own so low rates are not mistaken for failed branches.

A total across regions, sections, or listed student branches divides the summed branches in good standing by the summed branches. Numeric totals across listed student branches sum known cells and stay missing (`—`) when every listed cell in that column is blank.

### Requirement gaps

Gaps describe why branches miss good standing across available cycles (the open cycle and evaluable completed cycles), after the open annual-plan checkbox is applied. Incomplete rows and good-standing branches are tracked separately.

For the open cycle, requirements include members, reported events, reported officers or counselor, and annual plan (unless set aside). For completed cycles, requirements include December snapshot members, reported events, and annual plan (historical officer records are not in the export).

A requirement fails when members are under 12, reported events are under 4, no officer or counselor is reported, or a required plan is not Yes.

The gap table orders requirement gaps by intervention need, listing multi-requirement failures first:
- **All 4 requirements not met** (when 4 requirements are evaluated)
- **3 requirements not met** (when 4 requirements are evaluated) or **All 3 requirements not met** (when the annual plan is set aside and 3 requirements are evaluated)
- **2 requirements not met**

Followed by single-requirement rows indicating that the branch meets all other requirements:
- **Under 12 members** (meets events, reported officers, and plan if required)
- **Fewer than 4 events** (meets 12 members, reported officers, and plan if required)
- **No reported officers** (meets 12 members, 4 events, and plan if required)
- **Annual plan not submitted** (when the open-cycle plan is required; meets 12 members, 4 events, and reported officers)

Followed by **Incomplete data** and **Not established yet** (units established in a later year).

The annual plan gap is absent while the checkbox sets the plan aside.

## Dissolution risk

Dissolution uses membership and meetings only. It does not use the annual plan, the sheet status, or the checkbox. Unreported events do not count.

A completed activity year is a year that has both a December member column and an events column, excluding the open activity year. The open activity year is judged separately as on track, not on track, or incomplete:

- On track: members at least 12 and reported events at least 4.
- Not on track: either number is below its minimum.
- Incomplete: either number is missing.

A completed year is **met**, **failed**, or **unknown** with the same tests. The streak walks backward from the latest completed year through adjacent failed years. An unknown year or a gap in the years ends the streak (preventing newly chartered or reactivated units with missing prior membership snapshots from accumulating false failure streaks). A met year ends it as well.

| Condition | Tier |
| --- | --- |
| Latest completed year is unknown, or there is no completed year | Incomplete history |
| Latest completed year was met | On track |
| Three or more adjacent completed years failed | Dissolution activity test met |
| Two adjacent completed years failed, and the open year is not on track | Immediate action |
| Two adjacent completed years failed, and the open year is on track | Two-year warning |
| Two adjacent completed years failed, and the open year is incomplete | Multi-year failure, this year incomplete |
| Only the latest completed year failed | One-year watch |

The activity test means the branch has failed the membership or meeting minimum for three consecutive completed years. The file does not say whether delinquency notices were sent, so the app does not say the branch has been dissolved.

The table count labeled immediate action includes both **Immediate action** and **Dissolution activity test met**.

With the current columns the completed years are 2024 and 2025, so the longest streak the file can prove is two years. A future `Dec 2023 Members` and `2023 Events` pair extends the streak without a code change.

## Rebates

All rebate figures displayed in this tool are approximate estimates for planning and advocacy, not official payments or promises of distribution. Official, verified rebate amounts and statements are maintained on IEEE vTools (`https://events.vtools.ieee.org/tego_/events/administration/rebates`).

### Student branch allowance formula

Student-branch allowance at a headcount of M:

- Base **$50** when M is under 50, or **$100** when M is 50 or more.
- Plus **$2** times M.
- M is the cycle's member input (current headcount or latest December snapshot for the open cycle; December snapshot for completed cycles). A missing member count has no allowance.

Examples: 64 members → $100 + $128 = $228. 20 members → $50 + $40 = $90. 0 members → $50. 49 members → $50 + $98 = $148. 50 members → $100 + $100 = $200.

### Qualification requirements (all 4 vitality conditions required)

Member count alone is **not** sufficient to receive a rebate. To qualify for a student-branch rebate, a branch must satisfy all **4 vitality conditions**:

1. Minimum **12** student members
2. Minimum **4** reported events
3. Reported **officers** (at least one ExCom officer or Counselor)
4. Submitted **annual plan** (unless set aside by the open-cycle plan checkbox)

If any of these 4 conditions are unmet, the branch does not qualify and its rebate is **$0.00** (matching official MGA rebate statements).

### Terminology: Projected vs Rebate at risk (replacing "Foregone")

- If standing is good, the allowance is **projected** (for the open cycle) or **estimated qualified** (for completed cycles).
- If standing is needs support or inactive, the allowance is **at risk** (for the open cycle) or **unqualified** (for completed cycles). Incomplete standing has neither a projected nor an at-risk amount.
- The term **Rebate at risk** (or **At risk**) replaces "Foregone" across tables, follow-up actions, and summary cards. In the open cycle, branches that have not yet qualified still have time to submit their plan, report officers, or log events before final deadlines.

### Three-year cycle overview & historical officer status

The dashboard calculates approximate rebate amounts across all three available cycle years (the open cycle and the two completed cycles):

- **Open cycle**: Evaluates all 4 requirements against current membership, YTD events, reported officers, and the open annual plan.
- **Completed cycles**: Evaluates historical December membership, historical events, and historical annual plans. Historical officer reporting records are not in the CSV export; qualification assumes officers were reported. Because branches that lacked reported officers received $0.00 in reality, the estimated historical rebate is an upper bound; actual historical distributed amounts were likely lower.

### Distribution process & timeline (Q3 transfer via Sections)

- IEEE calculates and distributes student-branch rebates annually in **Q3** (July–September).
- IEEE does not transfer funds directly to individual student branches; rather, the total approved student-branch rebate is transferred as a lump sum to the **Section** bank account.
- Section officers are responsible for distributing the individual rebate amounts to their qualified student branches.

### Student portion of Section rebate

**Student portion of Section rebate** is **$3** times the student headcount for that cycle, summed across the branches in view. As reflected on the official IEEE Section Statement of Rebate (under Member Breakdown: Student Member @ $3.00 ea.), this is money in the section rebate formula, not the student-branch rebate. It is not added to the branch rebate and is not reduced when an individual branch misses good standing. The section still has its own requirements (higher-grade members, meetings, and timeliness). Those inputs are not in this export, so the portion is an advocacy estimate, not an official payment confirmation.

No timeliness bonus and no activity bonus are applied. The student-branch timeliness cell is empty in the allowance table we encoded, and the export has no filing dates.

## Scope

Scope is inferred from the rows in the file:

- Every row is in one section: section file. The officer sees that section only.
- Otherwise every row is in one region: region file. The officer can open those sections.
- More than one region: MGA file. The officer can open a region, then a section.

A route outside the file does not reveal other rows. Search filters the listed rows and the total row under them. The summary cards stay on the full current view.

## What this file cannot answer

- Whether a branch existed in a prior year.
- Official 2024 rebate eligibility, until the 2023 inputs and the 2024 plan exist.
- Whether delinquency notices were sent.
- Whether a section meets its own rebate requirements.
- Which unreported events still need a report filed, beyond the count already in the export.
