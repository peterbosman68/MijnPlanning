"use client";

import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ChangeEvent, CSSProperties, FormEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import type { AttachmentBoardData } from "@/lib/attachments/service";
import type { getTaskBoardData } from "@/lib/tasks/service";

import {
  subtaskPlannedMinutesOnDate,
  taskOwnPlannedMinutesOnDate,
  totalPlannedWorkMinutesForDate,
} from "@/lib/tasks/planned-load";

import {
  archiveSubtaskAction,
  archiveTaskAction,
  saveSubtaskAction,
  saveTaskAction,
} from "./actions";
import type { TaskActionState } from "./actions";

import styles from "./taken-visual-prototype.module.css";

const PANE_LAYOUT_STORAGE_KEY = "mijnplanning.taken.paneLayout.v1";

const initialTaskActionState: TaskActionState = {
  error: null,
};

const PANE_MIN_WIDTH = { nav: 168, list: 300, detail: 360 } as const;
const PANE_MAX_WIDTH = { nav: 320, list: 640, detail: 900 } as const;
const PANE_DEFAULT_WIDTH = { nav: 208, list: 400, detail: 520 } as const;

type PaneWidths = { nav: number; list: number; detail: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sanitizePaneWidths(candidate: unknown): PaneWidths | null {
  if (typeof candidate !== "object" || candidate === null) return null;
  const record = candidate as Record<string, unknown>;
  if (!isFiniteNumber(record.nav) || !isFiniteNumber(record.list) || !isFiniteNumber(record.detail)) {
    return null;
  }
  return {
    nav: clamp(record.nav, PANE_MIN_WIDTH.nav, PANE_MAX_WIDTH.nav),
    list: clamp(record.list, PANE_MIN_WIDTH.list, PANE_MAX_WIDTH.list),
    detail: clamp(record.detail, PANE_MIN_WIDTH.detail, PANE_MAX_WIDTH.detail),
  };
}

function fitPaneWidthsToViewport(widths: PaneWidths, availableWidth: number): PaneWidths {
  const minTotal = PANE_MIN_WIDTH.nav + PANE_MIN_WIDTH.list + PANE_MIN_WIDTH.detail;
  if (availableWidth <= minTotal) {
    return { ...PANE_DEFAULT_WIDTH };
  }
  const total = widths.nav + widths.list + widths.detail;
  if (total <= availableWidth) return widths;
  const scale = availableWidth / total;
  return {
    nav: clamp(Math.round(widths.nav * scale), PANE_MIN_WIDTH.nav, PANE_MAX_WIDTH.nav),
    list: clamp(Math.round(widths.list * scale), PANE_MIN_WIDTH.list, PANE_MAX_WIDTH.list),
    detail: clamp(Math.round(widths.detail * scale), PANE_MIN_WIDTH.detail, PANE_MAX_WIDTH.detail),
  };
}

function loadStoredPaneWidths(): PaneWidths | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PANE_LAYOUT_STORAGE_KEY);
    if (!raw) return null;
    return sanitizePaneWidths(JSON.parse(raw));
  } catch {
    return null;
  }
}

function subscribeNever() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

function useIsMounted() {
  return useSyncExternalStore(subscribeNever, getClientSnapshot, getServerSnapshot);
}

function usePaneLayout() {
  const isMounted = useIsMounted();
  const storedWidths = useMemo(() => (isMounted ? loadStoredPaneWidths() : null), [isMounted]);
  const [manualWidths, setWidths] = useState<PaneWidths | null>(null);
  const hydratedRef = useRef(false);
  const dragRef = useRef<{
    divider: "nav-list" | "list-detail";
    startX: number;
    startWidths: PaneWidths;
  } | null>(null);

  const widths = useMemo(() => {
    const base = manualWidths ?? storedWidths ?? PANE_DEFAULT_WIDTH;
    return isMounted ? fitPaneWidthsToViewport(base, window.innerWidth) : PANE_DEFAULT_WIDTH;
  }, [manualWidths, storedWidths, isMounted]);

  const widthsRef = useRef(widths);
  useEffect(() => {
    widthsRef.current = widths;
  }, [widths]);

  useEffect(() => {
    function handleResize() {
      setWidths(fitPaneWidthsToViewport(widthsRef.current, window.innerWidth));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }
    try {
      window.localStorage.setItem(PANE_LAYOUT_STORAGE_KEY, JSON.stringify(widths));
    } catch {
      // localStorage kan onbeschikbaar zijn (privémodus); de indeling werkt dan alleen binnen deze sessie.
    }
  }, [widths, isMounted]);

  const applyDrag = useCallback((clientX: number) => {
    const drag = dragRef.current;
    if (!drag) return;
    const delta = clientX - drag.startX;
    if (drag.divider === "nav-list") {
      const nav = clamp(drag.startWidths.nav + delta, PANE_MIN_WIDTH.nav, PANE_MAX_WIDTH.nav);
      const list = clamp(drag.startWidths.list - (nav - drag.startWidths.nav), PANE_MIN_WIDTH.list, PANE_MAX_WIDTH.list);
      setWidths({ ...drag.startWidths, nav, list });
      return;
    }
    const list = clamp(drag.startWidths.list + delta, PANE_MIN_WIDTH.list, PANE_MAX_WIDTH.list);
    const detail = clamp(
      drag.startWidths.detail - (list - drag.startWidths.list),
      PANE_MIN_WIDTH.detail,
      PANE_MAX_WIDTH.detail,
    );
    setWidths({ ...drag.startWidths, list, detail });
  }, []);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      applyDrag(event.clientX);
    }
    function handlePointerUp() {
      dragRef.current = null;
    }
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [applyDrag]);

  const startDrag = useCallback(
    (divider: "nav-list" | "list-detail") => (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      dragRef.current = { divider, startX: event.clientX, startWidths: widthsRef.current };
    },
    [],
  );

  const nudgeDivider = useCallback((divider: "nav-list" | "list-detail", deltaPx: number) => {
    const current = widthsRef.current;
    if (divider === "nav-list") {
      const nav = clamp(current.nav + deltaPx, PANE_MIN_WIDTH.nav, PANE_MAX_WIDTH.nav);
      const list = clamp(current.list - (nav - current.nav), PANE_MIN_WIDTH.list, PANE_MAX_WIDTH.list);
      setWidths({ ...current, nav, list });
      return;
    }
    const list = clamp(current.list + deltaPx, PANE_MIN_WIDTH.list, PANE_MAX_WIDTH.list);
    const detail = clamp(current.detail - (list - current.list), PANE_MIN_WIDTH.detail, PANE_MAX_WIDTH.detail);
    setWidths({ ...current, list, detail });
  }, []);

  const resetLayout = useCallback(() => {
    setWidths({ ...PANE_DEFAULT_WIDTH });
  }, []);

  return { widths, startDrag, nudgeDivider, resetLayout };
}

export type PlanningViewKey =
  | "today"
  | "week"
  | "tasks"
  | "appointments"
  | "email"
  | "whatsapp"
  | "waiting"
  | "completed";

type ViewKey = PlanningViewKey;

type MobilePane = "navigation" | "list" | "detail";
type EditorMode = "none" | "new-main" | "new-sub" | "edit-main" | "edit-sub";
type TaskStatus = "normal" | "active" | "waiting" | "completed" | "archived";
type RiskLevel = "attention" | "danger" | null;

type Subtask = {
  id: string;
  title: string;
  deadline: string;
  deadlineValue?: string;
  hardDeadline?: boolean;
  remaining: string;
  description?: string;
  state?: "active" | "blocked" | "waiting" | "done" | "planned" | "archived";
  databaseStatus?: string;
  estimatedMinutes?: number;
  remainingMinutes?: number;
  minimumBlockMinutes?: number;
  splittable?: boolean;
  priority?: number | null;
  context?: string;
};

type MainTask = {
  id: string;
  title: string;
  note: string;
  deadline: string;
  deadlineValue?: string;
  hardDeadline?: boolean;
  remaining: string;
  status: TaskStatus;
  risk: RiskLevel;
  riskText?: string;
  description: string;
  subtasks: Subtask[];
  databaseStatus?: string;
  estimatedMinutes?: number | null;
  remainingMinutes?: number | null;
};

type Appointment = {
  id: string;
  dateValue: string;
  durationMinutes: number;
  day: string;
  time: string;
  title: string;
  location: string;
  attendees: string;
  note: string;
};

type EmailCategory = "urgent" | "normal" | "newsletter";

type EmailProposal = {
  id: string;
  sender: string;
  subject: string;
  summary: string;
  proposal: string;
  confidence: string;
  source: string;
  category: EmailCategory;
  urgentReason?: string;
};

type WhatsAppMessage = {
  id: string;
  contact: string;
  preview: string;
  time: string;
  unread: boolean;
  needsAttention?: boolean;
  attentionReason?: string;
  thread: Array<{ from: "them" | "me"; text: string; time: string }>;
};

type LocalAttachment = {
  id: string;
  name: string;
  sizeLabel: string;
  mimeType: string;
  objectUrl?: string;
  sourceUrl?: string;
  storedFile?: boolean;
};

type TaskBoardData = Awaited<ReturnType<typeof getTaskBoardData>>;

const NAV_ITEMS: Array<{ id: ViewKey; label: string; icon: ViewKey }> = [
  { id: "today", label: "Vandaag", icon: "today" },
  { id: "week", label: "Week", icon: "week" },
  { id: "tasks", label: "Taken", icon: "tasks" },
  { id: "appointments", label: "Afspraken", icon: "appointments" },
  { id: "email", label: "E-mail", icon: "email" },
  { id: "whatsapp", label: "WhatsApp", icon: "whatsapp" },
  { id: "waiting", label: "Taken Mogelijk", icon: "waiting" },
  { id: "completed", label: "Taken Afgerond", icon: "completed" },
];

function toDeadlineValue(date: string, time: string) {
  return date ? `${date}T${time || DEFAULT_END_OF_WORKDAY}` : undefined;
}

function toVisualTaskStatus(status: string): TaskStatus {
  if (status === "ACTIVE") return "active";
  if (status === "WAITING" || status === "WAITING_EXTERNAL") return "waiting";
  if (status === "COMPLETED") return "completed";
  if (status === "ARCHIVED" || status === "CANCELLED") return "archived";
  return "normal";
}

function toVisualSubtaskState(status: string, blocked: boolean): Subtask["state"] {
  if (blocked) return "blocked";
  if (status === "ACTIVE") return "active";
  if (status === "WAITING" || status === "WAITING_EXTERNAL") return "waiting";
  if (status === "COMPLETED") return "done";
  if (status === "ARCHIVED" || status === "CANCELLED") return "archived";
  return "planned";
}

function mapTaskBoard(board: TaskBoardData): MainTask[] {
  return board.tasks.map((task) => ({
    id: task.id,
    title: task.title,
    note: `${task.openSubtaskCount} subtaken${task.blockedSubtaskCount > 0 ? ` · ${task.blockedSubtaskCount} geblokkeerd` : ""}`,
    deadline: task.deadline ?? "Geen deadline",
    deadlineValue: toDeadlineValue(task.deadlineDate, task.deadlineTime),
    remaining: task.remainingLabel,
    status: toVisualTaskStatus(task.status),
    risk: null,
    description: task.descriptionOriginal || "Nog geen omschrijving toegevoegd.",
    databaseStatus: task.status,
    estimatedMinutes: task.estimatedMinutes,
    remainingMinutes: task.remainingMinutes,
    subtasks: task.subtasks.map((subtask) => ({
      id: subtask.id,
      title: subtask.title,
      deadline: subtask.deadline ?? "Geen deadline",
      deadlineValue: toDeadlineValue(subtask.deadlineDate, subtask.deadlineTime),
      remaining: subtask.remainingLabel,
      description: subtask.descriptionOriginal || undefined,
      state: toVisualSubtaskState(subtask.status, subtask.blocked),
      databaseStatus: subtask.status,
      estimatedMinutes: subtask.estimatedMinutes,
      remainingMinutes: subtask.remainingMinutes,
      minimumBlockMinutes: subtask.minimumBlockMinutes,
      splittable: subtask.splittable,
      priority: subtask.priority,
      context: subtask.context ?? "",
    })),
  }));
}

function formatAttachmentSizeLabel(sizeBytes: number | null) {
  if (sizeBytes === null) return "Onbekende grootte";
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${Math.ceil(sizeBytes / 1024)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mapAttachmentBoard(attachments: AttachmentBoardData) {
  const taskAttachments: Record<string, LocalAttachment[]> = {};
  const subtaskAttachments: Record<string, LocalAttachment[]> = {};

  for (const attachment of attachments) {
    const mapped = {
      id: attachment.id,
      name: attachment.name,
      sizeLabel: formatAttachmentSizeLabel(attachment.sizeBytes),
      mimeType: attachment.mimeType,
      sourceUrl: attachment.sourceUrl ?? undefined,
      storedFile: attachment.hasStoredFile,
    };
    if (attachment.taskId) {
      taskAttachments[attachment.taskId] = [...(taskAttachments[attachment.taskId] ?? []), mapped];
    }
    if (attachment.subtaskId) {
      subtaskAttachments[attachment.subtaskId] = [...(subtaskAttachments[attachment.subtaskId] ?? []), mapped];
    }
  }

  return { taskAttachments, subtaskAttachments };
}

const EMAIL_PROPOSALS: EmailProposal[] = [
  {
    id: "invoice",
    sender: "boekhouder@voorbeeld.nl",
    subject: "Ontbrekende factuur juni — deadline dinsdag",
    summary: "De boekhouder mist één leveranciersfactuur in de administratie van juni.",
    proposal:
      "Maak een taak ‘Ontbrekende factuur juni aanleveren’ met deadline 21 juli en 15 minuten geschatte tijd.",
    confidence: "Hoge betrouwbaarheid",
    source:
      "Bij de controle van juni ontbreekt nog de factuur van de leverancier. Wil je die uiterlijk dinsdag aanleveren?",
    category: "urgent",
    urgentReason: "Financiële afhandeling met een harde deadline aanstaande dinsdag.",
  },
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
    category: "normal",
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
    category: "normal",
  },
  {
    id: "newsletter-vercel",
    sender: "updates@voorbeeldsaas.nl",
    subject: "Productnieuws: nieuwe functies deze maand",
    summary: "Maandelijks overzicht van nieuwe functies en verbeteringen.",
    proposal: "Geen taak voorgesteld — dit is een periodieke nieuwsbrief.",
    confidence: "Niet van toepassing",
    source: "Bekijk wat er deze maand nieuw is in jouw account. Uitschrijven kan onderaan deze e-mail.",
    category: "newsletter",
  },
  {
    id: "newsletter-brancheblad",
    sender: "nieuwsbrief@brancheblad.nl",
    subject: "Weekoverzicht transport en logistiek",
    summary: "Wekelijks overzicht van brancheartikelen en marktontwikkelingen.",
    proposal: "Geen taak voorgesteld — dit is een periodieke nieuwsbrief.",
    confidence: "Niet van toepassing",
    source: "Deze week: nieuwe regelgeving laadinfrastructuur en drie marktanalyses.",
    category: "newsletter",
  },
];

const WHATSAPP_MESSAGES: WhatsAppMessage[] = [
  {
    id: "erwin-wa",
    contact: "Erwin — Roodwilligen",
    preview: "Kun je morgenvroeg even bellen over de transformatorhuisje?",
    time: "vandaag 16:42",
    unread: true,
    needsAttention: true,
    attentionReason: "Vraagt om terugbellen vóór het locatiebezoek van morgen.",
    thread: [
      { from: "them", text: "Hoi Peter, heb je al iets gehoord van de netbeheerder?", time: "16:12" },
      { from: "me", text: "Nog niet, ik verwacht morgenochtend bericht.", time: "16:20" },
      { from: "them", text: "Kun je morgenvroeg even bellen over de transformatorhuisje?", time: "16:42" },
    ],
  },
  {
    id: "installateur-wa",
    contact: "Installateur laadpalen",
    preview: "Offerte is verstuurd, laat weten of je nog vragen hebt.",
    time: "vandaag 11:05",
    unread: true,
    thread: [
      { from: "them", text: "Offerte is verstuurd, laat weten of je nog vragen hebt.", time: "11:05" },
    ],
  },
  {
    id: "buurman-wa",
    contact: "Jan (buurman)",
    preview: "Bedankt voor het meedenken gisteren!",
    time: "gisteren 20:14",
    unread: false,
    thread: [
      { from: "them", text: "Bedankt voor het meedenken gisteren!", time: "20:14" },
      { from: "me", text: "Graag gedaan, succes ermee.", time: "20:20" },
    ],
  },
  {
    id: "boekhouder-wa",
    contact: "Boekhouder",
    preview: "Kun je de factuur van juni ook even appen ipv mailen?",
    time: "gisteren 09:30",
    unread: false,
    needsAttention: true,
    attentionReason: "Vraagt om dezelfde factuur die ook per e-mail als urgent is gemarkeerd.",
    thread: [
      { from: "them", text: "Kun je de factuur van juni ook even appen ipv mailen?", time: "09:30" },
    ],
  },
];

function NavIcon({ name }: { name: ViewKey }) {
  const paths: Record<ViewKey, ReactNode> = {
    today: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    week: <><rect x="3" y="5" width="18" height="16" rx="1" /><path d="M8 3v4m8-4v4M3 10h18M8 14h2m4 0h2m-8 4h2" /></>,
    tasks: <><path d="M8 6h12M8 12h12M8 18h8" /><path d="m3.5 6 1 1 2-2m-3 7 1 1 2-2m-3 7 1 1 2-2" /></>,
    appointments: <><rect x="3" y="5" width="18" height="16" rx="1" /><path d="M8 3v4m8-4v4M3 10h18m-9 3v4l2 1" /></>,
    email: <><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m4 7 8 6 8-6" /></>,
    whatsapp: <><path d="M4 20l1.3-3.9A8 8 0 1 1 8.9 19L4 20Z" /><path d="M8.5 9.5c.3 2.2 2.3 4.2 4.5 4.5" strokeLinecap="round" /></>,
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

const DEFAULT_END_OF_WORKDAY = "17:00";
const DAILY_TOTAL_MINUTES_LIMIT = 480;
const OUTLOOK_BOOKED_MINUTES_CACHE_MS = 60_000;
const outlookBookedMinutesCache = new Map<string, { bookedMinutes: number; expiresAt: number }>();
const outlookBookedMinutesRequests = new Map<string, Promise<number>>();

function parsePositiveMinutesInput(value: string, fieldName: "hoofdtaak" | "subtaak"): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(fieldName === "hoofdtaak" ? "INVALID_MAIN_PLANNED_MINUTES" : "INVALID_SUBTASK_PLANNED_MINUTES");
  }

  return parsed;
}

function parseMinutesFromLabel(label: string) {
  const trimmed = label.trim().toLowerCase();
  if (!trimmed || trimmed === "—" || trimmed === "nog te schatten") return "";

  const hourMatch = trimmed.match(/(\d+)u/);
  const minuteMatch = trimmed.match(/(\d+)m/);
  const hours = hourMatch ? Number.parseInt(hourMatch[1], 10) : 0;
  const minutes = minuteMatch ? Number.parseInt(minuteMatch[1], 10) : 0;
  const total = hours * 60 + minutes;

  if (total > 0) return String(total);
  return "";
}

function getTodayDateValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isPastDateValue(dateValue: string) {
  return dateValue < getTodayDateValue();
}

function splitDeadlineValue(value?: string) {
  if (!value) return { date: "", time: "" };
  if (value.includes("T")) {
    const [date, timePart] = value.split("T");
    return { date, time: timePart.slice(0, 5) };
  }
  return { date: value, time: "" };
}

function getAppointmentStartTimestamp(appointment: Appointment) {
  const startTime = appointment.time.split(/[-–]/)[0]?.trim() ?? "00:00";
  const parsed = new Date(`${appointment.dateValue}T${startTime}`).getTime();
  if (Number.isNaN(parsed)) return Number.POSITIVE_INFINITY;
  return parsed;
}

function getDeadlineTimestamp(value?: string) {
  if (!value) return Number.POSITIVE_INFINITY;
  const parsed = new Date(value).getTime();
  if (Number.isNaN(parsed)) return Number.POSITIVE_INFINITY;
  return parsed;
}

function sortByOldestDeadlineFirst<T extends { id: string; deadlineValue?: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    const byDate = getDeadlineTimestamp(a.deadlineValue) - getDeadlineTimestamp(b.deadlineValue);
    if (byDate !== 0) return byDate;
    return a.id.localeCompare(b.id);
  });
}

function taskStatusLabel(status: TaskStatus) {
  if (status === "active") return "Actief";
  if (status === "waiting") return "Wachten";
  if (status === "completed") return "Afgerond";
  if (status === "archived") return "Gearchiveerd";
  return null;
}

function subtaskStateLabel(state: Subtask["state"]) {
  if (state === "active") return "Actief";
  if (state === "blocked") return "Geblokkeerd";
  if (state === "waiting") return "Wachten";
  if (state === "done") return "Klaar";
  if (state === "planned") return "Gepland";
  if (state === "archived") return "Gearchiveerd";
  return null;
}

function isArchivedTask(task: MainTask) {
  return task.status === "archived";
}

function isCompletedBucketTask(task: MainTask) {
  return task.status === "completed" || task.status === "archived";
}

function isArchivedSubtask(subtask: Subtask) {
  return subtask.state === "archived";
}

function addDaysToDateValue(dateValue: string, days: number) {
  const parsed = new Date(`${dateValue}T00:00`);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  parsed.setDate(parsed.getDate() + days);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function fetchOutlookBookedMinutesForDate(dateValue: string) {
  const cached = outlookBookedMinutesCache.get(dateValue);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.bookedMinutes;
  }

  const activeRequest = outlookBookedMinutesRequests.get(dateValue);
  if (activeRequest) return activeRequest;

  const request = (async () => {
    const response = await fetch(`/api/outlook/calendar-booked-minutes?date=${encodeURIComponent(dateValue)}`, {
      method: "GET",
      cache: "no-store",
    });

    let payload: { bookedMinutes?: number; error?: string } | null = null;
    try {
      payload = await response.json() as { bookedMinutes?: number; error?: string };
    } catch {
      payload = null;
    }

    if (!response.ok) {
      throw new Error(payload?.error ?? "Outlook-agenda kon niet worden gecontroleerd.");
    }

    if (typeof payload?.bookedMinutes !== "number") {
      throw new Error("Outlook-agenda gaf een ongeldige reactie terug.");
    }

    outlookBookedMinutesCache.set(dateValue, {
      bookedMinutes: payload.bookedMinutes,
      expiresAt: Date.now() + OUTLOOK_BOOKED_MINUTES_CACHE_MS,
    });

    return payload.bookedMinutes;
  })().finally(() => outlookBookedMinutesRequests.delete(dateValue));

  outlookBookedMinutesRequests.set(dateValue, request);
  return request;
}

function resolveDailyLimitWithCarryOver(
  dateValue: string,
  plannedMinutes: number,
  otherPlannedWorkMinutes: number,
  hardDeadline: boolean,
  hardDeadlineLabel: string,
) {
  const cached = outlookBookedMinutesCache.get(dateValue);
  const appointmentMinutes = cached && cached.expiresAt > Date.now() ? cached.bookedMinutes : 0;
  if (!cached || cached.expiresAt <= Date.now()) {
    void fetchOutlookBookedMinutesForDate(dateValue).catch(() => undefined);
  }
  const workCapacity = Math.max(0, DAILY_TOTAL_MINUTES_LIMIT - appointmentMinutes);
  const remainingCapacity = Math.max(0, workCapacity - otherPlannedWorkMinutes);

  if (plannedMinutes <= remainingCapacity) {
    return {
      todayMinutes: plannedMinutes,
      carryOverMinutes: 0,
      carryOverDate: addDaysToDateValue(dateValue, 1),
    };
  }

  const carryOverMinutes = plannedMinutes - remainingCapacity;
  const carryOverDate = addDaysToDateValue(dateValue, 1);

  if (hardDeadline) {
    const shiftHardDeadline = window.confirm(
      `Harde deadline: ${hardDeadlineLabel}.\n` +
        `Op ${dateValue} is nog ${remainingCapacity} min vrij. ${carryOverMinutes} min moet doorschuiven naar ${carryOverDate}.\n\n` +
        "Wil je deze harde deadline toch opschuiven?",
    );

    if (!shiftHardDeadline) {
      return null;
    }

    return {
      todayMinutes: remainingCapacity,
      carryOverMinutes,
      carryOverDate,
    };
  }

  const accepted = window.confirm(
    `Op ${dateValue} is de daglimiet van ${DAILY_TOTAL_MINUTES_LIMIT} minuten bereikt of overschreden.\n` +
      `Afspraken: ${appointmentMinutes} min, al gepland werk: ${otherPlannedWorkMinutes} min, nog vrij: ${remainingCapacity} min.\n\n` +
      `Wil je ${carryOverMinutes} minuten meenemen naar ${carryOverDate}?`,
  );

  if (!accepted) return null;

  return {
    todayMinutes: remainingCapacity,
    carryOverMinutes,
    carryOverDate,
  };
}

const EMAIL_CATEGORY_LABEL: Record<EmailCategory, string> = {
  urgent: "Belangrijk / urgent",
  normal: "Normaal",
  newsletter: "Nieuwsbrief",
};

const EMAIL_CATEGORY_FILTERS: Array<{ id: EmailCategory | "all"; label: string }> = [
  { id: "all", label: "Alles" },
  { id: "urgent", label: "Belangrijk / urgent" },
  { id: "normal", label: "Normaal" },
  { id: "newsletter", label: "Nieuwsbrieven" },
];

type TakenVisualPrototypeProps = Readonly<{
  initialView: PlanningViewKey;
  initialTaskBoard: TaskBoardData;
  initialAttachmentBoard: AttachmentBoardData;
  userEmail: string;
  logoutAction: () => Promise<void>;
  revokeAllSessionsAction: () => Promise<void>;
}>;

export function TakenVisualPrototype({
  initialView,
  initialTaskBoard,
  initialAttachmentBoard,
  userEmail,
  logoutAction,
  revokeAllSessionsAction,
}: TakenVisualPrototypeProps) {
  const router = useRouter();
  const tasks = useMemo(() => mapTaskBoard(initialTaskBoard), [initialTaskBoard]);
  const initialAttachments = mapAttachmentBoard(initialAttachmentBoard);
  const { widths: paneWidths, startDrag, nudgeDivider, resetLayout } = usePaneLayout();
  const [activeView, setActiveView] = useState<ViewKey>(initialView);
  const [mobilePane, setMobilePane] = useState<MobilePane>("navigation");
  const [selectedTaskId, setSelectedTaskId] = useState(initialTaskBoard.selectedTask?.id ?? tasks[0]?.id ?? "");
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(initialTaskBoard.selectedSubtask?.id ?? null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [selectedEmailId, setSelectedEmailId] = useState("invoice");
  const [timerSeconds, setTimerSeconds] = useState(47 * 60 + 12);
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());
  const [editorMode, setEditorMode] = useState<EditorMode>("none");
  const [mainTaskError, setMainTaskError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [emailCategories, setEmailCategories] = useState<Record<string, EmailCategory>>(() =>
    Object.fromEntries(EMAIL_PROPOSALS.map((email) => [email.id, email.category])),
  );
  const [emailFilter, setEmailFilter] = useState<EmailCategory | "all">("all");
  const [unsubscribeSelection, setUnsubscribeSelection] = useState<Record<string, boolean>>({});
  const [selectedWhatsAppId, setSelectedWhatsAppId] = useState("erwin-wa");
  const [taskAttachments, setTaskAttachments] = useState<Record<string, LocalAttachment[]>>(initialAttachments.taskAttachments);
  const [subtaskAttachments, setSubtaskAttachments] = useState<Record<string, LocalAttachment[]>>(initialAttachments.subtaskAttachments);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const minimumDeadlineDate = getTodayDateValue();
  const newMainFormRef = useRef<HTMLFormElement | null>(null);
  const editMainFormRef = useRef<HTMLFormElement | null>(null);
  const newSubtaskFormRef = useRef<HTMLFormElement | null>(null);
  const editSubtaskFormRef = useRef<HTMLFormElement | null>(null);
  const taskAttachmentInputRef = useRef<HTMLInputElement | null>(null);
  const subtaskAttachmentInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setTimerSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const refreshNow = window.setInterval(() => setNowTimestamp(Date.now()), 60_000);
    return () => window.clearInterval(refreshNow);
  }, []);

  useEffect(() => {
    if (activeView !== "appointments") return;

    const controller = new AbortController();

    async function loadAppointments() {
      setAppointmentsLoading(true);
      setAppointmentsError(null);
      try {
        const response = await fetch("/api/outlook/appointments?days=84", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        const payload = (await response.json()) as { appointments?: Appointment[]; error?: string };

        if (!response.ok) {
          setAppointments([]);
          setSelectedAppointmentId(null);
          setAppointmentsError(payload.error ?? "Outlook-afspraken konden niet worden geladen.");
          return;
        }

        const nextAppointments = Array.isArray(payload.appointments) ? payload.appointments : [];
        setAppointments(nextAppointments);
        setSelectedAppointmentId((current) => current ?? nextAppointments[0]?.id ?? null);
      } catch (error) {
        if (controller.signal.aborted) return;
        setAppointments([]);
        setSelectedAppointmentId(null);
        setAppointmentsError(error instanceof Error ? error.message : "Outlook-afspraken konden niet worden geladen.");
      } finally {
        if (!controller.signal.aborted) {
          setAppointmentsLoading(false);
        }
      }
    }

    loadAppointments();

    return () => controller.abort();
  }, [activeView]);

  const visibleTasks = useMemo(() => {
    const filtered =
      activeView === "waiting"
        ? tasks.filter((task) => task.status === "waiting")
        : activeView === "completed"
          ? tasks.filter((task) => isCompletedBucketTask(task))
          : activeView === "today"
            ? tasks.filter((task) => task.status !== "completed" && !isArchivedTask(task))
            : tasks.filter((task) => task.status !== "completed" && !isArchivedTask(task));

    return sortByOldestDeadlineFirst(filtered);
  }, [activeView, tasks]);

  const selectedTask = useMemo(() => {
    const candidate = tasks.find((task) => task.id === selectedTaskId) ?? null;
    if (candidate && (activeView === "completed" ? isCompletedBucketTask(candidate) : !isArchivedTask(candidate))) {
      return candidate;
    }
    return visibleTasks.find((task) => task.id === selectedTaskId) ?? visibleTasks[0] ?? tasks.find((task) => !isArchivedTask(task)) ?? tasks[0] ?? null;
  }, [activeView, tasks, selectedTaskId, visibleTasks]);

  const visibleSubtasks = useMemo(() => {
    if (!selectedTask) return [];
    const filtered =
      activeView === "completed"
        ? selectedTask.subtasks
        : selectedTask.subtasks.filter((subtask) => !isArchivedSubtask(subtask));

    return sortByOldestDeadlineFirst(filtered);
  }, [activeView, selectedTask]);

  const selectedSubtask = useMemo(() => {
    if (visibleSubtasks.length === 0) return null;
    if (!selectedSubtaskId) return visibleSubtasks[0];
    return visibleSubtasks.find((subtask) => subtask.id === selectedSubtaskId) ?? visibleSubtasks[0];
  }, [selectedSubtaskId, visibleSubtasks]);

  useEffect(() => {
    const deadlineValue = editorMode === "edit-main"
      ? selectedTask?.deadlineValue
      : editorMode === "edit-sub"
        ? selectedSubtask?.deadlineValue
        : undefined;
    const dateValue = deadlineValue ? splitDeadlineValue(deadlineValue).date : "";

    if (dateValue) {
      void fetchOutlookBookedMinutesForDate(dateValue).catch(() => undefined);
    }
  }, [editorMode, selectedSubtask?.deadlineValue, selectedTask?.deadlineValue]);

  const sortedAppointments = useMemo(
    () => [...appointments].sort((a, b) => getAppointmentStartTimestamp(a) - getAppointmentStartTimestamp(b)),
    [appointments],
  );

  const upcomingAppointments = useMemo(() => {
    return sortedAppointments.filter((appointment) => getAppointmentStartTimestamp(appointment) >= nowTimestamp);
  }, [nowTimestamp, sortedAppointments]);

  const selectedAppointment = useMemo(() => {
    const pool = upcomingAppointments;
    if (pool.length === 0) return null;
    return pool.find((appointment) => appointment.id === selectedAppointmentId) ?? pool[0];
  }, [selectedAppointmentId, upcomingAppointments]);

  const emailsWithCurrentCategory = useMemo(
    () =>
      EMAIL_PROPOSALS.map((email) => ({
        ...email,
        category: emailCategories[email.id] ?? email.category,
      })),
    [emailCategories],
  );
  const visibleEmails = useMemo(
    () =>
      emailFilter === "all"
        ? emailsWithCurrentCategory
        : emailsWithCurrentCategory.filter((email) => email.category === emailFilter),
    [emailsWithCurrentCategory, emailFilter],
  );
  const selectedEmail =
    visibleEmails.find((email) => email.id === selectedEmailId) ?? visibleEmails[0] ?? emailsWithCurrentCategory[0];
  const selectedNewsletters = emailsWithCurrentCategory.filter(
    (email) => email.category === "newsletter" && unsubscribeSelection[email.id],
  );

  const selectedWhatsApp =
    WHATSAPP_MESSAGES.find((message) => message.id === selectedWhatsAppId) ?? WHATSAPP_MESSAGES[0];

  const currentKind =
    activeView === "appointments"
      ? "appointments"
      : activeView === "email"
        ? "email"
        : activeView === "whatsapp"
          ? "whatsapp"
          : "tasks";
  const viewTitle: Record<ViewKey, string> = {
    today: "Vandaag",
    week: "Deze week",
    tasks: "Taken",
    appointments: "Afspraken",
    email: "E-mail",
    whatsapp: "WhatsApp",
    waiting: "Taken Mogelijk",
    completed: "Taken Afgerond",
  };

  function getActiveEditorForm() {
    if (editorMode === "new-main") return newMainFormRef.current;
    if (editorMode === "edit-main") return editMainFormRef.current;
    if (editorMode === "new-sub") return newSubtaskFormRef.current;
    if (editorMode === "edit-sub") return editSubtaskFormRef.current;
    return null;
  }

  function runWithEditorCloseGuard(action: () => void) {
    if (editorMode === "none" || !hasUnsavedChanges) {
      action();
      return;
    }

    const wantsToSave = window.confirm("Je hebt niet-opgeslagen wijzigingen. Wil je eerst opslaan?");
    if (wantsToSave) {
      getActiveEditorForm()?.requestSubmit();
      return;
    }

    setHasUnsavedChanges(false);
    action();
  }

  function selectView(view: ViewKey) {
    runWithEditorCloseGuard(() => {
      setActiveView(view);
      const nextTask = view === "completed"
        ? tasks.find((task) => isCompletedBucketTask(task))
        : view === "waiting"
          ? tasks.find((task) => task.status === "waiting")
          : tasks.find((task) => task.status !== "completed" && !isArchivedTask(task));
      if (view !== "appointments" && view !== "email" && view !== "whatsapp") {
        setSelectedTaskId(nextTask?.id ?? "");
      }
      setMobilePane("list");
      setEditorMode("none");
      setHasUnsavedChanges(false);
      setSelectedSubtaskId(null);
      setMainTaskError(null);
      setDetailsOpen(false);
      setSourceOpen(false);
      setFormError(null);
      setFeedback(null);
    });
  }

  function selectTask(taskId: string) {
    runWithEditorCloseGuard(() => {
      const isSameTask = selectedTaskId === taskId;
      const isMainEditorOpen = editorMode === "edit-main";

      if (isSameTask && isMainEditorOpen) {
        setEditorMode("none");
        setHasUnsavedChanges(false);
        setMainTaskError(null);
        setFormError(null);
        setFeedback(null);
        return;
      }

      setSelectedTaskId(taskId);
      const task = tasks.find((item) => item.id === taskId);
      setSelectedSubtaskId(task?.subtasks[0]?.id ?? null);
      setEditorMode("edit-main");
      setHasUnsavedChanges(false);
      setMainTaskError(null);
      setDetailsOpen(false);
      setFormError(null);
      setFeedback(null);
      setMobilePane("detail");
    });
  }

  function selectSubtask(subtaskId: string) {
    runWithEditorCloseGuard(() => {
      const isSameSubtask = selectedSubtask?.id === subtaskId;
      const isSubEditorOpen = editorMode === "edit-sub";

      if (isSameSubtask && isSubEditorOpen) {
        setEditorMode("none");
        setHasUnsavedChanges(false);
        setFormError(null);
        setFeedback(null);
        return;
      }

      setSelectedSubtaskId(subtaskId);
      setEditorMode("edit-sub");
      setHasUnsavedChanges(false);
      setDetailsOpen(true);
      setFeedback(null);
    });
  }

  function openTodoImportPreview() {
    window.open("/todo-import-preview", "_blank", "noopener,noreferrer");
  }

  function openTaskAttachmentPicker() {
    if (!selectedTask) return;
    taskAttachmentInputRef.current?.click();
  }

  function openSubtaskAttachmentPicker() {
    if (!selectedSubtask) return;
    subtaskAttachmentInputRef.current?.click();
  }

  async function uploadAttachment(file: File, target: { taskId: string } | { subtaskId: string }) {
    const mimeType = file.type || "application/octet-stream";
    const targetPath = "taskId" in target
      ? `manual/task/${target.taskId}`
      : `manual/subtask/${target.subtaskId}`;
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-") || "document";
    const blob = await upload(`${targetPath}/${crypto.randomUUID()}-${safeFileName}`, file, {
      access: "private",
      handleUploadUrl: "/api/attachments/upload",
      contentType: mimeType,
      clientPayload: JSON.stringify({
        target,
        originalFileName: file.name,
        mimeType,
        sizeBytes: file.size,
      }),
      onUploadProgress: ({ percentage }) => {
        setFeedback(`${file.name} uploaden: ${Math.round(percentage)}%`);
      },
    });

    const response = await fetch("/api/attachments/finalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target,
        blobPath: blob.pathname,
        originalFileName: file.name,
        mimeType,
        sizeBytes: file.size,
      }),
    });
    const result = await response.json() as {
      attachment?: { id: string; name: string | null; mimeType: string | null; sizeBytes: number | null };
      error?: string;
    };
    if (!response.ok || !result.attachment) {
      throw new Error(result.error ?? "Document bevestigen is mislukt.");
    }

    return {
      id: result.attachment.id,
      name: result.attachment.name ?? file.name,
      sizeLabel: formatAttachmentSizeLabel(result.attachment.sizeBytes),
      mimeType: result.attachment.mimeType ?? mimeType,
      storedFile: true,
    } satisfies LocalAttachment;
  }

  async function handleTaskAttachmentSelect(event: ChangeEvent<HTMLInputElement>) {
    if (!selectedTask) return;
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        const attachment = await uploadAttachment(file, { taskId: selectedTask.id });
        setTaskAttachments((current) => ({
          ...current,
          [selectedTask.id]: [...(current[selectedTask.id] ?? []), attachment],
        }));
      }
      setFeedback(files.length === 1 ? "Document opgeslagen." : `${files.length} documenten opgeslagen.`);
      startTransition(() => router.refresh());
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Document uploaden is mislukt.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubtaskAttachmentSelect(event: ChangeEvent<HTMLInputElement>) {
    if (!selectedSubtask) return;
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of files) {
        const attachment = await uploadAttachment(file, { subtaskId: selectedSubtask.id });
        setSubtaskAttachments((current) => ({
          ...current,
          [selectedSubtask.id]: [...(current[selectedSubtask.id] ?? []), attachment],
        }));
      }
      setFeedback(files.length === 1 ? "Document opgeslagen." : `${files.length} documenten opgeslagen.`);
      startTransition(() => router.refresh());
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Document uploaden is mislukt.");
    } finally {
      setIsUploading(false);
    }
  }

  function openLocalAttachment(attachment: LocalAttachment) {
    if (attachment.storedFile) {
      window.open(`/api/attachments/${encodeURIComponent(attachment.id)}/download`, "_blank", "noopener,noreferrer");
      return;
    }
    const url = attachment.sourceUrl ?? attachment.objectUrl;
    if (!url) {
      setFeedback("Dit bestand kan niet worden geopend.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function finishSuccessfulSave(actionState: TaskActionState) {
    setEditorMode("none");
    setHasUnsavedChanges(false);
    setIsSaving(false);
    setFeedback(`Opgeslagen${actionState.serverDurationMs !== undefined ? ` in ${actionState.serverDurationMs} ms` : ""}.`);
    startTransition(() => router.refresh());
  }

  async function performSave(
    action: () => Promise<TaskActionState>,
    setError: (message: string) => void,
  ) {
    setIsSaving(true);
    try {
      const actionState = await action();
      if (actionState.error) {
        setError(actionState.error);
        setIsSaving(false);
        return null;
      }
      return actionState;
    } catch {
      setError("Opslaan mislukt. Controleer de verbinding en probeer het opnieuw.");
      setIsSaving(false);
      return null;
    }
  }

  async function updateMainTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTask) return;
    const formData = new FormData(event.currentTarget);
    formData.set("taskId", selectedTask.id);
    formData.set("descriptionOriginal", String(formData.get("description") ?? ""));
    formData.set("estimatedMinutes", String(formData.get("plannedMinutes") ?? ""));
    formData.set("remainingMinutes", String(formData.get("plannedMinutes") ?? ""));
    formData.set("status", selectedTask.databaseStatus ?? "OPEN");
    const title = String(formData.get("title") ?? "").trim();
    const deadlineDate = String(formData.get("deadlineDate") ?? "").trim();
    const deadlineTime = String(formData.get("deadlineTime") ?? "").trim();
    const hardDeadline = formData.get("hardDeadline") === "on";
    const plannedMinutesRaw = String(formData.get("plannedMinutes") ?? "").trim();

    if (!title) {
      setFormError("Vul een titel in.");
      return;
    }
    if (deadlineTime && !deadlineDate) {
      setFormError("Vul eerst een datum in voordat je een tijd invult.");
      return;
    }
    if (deadlineDate && isPastDateValue(deadlineDate)) {
      setFormError("Kies vandaag of een toekomstige datum.");
      return;
    }

    let plannedMinutes: number | null;
    try {
      plannedMinutes = parsePositiveMinutesInput(plannedMinutesRaw, "hoofdtaak");
    } catch {
      setFormError("Geplande tijd voor de hoofdtaak moet een positief aantal minuten zijn.");
      return;
    }

    const effectiveTime = deadlineTime || DEFAULT_END_OF_WORKDAY;
    let effectiveDeadlineDate = deadlineDate;
    const existingMainTaskMinutes = Number.parseInt(parseMinutesFromLabel(selectedTask.remaining), 10) || 0;
    const requestedMainTaskMinutes = plannedMinutes ?? existingMainTaskMinutes;
    let effectivePlannedMinutes: number | null = requestedMainTaskMinutes > 0 ? requestedMainTaskMinutes : plannedMinutes;
    let carryOverTask: { minutes: number; date: string } | null = null;

    if (deadlineDate && requestedMainTaskMinutes > 0) {
      const currentTaskMinutes = taskOwnPlannedMinutesOnDate(selectedTask, deadlineDate);
      const otherPlannedWorkMinutes = Math.max(0, totalPlannedWorkMinutesForDate(tasks, deadlineDate) - currentTaskMinutes);
      let split: Awaited<ReturnType<typeof resolveDailyLimitWithCarryOver>>;

      try {
        split = await resolveDailyLimitWithCarryOver(
          deadlineDate,
          requestedMainTaskMinutes,
          otherPlannedWorkMinutes,
          hardDeadline,
          `Hoofdtaak \"${title}\"`,
        );
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Outlook-agenda kon niet worden gecontroleerd.");
        return;
      }

      if (!split) {
        setFormError("Opslaan geannuleerd. Kies een andere dag of bevestig het meenemen naar de volgende dag.");
        return;
      }

      if (split.todayMinutes <= 0) {
        effectiveDeadlineDate = split.carryOverDate;
      } else {
        effectivePlannedMinutes = split.todayMinutes;
        if (split.carryOverMinutes > 0) {
          carryOverTask = { minutes: split.carryOverMinutes, date: split.carryOverDate };
        }
      }
    }

    if (effectiveDeadlineDate) {
      const parsed = new Date(`${effectiveDeadlineDate}T${effectiveTime}`);
      if (Number.isNaN(parsed.getTime())) {
        setFormError("Kies een geldige deadline.");
        return;
      }
    }

    if (carryOverTask) {
      setFormError("Gedeeltelijk doorschuiven kan nog niet veilig worden opgeslagen. Kies een andere dag of pas de geplande tijd aan.");
      return;
    }
    formData.set("deadlineDate", effectiveDeadlineDate);
    formData.set("estimatedMinutes", effectivePlannedMinutes === null ? "" : String(effectivePlannedMinutes));
    formData.set("remainingMinutes", effectivePlannedMinutes === null ? "" : String(effectivePlannedMinutes));
    const actionState = await performSave(
      () => saveTaskAction(initialTaskActionState, formData),
      setFormError,
    );
    if (!actionState) return;
    finishSuccessfulSave(actionState);
  }

  async function updateSubtask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTask || !selectedSubtask) return;

    const formData = new FormData(event.currentTarget);
    formData.set("taskId", selectedTask.id);
    formData.set("subtaskId", selectedSubtask.id);
    formData.set("descriptionOriginal", String(formData.get("description") ?? ""));
    formData.set("estimatedMinutes", String(formData.get("plannedMinutes") ?? ""));
    formData.set("remainingMinutes", String(formData.get("plannedMinutes") ?? ""));
    formData.set("minimumBlockMinutes", String(selectedSubtask.minimumBlockMinutes ?? 15));
    formData.set("splittable", selectedSubtask.splittable ? "on" : "");
    formData.set("priority", selectedSubtask.priority === null || selectedSubtask.priority === undefined ? "" : String(selectedSubtask.priority));
    formData.set("context", selectedSubtask.context ?? "");
    formData.set("status", selectedSubtask.databaseStatus ?? "OPEN");
    const title = String(formData.get("title") ?? "").trim();
    const deadlineDate = String(formData.get("deadlineDate") ?? "").trim();
    const deadlineTime = String(formData.get("deadlineTime") ?? "").trim();
    const hardDeadline = formData.get("hardDeadline") === "on";
    const plannedMinutesRaw = String(formData.get("plannedMinutes") ?? "").trim();

    if (!title) {
      setFormError("Vul een titel in.");
      return;
    }
    if (deadlineDate && isPastDateValue(deadlineDate)) {
      setFormError("Kies vandaag of een toekomstige datum.");
      return;
    }

    let plannedMinutes: number | null;
    try {
      plannedMinutes = parsePositiveMinutesInput(plannedMinutesRaw, "subtaak");
    } catch {
      setFormError("Geplande tijd voor de subtaak moet een positief aantal minuten zijn.");
      return;
    }

    if (plannedMinutes === null) {
      setFormError("Vul geplande tijd in minuten in voor deze subtaak.");
      return;
    }

    if (deadlineTime && !deadlineDate) {
      setFormError("Vul eerst een datum in voordat je een tijd invult.");
      return;
    }

    const effectiveTime = deadlineTime || DEFAULT_END_OF_WORKDAY;
    let effectiveDeadlineDate = deadlineDate;
    let effectivePlannedMinutes = plannedMinutes;
    let carryOverSubtask: { minutes: number; date: string } | null = null;

    if (deadlineDate) {
      const currentSubtaskMinutes = subtaskPlannedMinutesOnDate(selectedSubtask, deadlineDate);
      const otherPlannedWorkMinutes = Math.max(0, totalPlannedWorkMinutesForDate(tasks, deadlineDate) - currentSubtaskMinutes);
      let split: Awaited<ReturnType<typeof resolveDailyLimitWithCarryOver>>;

      try {
        split = await resolveDailyLimitWithCarryOver(
          deadlineDate,
          plannedMinutes,
          otherPlannedWorkMinutes,
          hardDeadline,
          `Subtaak \"${title}\"`,
        );
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Outlook-agenda kon niet worden gecontroleerd.");
        return;
      }

      if (!split) {
        setFormError("Opslaan geannuleerd. Kies een andere dag of bevestig het meenemen naar de volgende dag.");
        return;
      }

      if (split.todayMinutes <= 0) {
        effectiveDeadlineDate = split.carryOverDate;
      } else {
        effectivePlannedMinutes = split.todayMinutes;
        if (split.carryOverMinutes > 0) {
          carryOverSubtask = { minutes: split.carryOverMinutes, date: split.carryOverDate };
        }
      }
    }

    const childComparable = effectiveDeadlineDate
      ? new Date(`${effectiveDeadlineDate}T${effectiveTime}`)
      : null;
    if (childComparable && Number.isNaN(childComparable.getTime())) {
      setFormError("Kies een geldige deadline.");
      return;
    }

    if (childComparable && selectedTask.deadlineValue) {
      const parent = splitDeadlineValue(selectedTask.deadlineValue);
      if (parent.date && isPastDateValue(parent.date)) {
        setFormError("De hoofdtaakdeadline ligt in het verleden. Pas eerst de hoofdtaak aan naar vandaag of later.");
        return;
      }
      const parentComparable = new Date(`${parent.date}T${parent.time || DEFAULT_END_OF_WORKDAY}`);
      if (childComparable.getTime() > parentComparable.getTime()) {
        setFormError(`Kies een deadline op of vóór ${selectedTask.deadline}.`);
        return;
      }

      if (carryOverSubtask) {
        const carryComparable = new Date(`${carryOverSubtask.date}T${effectiveTime}`);
        if (carryComparable.getTime() > parentComparable.getTime()) {
          setFormError("De daglimiet wordt overschreden, maar doorschuiven kan niet voorbij de deadline van de hoofdtaak.");
          return;
        }
      }
    }

    if (carryOverSubtask) {
      setFormError("Gedeeltelijk doorschuiven kan nog niet veilig worden opgeslagen. Kies een andere dag of pas de geplande tijd aan.");
      return;
    }
    formData.set("deadlineDate", effectiveDeadlineDate);
    formData.set("estimatedMinutes", String(effectivePlannedMinutes));
    formData.set("remainingMinutes", String(effectivePlannedMinutes));
    const actionState = await performSave(
      () => saveSubtaskAction(initialTaskActionState, formData),
      setFormError,
    );
    if (!actionState) return;
    finishSuccessfulSave(actionState);
  }

  async function addMainTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("descriptionOriginal", String(formData.get("description") ?? ""));
    formData.set("estimatedMinutes", String(formData.get("plannedMinutes") ?? ""));
    formData.set("remainingMinutes", String(formData.get("plannedMinutes") ?? ""));
    formData.set("status", "OPEN");
    const title = String(formData.get("title") ?? "").trim();
    const deadlineDate = String(formData.get("deadlineDate") ?? "").trim();
    const deadlineTime = String(formData.get("deadlineTime") ?? "").trim();
    const hardDeadline = formData.get("hardDeadline") === "on";
    const plannedMinutesRaw = String(formData.get("plannedMinutes") ?? "").trim();

    if (!title) {
      setMainTaskError("Vul een titel in.");
      return;
    }

    if (deadlineTime && !deadlineDate) {
      setMainTaskError("Vul eerst een datum in voordat je een tijd invult.");
      return;
    }
    if (deadlineDate && isPastDateValue(deadlineDate)) {
      setMainTaskError("Kies vandaag of een toekomstige datum.");
      return;
    }

    let plannedMinutes: number | null;
    try {
      plannedMinutes = parsePositiveMinutesInput(plannedMinutesRaw, "hoofdtaak");
    } catch {
      setMainTaskError("Geplande tijd voor de hoofdtaak moet een positief aantal minuten zijn.");
      return;
    }

    const effectiveTime = deadlineTime || DEFAULT_END_OF_WORKDAY;
    let effectiveDeadlineDate = deadlineDate;
    let effectivePlannedMinutes = plannedMinutes;
    let carryOverTask: { minutes: number; date: string } | null = null;

    if (deadlineDate && plannedMinutes !== null) {
      const otherPlannedWorkMinutes = totalPlannedWorkMinutesForDate(tasks, deadlineDate);
      let split: Awaited<ReturnType<typeof resolveDailyLimitWithCarryOver>>;

      try {
        split = await resolveDailyLimitWithCarryOver(
          deadlineDate,
          plannedMinutes,
          otherPlannedWorkMinutes,
          hardDeadline,
          `Hoofdtaak \"${title}\"`,
        );
      } catch (error) {
        setMainTaskError(error instanceof Error ? error.message : "Outlook-agenda kon niet worden gecontroleerd.");
        return;
      }

      if (!split) {
        setMainTaskError("Opslaan geannuleerd. Kies een andere dag of bevestig het meenemen naar de volgende dag.");
        return;
      }

      if (split.todayMinutes <= 0) {
        effectiveDeadlineDate = split.carryOverDate;
      } else {
        effectivePlannedMinutes = split.todayMinutes;
        if (split.carryOverMinutes > 0) {
          carryOverTask = { minutes: split.carryOverMinutes, date: split.carryOverDate };
        }
      }
    }

    if (effectiveDeadlineDate) {
      const parsed = new Date(
        `${effectiveDeadlineDate}T${effectiveTime}`,
      );
      if (Number.isNaN(parsed.getTime())) {
        setMainTaskError("Kies een geldige deadline.");
        return;
      }
    }

    if (carryOverTask) {
      setMainTaskError("Gedeeltelijk doorschuiven kan nog niet veilig worden opgeslagen. Kies een andere dag of pas de geplande tijd aan.");
      return;
    }
    formData.set("deadlineDate", effectiveDeadlineDate);
    formData.set("estimatedMinutes", effectivePlannedMinutes === null ? "" : String(effectivePlannedMinutes));
    formData.set("remainingMinutes", effectivePlannedMinutes === null ? "" : String(effectivePlannedMinutes));
    const actionState = await performSave(
      () => saveTaskAction(initialTaskActionState, formData),
      setMainTaskError,
    );
    if (!actionState) return;
    finishSuccessfulSave(actionState);
  }

  async function addSubtask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTask) return;
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("taskId", selectedTask.id);
    formData.set("descriptionOriginal", String(formData.get("description") ?? ""));
    formData.set("estimatedMinutes", String(formData.get("plannedMinutes") ?? ""));
    formData.set("remainingMinutes", String(formData.get("plannedMinutes") ?? ""));
    formData.set("minimumBlockMinutes", "15");
    formData.set("status", "OPEN");
    const title = String(formData.get("title") ?? "").trim();
    const deadlineDate = String(formData.get("deadlineDate") ?? "").trim();
    const deadlineTime = String(formData.get("deadlineTime") ?? "").trim();
    const hardDeadline = formData.get("hardDeadline") === "on";
    const plannedMinutesRaw = String(formData.get("plannedMinutes") ?? "").trim();

    if (!title) {
      setFormError("Vul een titel in.");
      return;
    }
    if (deadlineDate && isPastDateValue(deadlineDate)) {
      setFormError("Kies vandaag of een toekomstige datum.");
      return;
    }

    let plannedMinutes: number | null;
    try {
      plannedMinutes = parsePositiveMinutesInput(plannedMinutesRaw, "subtaak");
    } catch {
      setFormError("Geplande tijd voor de subtaak moet een positief aantal minuten zijn.");
      return;
    }

    if (plannedMinutes === null) {
      setFormError("Vul geplande tijd in minuten in voor deze subtaak.");
      return;
    }

    if (deadlineTime && !deadlineDate) {
      setFormError("Vul eerst een datum in voordat je een tijd invult.");
      return;
    }

    const effectiveSubtaskTime = deadlineTime || DEFAULT_END_OF_WORKDAY;
    let effectiveDeadlineDate = deadlineDate;
    let effectivePlannedMinutes = plannedMinutes;
    let carryOverSubtask: { minutes: number; date: string } | null = null;

    if (deadlineDate) {
      const otherPlannedWorkMinutes = totalPlannedWorkMinutesForDate(tasks, deadlineDate);
      let split: Awaited<ReturnType<typeof resolveDailyLimitWithCarryOver>>;

      try {
        split = await resolveDailyLimitWithCarryOver(
          deadlineDate,
          plannedMinutes,
          otherPlannedWorkMinutes,
          hardDeadline,
          `Subtaak \"${title}\"`,
        );
      } catch (error) {
        setFormError(error instanceof Error ? error.message : "Outlook-agenda kon niet worden gecontroleerd.");
        return;
      }

      if (!split) {
        setFormError("Opslaan geannuleerd. Kies een andere dag of bevestig het meenemen naar de volgende dag.");
        return;
      }

      if (split.todayMinutes <= 0) {
        effectiveDeadlineDate = split.carryOverDate;
      } else {
        effectivePlannedMinutes = split.todayMinutes;
        if (split.carryOverMinutes > 0) {
          carryOverSubtask = { minutes: split.carryOverMinutes, date: split.carryOverDate };
        }
      }
    }

    const childComparable = effectiveDeadlineDate
      ? new Date(`${effectiveDeadlineDate}T${effectiveSubtaskTime}`)
      : null;
    if (childComparable && Number.isNaN(childComparable.getTime())) {
      setFormError("Kies een geldige deadline.");
      return;
    }

    if (childComparable && selectedTask.deadlineValue) {
      const parent = splitDeadlineValue(selectedTask.deadlineValue);
      if (parent.date && isPastDateValue(parent.date)) {
        setFormError("De hoofdtaakdeadline ligt in het verleden. Pas eerst de hoofdtaak aan naar vandaag of later.");
        return;
      }
      const parentComparable = new Date(
        `${parent.date}T${parent.time || DEFAULT_END_OF_WORKDAY}`,
      );
      if (childComparable.getTime() > parentComparable.getTime()) {
        setFormError(`Kies een deadline op of vóór ${selectedTask.deadline}.`);
        return;
      }

      if (carryOverSubtask) {
        const carryComparable = new Date(`${carryOverSubtask.date}T${effectiveSubtaskTime}`);
        if (carryComparable.getTime() > parentComparable.getTime()) {
          setFormError("De daglimiet wordt overschreden, maar doorschuiven kan niet voorbij de deadline van de hoofdtaak.");
          return;
        }
      }
    }

    if (carryOverSubtask) {
      setFormError("Gedeeltelijk doorschuiven kan nog niet veilig worden opgeslagen. Kies een andere dag of pas de geplande tijd aan.");
      return;
    }
    formData.set("deadlineDate", effectiveDeadlineDate);
    formData.set("estimatedMinutes", String(effectivePlannedMinutes));
    formData.set("remainingMinutes", String(effectivePlannedMinutes));
    const actionState = await performSave(
      () => saveSubtaskAction(initialTaskActionState, formData),
      setFormError,
    );
    if (!actionState) return;
    finishSuccessfulSave(actionState);
  }

  function deleteMainTask() {
    setFeedback("Definitief verwijderen is niet beschikbaar. Archiveer de hoofdtaak om deze uit de open lijst te halen.");
  }

  function deleteSubtask() {
    setFeedback("Definitief verwijderen is niet beschikbaar. Archiveer de subtaak om deze uit de open lijst te halen.");
  }

  async function archiveMainTask(taskId: string) {
    const formData = new FormData();
    formData.set("taskId", taskId);
    const actionState = await archiveTaskAction(initialTaskActionState, formData);
    if (actionState.error) setMainTaskError(actionState.error);
  }

  async function restoreMainTask(taskId: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    const deadline = splitDeadlineValue(task.deadlineValue);
    const formData = new FormData();
    formData.set("taskId", task.id);
    formData.set("title", task.title);
    formData.set("descriptionOriginal", task.description === "Nog geen omschrijving toegevoegd." ? "" : task.description);
    formData.set("deadlineDate", deadline.date);
    formData.set("deadlineTime", deadline.time);
    formData.set("estimatedMinutes", task.estimatedMinutes === null || task.estimatedMinutes === undefined ? "" : String(task.estimatedMinutes));
    formData.set("remainingMinutes", task.remainingMinutes === null || task.remainingMinutes === undefined ? "" : String(task.remainingMinutes));
    formData.set("status", "OPEN");
    const actionState = await saveTaskAction(initialTaskActionState, formData);
    if (actionState.error) setMainTaskError(actionState.error);
  }

  async function archiveSubtask(subtaskId: string) {
    const formData = new FormData();
    formData.set("subtaskId", subtaskId);
    const actionState = await archiveSubtaskAction(initialTaskActionState, formData);
    if (actionState.error) setFormError(actionState.error);
  }

  async function restoreSubtask(subtaskId: string) {
    if (!selectedTask || isCompletedBucketTask(selectedTask)) {
      setFeedback("Dearchiveer eerst de hoofdtaak. Daarna kun je subtaken terugzetten.");
      return;
    }
    const subtask = selectedTask.subtasks.find((item) => item.id === subtaskId);
    if (!subtask) return;
    const deadline = splitDeadlineValue(subtask.deadlineValue);
    const formData = new FormData();
    formData.set("taskId", selectedTask.id);
    formData.set("subtaskId", subtask.id);
    formData.set("title", subtask.title);
    formData.set("descriptionOriginal", subtask.description ?? "");
    formData.set("deadlineDate", deadline.date);
    formData.set("deadlineTime", deadline.time);
    formData.set("estimatedMinutes", String(subtask.estimatedMinutes ?? 1));
    formData.set("remainingMinutes", String(subtask.remainingMinutes ?? 0));
    formData.set("minimumBlockMinutes", String(subtask.minimumBlockMinutes ?? 15));
    formData.set("splittable", subtask.splittable ? "on" : "");
    formData.set("priority", subtask.priority === null || subtask.priority === undefined ? "" : String(subtask.priority));
    formData.set("context", subtask.context ?? "");
    formData.set("status", "OPEN");
    const actionState = await saveSubtaskAction(initialTaskActionState, formData);
    if (actionState.error) setFormError(actionState.error);
  }

  function selectEmail(emailId: string) {
    setSelectedEmailId(emailId);
    setSourceOpen(false);
    setFeedback(null);
    setMobilePane("detail");
  }

  function setEmailCategory(emailId: string, category: EmailCategory) {
    setEmailCategories((current) => ({ ...current, [emailId]: category }));
    if (category !== "newsletter") {
      setUnsubscribeSelection((current) => {
        if (!current[emailId]) return current;
        const next = { ...current };
        delete next[emailId];
        return next;
      });
    }
    setFeedback(`Categorie lokaal gewijzigd naar “${EMAIL_CATEGORY_LABEL[category]}”.`);
  }

  function toggleUnsubscribeSelection(emailId: string) {
    setUnsubscribeSelection((current) => ({ ...current, [emailId]: !current[emailId] }));
  }

  function unsubscribeSelectedNewsletters() {
    const count = selectedNewsletters.length;
    if (count === 0) return;
    setFeedback(
      `Voorbeeldactie: ${count} ${count === 1 ? "nieuwsbrief is" : "nieuwsbrieven zijn"} gemarkeerd voor afmelding. Er is nog niets echt afgemeld of verzonden.`,
    );
    setUnsubscribeSelection({});
  }

  function selectWhatsApp(messageId: string) {
    setSelectedWhatsAppId(messageId);
    setMobilePane("detail");
  }

  const shellStyle = {
    "--nav-width": `${paneWidths.nav}px`,
    "--list-width": `${paneWidths.list}px`,
    "--detail-width": `${paneWidths.detail}px`,
  } as CSSProperties;

  return (
    <main className={styles.page}>
      <div className={styles.shell} data-mobile-pane={mobilePane} style={shellStyle}>
        <aside className={styles.navPane} aria-label="Hoofdnavigatie">
          <div>
            <div className={styles.brand}>
              <span className={styles.brandMark} aria-hidden="true">M</span>
              <span>
                <strong>MijnPlanning</strong>
                <small>Persoonlijke planning</small>
              </span>
            </div>

            <nav className={styles.navigation}>
              {NAV_ITEMS.map((item, index) => (
                <div key={item.id} className={index === 3 || index === 6 ? styles.navDivider : undefined}>
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
              <div className={styles.navDivider}>
                <button type="button" className={styles.navButton} onClick={openTodoImportPreview}>
                  <span>To Do importpreview</span>
                </button>
              </div>
            </nav>
          </div>

          <div className={styles.navFooter}>
            <section className={styles.accountPanel} aria-label="Account en sessies">
              <span className={styles.accountLabel}>Ingelogd als</span>
              <span className={styles.accountEmail} title={userEmail}>
                {userEmail}
              </span>
              <div className={styles.accountActions}>
                <form action={logoutAction}>
                  <button type="submit" className={styles.logoutButton}>
                    Uitloggen
                  </button>
                </form>
                <form action={revokeAllSessionsAction}>
                  <button type="submit" className={styles.revokeButton}>
                    Op alle apparaten uitloggen
                  </button>
                </form>
              </div>
            </section>
            <button type="button" className={styles.resetLayoutButton} onClick={resetLayout}>
              Kolombreedtes herstellen
            </button>
            <p className={styles.prototypeNote}>
              <span aria-hidden="true" />
              Tijdelijke voorbeelddata<br />Geen externe opslag
            </p>
          </div>
        </aside>

        <div
          className={styles.paneDivider}
          role="separator"
          aria-orientation="vertical"
          aria-label="Breedte tussen navigatie en lijst aanpassen"
          tabIndex={0}
          onPointerDown={startDrag("nav-list")}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") { event.preventDefault(); nudgeDivider("nav-list", -16); }
            if (event.key === "ArrowRight") { event.preventDefault(); nudgeDivider("nav-list", 16); }
          }}
        />

        <section className={styles.listPane} aria-labelledby="list-title">
          <header className={styles.listHeader}>
            <button className={styles.mobileBack} type="button" onClick={() => setMobilePane("navigation")}>
              <span aria-hidden="true">←</span> Navigatie
            </button>
            <div>
              <p className={styles.eyebrow}>{currentKind === "tasks" ? "Taken" : "Werkoverzicht"}</p>
              <h1 id="list-title">{viewTitle[activeView]}</h1>
            </div>
            <p className={styles.listIntro}>
              {currentKind === "tasks" && `${visibleTasks.length} hoofd${visibleTasks.length === 1 ? "taak" : "taken"}`}
              {currentKind === "appointments" && "Alleen-lezen uit Outlook"}
              {currentKind === "email" && `${visibleEmails.length} van ${EMAIL_PROPOSALS.length} lokale voorstellen`}
              {currentKind === "whatsapp" && "Lokale voorbeeldgesprekken · nog geen koppeling"}
            </p>
            {currentKind === "tasks" && (
              <div className={styles.listActions}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => {
                    runWithEditorCloseGuard(() => {
                      setEditorMode((mode) => (mode === "new-main" ? "none" : "new-main"));
                      setHasUnsavedChanges(false);
                      setMainTaskError(null);
                      setFormError(null);
                      setFeedback(null);
                    });
                  }}
                  aria-expanded={editorMode === "new-main"}
                >
                  + Hoofdtaak
                </button>
              </div>
            )}
          </header>

          {currentKind === "tasks" && (
            <div className={styles.listBody}>
              {editorMode === "new-main" && (
                <form
                  className={styles.mainTaskForm}
                  onSubmit={addMainTask}
                  onChangeCapture={() => setHasUnsavedChanges(true)}
                  ref={newMainFormRef}
                  noValidate
                >
                  <label>
                    Titel <span aria-hidden="true">*</span>
                    <input name="title" type="text" required autoFocus placeholder="Wat wil je afronden?" />
                  </label>
                  <label>
                    Deadline (optioneel)
                  </label>
                  <div className={styles.deadlineFields}>
                    <label>
                      Datum
                      <input name="deadlineDate" type="date" min={minimumDeadlineDate} />
                    </label>
                    <label className={styles.hardDeadlineField}>
                      Hard
                      <input name="hardDeadline" type="checkbox" />
                    </label>
                    <label>
                      Tijd (optioneel)
                      <input name="deadlineTime" type="time" />
                    </label>
                  </div>
                  <label>
                    Geplande tijd (minuten, optioneel)
                    <input name="plannedMinutes" type="number" min={1} step={1} placeholder="Bijv. 90" />
                  </label>
                  <label>
                    Omschrijving (optioneel)
                    <textarea
                      name="description"
                      rows={24}
                      className={styles.descriptionField}
                      placeholder="Korte of lange context, notities en broninformatie"
                    />
                  </label>
                  {mainTaskError && <p className={styles.formError} role="alert">{mainTaskError}</p>}
                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.ghostButton}
                      onClick={() => {
                        runWithEditorCloseGuard(() => {
                          setEditorMode("none");
                          setHasUnsavedChanges(false);
                          setMainTaskError(null);
                        });
                      }}
                    >
                      Annuleren
                    </button>
                    <button type="submit" className={styles.primaryButton} disabled={isSaving}>
                      {isSaving ? "Opslaan..." : "Opslaan"}
                    </button>
                  </div>
                </form>
              )}
              <div className={styles.taskColumns} aria-hidden="true">
                <span>Hoofdtaak</span><span>Deadline</span><span>Resterend</span><span />
              </div>
              {visibleTasks.length === 0 ? (
                <p className={styles.emptyState}>Geen hoofdtaken in deze selectie.</p>
              ) : (
                visibleTasks.map((task) => {
                  const status = taskStatusLabel(task.status);
                  const taskDeadline = splitDeadlineValue(task.deadlineValue);
                  const showRestoreTaskAction = activeView === "completed";
                  return (
                    <div key={task.id}>
                      <div className={selectedTask.id === task.id ? styles.selectedTaskRowShell : styles.taskRowShell}>
                        <button
                          type="button"
                          className={selectedTask.id === task.id ? styles.selectedTaskRow : styles.taskRow}
                          onClick={() => selectTask(task.id)}
                        >
                          <span className={styles.taskTitleCell}>
                            <strong>{task.title}</strong>
                            <small>{task.hardDeadline ? `${status ?? task.note} · Harde deadline` : (status ?? task.note)}</small>
                            {(taskAttachments[task.id]?.length ?? 0) > 0 && (
                              <span className={styles.attachmentBadge} aria-label={`${taskAttachments[task.id]?.length ?? 0} bijlagen op hoofdtaak`}>
                                📎 {taskAttachments[task.id]?.length ?? 0}
                              </span>
                            )}
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
                        <button
                          type="button"
                          className={styles.rowArchiveButton}
                          onClick={() => (showRestoreTaskAction ? restoreMainTask(task.id) : archiveMainTask(task.id))}
                          aria-label={showRestoreTaskAction ? `Hoofdtaak dearchiveren: ${task.title}` : `Hoofdtaak archiveren: ${task.title}`}
                        >
                          {showRestoreTaskAction ? "Dearchiveren" : "Archiveren"}
                        </button>
                      </div>

                      {selectedTask.id === task.id && editorMode === "edit-main" && (
                        <form
                          className={`${styles.mainTaskForm} ${styles.inlineTaskEditor}`}
                          onSubmit={updateMainTask}
                          onChangeCapture={() => setHasUnsavedChanges(true)}
                          ref={editMainFormRef}
                          noValidate
                        >
                          <label>
                            Titel <span aria-hidden="true">*</span>
                            <input name="title" type="text" required defaultValue={task.title} />
                          </label>
                          <div className={styles.deadlineFields}>
                            <label>
                              Deadline datum (optioneel)
                              <input name="deadlineDate" type="date" min={minimumDeadlineDate} defaultValue={taskDeadline.date} />
                            </label>
                            <label className={styles.hardDeadlineField}>
                              Hard
                              <input name="hardDeadline" type="checkbox" defaultChecked={Boolean(task.hardDeadline)} />
                            </label>
                            <label>
                              Tijd (optioneel)
                              <input name="deadlineTime" type="time" defaultValue={taskDeadline.time} />
                            </label>
                          </div>
                          <label>
                            Geplande tijd (minuten, optioneel)
                            <input
                              name="plannedMinutes"
                              type="number"
                              min={1}
                              step={1}
                              placeholder="Bijv. 90"
                              defaultValue={parseMinutesFromLabel(task.remaining)}
                            />
                          </label>
                          <label>
                            Omschrijving (optioneel)
                            <textarea
                              name="description"
                                rows={24}
                              className={styles.descriptionField}
                              defaultValue={task.description}
                            />
                          </label>
                          {formError && <p className={styles.formError} role="alert">{formError}</p>}
                          <div className={styles.attachmentFormBar}>
                            <div className={styles.attachmentFormFiles}>
                            <button
                              className={styles.inlinePaperclipButton}
                              type="button"
                              onClick={openTaskAttachmentPicker}
                              disabled={isUploading}
                              aria-label="Document of foto toevoegen bij hoofdtaak"
                              title="Document of foto toevoegen bij hoofdtaak"
                            >
                              📎
                            </button>
                              {(taskAttachments[task.id] ?? []).map((attachment) => (
                                <button
                                  key={attachment.id}
                                  type="button"
                                  className={styles.attachmentFileButton}
                                  onClick={() => openLocalAttachment(attachment)}
                                  title={`${attachment.name} openen`}
                                >
                                  {attachment.name}
                                </button>
                              ))}
                            </div>
                            <div className={styles.formActions}>
                              <button
                                type="button"
                                className={styles.ghostButton}
                                onClick={() => {
                                  runWithEditorCloseGuard(() => {
                                    setEditorMode("none");
                                    setHasUnsavedChanges(false);
                                  });
                                }}
                              >
                                Annuleren
                              </button>
                              <button type="button" className={styles.secondaryButton} onClick={deleteMainTask}>Verwijderen</button>
                              <button type="submit" className={styles.primaryButton} disabled={isSaving}>
                                {isSaving ? "Opslaan..." : "Hoofdtaak opslaan"}
                              </button>
                            </div>
                          </div>
                        </form>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {currentKind === "appointments" && (
            <div className={styles.listBody}>
              {appointmentsLoading && <p className={styles.emptyState}>Outlook-afspraken laden...</p>}

              {!appointmentsLoading && appointmentsError && <p className={styles.formError}>{appointmentsError}</p>}

              {!appointmentsLoading && !appointmentsError && upcomingAppointments.length === 0 ? (
                <p className={styles.emptyState}>Geen komende afspraken vanaf nu.</p>
              ) : (
                !appointmentsLoading && !appointmentsError && upcomingAppointments.map((appointment, index) => {
                  const showDay = index === 0 || upcomingAppointments[index - 1].day !== appointment.day;
                  return (
                    <div key={appointment.id}>
                      {showDay && <p className={styles.dateDivider}>{appointment.day}</p>}
                      <button
                        type="button"
                        className={selectedAppointment?.id === appointment.id ? styles.selectedAppointmentRow : styles.appointmentRow}
                        onClick={() => { setSelectedAppointmentId(appointment.id); setMobilePane("detail"); }}
                      >
                        <span className={styles.timeBar} aria-hidden="true" />
                        <time>{appointment.time}</time>
                        <strong>{appointment.title}</strong>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {currentKind === "email" && (
            <div className={styles.listBody}>
              <div className={styles.emailFilters} role="tablist" aria-label="Filter op e-mailcategorie">
                {EMAIL_CATEGORY_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    role="tab"
                    aria-selected={emailFilter === filter.id}
                    className={emailFilter === filter.id ? styles.emailFilterActive : styles.emailFilter}
                    onClick={() => setEmailFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {emailFilter === "newsletter" && selectedNewsletters.length > 0 && (
                <div className={styles.unsubscribeBar}>
                  <span>
                    {selectedNewsletters.length}{" "}
                    {selectedNewsletters.length === 1 ? "nieuwsbrief geselecteerd" : "nieuwsbrieven geselecteerd"}
                  </span>
                  <button type="button" className={styles.secondaryButton} onClick={unsubscribeSelectedNewsletters}>
                    Geselecteerde nieuwsbrieven afmelden
                  </button>
                </div>
              )}

              <div className={styles.emailColumns} aria-hidden="true">
                <span>Voorstel</span><span>Categorie</span>
              </div>
              {visibleEmails.length === 0 ? (
                <p className={styles.emptyState}>Geen e-mails in deze categorie.</p>
              ) : (
                visibleEmails.map((email) => (
                  <div
                    key={email.id}
                    className={selectedEmail.id === email.id ? styles.selectedEmailRow : styles.emailRow}
                  >
                    {email.category === "newsletter" && (
                      <label className={styles.unsubscribeCheckbox} onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={Boolean(unsubscribeSelection[email.id])}
                          onChange={() => toggleUnsubscribeSelection(email.id)}
                          aria-label={`Markeren voor afmelding: ${email.subject}`}
                        />
                      </label>
                    )}
                    <button type="button" className={styles.emailRowMain} onClick={() => selectEmail(email.id)}>
                      <span>
                        <strong>{email.subject}</strong>
                        <small>{email.summary}</small>
                      </span>
                      <span
                        className={
                          email.category === "urgent"
                            ? styles.categoryBadgeUrgent
                            : email.category === "newsletter"
                              ? styles.categoryBadgeNewsletter
                              : styles.categoryBadgeNormal
                        }
                      >
                        {EMAIL_CATEGORY_LABEL[email.category]}
                      </span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {currentKind === "whatsapp" && (
            <div className={styles.listBody}>
              <div className={styles.whatsappColumns} aria-hidden="true">
                <span>Gesprek</span><span>Tijd</span>
              </div>
              {WHATSAPP_MESSAGES.map((message) => (
                <button
                  key={message.id}
                  type="button"
                  className={selectedWhatsApp.id === message.id ? styles.selectedWhatsappRow : styles.whatsappRow}
                  onClick={() => selectWhatsApp(message.id)}
                >
                  <span className={message.unread ? styles.unreadDot : styles.readDot} aria-hidden="true" />
                  <span className={styles.whatsappRowText}>
                    <strong>{message.contact}</strong>
                    <small>{message.preview}</small>
                  </span>
                  <span className={styles.whatsappRowMeta}>
                    <span className={styles.whatsappTime}>{message.time}</span>
                    {message.needsAttention && <span className={styles.attentionBadge}>Aandacht</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <div
          className={styles.paneDivider}
          role="separator"
          aria-orientation="vertical"
          aria-label="Breedte tussen lijst en detailpaneel aanpassen"
          tabIndex={0}
          onPointerDown={startDrag("list-detail")}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") { event.preventDefault(); nudgeDivider("list-detail", -16); }
            if (event.key === "ArrowRight") { event.preventDefault(); nudgeDivider("list-detail", 16); }
          }}
        />

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
                  {selectedTask.hardDeadline && <span>Harde deadline</span>}
                </div>
              </header>

              {selectedTask.status === "active" && (
                <div className={styles.timerStrip}>
                  <span>
                    <small>Actieve subtaak</small>
                    <strong>{selectedSubtask?.title ?? selectedTask.title}</strong>
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
                    onClick={() => {
                      runWithEditorCloseGuard(() => {
                        setEditorMode((mode) => (mode === "new-sub" ? "none" : "new-sub"));
                        setHasUnsavedChanges(false);
                        setFormError(null);
                        setFeedback(null);
                      });
                    }}
                    aria-expanded={editorMode === "new-sub"}
                  >
                    + Subtaak
                  </button>
                )}
                <button className={styles.ghostButton} type="button" onClick={() => setDetailsOpen((open) => !open)} aria-expanded={detailsOpen}>
                  {detailsOpen ? "Details verbergen" : "Details tonen"}
                </button>
              </div>

              <input
                ref={taskAttachmentInputRef}
                type="file"
                className={styles.visuallyHiddenInput}
                onChange={handleTaskAttachmentSelect}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
              />
              <input
                ref={subtaskAttachmentInputRef}
                type="file"
                className={styles.visuallyHiddenInput}
                onChange={handleSubtaskAttachmentSelect}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
              />

              {selectedTask.status === "completed" && (
                <div className={styles.reopenPrompt}>
                  <p>Deze hoofdtaak is afgerond. Open de taak eerst opnieuw om een subtaak toe te voegen.</p>
                  <button type="button" className={styles.secondaryButton} onClick={() => setFeedback("Voorbeeldactie: de hoofdtaak zou eerst opnieuw worden geopend.")}>Opnieuw openen</button>
                </div>
              )}

              {editorMode === "new-sub" && selectedTask.status !== "completed" && (
                <form
                  className={styles.subtaskForm}
                  onSubmit={addSubtask}
                  onChangeCapture={() => setHasUnsavedChanges(true)}
                  ref={newSubtaskFormRef}
                  noValidate
                >
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
                  <div className={styles.deadlineFields}>
                    <label>
                      Deadline datum (optioneel)
                      <input name="deadlineDate" type="date" min={minimumDeadlineDate} />
                    </label>
                    <label className={styles.hardDeadlineField}>
                      Hard
                      <input name="hardDeadline" type="checkbox" />
                    </label>
                    <label>
                      Tijd (optioneel)
                      <input name="deadlineTime" type="time" />
                    </label>
                  </div>
                  <label>
                    Geplande tijd (minuten) <span aria-hidden="true">*</span>
                    <input name="plannedMinutes" type="number" min={1} step={1} required placeholder="Bijv. 45" />
                  </label>
                  {selectedTask.deadlineValue && <p className={styles.formHint}>Uiterlijk {selectedTask.deadline}</p>}
                  <label>
                    Omschrijving (optioneel)
                    <textarea
                      name="description"
                      rows={24}
                      className={styles.descriptionField}
                      placeholder="Extra context of uitgebreid tekstblok"
                    />
                  </label>
                  {formError && <p className={styles.formError} role="alert">{formError}</p>}
                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.ghostButton}
                      onClick={() => {
                        runWithEditorCloseGuard(() => {
                          setEditorMode("none");
                          setHasUnsavedChanges(false);
                          setFormError(null);
                        });
                      }}
                    >
                      Annuleren
                    </button>
                    <button type="submit" className={styles.primaryButton} disabled={isSaving}>
                      {isSaving ? "Opslaan..." : "Opslaan"}
                    </button>
                  </div>
                </form>
              )}

              {feedback && <p className={styles.feedback} role="status">{feedback}</p>}

              <section className={styles.subtasks} aria-labelledby="subtasks-title">
                <div className={styles.sectionHeading}>
                  <h3 id="subtasks-title">Subtaken</h3>
                  <span>{visibleSubtasks.length}</span>
                </div>
                <div className={styles.subtaskList}>
                  {visibleSubtasks.map((subtask) => {
                    const stateLabel = subtaskStateLabel(subtask.state);
                    const selectedClass = selectedSubtask?.id === subtask.id ? styles.selectedSubtaskRow : "";
                    const isEditingThisSubtask = editorMode === "edit-sub" && selectedSubtask?.id === subtask.id;
                    const showRestoreSubtaskAction = subtask.state === "archived" || activeView === "completed";
                    const restoreSubtaskBlocked = showRestoreSubtaskAction && Boolean(selectedTask && isCompletedBucketTask(selectedTask));
                    return (
                      <div key={subtask.id}>
                        <div className={selectedSubtask?.id === subtask.id ? styles.selectedSubtaskRowShell : styles.subtaskRowShell}>
                          <button
                            type="button"
                            className={
                              subtask.state === "active"
                                ? `${styles.subtaskRow} ${styles.subtaskRowActive} ${selectedClass}`
                                : `${styles.subtaskRow} ${selectedClass}`
                            }
                            onClick={() => selectSubtask(subtask.id)}
                          >
                            <span className={styles.subtaskMarker} aria-hidden="true" />
                            <span className={styles.subtaskText}>
                              <strong>{subtask.title}</strong>
                              <small>{subtask.hardDeadline ? `${subtask.deadline} · Harde deadline` : subtask.deadline}</small>
                            </span>
                            {(subtaskAttachments[subtask.id]?.length ?? 0) > 0 && (
                              <span className={styles.attachmentBadge} aria-label={`${subtaskAttachments[subtask.id]?.length ?? 0} bijlagen op subtaak`}>
                                📎 {subtaskAttachments[subtask.id]?.length ?? 0}
                              </span>
                            )}
                            {stateLabel && <span className={subtask.state === "blocked" ? styles.blockedText : styles.subtaskState}>{stateLabel}</span>}
                            <span className={styles.subtaskTime}>{subtask.remaining}</span>
                          </button>
                          <button
                            type="button"
                            className={styles.rowArchiveButton}
                            onClick={() => (showRestoreSubtaskAction ? restoreSubtask(subtask.id) : archiveSubtask(subtask.id))}
                            aria-label={showRestoreSubtaskAction ? `Subtaak dearchiveren: ${subtask.title}` : `Subtaak archiveren: ${subtask.title}`}
                            disabled={restoreSubtaskBlocked}
                            title={restoreSubtaskBlocked ? "Dearchiveer eerst de hoofdtaak" : undefined}
                          >
                            {showRestoreSubtaskAction ? "Dearchiveren" : "Archiveren"}
                          </button>
                        </div>

                        {isEditingThisSubtask && selectedSubtask && (
                          <>
                            <form
                            className={`${styles.subtaskForm} ${styles.inlineSubtaskEditor}`}
                            onSubmit={updateSubtask}
                            onChangeCapture={() => setHasUnsavedChanges(true)}
                            ref={editSubtaskFormRef}
                            noValidate
                          >
                            <div className={styles.formHeading}>
                              <div>
                                <p className={styles.eyebrow}>Subtaak bewerken</p>
                                <h3>{selectedSubtask.title}</h3>
                              </div>
                            </div>
                            <label>
                              Titel <span aria-hidden="true">*</span>
                              <input name="title" type="text" required defaultValue={selectedSubtask.title} />
                            </label>
                            <div className={styles.deadlineFields}>
                              <label>
                                Deadline datum (optioneel)
                                <input
                                  name="deadlineDate"
                                  type="date"
                                  min={minimumDeadlineDate}
                                  defaultValue={splitDeadlineValue(selectedSubtask.deadlineValue).date}
                                />
                              </label>
                              <label className={styles.hardDeadlineField}>
                                Hard
                                <input name="hardDeadline" type="checkbox" defaultChecked={Boolean(selectedSubtask.hardDeadline)} />
                              </label>
                              <label>
                                Tijd (optioneel)
                                <input
                                  name="deadlineTime"
                                  type="time"
                                  defaultValue={splitDeadlineValue(selectedSubtask.deadlineValue).time}
                                />
                              </label>
                            </div>
                            <label>
                              Geplande tijd (minuten) <span aria-hidden="true">*</span>
                              <input
                                name="plannedMinutes"
                                type="number"
                                min={1}
                                step={1}
                                required
                                placeholder="Bijv. 45"
                                defaultValue={parseMinutesFromLabel(selectedSubtask.remaining)}
                              />
                            </label>
                            {selectedTask.deadlineValue && <p className={styles.formHint}>Uiterlijk {selectedTask.deadline}</p>}
                            <label>
                              Omschrijving (optioneel)
                              <textarea
                                name="description"
                                rows={24}
                                className={styles.descriptionField}
                                defaultValue={selectedSubtask.description ?? ""}
                              />
                            </label>
                            {formError && <p className={styles.formError} role="alert">{formError}</p>}
                            <div className={styles.attachmentFormBar}>
                              <div className={styles.attachmentFormFiles}>
                              <button
                                className={styles.inlinePaperclipButton}
                                type="button"
                                onClick={openSubtaskAttachmentPicker}
                                disabled={isUploading}
                                aria-label="Document of foto toevoegen bij subtaak"
                                title="Document of foto toevoegen bij subtaak"
                              >
                                📎
                              </button>
                                {(subtaskAttachments[selectedSubtask.id] ?? []).map((attachment) => (
                                  <button
                                    key={attachment.id}
                                    type="button"
                                    className={styles.attachmentFileButton}
                                    onClick={() => openLocalAttachment(attachment)}
                                    title={`${attachment.name} openen`}
                                  >
                                    {attachment.name}
                                  </button>
                                ))}
                              </div>
                              <div className={styles.formActions}>
                                <button
                                  type="button"
                                  className={styles.ghostButton}
                                  onClick={() => {
                                    runWithEditorCloseGuard(() => {
                                      setEditorMode("none");
                                      setHasUnsavedChanges(false);
                                      setFormError(null);
                                    });
                                  }}
                                >
                                  Annuleren
                                </button>
                                <button type="button" className={styles.secondaryButton} onClick={deleteSubtask}>Verwijderen</button>
                                <button type="submit" className={styles.primaryButton} disabled={isSaving}>
                                  {isSaving ? "Opslaan..." : "Subtaak opslaan"}
                                </button>
                              </div>
                            </div>
                            </form>
                          </>
                        )}
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
                    <div><dt>Bijlagen</dt><dd>{taskAttachments[selectedTask.id]?.length ?? 0}</dd></div>
                  </dl>
                </section>
              )}
            </div>
          )}

          {currentKind === "appointments" && selectedAppointment && (
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
                <NavIcon name="appointments" /> Alleen-lezen via Outlook
              </p>
            </div>
          )}

          {currentKind === "appointments" && !selectedAppointment && (
            <div className={styles.detailContent}>
              <header className={styles.detailHeader}>
                <p className={styles.eyebrow}>Outlook-afspraken</p>
                <h2>Geen komende afspraken</h2>
              </header>
              <p className={styles.readOnlyNote}>
                <NavIcon name="appointments" /> Zodra er afspraken vanaf nu zijn, verschijnen ze hier automatisch op datumvolgorde.
              </p>
            </div>
          )}

          {currentKind === "email" && selectedEmail && (
            <div className={styles.detailContent}>
              <header className={styles.detailHeader}>
                <p className={styles.eyebrow}>E-mail</p>
                <h2>{selectedEmail.subject}</h2>
                <p className={styles.sender}>Van {selectedEmail.sender}</p>
              </header>

              <div className={styles.categoryPicker} role="radiogroup" aria-label="Categorie van dit bericht">
                {(["urgent", "normal", "newsletter"] as const).map((category) => (
                  <button
                    key={category}
                    type="button"
                    role="radio"
                    aria-checked={selectedEmail.category === category}
                    className={
                      selectedEmail.category === category
                        ? `${styles.categoryOption} ${styles.categoryOptionActive}`
                        : styles.categoryOption
                    }
                    onClick={() => setEmailCategory(selectedEmail.id, category)}
                  >
                    {EMAIL_CATEGORY_LABEL[category]}
                  </button>
                ))}
              </div>

              {selectedEmail.category === "urgent" && selectedEmail.urgentReason && (
                <div className={styles.dangerMessage}>
                  <strong>Belangrijk / urgent</strong>
                  <p>{selectedEmail.urgentReason}</p>
                </div>
              )}

              <section className={styles.emailSummary}>
                <h3>Samenvatting</h3>
                <p>{selectedEmail.summary}</p>
              </section>

              {selectedEmail.category === "newsletter" ? (
                <section className={styles.proposalBlock}>
                  <p className={styles.eyebrow}>Nieuwsbrief</p>
                  <label className={styles.unsubscribeOption}>
                    <input
                      type="checkbox"
                      checked={Boolean(unsubscribeSelection[selectedEmail.id])}
                      onChange={() => toggleUnsubscribeSelection(selectedEmail.id)}
                    />
                    Markeren voor afmelding
                  </label>
                  {selectedNewsletters.length > 0 && (
                    <button type="button" className={styles.secondaryButton} onClick={unsubscribeSelectedNewsletters}>
                      Geselecteerde nieuwsbrieven afmelden ({selectedNewsletters.length})
                    </button>
                  )}
                </section>
              ) : (
                <section className={styles.proposalBlock}>
                  <p className={styles.eyebrow}>Voorgestelde actie</p>
                  <p>{selectedEmail.proposal}</p>
                  <span>{selectedEmail.confidence}</span>
                </section>
              )}

              {selectedEmail.category !== "newsletter" && (
                <div className={styles.emailActions}>
                  <button className={styles.primaryButton} type="button" onClick={() => setFeedback("Voorbeeldactie: het voorstel is lokaal geaccepteerd. Er is niets opgeslagen of verzonden.")}>Accepteren</button>
                  <button className={styles.secondaryButton} type="button" onClick={() => setFeedback("Voorbeeldactie: aanpassen opent later een echt formulier.")}>Aanpassen</button>
                  <button className={styles.ghostButton} type="button" onClick={() => setFeedback("Voorbeeldactie: het voorstel is alleen in lokale state genegeerd.")}>Negeren</button>
                </div>
              )}

              {feedback && <p className={styles.feedback} role="status">{feedback}</p>}
              <button className={styles.sourceToggle} type="button" onClick={() => setSourceOpen((open) => !open)} aria-expanded={sourceOpen}>
                {sourceOpen ? "Bericht verbergen" : "Bericht tonen"}
                <span aria-hidden="true">{sourceOpen ? "↑" : "↓"}</span>
              </button>
              {sourceOpen && <blockquote className={styles.sourceContent}>{selectedEmail.source}</blockquote>}
              <p className={styles.dataNote}>Alle e-mailinhoud op dit scherm is fictieve voorbeelddata. Een echte afmelding vindt in deze proef niet plaats.</p>
            </div>
          )}

          {currentKind === "whatsapp" && selectedWhatsApp && (
            <div className={styles.detailContent}>
              <header className={styles.detailHeader}>
                <p className={styles.eyebrow}>WhatsApp</p>
                <h2>{selectedWhatsApp.contact}</h2>
                <div className={styles.taskMeta}>
                  {selectedWhatsApp.needsAttention && <span className={styles.attentionBadgeLarge}>Aandacht</span>}
                  <span>Laatste bericht {selectedWhatsApp.time}</span>
                </div>
              </header>

              {selectedWhatsApp.needsAttention && selectedWhatsApp.attentionReason && (
                <div className={styles.attentionMessage}>
                  <strong>Aandacht</strong>
                  <p>{selectedWhatsApp.attentionReason}</p>
                </div>
              )}

              <section className={styles.whatsappThread} aria-label="Berichten in dit gesprek">
                {selectedWhatsApp.thread.map((entry, index) => (
                  <div
                    key={index}
                    className={entry.from === "me" ? styles.whatsappBubbleMe : styles.whatsappBubbleThem}
                  >
                    <p>{entry.text}</p>
                    <time>{entry.time}</time>
                  </div>
                ))}
              </section>

              <p className={styles.readOnlyNote}>
                <NavIcon name="whatsapp" /> Nog geen WhatsApp-koppeling · tijdelijke voorbeelddata
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
