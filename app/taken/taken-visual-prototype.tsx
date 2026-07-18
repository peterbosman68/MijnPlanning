"use client";

import { useState } from "react";

import styles from "./taken-visual-prototype.module.css";

type TaskStatus = "Open" | "Wachten" | "Afgerond";
type SubtaskStatus = TaskStatus | "Geblokkeerd";
type RiskLevel = "green" | "orange" | "red";

type SubtaskExample = {
  id: string;
  title: string;
  description: string;
  status: SubtaskStatus;
  deadline: string;
  estimate: string;
  dependency?: string;
  risk: {
    level: RiskLevel;
    label: "Op tijd" | "Kleine marge" | "Risico";
    explanation: string;
  };
};

type TaskExample = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  deadlineLabel: string | null;
  deadlineValue: string;
  estimate: string;
  personalAdvice: string;
  userChoice: string;
  completedCount: number;
  risk: {
    level: RiskLevel;
    label: "Op tijd" | "Kleine marge";
    explanation: string;
  };
  subtasks: readonly SubtaskExample[];
};

type DraftTask = {
  title: string;
  description: string;
  deadline: string;
  status: TaskStatus;
  userChoice: string;
};

// Tijdelijke, niet-gevoelige voorbeeldgegevens voor uitsluitend de O20-visuele proef.
// Deze gegevens komen niet uit Neon en worden nergens buiten lokale React-state opgeslagen.
const VISUAL_EXAMPLE_TASKS: readonly TaskExample[] = [
  {
    id: "truckparking-duiven",
    title: "Truckparking Duiven voorbereiden",
    description:
      "De technische stukken en offertes verzamelen zodat vrijdag een compleet besluit kan worden genomen.",
    status: "Open",
    deadlineLabel: "vr 24 juli 2026, 17:00",
    deadlineValue: "2026-07-24T17:00",
    estimate: "3 uur 35 min",
    personalAdvice: "4 uur 10 min",
    userChoice: "3 uur 40 min",
    completedCount: 1,
    risk: {
      level: "orange",
      label: "Kleine marge",
      explanation:
        "De gekozen duur ligt 30 minuten onder het persoonlijke advies.",
    },
    subtasks: [
      {
        id: "locatiegegevens",
        title: "Locatiegegevens controleren",
        description: "Maten, ontsluiting en netaansluiting zijn gecontroleerd.",
        status: "Afgerond",
        deadline: "ma 20 juli, 17:00",
        estimate: "35 min",
        risk: {
          level: "green",
          label: "Op tijd",
          explanation: "Afgerond met voldoende marge.",
        },
      },
      {
        id: "offerte-laadpalen",
        title: "Offerte laadpalen beoordelen",
        description: "Prijs, capaciteit en onderhoudsvoorwaarden vergelijken.",
        status: "Open",
        deadline: "di 21 juli, 16:00",
        estimate: "1 uur 20 min",
        risk: {
          level: "orange",
          label: "Kleine marge",
          explanation: "Nog ongeveer 45 minuten marge bij de gekozen duur.",
        },
      },
      {
        id: "vergunningstukken",
        title: "Vergunningstukken aanleveren",
        description: "Het dossier kan pas compleet worden gemaakt na de offertecontrole.",
        status: "Geblokkeerd",
        deadline: "wo 22 juli, 12:00",
        estimate: "1 uur 10 min",
        dependency: "Wacht op ‘Offerte laadpalen beoordelen’.",
        risk: {
          level: "red",
          label: "Risico",
          explanation:
            "Waarschijnlijk niet haalbaar zolang de voorganger niet is afgerond.",
        },
      },
      {
        id: "terugkoppeling-eigenaar",
        title: "Terugkoppeling aan eigenaar voorbereiden",
        description: "Kernpunten en open keuzes kort samenvatten.",
        status: "Wachten",
        deadline: "vr 24 juli, 15:00",
        estimate: "30 min",
        dependency: "Wacht op een prijsbevestiging van de leverancier.",
        risk: {
          level: "green",
          label: "Op tijd",
          explanation: "Voldoende marge zodra de prijsbevestiging binnen is.",
        },
      },
    ],
  },
  {
    id: "kwartaaladministratie",
    title: "Administratie tweede kwartaal afronden",
    description:
      "Ontbrekende stukken verzamelen en de administratie gereedmaken voor controle.",
    status: "Wachten",
    deadlineLabel: null,
    deadlineValue: "",
    estimate: "2 uur 15 min",
    personalAdvice: "2 uur 40 min",
    userChoice: "2 uur 30 min",
    completedCount: 0,
    risk: {
      level: "green",
      label: "Op tijd",
      explanation: "De hoofdtaak heeft geen eigen deadline.",
    },
    subtasks: [
      {
        id: "bankmutaties",
        title: "Bankmutaties controleren",
        description: "Afwijkende betalingen koppelen aan de juiste factuur.",
        status: "Open",
        deadline: "ma 27 juli, 17:00",
        estimate: "1 uur 25 min",
        risk: {
          level: "orange",
          label: "Kleine marge",
          explanation: "De beschikbare marge is kleiner dan één werkblok.",
        },
      },
      {
        id: "factuur-opvragen",
        title: "Ontbrekende factuur opvragen",
        description: "Leverancier heeft toegezegd vandaag te reageren.",
        status: "Wachten",
        deadline: "di 28 juli, 12:00",
        estimate: "50 min",
        risk: {
          level: "green",
          label: "Op tijd",
          explanation: "Nog voldoende marge na de verwachte reactie.",
        },
      },
    ],
  },
];

const statusClassNames: Record<SubtaskStatus, string> = {
  Open: styles.statusNeutral,
  Wachten: styles.statusWaiting,
  Afgerond: styles.statusComplete,
  Geblokkeerd: styles.statusBlocked,
};

const riskClassNames: Record<RiskLevel, string> = {
  green: styles.riskGreen,
  orange: styles.riskOrange,
  red: styles.riskRed,
};

function makeDraft(task: TaskExample): DraftTask {
  return {
    title: task.title,
    description: task.description,
    deadline: task.deadlineValue,
    status: task.status,
    userChoice: task.userChoice,
  };
}

function StatusLabel({ status }: Readonly<{ status: SubtaskStatus }>) {
  return (
    <span className={`${styles.statusLabel} ${statusClassNames[status]}`}>
      <span className={styles.statusDot} aria-hidden="true" />
      {status}
    </span>
  );
}

function RiskLabel({
  level,
  label,
}: Readonly<{ level: RiskLevel; label: string }>) {
  return (
    <span className={`${styles.riskLabel} ${riskClassNames[level]}`}>
      <span aria-hidden="true">{level === "red" ? "!" : level === "green" ? "✓" : "•"}</span>
      {label}
    </span>
  );
}

export function TakenVisualPrototype() {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    VISUAL_EXAMPLE_TASKS[0].id,
  );
  const [expandedTaskIds, setExpandedTaskIds] = useState<ReadonlySet<string>>(
    new Set([VISUAL_EXAMPLE_TASKS[0].id]),
  );
  const [detailExpanded, setDetailExpanded] = useState(true);
  const [draft, setDraft] = useState<DraftTask>(makeDraft(VISUAL_EXAMPLE_TASKS[0]));
  const [notice, setNotice] = useState<string | null>(null);

  const selectedTask =
    VISUAL_EXAMPLE_TASKS.find((task) => task.id === selectedTaskId) ??
    VISUAL_EXAMPLE_TASKS[0];

  function selectTask(task: TaskExample) {
    setSelectedTaskId(task.id);
    setDraft(makeDraft(task));
    setDetailExpanded(true);
    setNotice(null);
  }

  function toggleTaskSummary(taskId: string) {
    setExpandedTaskIds((current) => {
      const next = new Set(current);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }

  function saveLocally(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(
      "Proefwijziging lokaal verwerkt. Er is niets naar een database of API gestuurd.",
    );
  }

  return (
    <main className={styles.prototype}>
      <div className={styles.prototypeBar}>
        <div className={styles.prototypeBarInner}>
          <strong>MijnPlanning</strong>
          <span>Visuele proef · tijdelijke voorbeeldgegevens</span>
        </div>
      </div>

      <div className={styles.pageShell}>
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Werkoverzicht</p>
            <h1>Taken</h1>
            <p className={styles.pageIntro}>
              Bekijk hoofdtaken, subtaken, deadlines en tijdsadvies in één compact overzicht.
            </p>
          </div>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() =>
              setNotice(
                "‘Nieuwe taak’ is alleen zichtbaar voor de ontwerpbeoordeling en maakt nog niets aan.",
              )
            }
          >
            <span aria-hidden="true">+</span>
            Nieuwe taak
          </button>
        </header>

        <div className={styles.prototypeNotice} role="note">
          <strong>Alleen een visuele proef.</strong>
          <span>De gegevens hieronder zijn fictief en worden niet opgeslagen.</span>
        </div>

        {notice ? (
          <div className={styles.localNotice} role="status" aria-live="polite">
            {notice}
            <button type="button" onClick={() => setNotice(null)}>
              Sluiten
            </button>
          </div>
        ) : null}

        <div className={styles.workspace}>
          <section className={styles.taskListPanel} aria-labelledby="task-list-heading">
            <div className={styles.panelHeading}>
              <div>
                <h2 id="task-list-heading">Hoofdtaken</h2>
                <p>2 voorbeeldtaken</p>
              </div>
              <span className={styles.neutralCount}>2 open</span>
            </div>

            <div className={styles.taskList}>
              {VISUAL_EXAMPLE_TASKS.map((task) => {
                const selected = task.id === selectedTaskId;
                const expanded = expandedTaskIds.has(task.id);
                const summaryId = `${task.id}-summary`;

                return (
                  <article
                    className={`${styles.taskCard} ${selected ? styles.taskCardSelected : ""}`}
                    key={task.id}
                  >
                    <div className={styles.taskCardTop}>
                      <button
                        className={styles.taskSelectButton}
                        type="button"
                        onClick={() => selectTask(task)}
                        aria-current={selected ? "true" : undefined}
                      >
                        <span className={styles.taskTitle}>{task.title}</span>
                        <span className={styles.taskDeadline}>
                          {task.deadlineLabel ?? "Geen taakdeadline"}
                        </span>
                      </button>
                      <button
                        className={styles.iconButton}
                        type="button"
                        onClick={() => toggleTaskSummary(task.id)}
                        aria-expanded={expanded}
                        aria-controls={summaryId}
                        aria-label={`${expanded ? "Inklappen" : "Uitklappen"}: ${task.title}`}
                      >
                        <span aria-hidden="true">{expanded ? "−" : "+"}</span>
                      </button>
                    </div>

                    <div className={styles.taskCardLabels}>
                      <StatusLabel status={task.status} />
                      <RiskLabel level={task.risk.level} label={task.risk.label} />
                    </div>

                    {expanded ? (
                      <div className={styles.taskSummary} id={summaryId}>
                        <p>{task.description}</p>
                        <dl>
                          <div>
                            <dt>Subtaken</dt>
                            <dd>
                              {task.completedCount} van {task.subtasks.length} afgerond
                            </dd>
                          </div>
                          <div>
                            <dt>Resterend</dt>
                            <dd>{task.userChoice}</dd>
                          </div>
                        </dl>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>

          <section className={styles.detailPanel} aria-labelledby="task-detail-heading">
            <div className={styles.detailHeading}>
              <div>
                <p className={styles.panelKicker}>Geselecteerde hoofdtaak</p>
                <h2 id="task-detail-heading">{selectedTask.title}</h2>
                <div className={styles.detailLabels}>
                  <StatusLabel status={selectedTask.status} />
                  <RiskLabel
                    level={selectedTask.risk.level}
                    label={selectedTask.risk.label}
                  />
                </div>
              </div>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => setDetailExpanded((current) => !current)}
                aria-expanded={detailExpanded}
                aria-controls="selected-task-detail"
              >
                {detailExpanded ? "Inklappen" : "Uitklappen"}
              </button>
            </div>

            {detailExpanded ? (
              <div id="selected-task-detail">
                <p className={styles.taskDescription}>{selectedTask.description}</p>

                <div className={styles.factGrid}>
                  <div>
                    <span>Taakdeadline</span>
                    <strong>{selectedTask.deadlineLabel ?? "Geen taakdeadline"}</strong>
                  </div>
                  <div>
                    <span>Algemene inschatting</span>
                    <strong>{selectedTask.estimate}</strong>
                  </div>
                  <div className={styles.adviceFact}>
                    <span>Persoonlijk advies</span>
                    <strong>{selectedTask.personalAdvice}</strong>
                  </div>
                  <div>
                    <span>Jouw keuze</span>
                    <strong>{selectedTask.userChoice}</strong>
                  </div>
                </div>

                <div
                  className={`${styles.riskExplanation} ${riskClassNames[selectedTask.risk.level]}`}
                  role="note"
                >
                  <strong>{selectedTask.risk.label}</strong>
                  <span>{selectedTask.risk.explanation}</span>
                </div>

                <section className={styles.subtaskSection} aria-labelledby="subtask-heading">
                  <div className={styles.sectionHeading}>
                    <div>
                      <h3 id="subtask-heading">Subtaken</h3>
                      <p>Iedere subtaak heeft een verplichte deadline.</p>
                    </div>
                    <span className={styles.neutralCount}>
                      {selectedTask.subtasks.length} subtaken
                    </span>
                  </div>

                  <div className={styles.subtaskList}>
                    {selectedTask.subtasks.map((subtask) => (
                      <article className={styles.subtaskRow} key={subtask.id}>
                        <div className={styles.subtaskMarker} aria-hidden="true" />
                        <div className={styles.subtaskMain}>
                          <div className={styles.subtaskTitleRow}>
                            <h4>{subtask.title}</h4>
                            <div className={styles.subtaskLabels}>
                              <StatusLabel status={subtask.status} />
                              <RiskLabel
                                level={subtask.risk.level}
                                label={subtask.risk.label}
                              />
                            </div>
                          </div>
                          <p>{subtask.description}</p>
                          {subtask.dependency ? (
                            <p className={styles.dependencyLine}>
                              <span aria-hidden="true">↳</span> {subtask.dependency}
                            </p>
                          ) : null}
                          <div className={styles.subtaskMeta}>
                            <span>
                              <strong>Deadline:</strong> {subtask.deadline}
                            </span>
                            <span>
                              <strong>Inschatting:</strong> {subtask.estimate}
                            </span>
                          </div>
                          <p
                            className={`${styles.deadlineReason} ${riskClassNames[subtask.risk.level]}`}
                          >
                            {subtask.risk.explanation}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className={styles.formSection} aria-labelledby="edit-heading">
                  <div className={styles.sectionHeading}>
                    <div>
                      <h3 id="edit-heading">Hoofdtaak bewerken</h3>
                      <p>Voorbeeldformulier — wijzigingen blijven alleen lokaal zichtbaar.</p>
                    </div>
                  </div>

                  <form className={styles.taskForm} onSubmit={saveLocally}>
                    <div className={styles.fieldFull}>
                      <label htmlFor="task-title">Titel</label>
                      <input
                        id="task-title"
                        type="text"
                        value={draft.title}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, title: event.target.value }))
                        }
                      />
                    </div>

                    <div className={styles.fieldFull}>
                      <label htmlFor="task-description">Korte omschrijving</label>
                      <textarea
                        id="task-description"
                        rows={3}
                        value={draft.description}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className={styles.field}>
                      <label htmlFor="task-deadline">Taakdeadline (optioneel)</label>
                      <input
                        id="task-deadline"
                        type="datetime-local"
                        value={draft.deadline}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, deadline: event.target.value }))
                        }
                      />
                      <span className={styles.helpText}>Tijdzone: Europe/Amsterdam</span>
                    </div>

                    <div className={styles.field}>
                      <label htmlFor="task-status">Status</label>
                      <select
                        id="task-status"
                        value={draft.status}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            status: event.target.value as TaskStatus,
                          }))
                        }
                      >
                        <option>Open</option>
                        <option>Wachten</option>
                        <option>Afgerond</option>
                      </select>
                      <span className={styles.helpText}>
                        Geblokkeerd wordt afgeleid en is niet handmatig instelbaar.
                      </span>
                    </div>

                    <div className={styles.field}>
                      <label htmlFor="user-duration">Jouw gekozen tijd</label>
                      <input
                        id="user-duration"
                        type="text"
                        value={draft.userChoice}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            userChoice: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className={`${styles.field} ${styles.errorExample}`}>
                      <label htmlFor="subtask-deadline-example">
                        Voorbeeld foutweergave
                      </label>
                      <input
                        id="subtask-deadline-example"
                        type="text"
                        value="za 25 juli 2026, 12:00"
                        readOnly
                        aria-invalid="true"
                        aria-describedby="deadline-example-error"
                      />
                      <span id="deadline-example-error" className={styles.errorText}>
                        De subtaakdeadline mag niet na de taakdeadline liggen.
                      </span>
                    </div>

                    <div className={styles.formActions}>
                      <button
                        className={styles.secondaryButton}
                        type="button"
                        onClick={() => {
                          setDraft(makeDraft(selectedTask));
                          setNotice("Lokale formulierwijzigingen zijn teruggezet.");
                        }}
                      >
                        Annuleren
                      </button>
                      <button className={styles.primaryButton} type="submit">
                        Opslaan
                      </button>
                    </div>
                  </form>
                </section>
              </div>
            ) : (
              <p className={styles.collapsedMessage}>
                Het taakdetail is ingeklapt. Gebruik ‘Uitklappen’ om het opnieuw te tonen.
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
