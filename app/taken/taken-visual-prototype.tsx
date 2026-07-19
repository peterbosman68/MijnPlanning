"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import styles from "./taken-visual-prototype.module.css";

type TaskStatus = "open" | "waiting" | "completed";
type SubtaskStatus = "open" | "waiting" | "blocked" | "completed";
type RiskLevel = "none" | "green" | "orange" | "red";

type SubtaskExample = {
  id: string;
  title: string;
  status: SubtaskStatus;
  deadline: string;
  estimatedMinutes: number | null;
  remainingMinutes: number;
  risk: RiskLevel;
  riskExplanation?: string;
  dependency?: string;
  timerRunning?: boolean;
};

type TaskExample = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  deadline: string | null;
  ownRemainingMinutes: number;
  generalEstimate: string;
  personalAdvice: string;
  userChoice: string;
  risk: RiskLevel;
  riskExplanation?: string;
  subtasks: SubtaskExample[];
};

type SubtaskDraft = {
  title: string;
  deadline: string;
  durationMinutes: string;
};

type SubtaskErrors = Partial<Record<keyof SubtaskDraft, string>>;

const EMPTY_SUBTASK_DRAFT: SubtaskDraft = {
  title: "",
  deadline: "",
  durationMinutes: "45",
};

// Uitsluitend fictieve O20-voorbeelddata. Alles blijft in lokale React-state.
// Er is geen API-koppeling, Neon-write of tijdelijk productiedatamodel.
const VISUAL_EXAMPLE_TASKS: readonly TaskExample[] = [
  {
    id: "truckparking-duiven",
    title: "Truckparking Duiven voorbereiden",
    description:
      "De technische stukken en offertes verzamelen zodat vrijdag een compleet besluit kan worden genomen.",
    status: "open",
    deadline: "2026-07-24T17:00",
    ownRemainingMinutes: 220,
    generalEstimate: "3 uur 35 min",
    personalAdvice: "4 uur 10 min",
    userChoice: "3 uur 40 min",
    risk: "orange",
    riskExplanation: "De gekozen duur ligt 30 minuten onder het persoonlijke advies.",
    subtasks: [
      {
        id: "locatiegegevens",
        title: "Locatiegegevens controleren",
        status: "completed",
        deadline: "2026-07-20T17:00",
        estimatedMinutes: 35,
        remainingMinutes: 0,
        risk: "green",
      },
      {
        id: "offerte-laadpalen",
        title: "Offerte laadpalen beoordelen",
        status: "open",
        deadline: "2026-07-21T16:00",
        estimatedMinutes: 80,
        remainingMinutes: 45,
        risk: "orange",
        riskExplanation: "Nog ongeveer 45 minuten marge bij de gekozen duur.",
        timerRunning: true,
      },
      {
        id: "vergunningsstukken",
        title: "Vergunningsstukken aanleveren",
        status: "blocked",
        deadline: "2026-07-22T12:00",
        estimatedMinutes: 70,
        remainingMinutes: 70,
        risk: "red",
        riskExplanation: "Waarschijnlijk niet haalbaar zolang de offertecontrole openstaat.",
        dependency: "Wacht op Offerte laadpalen beoordelen",
      },
      {
        id: "terugkoppeling-eigenaar",
        title: "Terugkoppeling aan eigenaar voorbereiden",
        status: "waiting",
        deadline: "2026-07-24T15:00",
        estimatedMinutes: 30,
        remainingMinutes: 30,
        risk: "none",
        dependency: "Wacht op prijsbevestiging van leverancier",
      },
    ],
  },
  {
    id: "administratie-kwartaal",
    title: "Administratie tweede kwartaal afronden",
    description:
      "Losse facturen controleren en de kwartaalmap gereedmaken voor de boekhouder.",
    status: "waiting",
    deadline: null,
    ownRemainingMinutes: 75,
    generalEstimate: "1 uur 10 min",
    personalAdvice: "1 uur 25 min",
    userChoice: "1 uur 15 min",
    risk: "none",
    subtasks: [],
  },
];

const dutchDateFormatter = new Intl.DateTimeFormat("nl-NL", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDeadline(value: string): string {
  return dutchDateFormatter.format(new Date(value)).replace(" om ", ", ");
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} uur` : `${hours} uur ${rest} min`;
}

function formatTimer(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

function getRemainingMinutes(task: TaskExample): number {
  if (task.subtasks.length === 0) return task.ownRemainingMinutes;
  return task.subtasks.reduce(
    (total, subtask) =>
      subtask.status === "completed" ? total : total + subtask.remainingMinutes,
    0,
  );
}

function statusLabel(status: TaskStatus | SubtaskStatus): string | null {
  if (status === "waiting") return "Wachten";
  if (status === "blocked") return "Geblokkeerd";
  if (status === "completed") return "Afgerond";
  return null;
}

function riskLabel(risk: RiskLevel): string | null {
  if (risk === "orange") return "Kleine marge";
  if (risk === "red") return "Risico";
  return null;
}

function cloneExampleTasks(): TaskExample[] {
  return VISUAL_EXAMPLE_TASKS.map((task) => ({
    ...task,
    subtasks: task.subtasks.map((subtask) => ({ ...subtask })),
  }));
}

export function TakenVisualPrototype() {
  const [tasks, setTasks] = useState<TaskExample[]>(cloneExampleTasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    VISUAL_EXAMPLE_TASKS[0].id,
  );
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [formTaskId, setFormTaskId] = useState<string | null>(null);
  const [draft, setDraft] = useState<SubtaskDraft>(EMPTY_SUBTASK_DRAFT);
  const [errors, setErrors] = useState<SubtaskErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(18 * 60 + 42);
  const [localSubtaskNumber, setLocalSubtaskNumber] = useState(1);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimerSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  );

  function selectTask(taskId: string) {
    setSelectedTaskId((current) => (current === taskId ? null : taskId));
    setDetailsVisible(false);
    setFormTaskId(null);
    setErrors({});
    setNotice(null);
  }

  function openSubtaskForm(taskId: string) {
    setFormTaskId(taskId);
    setDraft(EMPTY_SUBTASK_DRAFT);
    setErrors({});
    setNotice(null);
  }

  function cancelSubtaskForm() {
    setFormTaskId(null);
    setDraft(EMPTY_SUBTASK_DRAFT);
    setErrors({});
    setNotice("Toevoegen geannuleerd. De visuele timer is blijven doorlopen.");
  }

  function saveSubtask(event: FormEvent<HTMLFormElement>, task: TaskExample) {
    event.preventDefault();
    const nextErrors: SubtaskErrors = {};
    const title = draft.title.trim();
    const deadlineTimestamp = Date.parse(draft.deadline);
    const duration = draft.durationMinutes.trim();
    const durationMinutes = duration === "" ? null : Number(duration);

    if (!title) nextErrors.title = "Vul een titel voor de subtaak in.";
    if (!draft.deadline || Number.isNaN(deadlineTimestamp)) {
      nextErrors.deadline = "Kies een geldige deadline met datum en tijd.";
    } else if (
      task.deadline &&
      deadlineTimestamp > Date.parse(task.deadline)
    ) {
      nextErrors.deadline = `Kies een deadline uiterlijk ${formatDeadline(task.deadline)}.`;
    }
    if (
      durationMinutes !== null &&
      (!Number.isInteger(durationMinutes) || durationMinutes <= 0)
    ) {
      nextErrors.durationMinutes = "Gebruik een positief aantal hele minuten.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const wasExecutableTask = task.subtasks.length === 0;
    const newSubtask: SubtaskExample = {
      id: `local-subtask-${localSubtaskNumber}`,
      title,
      status: "open",
      deadline: draft.deadline,
      estimatedMinutes: durationMinutes,
      remainingMinutes: durationMinutes ?? 0,
      risk: "none",
    };

    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id
          ? { ...currentTask, subtasks: [...currentTask.subtasks, newSubtask] }
          : currentTask,
      ),
    );
    setLocalSubtaskNumber((number) => number + 1);
    setFormTaskId(null);
    setDraft(EMPTY_SUBTASK_DRAFT);
    setErrors({});

    const recalculatedAt = new Intl.DateTimeFormat("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date());
    setNotice(
      wasExecutableTask
        ? `Subtaak lokaal toegevoegd. De hoofdtaak is nu een verzameltaak; de proefplanning is herberekend om ${recalculatedAt}.`
        : `Subtaak lokaal toegevoegd. De proefplanning is herberekend om ${recalculatedAt}.`,
    );
  }

  return (
    <main className={styles.prototype}>
      <div className={styles.shell}>
        <div className={styles.brandLine}>
          <strong>MijnPlanning</strong>
          <span>Visuele proef · uitsluitend lokale voorbeelddata</span>
        </div>

        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Werkoverzicht</p>
            <h1>Taken</h1>
            <p className={styles.pageIntro}>
              Hoofdtaken en subtaken, teruggebracht tot wat nu aandacht vraagt.
            </p>
          </div>
          <button
            type="button"
            className={styles.newTaskButton}
            onClick={() =>
              setNotice("Nieuwe taak is in deze visuele proef nog niet aangesloten.")
            }
          >
            Nieuwe taak
          </button>
        </header>

        <div className={styles.runningTimer}>
          <span className={styles.timerPulse} aria-hidden="true" />
          <span>
            Timer loopt voor <strong>Offerte laadpalen beoordelen</strong>
          </span>
          <time aria-label="Verstreken actieve tijd">{formatTimer(timerSeconds)}</time>
        </div>

        {notice ? (
          <div className={styles.localNotice} role="status" aria-live="polite">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)}>
              Sluiten
            </button>
          </div>
        ) : null}

        <section className={styles.taskSection} aria-labelledby="tasks-heading">
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="tasks-heading">Hoofdtaken</h2>
              <span>{tasks.length} tijdelijke voorbeelden</span>
            </div>
            <p>Selecteer een taak om de subtaken inline te openen.</p>
          </div>

          <div className={styles.taskList}>
            {tasks.map((task) => {
              const isSelected = selectedTaskId === task.id;
              const remainingMinutes = getRemainingMinutes(task);
              const taskStatusLabel = statusLabel(task.status);
              const taskRiskLabel = riskLabel(task.risk);

              return (
                <article
                  className={`${styles.task} ${isSelected ? styles.taskSelected : ""}`}
                  key={task.id}
                >
                  <button
                    type="button"
                    className={styles.taskToggle}
                    onClick={() => selectTask(task.id)}
                    aria-expanded={isSelected}
                    aria-controls={`task-detail-${task.id}`}
                  >
                    <span className={styles.taskIdentity}>
                      <span className={styles.taskTitle}>{task.title}</span>
                      <span className={styles.taskStateLine}>
                        {taskStatusLabel ? (
                          <span className={`${styles.statusText} ${styles[`status_${task.status}`]}`}>
                            {taskStatusLabel}
                          </span>
                        ) : null}
                        {task.subtasks.length > 0 ? (
                          <span>{task.subtasks.length} subtaken</span>
                        ) : (
                          <span>Uitvoerbare hoofdtaak</span>
                        )}
                      </span>
                    </span>

                    <span className={styles.taskEssentials}>
                      <span>
                        <small>Deadline</small>
                        <strong>
                          {task.deadline ? formatDeadline(task.deadline) : "Geen taakdeadline"}
                        </strong>
                      </span>
                      <span>
                        <small>Resterend</small>
                        <strong>{formatMinutes(remainingMinutes)}</strong>
                      </span>
                      <span className={styles.riskSlot}>
                        {taskRiskLabel ? (
                          <span className={`${styles.riskText} ${styles[`risk_${task.risk}`]}`}>
                            {taskRiskLabel}
                          </span>
                        ) : null}
                      </span>
                      <span className={styles.chevron} aria-hidden="true">
                        {isSelected ? "−" : "+"}
                      </span>
                    </span>
                  </button>

                  {isSelected ? (
                    <div className={styles.taskDetail} id={`task-detail-${task.id}`}>
                      <div className={styles.detailActions}>
                        <button
                          type="button"
                          className={styles.addSubtaskButton}
                          onClick={() => openSubtaskForm(task.id)}
                          aria-expanded={formTaskId === task.id}
                          aria-controls={`subtask-form-${task.id}`}
                        >
                          + Subtaak
                        </button>
                        <button
                          type="button"
                          className={styles.detailsButton}
                          onClick={() => setDetailsVisible((visible) => !visible)}
                          aria-expanded={detailsVisible}
                        >
                          {detailsVisible ? "Details verbergen" : "Details tonen"}
                        </button>
                      </div>

                      {task.riskExplanation ? (
                        <p className={`${styles.taskRiskExplanation} ${styles[`riskBorder_${task.risk}`]}`}>
                          <strong>{taskRiskLabel}:</strong> {task.riskExplanation}
                        </p>
                      ) : null}

                      {detailsVisible ? (
                        <div className={styles.onDemandDetails}>
                          <p>{task.description}</p>
                          <dl>
                            <div>
                              <dt>Algemene inschatting</dt>
                              <dd>{task.generalEstimate}</dd>
                            </div>
                            <div>
                              <dt>Persoonlijk advies</dt>
                              <dd>{task.personalAdvice}</dd>
                            </div>
                            <div>
                              <dt>Jouw keuze</dt>
                              <dd>{task.userChoice}</dd>
                            </div>
                          </dl>
                        </div>
                      ) : null}

                      {formTaskId === task.id ? (
                        <form
                          className={styles.subtaskForm}
                          id={`subtask-form-${task.id}`}
                          onSubmit={(event) => saveSubtask(event, task)}
                          noValidate
                        >
                          <div className={styles.formHeading}>
                            <div>
                              <h3>Nieuwe subtaak</h3>
                              <p>De lopende timer blijft tijdens deze invoer actief.</p>
                            </div>
                            <span className={styles.liveTimer}>{formatTimer(timerSeconds)}</span>
                          </div>

                          <div className={styles.formGrid}>
                            <div className={`${styles.field} ${styles.fieldTitle}`}>
                              <label htmlFor={`subtask-title-${task.id}`}>Titel *</label>
                              <input
                                id={`subtask-title-${task.id}`}
                                value={draft.title}
                                onChange={(event) => {
                                  setDraft((current) => ({ ...current, title: event.target.value }));
                                  setErrors((current) => ({ ...current, title: undefined }));
                                }}
                                aria-invalid={Boolean(errors.title)}
                                aria-describedby={errors.title ? `subtask-title-error-${task.id}` : undefined}
                                autoFocus
                              />
                              {errors.title ? (
                                <span className={styles.errorText} id={`subtask-title-error-${task.id}`}>
                                  {errors.title}
                                </span>
                              ) : null}
                            </div>

                            <div className={styles.field}>
                              <label htmlFor={`subtask-deadline-${task.id}`}>Deadline *</label>
                              <input
                                id={`subtask-deadline-${task.id}`}
                                type="datetime-local"
                                value={draft.deadline}
                                max={task.deadline ?? undefined}
                                onChange={(event) => {
                                  setDraft((current) => ({ ...current, deadline: event.target.value }));
                                  setErrors((current) => ({ ...current, deadline: undefined }));
                                }}
                                aria-invalid={Boolean(errors.deadline)}
                                aria-describedby={`subtask-deadline-help-${task.id}${errors.deadline ? ` subtask-deadline-error-${task.id}` : ""}`}
                              />
                              <span className={styles.helpText} id={`subtask-deadline-help-${task.id}`}>
                                {task.deadline
                                  ? `Uiterlijk ${formatDeadline(task.deadline)}.`
                                  : "Datum en tijd zijn verplicht."}
                              </span>
                              {errors.deadline ? (
                                <span className={styles.errorText} id={`subtask-deadline-error-${task.id}`}>
                                  {errors.deadline}
                                </span>
                              ) : null}
                            </div>

                            <div className={styles.field}>
                              <label htmlFor={`subtask-duration-${task.id}`}>Duur in minuten</label>
                              <input
                                id={`subtask-duration-${task.id}`}
                                type="number"
                                min="1"
                                step="1"
                                inputMode="numeric"
                                value={draft.durationMinutes}
                                onChange={(event) => {
                                  setDraft((current) => ({
                                    ...current,
                                    durationMinutes: event.target.value,
                                  }));
                                  setErrors((current) => ({ ...current, durationMinutes: undefined }));
                                }}
                                aria-invalid={Boolean(errors.durationMinutes)}
                                aria-describedby={
                                  errors.durationMinutes
                                    ? `subtask-duration-error-${task.id}`
                                    : undefined
                                }
                              />
                              {errors.durationMinutes ? (
                                <span className={styles.errorText} id={`subtask-duration-error-${task.id}`}>
                                  {errors.durationMinutes}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className={styles.formActions}>
                            <button type="button" className={styles.cancelButton} onClick={cancelSubtaskForm}>
                              Annuleren
                            </button>
                            <button type="submit" className={styles.saveButton}>
                              Opslaan
                            </button>
                          </div>
                        </form>
                      ) : null}

                      <div className={styles.subtaskHeader}>
                        <div>
                          <h3>Subtaken</h3>
                          <p>Deadline en resterende tijd per uitvoerbaar onderdeel.</p>
                        </div>
                        {task.subtasks.length > 0 ? (
                          <span>Resterend samen: {formatMinutes(remainingMinutes)}</span>
                        ) : null}
                      </div>

                      {task.subtasks.length > 0 ? (
                        <>
                          <p className={styles.collectionNote}>
                            Verzameltaak · de hoofdtaakduur wordt niet boven op de subtaken gepland.
                          </p>
                          <ol className={styles.subtaskList}>
                            {task.subtasks.map((subtask) => {
                              const subtaskStatusLabel = statusLabel(subtask.status);
                              const subtaskRiskLabel = riskLabel(subtask.risk);
                              return (
                                <li className={styles.subtaskRow} key={subtask.id}>
                                  <div className={styles.subtaskIdentity}>
                                    <div className={styles.subtaskTitleLine}>
                                      {subtask.timerRunning ? (
                                        <span className={styles.activeDot} aria-label="Timer actief" />
                                      ) : null}
                                      <strong>{subtask.title}</strong>
                                    </div>
                                    <span>
                                      Deadline {formatDeadline(subtask.deadline)}
                                      <span aria-hidden="true"> · </span>
                                      {subtask.estimatedMinutes
                                        ? `${formatMinutes(subtask.estimatedMinutes)} geschat`
                                        : "duur nog te schatten"}
                                    </span>
                                    {subtask.dependency ? <small>{subtask.dependency}</small> : null}
                                    {subtask.riskExplanation ? (
                                      <small className={styles[`riskCopy_${subtask.risk}`]}>
                                        {subtask.riskExplanation}
                                      </small>
                                    ) : null}
                                  </div>
                                  <div className={styles.subtaskOutcome}>
                                    <strong>{formatMinutes(subtask.remainingMinutes)} resterend</strong>
                                    <div>
                                      {subtaskStatusLabel ? (
                                        <span className={`${styles.statusText} ${styles[`status_${subtask.status}`]}`}>
                                          {subtaskStatusLabel}
                                        </span>
                                      ) : null}
                                      {subtaskRiskLabel ? (
                                        <span className={`${styles.riskText} ${styles[`risk_${subtask.risk}`]}`}>
                                          {subtaskRiskLabel}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ol>
                        </>
                      ) : (
                        <p className={styles.emptySubtasks}>
                          Nog geen subtaken. Deze hoofdtaak is nu zelf uitvoerbaar; voeg een eerste subtaak toe om er een verzameltaak van te maken.
                        </p>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <footer className={styles.prototypeFooter}>
          Tweede visuele richting · geen gegevens worden opgeslagen
        </footer>
      </div>
    </main>
  );
}
