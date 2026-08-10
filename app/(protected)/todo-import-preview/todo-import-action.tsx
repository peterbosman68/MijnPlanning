"use client";

import { useDeferredValue, useState } from "react";

import styles from "./todo-import-preview.module.css";

type ImportResult = Readonly<{
  batchId: string;
  listsCount: number;
  fetchedCount: number;
  importedCount: number;
  skippedCount: number;
}>;

type ImportableItem = Readonly<{
  sourceExternalId: string;
  title: string;
  listDisplayName: string;
  status: string;
  requiresManualFileTransfer: boolean;
}>;

export function TodoImportAction({
  items,
}: {
  items: ImportableItem[];
}) {
  const [selectedIds, setSelectedIds] = useState(() => new Set(items.map((item) => item.sourceExternalId)));
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery.trim().toLocaleLowerCase("nl"));
  const filteredItems = deferredSearchQuery
    ? items.filter((item) =>
        `${item.title} ${item.listDisplayName}`.toLocaleLowerCase("nl").includes(deferredSearchQuery),
      )
    : items;
  const selectedCount = selectedIds.size;
  const selectedOpenCount = items.filter(
    (item) => selectedIds.has(item.sourceExternalId) && item.status !== "COMPLETED",
  ).length;
  const selectedCompletedCount = selectedCount - selectedOpenCount;
  const selectedManualFileTitles = items.filter(
    (item) => selectedIds.has(item.sourceExternalId) && item.requiresManualFileTransfer,
  ).map((item) => item.title);

  function setItemSelected(sourceExternalId: string, selected: boolean) {
    setConfirmed(false);
    setSelectedIds((current) => {
      const next = new Set(current);
      if (selected) next.add(sourceExternalId);
      else next.delete(sourceExternalId);
      return next;
    });
  }

  function selectAll() {
    setConfirmed(false);
    setSelectedIds(new Set(items.map((item) => item.sourceExternalId)));
  }

  function clearSelection() {
    setConfirmed(false);
    setSelectedIds(new Set());
  }

  async function executeImport() {
    if (!confirmed || pending || result || selectedCount === 0) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/todo/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmOneTimeImport: true,
          selectedSourceExternalIds: Array.from(selectedIds),
        }),
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
      <section className={styles.contentGrid}>
        <article className={styles.panel}>
          <div className={styles.importResult} role="status">
            <strong>Import voltooid</strong>
            <span>{result.importedCount} hoofdtaken geïmporteerd</span>
            <span>{result.skippedCount} niet geïmporteerd of reeds bekend</span>
            <small>Batch {result.batchId}</small>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className={styles.contentGrid}>
      <article className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelEyebrow}>Taakselectie</p>
            <h2 className={styles.panelTitle}>Controleer alle importtaken</h2>
          </div>
          <span className={styles.panelMeta}>{selectedCount} van {items.length} geselecteerd</span>
        </div>

        <p className={styles.selectionSummary} aria-live="polite">
          {selectedOpenCount} open · {selectedCompletedCount} afgerond
        </p>

        <label className={styles.searchLabel}>
          <span>Zoek op taak of lijst</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Bijvoorbeeld sd"
          />
        </label>

        <div className={styles.selectionActions}>
          <button type="button" onClick={selectAll} disabled={pending || selectedCount === items.length}>
            Alles selecteren
          </button>
          <button type="button" onClick={clearSelection} disabled={pending || selectedCount === 0}>
            Alles uitsluiten
          </button>
        </div>

        {filteredItems.length > 0 ? (
          <ul className={styles.selectionList} aria-label="Importeerbare To Do-taken">
            {filteredItems.map((item) => (
              <li key={item.sourceExternalId} className={styles.selectionItem}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.sourceExternalId)}
                    onChange={(event) => setItemSelected(item.sourceExternalId, event.target.checked)}
                    disabled={pending}
                  />
                  <span className={styles.selectionText}>
                    <strong>{item.title}</strong>
                    <small>
                      {item.listDisplayName} · {item.status === "COMPLETED" ? "Afgerond" : "Open"}
                      {item.requiresManualFileTransfer ? " · Document handmatig" : ""}
                    </small>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyState}>Geen taken gevonden voor deze zoekopdracht.</p>
        )}
      </article>

      <article className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelEyebrow}>Volgende stap</p>
            <h2 className={styles.panelTitle}>Import bevestigen</h2>
          </div>
        </div>
        <ol className={styles.stepList}>
          <li>Schakel taken uit die niet naar MijnPlanning mogen.</li>
          <li>De geselecteerde To Do-taken worden hoofdtaken in MijnPlanning.</li>
          <li>Documentbijlagen worden niet geïmporteerd en moeten later handmatig worden toegevoegd.</li>
          <li>Bestaande MijnPlanning-taken blijven behouden.</li>
        </ol>
        {selectedManualFileTitles.length > 0 && (
          <p className={styles.note}>Handmatige documenten: {selectedManualFileTitles.join(", ")}.</p>
        )}
        <p className={styles.note}>
          To Do wordt alleen gelezen. De originele taken blijven staan; er is geen blijvende synchronisatie.
        </p>
        <div className={styles.importConfirmation}>
          <label className={styles.confirmationLabel}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              disabled={pending || selectedCount === 0}
            />
            <span>
              Ik bevestig dat de {selectedCount} geselecteerde taken éénmalig worden gekopieerd. Documentbijlagen van
              {" "}{selectedManualFileTitles.length} geselecteerde taken voeg ik later handmatig toe.
            </span>
          </label>
          <button
            className={styles.importButton}
            type="button"
            onClick={executeImport}
            disabled={!confirmed || pending || selectedCount === 0}
          >
            {pending
              ? "Importeren…"
              : selectedCount === 0
                ? "Selecteer minimaal één taak"
                : `${selectedCount} hoofdtaken importeren`}
          </button>
          {error && <p className={styles.importError} role="alert">{error}</p>}
        </div>
      </article>
    </section>
  );
}
