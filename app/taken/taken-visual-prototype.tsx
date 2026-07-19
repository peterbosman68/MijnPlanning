"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import styles from "./taken-visual-prototype.module.css";

type ViewKey =
  | "today"
  | "week"
  | "tasks"
  | "appointments"
  | "email"
  | "waiting"
  | "completed";

type MobilePane = "navigation" | "list" | "detail";
type TaskStatus = "normal" | "active" | "waiting" | "completed";
type RiskLevel = "attention" | "danger" | null;

type Subtask = {
  id: string;
  title: string;
  deadline: string;
  remaining: string;
  state?: "active" | "blocked" | "waiting" | "done" | "planned";
};

type MainTask = {
  id: string;
  title: string;
  note: string;
  deadline: string;
  deadlineValue?: string;
  remaining: string;
  status: TaskStatus;
  risk: RiskLevel;
  riskText?: string;
  description: string;
  subtasks: Subtask[];
};

type Appointment = {
  id: string;
  day: string;
  time: string;
  title: string;
  location: string;
  attendees: string;
  note: string;
};

type EmailProposal = {
  id: string;
  sender: string;
  subject: string;
  summary: string;
  proposal: string;
  confidence: string;
  source: string;
};

const NAV_ITEMS: Array<{ id: ViewKey; label: string; icon: ViewKey }> = [
  { id: "today", label: "Vandaag", icon: "today" },
  { id: "week", label: "Week", icon: "week" },
  { id: "tasks", label: "Hoofdtaken", icon: "tasks" },
  { id: "appointments", label: "Afspraken", icon: "appointments" },
  { id: "email", label: "E-mail", icon: "email" },
  { id: "waiting", label: "Wachten", icon: "waiting" },
  { id: "completed", label: "Afgerond", icon: "completed" },
];

const INITIAL_TASKS: MainTask[] = [
  {
    id: "truckparking",
    title: "Truckparking Duiven voorbereiden",
    note: "4 subtaken · 1 geblokkeerd",
    deadline: "vr 24 jul · 17:00",
    deadlineValue: "2026-07-24T17:00",
    remaining: "3u 40m",
    status: "active",
    risk: "attention",
    riskText:
      "Kleine marge: de gekozen duur ligt 30 minuten onder jouw persoonlijke advies. De deadline blijft haalbaar als het actieve werk vandaag doorgaat.",
    description:
      "Voorbereiding van het locatiebezoek, de laadpaalofferte en de benodigde vergunningsstukken voor Truckparking Duiven.",
    subtasks: [
      {
        id: "location",
        title: "Locatiegegevens controleren",
        deadline: "20 jul · 12:00",
        remaining: "—",
        state: "done",
      },
      {
        id: "quote",
        title: "Offerte laadpalen beoordelen",
        deadline: "22 jul · 17:00",
        remaining: "45m",
        state: "active",
      },
      {
        id: "permit",
        title: "Vergunningsstukken verzamelen",
        deadline: "23 jul · 12:00",
        remaining: "1u 10m",
        state: "blocked",
      },
      {
        id: "owner",
        title: "Terugkoppeling eigenaar verwerken",
        deadline: "24 jul · 11:00",
        remaining: "30m",
        state: "waiting",
      },
    ],
  },
  {
    id: "quarter",
    title: "Administratie tweede kwartaal afronden",
    note: "2 subtaken",
    deadline: "wo 29 jul · 17:00",
    deadlineValue: "2026-07-29T17:00",
    remaining: "1u 15m",
    status: "normal",
    risk: null,
    description:
      "Openstaande boekingen nalopen en de kwartaalmap gereedmaken voor de boekhouder.",
    subtasks: [
      {
        id: "receipts",
        title: "Ontbrekende bonnen koppelen",
        deadline: "27 jul · 17:00",
        remaining: "35m",
      },
      {
        id: "check",
        title: "Kwartaaloverzicht controleren",
        deadline: "29 jul · 15:00",
        remaining: "40m",
      },
    ],
  },
  {
    id: "roof",
    title: "Besluit dakonderhoud vastleggen",
    note: "Wachten op offerte",
    deadline: "ma 27 jul · 10:00",
    deadlineValue: "2026-07-27T10:00",
    remaining: "50m",
    status: "waiting",
    risk: "danger",
    riskText:
      "Deadlinegevaar: de offerte is nog niet ontvangen. Zonder antwoord vóór dinsdag ontbreekt 1 werkdag om het besluit af te ronden.",
    description:
      "Offertes vergelijken en het definitieve onderhoudsbesluit met onderbouwing vastleggen.",
    subtasks: [
      {
        id: "vendor",
        title: "Herinnering aan leverancier sturen",
        deadline: "20 jul · 09:00",
        remaining: "10m",
        state: "waiting",
      },
      {
        id: "compare",
        title: "Offertes vergelijken",
        deadline: "24 jul · 14:00",
        remaining: "40m",
        state: "blocked",
      },
    ],
  },
  {
    id: "archive",
    title: "Verzekeringsmap 2025 archiveren",
    note: "Afgerond op 16 juli",
    deadline: "16 jul · 17:00",
    remaining: "—",
    status: "completed",
    risk: null,
    description: "De gecontroleerde documenten zijn gebundeld en veilig gearchiveerd.",
    subtasks: [
      {
        id: "archive-files",
        title: "Documenten controleren en archiveren",
        deadline: "16 jul · 17:00",
        remaining: "—",
        state: "done",
      },
    ],
  },
];

const APPOINTMENTS: Appointment[] = [
  {
    id: "daily",
    day: "Vandaag · 19 juli",
    time: "09:00–09:30",
    title: "Dagstart",
    location: "Teams",
    attendees: "3 deelnemers",
    note: "Korte afstemming over lopende projecten en blokkades.",
  },
  {
    id: "erwin",
    day: "Vandaag · 19 juli",
    time: "14:00–14:30",
    title: "Overleg Erwin — Roodwilligen",
    location: "Microsoft Teams",
    attendees: "2 deelnemers",
    note: "Voortgang en open keuzes voor Roodwilligen bespreken.",
  },
  {
    id: "visit",
    day: "Morgen · 20 juli",
    time: "10:00–11:00",
    title: "Locatiebezoek Truckparking Duiven",
    location: "Duiven",
    attendees: "4 deelnemers",
    note: "Locatie, netaansluiting en plaatsing van laadpalen nalopen.",
  },
];

const EMAIL_PROPOSALS: EmailProposal[] = [
  {
    id: "charger",
    sender: "installateur@voorbeeld.nl",
    subject: "Offerte laadpalen Duiven",
    summary:
      "De installateur bevestigt een levertijd van zes weken en heeft de installatiekosten in de offerte opgenomen.",
    proposal:
      "Voeg ‘Offerte laadpalen beoordelen’ toe aan Truckparking Duiven met deadline 22 juli en 45 minuten geschatte tijd.",
    confidence: "Hoge betrouwbaarheid",
    source:
      "Goedemiddag Peter, in de bijlage vind je de bijgewerkte offerte. De huidige levertijd is circa zes weken. Installatie en keuring zijn in het totaalbedrag opgenomen.",
  },
  {
    id: "erwin-mail",
    sender: "erwin@voorbeeld.nl",
    subject: "Vraag over stroomaansluiting",
    summary:
      "Erwin vraagt of de beschikbare netcapaciteit vóór het locatiebezoek kan worden bevestigd.",
    proposal:
      "Maak een subtaak ‘Netcapaciteit bevestigen’ met deadline 20 juli en 20 minuten geschatte tijd.",
    confidence: "Gemiddelde betrouwbaarheid",
    source:
      "Kun je voor ons bezoek nog bevestigen welke netcapaciteit op de locatie beschikbaar is? Dan kunnen we het voorstel tijdens de afspraak afronden.",
  },
  {
    id: "invoice",
    sender: "boekhouder@voorbeeld.nl",
    subject: "Ontbrekende factuur juni",
    summary: "De boekhouder mist één leveranciersfactuur in de administratie van juni.",
    proposal:
      "Maak een taak ‘Ontbrekende factuur juni aanleveren’ met deadline 21 juli en 15 minuten geschatte tijd.",
    confidence: "Hoge betrouwbaarheid",
    source:
      "Bij de controle van juni ontbreekt nog de factuur van de leverancier. Wil je die uiterlijk dinsdag aanleveren?",
  },
];

function NavIcon({ name }: { name: ViewKey }) {
  const paths: Record<ViewKey, ReactNode> = {
    today: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    week: <><rect x="3" y="5" width="18" height="16" rx="1" /><path d="M8 3v4m8-4v4M3 10h18M8 14h2m4 0h2m-8 4h2" /></>,
    tasks: <><path d="M8 6h12M8 12h12M8 18h8" /><path d="m3.5 6 1 1 2-2m-3 7 1 1 2-2m-3 7 1 1 2-2" /></>,
    appointments: <><rect x="3" y="5" width="18" height="16" rx="1" /><path d="M8 3v4m8-4v4M3 10h18m-9 3v4l2 1" /></>,
    email: <><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m4 7 8 6 8-6" /></>,
    waiting: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    completed: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
  };

  return (
    <svg aria-hidden="true" className={styles.navIcon} viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

function formatTimer(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => value.toString().padStart(2, "0")).join(":");
}

function formatDeadline(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function taskStatusLabel(status: TaskStatus) {
  if (status === "active") return "Actief";
  if (status === "waiting") return "Wachten";
  if (status === "completed") return "Afgerond";
  return null;
}

function subtaskStateLabel(state: Subtask["state"]) {
  if (state === "active") return "Actief";
  if (state === "blocked") return "Geblokkeerd";
  if (state === "waiting") return "Wachten";
  if (state === "done") return "Klaar";
  if (state === "planned") return "Gepland";
  return null;
}

export function TakenVisualPrototype() {
  const [activeView, setActiveView] = useState<ViewKey>("tasks");
  const [mobilePane, setMobilePane] = useState<MobilePane>("navigation");
  const [tasks, setTasks] = useState<MainTask[]>(INITIAL_TASKS);
  const [selectedTaskId, setSelectedTaskId] = useState("truckparking");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("erwin");
  const [selectedEmailId, setSelectedEmailId] = useState("charger");
  const [timerSeconds, setTimerSeconds] = useState(47 * 60 + 12);
  const [subtaskFormOpen, setSubtaskFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setTimerSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const visibleTasks = useMemo(() => {
    if (activeView === "waiting") return tasks.filter((task) => task.status === "waiting");
    if (activeView === "completed") return tasks.filter((task) => task.status === "completed");
    if (activeView === "today") return tasks.filter((task) => task.id !== "quarter" && task.status !== "completed");
    return tasks.filter((task) => task.status !== "completed");
  }, [activeView, tasks]);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? visibleTasks[0] ?? tasks[0];
  const selectedAppointment =
    APPOINTMENTS.find((appointment) => appointment.id === selectedAppointmentId) ?? APPOINTMENTS[0];
  const selectedEmail = EMAIL_PROPOSALS.find((email) => email.id === selectedEmailId) ?? EMAIL_PROPOSALS[0];

  const currentKind = activeView === "appointments" ? "appointments" : activeView === "email" ? "email" : "tasks";
  const viewTitle: Record<ViewKey, string> = {
    today: "Vandaag",
    week: "Deze week",
    tasks: "Hoofdtaken",
    appointments: "Afspraken",
    email: "E-mail",
    waiting: "Wachten",
    completed: "Afgerond",
  };

  function selectView(view: ViewKey) {
    setActiveView(view);
    if (view === "waiting") setSelectedTaskId("roof");
    else if (view === "completed") setSelectedTaskId("archive");
    else if (view !== "appointments" && view !== "email") setSelectedTaskId("truckparking");
    setMobilePane("list");
    setSubtaskFormOpen(false);
    setDetailsOpen(false);
    setSourceOpen(false);
    setFormError(null);
    setFeedback(null);
  }

  function selectTask(taskId: string) {
    setSelectedTaskId(taskId);
    setSubtaskFormOpen(false);
    setDetailsOpen(false);
    setFormError(null);
    setFeedback(null);
    setMobilePane("detail");
  }

  function addSubtask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const deadline = String(formData.get("deadline") ?? "");

    if (!title || !deadline) {
      setFormError("Vul een titel en deadline in.");
      return;
    }

    if (selectedTask.deadlineValue && deadline > selectedTask.deadlineValue) {
      setFormError(`Kies een deadline op of vóór ${selectedTask.deadline}.`);
      return;
    }

    const newSubtask: Subtask = {
      id: `local-${Date.now()}`,
      title,
      deadline: formatDeadline(deadline),
      remaining: "Nog te schatten",
      state: "planned",
    };

    setTasks((current) =>
      current.map((task) =>
        task.id === selectedTask.id
          ? {
              ...task,
              note: `${task.subtasks.length + 1} subtaken${task.subtasks.some((item) => item.state === "blocked") ? " · 1 geblokkeerd" : ""}`,
              subtasks: [...task.subtasks, newSubtask],
            }
          : task,
      ),
    );
    form.reset();
    setFormError(null);
    setSubtaskFormOpen(false);
    setFeedback(
      "Subtaak lokaal toegevoegd. Planning opnieuw berekend; de actieve timer liep door en de nieuwe subtaak is niet gestart.",
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell} data-mobile-pane={mobilePane}>
        <aside className={styles.navPane} aria-label="Navigatie van de visuele proef">
          <div>
            <div className={styles.brand}>
              <span className={styles.brandMark} aria-hidden="true">M</span>
              <span>
                <strong>MijnPlanning</strong>
                <small>Visuele proef</small>
              </span>
            </div>

            <nav className={styles.navigation}>
              {NAV_ITEMS.map((item, index) => (
                <div key={item.id} className={index === 3 || index === 5 ? styles.navDivider : undefined}>
                  <button
                    className={activeView === item.id ? styles.navActive : styles.navButton}
                    type="button"
                    onClick={() => selectView(item.id)}
                    aria-current={activeView === item.id ? "page" : undefined}
                  >
                    <NavIcon name={item.icon} />
                    <span>{item.label}</span>
                  </button>
                </div>
              ))}
            </nav>
          </div>

          <p className={styles.prototypeNote}>
            <span aria-hidden="true" />
            Tijdelijke voorbeelddata<br />Geen externe opslag
          </p>
        </aside>

        <section className={styles.listPane} aria-labelledby="list-title">
          <header className={styles.listHeader}>
            <button className={styles.mobileBack} type="button" onClick={() => setMobilePane("navigation")}>
              <span aria-hidden="true">←</span> Navigatie
            </button>
            <div>
              <p className={styles.eyebrow}>Werkoverzicht</p>
              <h1 id="list-title">{viewTitle[activeView]}</h1>
            </div>
            <p className={styles.listIntro}>
              {currentKind === "tasks" && `${visibleTasks.length} hoofd${visibleTasks.length === 1 ? "taak" : "taken"}`}
              {currentKind === "appointments" && "Alleen-lezen uit Outlook"}
              {currentKind === "email" && `${EMAIL_PROPOSALS.length} lokale voorstellen`}
            </p>
          </header>

          {currentKind === "tasks" && (
            <div className={styles.listBody}>
              <div className={styles.taskColumns} aria-hidden="true">
                <span>Hoofdtaak</span><span>Deadline</span><span>Resterend</span><span />
              </div>
              {visibleTasks.length === 0 ? (
                <p className={styles.emptyState}>Geen hoofdtaken in deze selectie.</p>
              ) : (
                visibleTasks.map((task) => {
                  const status = taskStatusLabel(task.status);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      className={selectedTask.id === task.id ? styles.selectedTaskRow : styles.taskRow}
                      onClick={() => selectTask(task.id)}
                    >
                      <span className={styles.taskTitleCell}>
                        <strong>{task.title}</strong>
                        <small>{status ?? task.note}</small>
                      </span>
                      <span className={styles.deadlineCell}>{task.deadline}</span>
                      <span className={styles.remainingCell}>{task.remaining}</span>
                      <span className={styles.riskCell}>
                        {task.risk && (
                          <span
                            className={task.risk === "danger" ? styles.dangerDot : styles.attentionDot}
                            aria-label={task.risk === "danger" ? "Deadlinegevaar" : "Aandacht nodig"}
                            role="img"
                          />
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {currentKind === "appointments" && (
            <div className={styles.listBody}>
              {APPOINTMENTS.map((appointment, index) => {
                const showDay = index === 0 || APPOINTMENTS[index - 1].day !== appointment.day;
                return (
                  <div key={appointment.id}>
                    {showDay && <p className={styles.dateDivider}>{appointment.day}</p>}
                    <button
                      type="button"
                      className={selectedAppointment.id === appointment.id ? styles.selectedAppointmentRow : styles.appointmentRow}
                      onClick={() => { setSelectedAppointmentId(appointment.id); setMobilePane("detail"); }}
                    >
                      <span className={styles.timeBar} aria-hidden="true" />
                      <time>{appointment.time}</time>
                      <strong>{appointment.title}</strong>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {currentKind === "email" && (
            <div className={styles.listBody}>
              <div className={styles.emailColumns} aria-hidden="true">
                <span>Voorstel</span><span>Betrouwbaarheid</span>
              </div>
              {EMAIL_PROPOSALS.map((email) => (
                <button
                  key={email.id}
                  type="button"
                  className={selectedEmail.id === email.id ? styles.selectedEmailRow : styles.emailRow}
                  onClick={() => { setSelectedEmailId(email.id); setSourceOpen(false); setFeedback(null); setMobilePane("detail"); }}
                >
                  <span>
                    <strong>{email.subject}</strong>
                    <small>{email.summary}</small>
                  </span>
                  <span className={styles.confidence}>{email.confidence}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={styles.detailPane} aria-label="Detailpaneel">
          <button className={styles.mobileBack} type="button" onClick={() => setMobilePane("list")}>
            <span aria-hidden="true">←</span> {viewTitle[activeView]}
          </button>

          {currentKind === "tasks" && selectedTask && (
            <div className={styles.detailContent}>
              <header className={styles.detailHeader}>
                <p className={styles.eyebrow}>Hoofdtaak</p>
                <h2>{selectedTask.title}</h2>
                <div className={styles.taskMeta}>
                  {taskStatusLabel(selectedTask.status) && (
                    <span className={selectedTask.status === "active" ? styles.activeStatus : styles.neutralStatus}>
                      {taskStatusLabel(selectedTask.status)}
                    </span>
                  )}
                  <span>Deadline {selectedTask.deadline}</span>
                </div>
              </header>

              {selectedTask.status === "active" && (
                <div className={styles.timerStrip}>
                  <span>
                    <small>Actieve subtaak</small>
                    <strong>Offerte laadpalen beoordelen</strong>
                  </span>
                  <time aria-label={`Actieve tijd ${formatTimer(timerSeconds)}`}>{formatTimer(timerSeconds)}</time>
                </div>
              )}

              {selectedTask.risk && selectedTask.riskText && (
                <div className={selectedTask.risk === "danger" ? styles.dangerMessage : styles.attentionMessage}>
                  <strong>{selectedTask.risk === "danger" ? "Deadlinegevaar" : "Aandacht"}</strong>
                  <p>{selectedTask.riskText}</p>
                </div>
              )}

              <div className={styles.detailActions}>
                {selectedTask.status !== "completed" && (
                  <button
                    className={styles.primaryButton}
                    type="button"
                    onClick={() => { setSubtaskFormOpen((open) => !open); setFormError(null); setFeedback(null); }}
                    aria-expanded={subtaskFormOpen}
                  >
                    + Subtaak
                  </button>
                )}
                <button className={styles.ghostButton} type="button" onClick={() => setDetailsOpen((open) => !open)} aria-expanded={detailsOpen}>
                  {detailsOpen ? "Details verbergen" : "Details tonen"}
                </button>
              </div>

              {selectedTask.status === "completed" && (
                <div className={styles.reopenPrompt}>
                  <p>Deze hoofdtaak is afgerond. Open de taak eerst opnieuw om een subtaak toe te voegen.</p>
                  <button type="button" className={styles.secondaryButton} onClick={() => setFeedback("Voorbeeldactie: de hoofdtaak zou eerst opnieuw worden geopend.")}>Opnieuw openen</button>
                </div>
              )}

              {subtaskFormOpen && selectedTask.status !== "completed" && (
                <form className={styles.subtaskForm} onSubmit={addSubtask} noValidate>
                  <div className={styles.formHeading}>
                    <div>
                      <p className={styles.eyebrow}>Nieuwe subtaak</p>
                      <h3>Toevoegen zonder actief werk te onderbreken</h3>
                    </div>
                    {selectedTask.status === "active" && <span>Timer loopt door</span>}
                  </div>
                  <label>
                    Titel <span aria-hidden="true">*</span>
                    <input name="title" type="text" required autoFocus placeholder="Wat moet er gebeuren?" />
                  </label>
                  <label>
                    Deadline <span aria-hidden="true">*</span>
                    <input name="deadline" type="datetime-local" required max={selectedTask.deadlineValue} />
                    {selectedTask.deadlineValue && <small>Uiterlijk {selectedTask.deadline}</small>}
                  </label>
                  {formError && <p className={styles.formError} role="alert">{formError}</p>}
                  <div className={styles.formActions}>
                    <button type="button" className={styles.ghostButton} onClick={() => { setSubtaskFormOpen(false); setFormError(null); }}>Annuleren</button>
                    <button type="submit" className={styles.primaryButton}>Opslaan</button>
                  </div>
                </form>
              )}

              {feedback && <p className={styles.feedback} role="status">{feedback}</p>}

              <section className={styles.subtasks} aria-labelledby="subtasks-title">
                <div className={styles.sectionHeading}>
                  <h3 id="subtasks-title">Subtaken</h3>
                  <span>{selectedTask.subtasks.length}</span>
                </div>
                <div className={styles.subtaskList}>
                  {selectedTask.subtasks.map((subtask) => {
                    const stateLabel = subtaskStateLabel(subtask.state);
                    return (
                      <div key={subtask.id} className={styles.subtaskRow}>
                        <span className={styles.subtaskMarker} aria-hidden="true" />
                        <span className={styles.subtaskText}>
                          <strong>{subtask.title}</strong>
                          <small>{subtask.deadline}</small>
                        </span>
                        {stateLabel && <span className={subtask.state === "blocked" ? styles.blockedText : styles.subtaskState}>{stateLabel}</span>}
                        <span className={styles.subtaskTime}>{subtask.remaining}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {detailsOpen && (
                <section className={styles.expandedDetails}>
                  <div><h3>Omschrijving</h3><p>{selectedTask.description}</p></div>
                  <dl>
                    <div><dt>Persoonlijk advies</dt><dd>4u 10m</dd></div>
                    <div><dt>Gekozen resterend</dt><dd>{selectedTask.remaining}</dd></div>
                    <div><dt>Afhankelijkheden</dt><dd>1 actief</dd></div>
                    <div><dt>Bijlagen</dt><dd>2 bestanden</dd></div>
                  </dl>
                  <p className={styles.dataNote}>Dit blok gebruikt uitsluitend tijdelijke voorbeelddata.</p>
                </section>
              )}
            </div>
          )}

          {currentKind === "appointments" && (
            <div className={styles.detailContent}>
              <header className={styles.detailHeader}>
                <p className={styles.eyebrow}>Outlook-afspraak</p>
                <h2>{selectedAppointment.title}</h2>
              </header>
              <div className={styles.appointmentDetail}>
                <time>{selectedAppointment.time}</time>
                <dl>
                  <div><dt>Datum</dt><dd>{selectedAppointment.day}</dd></div>
                  <div><dt>Locatie</dt><dd>{selectedAppointment.location}</dd></div>
                  <div><dt>Deelnemers</dt><dd>{selectedAppointment.attendees}</dd></div>
                </dl>
                <p>{selectedAppointment.note}</p>
              </div>
              <p className={styles.readOnlyNote}>
                <NavIcon name="appointments" /> Alleen-lezen via Outlook · tijdelijke voorbeelddata
              </p>
            </div>
          )}

          {currentKind === "email" && (
            <div className={styles.detailContent}>
              <header className={styles.detailHeader}>
                <p className={styles.eyebrow}>E-mailvoorstel</p>
                <h2>{selectedEmail.subject}</h2>
                <p className={styles.sender}>Van {selectedEmail.sender}</p>
              </header>
              <section className={styles.emailSummary}>
                <h3>Samenvatting</h3>
                <p>{selectedEmail.summary}</p>
              </section>
              <section className={styles.proposalBlock}>
                <p className={styles.eyebrow}>Voorgestelde actie</p>
                <p>{selectedEmail.proposal}</p>
                <span>{selectedEmail.confidence}</span>
              </section>
              <div className={styles.emailActions}>
                <button className={styles.primaryButton} type="button" onClick={() => setFeedback("Voorbeeldactie: het voorstel is lokaal geaccepteerd. Er is niets opgeslagen of verzonden.")}>Accepteren</button>
                <button className={styles.secondaryButton} type="button" onClick={() => setFeedback("Voorbeeldactie: aanpassen opent later een echt formulier.")}>Aanpassen</button>
                <button className={styles.ghostButton} type="button" onClick={() => setFeedback("Voorbeeldactie: het voorstel is alleen in lokale state genegeerd.")}>Negeren</button>
              </div>
              {feedback && <p className={styles.feedback} role="status">{feedback}</p>}
              <button className={styles.sourceToggle} type="button" onClick={() => setSourceOpen((open) => !open)} aria-expanded={sourceOpen}>
                {sourceOpen ? "Broninhoud verbergen" : "Broninhoud tonen"}
                <span aria-hidden="true">{sourceOpen ? "↑" : "↓"}</span>
              </button>
              {sourceOpen && <blockquote className={styles.sourceContent}>{selectedEmail.source}</blockquote>}
              <p className={styles.dataNote}>Alle e-mailinhoud op dit scherm is fictieve voorbeelddata.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
