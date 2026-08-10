"use client";

import { useState } from "react";

import styles from "./todo-import-preview.module.css";

type ImportResult = Readonly<{
  batchId: string;
  listsCount: number;
  fetchedCount: number;
  importedCount: number;
  skippedCount: number;
}>;

export function TodoImportAction({
  importableCount,
  manualFileTaskCount,
}: {
  importableCount: number;
  manualFileTaskCount: number;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function executeImport() {
    if (!confirmed || pending || result) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/todo/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmOneTimeImport: true }),
      });
      const payload = (await response.json()) as ImportResult | { error?: string };

      if (!response.ok) {
        throw new Error("error" in payload && payload.error ? payload.error : "De To Do-import is mislukt.");
      }

      setResult(payload as ImportResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "De To Do-import is mislukt.");
    } finally {
      setPending(false);
    }
  }

  if (result) {
    return (
      <div className={styles.importResult} role="status">
        <strong>Import voltooid</strong>
        <span>{result.importedCount} hoofdtaken geïmporteerd</span>
        <span>{result.skippedCount} reeds bekende taken overgeslagen</span>
        <small>Batch {result.batchId}</small>
      </div>
    );
  }

  return (
    <div className={styles.importConfirmation}>
      <label className={styles.confirmationLabel}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          disabled={pending || importableCount === 0}
        />
        <span>
          Ik bevestig dat alle To Do-lijsten, inclusief open en afgeronde taken, éénmalig als hoofdtaken worden gekopieerd.
          Bestaande MijnPlanning-taken blijven behouden. Documentbijlagen van {manualFileTaskCount} taken worden niet
          gekopieerd en voeg ik later handmatig toe.
        </span>
      </label>
      <button
        className={styles.importButton}
        type="button"
        onClick={executeImport}
        disabled={!confirmed || pending || importableCount === 0}
      >
        {pending ? "Importeren…" : importableCount === 0 ? "Niets nieuws te importeren" : `${importableCount} hoofdtaken importeren`}
      </button>
      {error && <p className={styles.importError} role="alert">{error}</p>}
    </div>
  );
}
