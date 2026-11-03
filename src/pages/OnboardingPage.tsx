import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExportSteps } from "../components/ExportSteps";
import { FileDrop } from "../components/FileDrop";
import { useAppState } from "../state/AppState";

export function OnboardingPage() {
  const { replaceCsv, error, clearError } = useAppState();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function accept(csv: string, fileName: string) {
    setBusy(true);
    clearError();
    setLocalError(null);
    try {
      const ok = await replaceCsv(csv, fileName);
      if (ok) navigate("/");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File) {
    const csv = await file.text();
    await accept(csv, file.name);
  }

  async function loadSample() {
    setBusy(true);
    clearError();
    setLocalError(null);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}sample-sb-vitality-report.csv`);
      if (!response.ok) throw new Error("The sample file could not be loaded.");
      const csv = await response.text();
      const ok = await replaceCsv(csv, "sample-sb-vitality-report.csv");
      if (ok) navigate("/");
    } catch (loadError) {
      setLocalError(loadError instanceof Error ? loadError.message : "The sample file could not be loaded.");
    } finally {
      setBusy(false);
    }
  }

  const message = localError ?? error;

  return (
    <div className="page">
      <div className="page-intro">
        <h1>Explore Student Branch vitality analytics</h1>
        <p>
          Turn your Smartsheet vitality export into an interactive overview of membership trends, reported
          events, good standing, dissolution risk, and rebates. Section, region, and MGA volunteers all use
          the same tool, and the rows in your CSV determine what you can view and drill into.
        </p>
      </div>
      <div className="onboard-grid">
        <ExportSteps />
        <div>
          <aside className="privacy-callout">
            <h2>Your file stays on this device</h2>
            <p>
              No sign-in is required and your CSV is never uploaded to any server. Everything is calculated
              locally and saved in browser storage so your analytics reopen automatically next time. Click{" "}
              <strong>Remove local data</strong> when you finish, especially on a shared computer.
            </p>
          </aside>
          <FileDrop busy={busy} onFile={(file) => void onFile(file)} />
          <button type="button" className="button button-secondary sample-button" disabled={busy} onClick={() => void loadSample()}>
            Load fictional sample
          </button>
          <p className="sample-note">
            Want to preview the dashboard first? Load a sample report with fictional universities and
            placeholder data.
          </p>
          {message ? (
            <p className="form-error" role="alert">
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
