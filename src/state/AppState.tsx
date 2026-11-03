import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CsvFormatError } from "../domain/errors";
import { parseVitalityCsv } from "../domain/parseCsv";
import type { Workbook } from "../domain/types";
import { deleteStoredFile, loadStoredFile, saveStoredFile, type StoredFile } from "../storage/dataset";
import {
  readIgnoreAnnualPlan,
  readShowRebate,
  writeIgnoreAnnualPlan,
  writeShowRebate,
} from "../storage/preferences";

type Status = "loading" | "ready" | "empty";

interface AppStateValue {
  status: Status;
  stored: StoredFile | null;
  model: Workbook | null;
  error: string | null;
  memoryOnly: boolean;
  ignoreAnnualPlan: boolean;
  setIgnoreAnnualPlan: (value: boolean) => void;
  showRebate: boolean;
  setShowRebate: (value: boolean) => void;
  replaceCsv: (csv: string, fileName: string) => Promise<boolean>;
  remove: () => Promise<void>;
  clearError: () => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

function errorMessage(error: unknown): string {
  if (error instanceof CsvFormatError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return "That file could not be read.";
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [stored, setStored] = useState<StoredFile | null>(null);
  const [model, setModel] = useState<Workbook | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [memoryOnly, setMemoryOnly] = useState(false);
  const [ignoreAnnualPlan, setIgnoreState] = useState(readIgnoreAnnualPlan);
  const [showRebate, setShowRebateState] = useState(readShowRebate);

  useEffect(() => {
    let cancelled = false;
    loadStoredFile()
      .then((file) => {
        if (cancelled) return;
        if (!file) {
          setStatus("empty");
          return;
        }
        try {
          setModel(parseVitalityCsv(file.csv));
          setStored(file);
          setStatus("ready");
        } catch (loadError) {
          setStored(file);
          setError(errorMessage(loadError));
          setStatus("empty");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("empty");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setIgnoreAnnualPlan = useCallback((value: boolean) => {
    setIgnoreState(value);
    writeIgnoreAnnualPlan(value);
  }, []);

  const setShowRebate = useCallback((value: boolean) => {
    setShowRebateState(value);
    writeShowRebate(value);
  }, []);

  const replaceCsv = useCallback(async (csv: string, fileName: string) => {
    let parsed: Workbook;
    try {
      parsed = parseVitalityCsv(csv);
    } catch (parseError) {
      setError(errorMessage(parseError));
      return false;
    }

    const next: StoredFile = {
      csv,
      fileName,
      importedAt: new Date().toISOString(),
    };
    try {
      await saveStoredFile(next);
      setMemoryOnly(false);
    } catch {
      setMemoryOnly(true);
    }
    setStored(next);
    setModel(parsed);
    setError(null);
    setStatus("ready");
    return true;
  }, []);

  const remove = useCallback(async () => {
    try {
      await deleteStoredFile();
    } catch {
      // The in-memory copy is still cleared so the page returns to the three steps.
    }
    setStored(null);
    setModel(null);
    setMemoryOnly(false);
    setError(null);
    setStatus("empty");
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AppStateValue>(
    () => ({
      status,
      stored,
      model,
      error,
      memoryOnly,
      ignoreAnnualPlan,
      setIgnoreAnnualPlan,
      showRebate,
      setShowRebate,
      replaceCsv,
      remove,
      clearError,
    }),
    [
      status,
      stored,
      model,
      error,
      memoryOnly,
      ignoreAnnualPlan,
      setIgnoreAnnualPlan,
      showRebate,
      setShowRebate,
      replaceCsv,
      remove,
      clearError,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("useAppState must be used inside AppStateProvider.");
  return value;
}
