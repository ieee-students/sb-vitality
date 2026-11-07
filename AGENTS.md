# Agent guide

This repository is a login-free Student Branch Vitality analytics site. The CSV never leaves the browser. GitHub Pages only hosts the static app.

## Read before changing behavior

- Product behavior: `docs/PRD.md`
- Formulas: `docs/calculations.md`
- Thresholds, dollar amounts, and header patterns: `src/config/defaults.ts`
- Implementation of those rules: `src/domain/`
- Brand: `DESIGN.md`

`INTENT.md` is a pointer, not the spec. If an older note disagrees with `docs/calculations.md`, follow `docs/calculations.md`.

When a formula changes, update the calculations document, `src/domain/`, and the Vitest tests in the same change.

## Privacy

- Do not commit officer exports, personal email addresses, or rows copied from a real vitality report.
- `MGA SAC SB Vitality Report.csv` is gitignored. Leave it on disk if it is present. Do not read it into sample data, docs, or screenshots.
- The public fixture is `samples/sample-sb-vitality-report.csv`. The site loads the identical file from `public/`. Keep both copies the same. Addresses in that file stay on `@example.com`.
- Region and section views display the related region or section officer emails from the local CSV (with comma-separated clipboard copy); student-branch officer and counselor emails stay in the parsed model and are not rendered.
- Do not add a backend, telemetry, or a font request to a third party.

## Product rules that are easy to break

- `R0` is Region 10. Routes use `/r10`.
- Blank cells are missing, not zero.
- Unreported events are displayed and are not part of the 4-event minimum.
- The annual-plan checkbox changes only the open cycle. Dissolution risk ignores the plan.
- Branch rebate and the section's $3 student portion are different amounts. Do not add them together.
- The Vite base is `/sb-vitality/` in dev and production. Use `import.meta.env.BASE_URL` for assets. Router paths omit that prefix.
- Deep links depend on the script in `index.html` and on `public/404.html`.
- Section search and student-branch search are independent inputs and filter only their respective tables.
- Tables with >40 rows use row virtualization (`useVirtualRows`) for DOM performance so full MGA exports (3,900+ rows) render smoothly without main-thread freezes.

## Commands

```bash
npm ci
npm test
npm run dev
```

Local site: `http://localhost:5173/sb-vitality/`.

`npm run build` typechecks and writes `dist/`. Pushes to `main` run `.github/workflows/pages.yml`. Publishing also requires the repo Pages source to be GitHub Actions.
