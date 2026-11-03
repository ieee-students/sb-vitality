import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppState } from "../state/AppState";

function isCsv(file: File): boolean {
  return file.name.toLowerCase().endsWith(".csv") || file.type.includes("csv");
}

export function Header() {
  const { model, replaceCsv, remove, clearError } = useAppState();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);

  const isExportPage = pathname === "/how-to-export";

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!isCsv(file)) return;
    setBusy(true);
    clearError();
    try {
      const csv = await file.text();
      await replaceCsv(csv, file.name);
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    dialogRef.current?.close();
    await remove();
    navigate("/");
  }

  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          <Link to="/" className="brand-group">
            <span className="brand-text">SB Vitality</span>
            <span className="brand-separator" aria-hidden="true">
              ×
            </span>
            <img
              src={`${import.meta.env.BASE_URL}ieee-students.png`}
              alt="IEEE Students"
              width={201}
              height={81}
              className="brand-logo"
            />
          </Link>
          <div className="header-controls">
            <nav className="header-nav" aria-label="Primary">
              <Link
                className={isExportPage ? "nav-link" : "nav-link active"}
                to="/"
                aria-current={isExportPage ? undefined : "page"}
              >
                Home
              </Link>
              <Link
                className={isExportPage ? "nav-link active" : "nav-link"}
                to="/how-to-export"
                aria-current={isExportPage ? "page" : undefined}
              >
                How to export
              </Link>
            </nav>
            {model ? (
              <div className="header-actions">
                <button
                  type="button"
                  className="button button-secondary button-compact"
                  disabled={busy}
                  onClick={() => inputRef.current?.click()}
                >
                  {busy ? "Reading…" : "Update data"}
                </button>
                <input
                  ref={inputRef}
                  className="file-input"
                  type="file"
                  accept=".csv,text/csv"
                  aria-label="Replacement vitality CSV"
                  onChange={(event) => {
                    void onFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                <button
                  type="button"
                  className="button button-quiet button-compact"
                  onClick={() => dialogRef.current?.showModal()}
                >
                  Remove local data
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <dialog ref={dialogRef} className="confirm" aria-labelledby="remove-data-title">
        <h2 id="remove-data-title">Remove the file from this browser?</h2>
        <p>This deletes the CSV stored on this device. Nothing is removed from Smartsheet.</p>
        <div className="confirm-actions">
          <button type="button" className="button button-danger" onClick={() => void confirmRemove()}>
            Remove local data
          </button>
          <button type="button" className="button button-secondary" onClick={() => dialogRef.current?.close()}>
            Cancel
          </button>
        </div>
      </dialog>
    </>
  );
}
