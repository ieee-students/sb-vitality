# Student Branch Vitality Analytics

A browser-only view of an IEEE Student Branch vitality export. Drop in the CSV from your Smartsheet dynamic view and see membership, reported events, good standing, dissolution risk, and rebate estimates for the regions or sections in that file.

The published site is [https://ieee-students.github.io/sb-vitality/](https://ieee-students.github.io/sb-vitality/).

## Privacy

The file is read on your device and stored in this browser. It is not uploaded. GitHub Pages serves the application only.

Officer exports contain personal email addresses. Do not commit them. Files matching `*Vitality Report*.csv` are gitignored. The sample in this repository is fictional.

## Use the site

1. Open the [Student Branch Vitality Dashboard](https://app.smartsheet.com/b/publish?EQBCT=d178a832bd6042259336792c9175f706) and launch the Smartsheet Dynamic View for your IEEE volunteer role. Smartsheet automatically filters the rows you can access.
2. Download the view as CSV.
3. Drop the file on the site. You can also load the fictional sample to see the layout first.

An MGA file can open any region and then a section. A region file can open its own sections. A section file stays on that section. The scope bar under the header is the way back. `R0` in an export is Region 10.

**Update data** chooses a newer export. The current file stays in use if the new file cannot be read. **Remove local data** deletes the browser copy.

The annual-plan checkbox judges the open cycle on members and reported events while the plan is still not due. Completed years still require their plan. Dissolution risk never uses the plan.

Calculations and the rebate allowances are documented in [docs/calculations.md](docs/calculations.md). The product requirements are in [docs/PRD.md](docs/PRD.md).

## Develop

Requires Node.js 22 or newer.

```bash
npm ci
npm test
npm run dev
```

Open [http://localhost:5173/sb-vitality/](http://localhost:5173/sb-vitality/). The `/sb-vitality/` prefix matches the GitHub Pages project URL.

```bash
npm run build
npm run preview
```

`samples/sample-sb-vitality-report.csv` is the fixture used by tests. `public/sample-sb-vitality-report.csv` is the copy the site serves. Keep them identical.

## GitHub Pages

Workflow: `.github/workflows/pages.yml`. It runs tests, builds, and deploys on a push to `main`.

In the `ieee-students/sb-vitality` repository settings, set Pages to deploy from **GitHub Actions**. The workflow does not change that setting.
