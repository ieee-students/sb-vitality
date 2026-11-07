# Product requirements: Student Branch Vitality Analytics

## Problem

The published Student Branch Vitality Dashboard shows a branch list and a three-color legend. MGA SAC, region officers, and section officers need a bird's-eye view of the same export: how many members and branches they have, which branches are in good standing, where the pattern is getting worse, which branches are close to the dissolution rule, and how much rebate is at stake.

Smartsheet already limits each dynamic view. An MGA export contains every region. A region export contains that region's sections and branches. A section export contains that section's branches. This product does not add an account. It reads the CSV the officer already downloaded.

## Product

A static website at [https://ieee-students.github.io/sb-vitality/](https://ieee-students.github.io/sb-vitality/).

Officers follow three steps:

1. Open the [Student Branch Vitality Dashboard](https://app.smartsheet.com/b/publish?EQBCT=d178a832bd6042259336792c9175f706), launch the Smartsheet Dynamic View for their IEEE volunteer role, and export the CSV.
2. Drop the file on this site, or choose it.
3. Read the analytics for the scope inside that file.

A fictional sample can be loaded from the site so a visitor can see the layout. It uses invented schools and `@example.com` addresses.

Returning visitors with a file already stored in the browser skip to analytics. **Update data** replaces the file only after the new CSV parses. **Remove local data** deletes the browser copy. Until a new file is chosen, the stored file is reused and parsed again with the current rules.

## Privacy

- There is no login, no server, and no analytics collector.
- The CSV is parsed in the browser and stored in IndexedDB on that device.
- GitHub Pages hosts the application only. It does not receive the CSV.
- Fonts are bundled with the site.
- Officer emails stay in the browser. Region and section views show the related region or section officer contact emails on the right of the page header, with a clipboard icon to copy those emails comma-separated. Student-branch officer and counselor emails are kept in the local model and are not rendered.
- Real exports stay off the public repository. See the root `.gitignore`. The committed fixture is `samples/sample-sb-vitality-report.csv`, also copied to `public/` so the site can load it.

If the browser refuses storage, the file remains available for the current visit and the page says so.

## Navigation

Router paths are `/`, `/r10`, and `/r8/saudi-arabia-section`. On the published site the Vite base prefixes them:

- `https://ieee-students.github.io/sb-vitality/`
- `https://ieee-students.github.io/sb-vitality/r10`
- `https://ieee-students.github.io/sb-vitality/r8/saudi-arabia-section`

`R0` in the CSV is Region 10 and the path is `/r10`.

A scope bar stays on screen: `All regions / Region 10 / Harbor Section`. A parent is a link only when that parent is inside the uploaded file. A section file has no link up to other sections. A region file has no link to other regions. The bar names the inferred file role and the time the file was loaded.

Direct visits still work after refresh. GitHub Pages serves `404.html`, which keeps the `sb-vitality` segment and returns the remaining path to the app.

Search filters the listed rows and the total row under them. It does not change the summary cards. Search inputs on the Sections table and the Student branches table operate independently and do not filter each other. On an MGA page, the Sections search filters sections by section name or region label while leaving the region table complete, and the Student branches search filters branches by school name, SPOID, section name, or region label. On a region page, the branch search filters by school name, SPOID, or section name. On a section page, it searches school names and SPOIDs.

## Analytics

Formulas, thresholds, and the meaning of blank cells are specified in [calculations.md](calculations.md).

At a glance, for the current scope:

- Student members, with the change versus the previous 31 December snapshot.
- Student branches, as a current roster, with counts of branches without an officer report, branches without a counselor, branches without a chair, and no invented growth.
- Reported events for the open activity year. When that year is not locked, the figure is labeled year to date. Unreported events sit beside it and are outside the total.
- Branches in good standing for the open cycle, with the rates for the two completed cycles.
- Student-branch rebate expected versus foregone, and the separate section student portion, when approximate rebate information is shown.

Charts show December membership snapshots plus the current headcount, and reported events for each events column. A year-to-date bar is labeled as such.

A gap breakdown counts open-cycle branches missing only members, only events, only officers, only the annual plan, or more than one requirement.

Below the primary tables, a follow-up actions panel combines **Dissolution risk** with **Where to act** when approximate rebate information is on, or shows **Dissolution risk** on its own when approximate rebate information is off. Each follow-up list shows up to 10 entries at a time and scrolls vertically through every matching branch or section, linking each entry to its section or branch row. **Where to act** ranks sections, or schools on a section page, with foregone branch rebate from largest to smallest. Dissolution risk is not affected by the annual-plan checkbox or the rebate checkbox.

When approximate rebate information is on, **Rebate at the current headcount** sits as the final card on the page.

The checkbox **"{year} annual plan is not due yet"** defaults to on. It lets officers see whether members and reported events are already in place before the plan is due. Completed years always include their plan.

The checkbox **Show approximate rebate information** defaults to off. While it is off, the dashboard shows no dollar amounts. The branch-rebate card, the rebate panel, Where to act, the foregone-rebate column, and the branch-rebate column stay hidden. Turning it on shows expected and foregone student-branch rebate, and the separate section student portion. Those figures are planning estimates, not an official payment. The choice is kept in this browser with the annual-plan checkbox.

MGA users see a region table, a section table of every section in the file, and a student-branch table of every branch in the file with added Region and Section columns. Those panels are titled Regions, Sections, and Student branches. The MGA section table includes the region and sorts on its own. Region users see a section table and, below it, a student-branch table of every branch in the region with an added Section column. Section users see a student-branch table. Tables appear before the follow-up actions and dissolution risk segment. The summary table is labeled as vitality status. On the region table, each row shows sections, sections with SAC Chair, sections with SSR, student members, student branches, SBs with officers, SBs with counselor, reported events, good standing for the open cycle and the two completed cycles, and the immediate-action count. On the section table, each row omits the sections count and shows SAC Chair and SSR presence (`Yes` / `No`), followed by student members, student branches, SBs with officers, SBs with counselor, reported events, good standing, and immediate action. Foregone rebate is an extra column when approximate rebate information is shown. Good standing for each year is two columns: the number of branches, and the percent of branches in that row. Each column sorts on its own. Hovering a year heading names what that year counts toward good standing. The last row totals the listed rows. Its percent is the total branches in good standing divided by the total branches. The region table opens in name order, from 1 through 10. A section table opens with the most branches that are not in good standing. The section table can also be sorted by section name, and the branch table by school name. Selecting a summary row opens the next level. The branch table starts with school, SPOID, sheet status, and dissolution risk, then groups each rebate cycle's criteria right before that cycle's vitality status: for the open cycle, members now, reported events, unreported events, annual plan, ExCom officer count `(3/4)` with compliance and Chair indicators, counselor presence (`Yes` / `Missing` with recommendation notice), open-cycle vitality status, and the rebate outcome when approximate rebate information is shown; for each completed cycle, December snapshot members, reported events, annual plan, `Officers` marked `N/A` (since historical officer records are not in the CSV export), and that cycle's vitality status. The sheet's Vitality Status column is labeled as sheet status so it is not confused with the calculated standing. Its last row totals the listed branches.

Wide tables scroll sideways, and the school or unit name stays visible. Section and student-branch tables show up to 10 rows at a time and scroll vertically while keeping the column headers and the totals row visible. For performance on large files (e.g. full MGA exports of 3,900+ branches), section and student-branch tables window rendered rows beyond 40 items while preserving the 10-row scroll container, pinned headers, and pinned totals in `<tfoot>`. Typing in search uses deferred concurrent transitions so input responsiveness is maintained.

## Visual design

Follow [DESIGN.md](../DESIGN.md). IEEE Blue `#00629B` is the header. Dark Blue `#002855` is the primary text. Lora is for titles. Open Sans is for everything else. Standing uses a text label as well as color: green for good standing, a yellow chip with dark text for needs support, and red for inactive. Incomplete data is gray. Do not use yellow as text on white.

The layout is a desktop analytics page. Cards stack on a narrow viewport.

## Hosting

Repository: `ieee-students/sb-vitality`.

`.github/workflows/pages.yml` installs, tests, builds, and deploys to GitHub Pages on every push to `main`, and when the workflow is run by hand.

One setting is manual: in the repository, Pages source is **GitHub Actions**. The workflow cannot turn that on by itself.

Local development uses the same base path: `http://localhost:5173/sb-vitality/`.

## Sample data

`samples/sample-sb-vitality-report.csv` is fictional. It includes `R0` plus other regions, mixed standing, a blank events cell, unreported events, a branch at or above 50 members, and an immediate-action branch. Keep the `public/` copy identical.

## Version 1 acceptance

- A multi-region file opens an MGA view. A single-region file cannot open another region. A single-section file cannot open another section.
- `R0` displays as Region 10.
- Blank numeric cells do not become zero, and they do not become a failed year by themselves.
- The plan checkbox changes only the open cycle, including good standing, gaps, and branch rebate. Dissolution tiers stay put.
- Unreported events are visible and are not part of the event minimum.
- **Show approximate rebate information** defaults to off and is kept in this browser. While it is off, no dollar amounts are shown. While it is on, branch rebate and the section student portion are shown as different amounts.
- Reload keeps the file. A deep link reloads on that page. Remove local data returns to the three steps. A failed replacement keeps the previous file.
- The committed tree has no real officer emails.

## Roadmap

Do not build these until they are requested. Record them here so later work stays consistent.

- A configuration screen for the header map and the numbers in `src/config/defaults.ts`, including a later year's column layout. Until that screen exists, those values live in code.
- Copy the locally stored chair emails for branches that need a nudge. The addresses still never leave the browser.
- A worklist for unreported events.
- Compare two saved exports so a change in branch count is real.
- Track delinquency notices when those columns exist.
- A short cycle note for the 31 December membership lock and the published annual-plan deadline, using the published day rather than an assumed one.

## References

- [calculations.md](calculations.md)
- [DESIGN.md](../DESIGN.md)
- [MGA Operations Manual](https://mga.ieee.org/images/files/Current_MGA_Operations_Manual_2026_20_June_2026.pdf), geographic unit rebate allowances and student branch requirements
