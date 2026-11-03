import { useRef, useState, type DragEvent } from "react";

function isCsv(file: File): boolean {
  return file.name.toLowerCase().endsWith(".csv") || file.type.includes("csv");
}

export function FileDrop({
  busy,
  onFile,
}: {
  busy: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function take(file: File | undefined) {
    if (!file) return;
    if (!isCsv(file)) {
      setLocalError("Choose a CSV export.");
      return;
    }
    setLocalError(null);
    onFile(file);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setOver(false);
    take(event.dataTransfer.files[0]);
  }

  return (
    <div
      className={over ? "dropzone over" : "dropzone"}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      <p className="drop-title">Drop the vitality CSV here</p>
      <p>or choose the file you downloaded from Smartsheet.</p>
      <button
        type="button"
        className="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Reading…" : "Choose CSV"}
      </button>
      <input
        ref={inputRef}
        className="file-input"
        type="file"
        accept=".csv,text/csv"
        aria-label="Vitality CSV"
        onChange={(event) => {
          take(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {localError ? (
        <p className="form-error" role="alert">
          {localError}
        </p>
      ) : null}
    </div>
  );
}
