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

A blank cell is missing. It is not zero. A cell that is not a number is also missing. `Yes` and `No` (any case, also `Y` / `N` and `Submitted` / `Not submitted`) are the plan values. Any other plan text is unrecognized and is treated as missing.

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

There is no earlier roster in the file, so the number of student branches has no year-over-year change. Member and event trends use only the branches in the current file.

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

Rates use all branches in the current view as the denominator, including incomplete rows. Incomplete rows are also counted on their own so a low rate is not mistaken for a failed branch.

A total across regions, sections, or listed student branches divides the summed branches in good standing by the summed branches. Numeric totals across listed student branches sum known cells and stay missing (`—`) when every listed cell in that column is blank.

### Requirement gaps

Gaps describe the open cycle, after the checkbox is applied. Incomplete and good-standing branches are not gaps.

A requirement fails when members are under 12, reported events are under 4, no officer or counselor is reported, or a required plan is not Yes.

- **Members only**, **Events only**, **Officers only**, or **Annual plan only** when that one requirement fails.
- **More than one requirement** when two or more fail.

The plan gap is absent while the checkbox sets the plan aside.

## Dissolution risk

Dissolution uses membership and meetings only. It does not use the annual plan, the sheet status, or the checkbox. Unreported events do not count.

A completed activity year is a year that has both a December member column and an events column, excluding the open activity year. The open activity year is judged separately as on track, not on track, or incomplete:

- On track: members at least 12 and reported events at least 4.
- Not on track: either number is below its minimum.
- Incomplete: either number is missing.

A completed year is **met**, **failed**, or **unknown** with the same tests. The streak walks backward from the latest completed year through adjacent failed years. An unknown year or a gap in the years ends the streak. A met year ends it as well.

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

Student-branch allowance at a headcount of M:

- Base **$50** when M is under 50, or **$100** when M is 50 or more.
- Plus **$2** times M.
- M is the open cycle's member input. A missing member count has no allowance.

If open-cycle standing is good, the allowance is **expected**. If standing is needs support or inactive, the same allowance is **foregone** at that headcount. Incomplete standing has neither an expected nor a foregone amount. The app does not raise a branch's headcount to 12 to invent a larger rebate.

Examples: 64 members → $100 + $128 = $228. 20 members → $50 + $40 = $90. 0 members → $50. 49 members → $50 + $98 = $148. 50 members → $100 + $100 = $200.

**Section student portion** is **$3** times the same open-cycle headcount, summed across the branches in view. It is money in the section rebate formula, not the branch rebate. It is not added to expected or foregone branch rebate. It is not reduced when a branch misses good standing. The section still has its own requirements (higher-grade members, meetings, and timeliness). Those inputs are not in this export, so the portion is an advocacy estimate, not a promise that the section is paid.

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
