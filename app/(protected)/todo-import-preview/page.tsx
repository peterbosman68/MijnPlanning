import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/require-user";
import {
  MicrosoftTodoConfigError,
  MicrosoftTodoRequestError,
  previewTodoImport,
} from "@/lib/microsoft/todo-import";

import styles from "./todo-import-preview.module.css";
import { TodoImportAction } from "./todo-import-action";

export const metadata: Metadata = {
  title: "To Do-importpreview | MijnPlanning",
  description: "Voorvertoning van een eenmalige Microsoft To Do-import.",
};

export const dynamic = "force-dynamic";

function formatErrorMessage(error: unknown) {
  if (error instanceof MicrosoftTodoConfigError || error instanceof MicrosoftTodoRequestError) {
    return error.message;
  }

  return "To Do-preview ophalen mislukt.";
}

export default async function TodoImportPreviewPage() {
  const session = await requireUser();

  let preview = null as Awaited<ReturnType<typeof previewTodoImport>> | null;
  let errorMessage: string | null = null;

  try {
    preview = await previewTodoImport(session.user.id);
  } catch (error) {
    errorMessage = formatErrorMessage(error);
  }

  if (preview) {
    return (
      <main className={styles.page}>
        <section className={styles.shell}>
          <header className={styles.hero}>
            <div>
              <p className={styles.kicker}>Tijdelijke importpreview</p>
              <h1 className={styles.title}>Microsoft To Do</h1>
              <p className={styles.lead}>
                Dit overzicht toont wat er uit To Do beschikbaar is voor een eenmalige kopie naar MijnPlanning.
              </p>
            </div>
            <div className={styles.heroActions}>
              <a className={styles.primaryAction} href="/taken">
                Terug naar Taken
              </a>
              <a className={styles.secondaryAction} href="/api/todo/import/preview" target="_blank" rel="noreferrer">
                Ruwe preview
              </a>
            </div>
          </header>

          <section className={styles.summaryGrid} aria-label="Preview samenvatting">
            <article className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Lijsten</span>
              <strong className={styles.summaryValue}>{preview.listsCount}</strong>
            </article>
            <article className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Taken gevonden</span>
              <strong className={styles.summaryValue}>{preview.tasksCount}</strong>
            </article>
            <article className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Importeerbaar</span>
              <strong className={styles.summaryValue}>{preview.importableCount}</strong>
            </article>
            <article className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Documenttaken handmatig</span>
              <strong className={styles.summaryValue}>{preview.manualFileTaskCount}</strong>
            </article>
            <article className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Links</span>
              <strong className={styles.summaryValue}>{preview.linkCount}</strong>
            </article>
          </section>

          <TodoImportAction
            items={preview.importableItems}
          />
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.hero}>
          <div>
            <p className={styles.kicker}>Tijdelijke importpreview</p>
            <h1 className={styles.title}>Microsoft To Do</h1>
            <p className={styles.lead}>De koppeling is nog niet bruikbaar voor de preview.</p>
          </div>
          <div className={styles.heroActions}>
            <a className={styles.primaryAction} href="/taken">
              Terug naar Taken
            </a>
            <a className={styles.secondaryAction} href="/api/auth/microsoft/connect">
              Koppel Microsoft opnieuw
            </a>
          </div>
        </header>

        <section className={styles.panel}>
          <p className={styles.errorLabel}>Preview-fout</p>
          <p className={styles.errorMessage}>{errorMessage}</p>
          <p className={styles.note}>
            Na opnieuw koppelen kun je deze pagina opnieuw openen om de kopie te controleren.
          </p>
        </section>
      </section>
    </main>
  );
}
