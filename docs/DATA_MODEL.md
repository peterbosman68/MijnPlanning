# MijnPlanning — datamodel

## 1. Doel

Dit document beschrijft het functionele datamodel.

Het definitieve Prisma-schema wordt later vanuit dit document opgebouwd.

---

## 2. Account

### User

Velden:

- id;
- email, verplicht, genormaliseerd en uniek;
- passwordHash;
- timeZone, standaard `Europe/Amsterdam`;
- createdAt;
- updatedAt.

Alleen e-mailadres en wachtwoord zijn verplicht voor de MVP-login. Er is geen gebruikersnaamveld nodig. Een optionele weergavenaam kan later via een afzonderlijke wijziging worden toegevoegd.

### Session

Velden:

- id;
- userId;
- tokenHash;
- expiresAt, uiterlijk 30 dagen na aanmaak;
- revokedAt;
- createdAt;
- lastUsedAt, gebruikt voor een maximale inactiviteit van 7 dagen.

Handmatig uitloggen trekt de actuele sessie in. Alle sessies van de gebruiker kunnen gezamenlijk worden ingetrokken. Alleen een hash van het sessietoken wordt opgeslagen.

---

## 3. Taken

### Task

Een Task is de hoofdtaak.

Velden:

- id;
- userId;
- title, verplicht;
- descriptionOriginal, mag leeg zijn;
- descriptionPlain;
- status;
- deadline, optioneel tijdstip met datum en tijd;
- estimatedMinutes, optioneel en alleen relevant wanneer geen subtaken bestaan;
- remainingMinutes, optioneel zolang geen tijdsinschatting is ingevuld of geaccepteerd;
- sourceType;
- sourceExternalId;
- createdAt;
- updatedAt;
- completedAt.

Mogelijke statuswaarden:

```text
OPEN
WAITING
COMPLETED
ARCHIVED
CANCELLED
```

Dit zijn de handmatig bedienbare statuswaarden in fase 1. `BLOCKED` wordt uit dependencies afgeleid en niet als handmatige status opgeslagen. `ACTIVE`, `PAUSED` en `WAITING_EXTERNAL` worden pas in de tijdregistratiefase toegevoegd.

Een taak zonder subtaken en zonder ingevulde of geaccepteerde tijdsinschatting is niet planbaar. Zodra subtaken bestaan, worden `estimatedMinutes` en `remainingMinutes` van de hoofdtaak niet als extra werk boven op de subtaken geteld.

### Subtask

Velden:

- id;
- taskId;
- title, verplicht;
- descriptionOriginal, mag leeg zijn;
- descriptionPlain;
- deadline, verplicht tijdstip met datum en tijd;
- earliestStart, optioneel;
- estimatedMinutes;
- remainingMinutes;
- minimumBlockMinutes;
- splittable;
- priority;
- context;
- status;
- createdAt;
- updatedAt;
- completedAt.

Mogelijke statuswaarden:

```text
OPEN
WAITING
COMPLETED
ARCHIVED
CANCELLED
```

Ook voor subtaken wordt `BLOCKED` afgeleid uit dependencies. Timerstatussen worden pas in de tijdregistratiefase aan het model toegevoegd.

### Belangrijke regel

Wanneer Task.deadline bestaat:

```text
Subtask.deadline <= Task.deadline
```

Deze regel moet worden gecontroleerd:

- in de UI;
- in de domeinservice, als leidende bedrijfsvalidatie;
- in de transactie;
- aanvullend in PostgreSQL als kritisch integriteitsvangnet.

Het fase-1-uitvoeringsplan concretiseert de PostgreSQL-bescherming als versioned triggers voor writes op `Task.deadline` en `Subtask.deadline`. Deze triggers dupliceren geen foutpresentatie of overige bedrijfsregels.

---

## 4. Afhankelijkheden

### TaskDependency

Velden:

- id;
- subtaskId;
- dependsOnSubtaskId;
- dependencyType;
- createdAt.

Mogelijke typen:

```text
FINISH_TO_START
```

Eerste versie gebruikt alleen finish-to-start.

Regels:

- een subtaak mag niet van zichzelf afhangen;
- dubbele afhankelijkheden worden geweigerd;
- cycli worden geweigerd;
- afhankelijkheden mogen tussen verschillende hoofdtaken lopen;
- cycluscontrole gebeurt transactioneel, ook bij gelijktijdige wijzigingen;
- dependencyrelaties gebruiken geen automatische deletecascade en worden nooit stilzwijgend verwijderd.

### Archiveren en definitief verwijderen

- Taken en subtaken worden standaard gearchiveerd in plaats van definitief verwijderd.
- Definitief verwijderen wordt geblokkeerd wanneer tijdregistraties, bijlagen, importhistorie of afhankelijkheden bestaan.
- Een dependency wordt alleen door een expliciete dependencyhandeling verwijderd.

---

## 5. Tijdregistratie

### TimeSession

Velden:

- id;
- userId;
- taskId, optioneel;
- subtaskId, optioneel;
- sessionType;
- startedAt;
- endedAt;
- activeSeconds;
- note;
- interruptionReason;
- createdAt;
- updatedAt.

Mogelijke sessionType-waarden:

```text
ACTIVE
PAUSED
INTERRUPTED
WAITING_EXTERNAL
TRAVEL
```

Regels:

- koppel een sessie aan een taak of subtaak;
- niet aan beide tegelijk zonder expliciete reden;
- alleen ACTIVE telt mee voor persoonlijke uitvoersnelheid.

---

## 6. Tijdsinschattingen

### TaskEstimate

Velden:

- id;
- userId;
- taskId, optioneel;
- subtaskId, optioneel;
- genericMinutes;
- personalizedMinutes;
- lowerMinutes;
- upperMinutes;
- confidence;
- similarTaskCount;
- userSelectedMinutes;
- acceptedByUser;
- explanation;
- provider;
- modelVersion;
- promptVersion;
- createdAt.

Regels:

- koppel aan een taak of subtaak;
- bewaar iedere relevante versie;
- overschrijf historische schattingen niet.

---

## 7. Persoonlijk leerprofiel

### UserTaskProfile

Velden:

- id;
- userId;
- taskType;
- sampleCount;
- medianEstimateRatio;
- p25Minutes;
- p50Minutes;
- p75Minutes;
- averageActiveMinutes;
- confidence;
- updatedAt.

Later eventueel:

- tijdstipvoorkeur;
- gemiddelde onderbrekingskans;
- gemiddelde contextwisselkosten;
- recente trend.

---

## 8. Intake en vervolgvragen

### TaskIntakeAnswer

Velden:

- id;
- userId;
- taskId, optioneel;
- subtaskId, optioneel;
- questionKey;
- questionText;
- answerText;
- structuredValue;
- createdAt.

### TaskFeature

Velden:

- id;
- userId;
- taskId, optioneel;
- subtaskId, optioneel;
- featureKey;
- featureValue;
- confidence;
- source;
- createdAt.

---

## 9. Planning

### PlanRun

Velden:

- id;
- userId;
- reason;
- startedAt;
- completedAt;
- planningVersion;
- inputHash;
- resultSummary;
- status;
- createdAt.

Mogelijke reasons:

```text
MANUAL_REFRESH
TASK_CREATED
TASK_UPDATED
TIME_SESSION_CHANGED
CALENDAR_CHANGED
EMAIL_ACTION_ACCEPTED
SCHEDULED_CHECK
```

### ScheduledBlock

Velden:

- id;
- userId;
- planRunId;
- taskId, optioneel;
- subtaskId, optioneel;
- startAt;
- endAt;
- source;
- status;
- lockedByUser;
- outlookEventId, optioneel;
- createdAt;
- updatedAt.

### Alert

Velden:

- id;
- userId;
- taskId, optioneel;
- subtaskId, optioneel;
- severity;
- reasonCode;
- explanation;
- shortageMinutes;
- marginMinutes;
- createdAt;
- acknowledgedAt;
- resolvedAt.

Mogelijke severity-waarden:

```text
GREEN
ORANGE
RED
```

---

## 10. Werktijden en voorkeuren

### PlanningPreferences

Velden:

- id;
- userId;
- workdayStart;
- workdayEnd;
- defaultBreakMinutes;
- defaultBufferMinutes;
- maximumFocusMinutes;
- minimumBlockMinutes;
- allowTaskSplitting;
- timeZone;
- updatedAt.

### AvailabilityRule

Velden:

- id;
- userId;
- dayOfWeek;
- startTime;
- endTime;
- isWorkingTime;
- createdAt;
- updatedAt.

---

## 11. Bijlagen

### TaskAttachment

Velden:

- id;
- userId;
- taskId, optioneel;
- subtaskId, optioneel;
- blobPath;
- originalFileName;
- mimeType;
- sizeBytes;
- source;
- createdAt.

Mogelijke source-waarden:

```text
MANUAL_UPLOAD
MICROSOFT_TODO
EMAIL
SCREENSHOT
PHOTO
```

---

## 12. Microsoft-koppeling

### MicrosoftConnection

Velden:

- id;
- userId;
- microsoftAccountId;
- microsoftEmail;
- accountType;
- encryptedTokenCache;
- grantedScopes;
- lastSyncedAt;
- createdAt;
- updatedAt;
- disconnectedAt.

AccountType:

```text
PERSONAL
```

### CalendarEvent

Velden:

- id;
- userId;
- microsoftConnectionId;
- graphEventId;
- calendarId;
- subject;
- startAt;
- endAt;
- isAllDay;
- showAs;
- isCancelled;
- lastModifiedAt;
- syncedAt.

---

## 13. Eenmalige To Do-import

### TodoImportBatch

Velden:

- id;
- userId;
- microsoftConnectionId;
- sourceLists;
- status;
- startedAt;
- completedAt;
- sourceCount;
- importedCount;
- skippedCount;
- errorCount;
- createdAt.

### TodoImportItem

Velden:

- id;
- importBatchId;
- externalListId;
- externalTaskId;
- targetTaskId;
- sourceHash;
- status;
- errorMessage;
- createdAt.

Doel:

- dubbele import voorkomen;
- controleerbare migratie;
- importresultaat rapporteren.

---

## 14. E-mail

### EmailMessage

Velden:

- id;
- userId;
- microsoftConnectionId;
- microsoftMessageId;
- conversationId;
- subject;
- senderName;
- senderEmail;
- receivedAt;
- isRead;
- hasAttachments;
- summary;
- classification;
- actionRequired;
- detectedDeadline;
- processedAt;
- createdAt.

De volledige body wordt standaard niet permanent opgeslagen.

### EmailActionProposal

Velden:

- id;
- userId;
- emailMessageId;
- title;
- description;
- proposedDeadline;
- proposedMinutes;
- confidence;
- status;
- createdTaskId;
- createdSubtaskId;
- createdAt;
- updatedAt.

### EmailDigest

Velden:

- id;
- userId;
- periodStart;
- periodEnd;
- summary;
- urgentCount;
- actionCount;
- informationCount;
- generatedAt;
- viewedAt.

---

## 15. Indexen

Minimaal indexeren:

- Task.userId;
- Task.status;
- Task.deadline;
- Subtask.taskId;
- Subtask.status;
- Subtask.deadline;
- ScheduledBlock.userId + startAt;
- CalendarEvent.userId + startAt;
- EmailMessage.userId + receivedAt;
- TodoImportItem.externalTaskId;
- Alert.userId + severity;
- TimeSession.userId + startedAt.

---

## 16. Tijdzone

Deadlines bevatten datum én tijd. Sla datum en tijd op in UTC.

Toon in de ingestelde gebruikerszone, standaard:

```text
Europe/Amsterdam
```

Wanneer de interface alleen een datum ontvangt, mag zij 17.00 uur in `Europe/Amsterdam` voorstellen. De gebruiker kan dit tijdstip wijzigen voordat het wordt opgeslagen.
