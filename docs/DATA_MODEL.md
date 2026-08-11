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

### AuthThrottle

Technisch, privacybewust model voor centrale login-rate-limiting:

- id;
- keyHash, verplicht en uniek; hash van doelaccount en verzoekbron, nooit het ruwe IP-adres of e-mailadres;
- failureCount;
- windowStartedAt;
- blockedUntil, optioneel;
- expiresAt;
- createdAt;
- updatedAt.

De eerste fase blokkeert een combinatie na vijf mislukte pogingen binnen vijftien minuten gedurende vijftien minuten. Het record verloopt automatisch als opruimbare technische state en bevat geen wachtwoord, sessietoken of ruwe requestbron.

### PasswordResetToken

Technisch model voor eenmalig webherstel:

- id;
- userId;
- tokenHash, verplicht en uniek; de leesbare token wordt nooit opgeslagen;
- expiresAt, dertig minuten na uitgifte;
- usedAt, optioneel;
- createdAt.

Een geslaagde reset markeert alle nog openstaande tokens van de gebruiker als gebruikt. Indexen op `userId + usedAt` en `expiresAt` ondersteunen validatie en latere opruiming. Databaseconstraints bewaken dat verval en gebruik niet vóór creatie liggen.

De modellen `User`, `Session` en `AuthThrottle` zijn in fase 0 als eerste additieve migratie geïmplementeerd. `PasswordResetToken` volgt als afzonderlijke additieve beveiligingsmigratie. Taak- en overige productmodellen volgen pas in hun eigen fase.

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
- attachmentCount;
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

Dit zijn de handmatig bedienbare statuswaarden in fase 1. Voor een hoofdtaak betekent `WAITING` dat de taak in `Taken Mogelijk` wordt bewaard en niet wordt ingepland. De overgang naar `WAITING` verwijdert of wijzigt geen subtaken, deadlines, tijd of bijlagen; terugzetten naar `OPEN` maakt de taak weer planbaar. `BLOCKED` wordt uit dependencies afgeleid en niet als handmatige status opgeslagen. `ACTIVE`, `PAUSED` en `WAITING_EXTERNAL` worden pas in de tijdregistratiefase toegevoegd.

Een taak zonder subtaken en zonder ingevulde of geaccepteerde tijdsinschatting is niet planbaar. Zodra subtaken bestaan, worden `estimatedMinutes` en `remainingMinutes` van de hoofdtaak niet als extra werk boven op de subtaken geteld.

De takenprojectie kan aanvullend een niet-opgeslagen `planningDeadline` afleiden. Wanneer `Task.deadline` ontbreekt, is dit de vroegste deadline van een open subtaak. Deze projectiewaarde is alleen bedoeld voor sortering en de gelabelde weergave `Eerstvolgende subtaak`; zij wordt nooit teruggeschreven naar `Task.deadline` en verandert de deadlinehiërarchie niet.

De UI kan een Task daarnaast projecteren naar meerdere niet-opgeslagen `TaskDateOccurrence`-waarden: één per unieke kalenderdatum van relevante subtaken en optioneel één deadline-loze restgroep. Een occurrence is geen database-entiteit, gebruikt de bestaande `Task.id` voor detail en mutaties en wijzigt geen taak- of subtaakdeadline.

### Subtask

Velden:

- id;
- taskId;
- title, verplicht;
- descriptionOriginal, mag leeg zijn;
- descriptionPlain;
- deadline, optioneel tijdstip met datum en tijd;
- earliestStart, optioneel;
- estimatedMinutes;
- remainingMinutes;
- minimumBlockMinutes;
- splittable;
- priority;
- context;
- attachmentCount;
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

Wanneer zowel `Task.deadline` als `Subtask.deadline` bestaat:

```text
Subtask.deadline <= Task.deadline
```

Deze regel moet worden gecontroleerd:

- in de UI;
- in de domeinservice, als leidende bedrijfsvalidatie;
- in de transactie;
- aanvullend in PostgreSQL als kritisch integriteitsvangnet.

Het fase-1-uitvoeringsplan concretiseert de PostgreSQL-bescherming als versioned triggers voor writes op `Task.deadline` en `Subtask.deadline`. Een null subtaakdeadline veroorzaakt geen conflict; de triggers dupliceren geen foutpresentatie of overige bedrijfsregels.

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
- dependencyrelaties gebruiken geen automatische deletecascade;
- na expliciete bevestiging van definitieve taak- of subtaakverwijdering verwijdert de domeinservice de betrokken dependencies gericht.

### Archiveren en definitief verwijderen

- Archiveren bewaart de taak- of subtaakrecord met status `ARCHIVED`.
- Verwijderen is een afzonderlijke hard-delete en mag nooit als statuswijziging naar `ARCHIVED` worden geïmplementeerd.
- Na een geslaagde verwijdering bestaat de taak- of subtaakrecord niet meer in PostgreSQL of MijnPlanning.
- Definitief verwijderen vraagt altijd één expliciete bevestiging.
- De domeinservice verwijdert daarna gekoppelde private bestanden, attachmentmetadata, tijdregistraties en dependencies vóór de taak- of subtaakrecord.
- De domeinservice weigert definitieve hoofdtaakverwijdering zolang minimaal één subtaak bestaat.
- Subtaken worden afzonderlijk en expliciet verwijderd voordat de hoofdtaak kan worden verwijderd.
- To Do-importhistorie blijft bestaan met een lege taakverwijzing.

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
- blobPath, optioneel;
- sourceUrl, optioneel;
- originalFileName, optioneel;
- mimeType, optioneel;
- sizeBytes, optioneel;
- sourceExternalId, optioneel;
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

Regels:

- een bijlage hangt aan precies één taak of één subtaak;
- een echte bestandskopie gebruikt `blobPath`;
- een externe link gebruikt `sourceUrl`;
- een To Do-bijlage krijgt waar mogelijk zowel de bronlink als een gekopieerde bestandsversie;
- `sourceExternalId` voorkomt dubbele import van dezelfde bronbijlage;
- de UI toont op zowel hoofdtaak als subtaak een paperclip wanneer er één of meer bijlagen bestaan.

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
- importedAttachmentCount;
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
- TaskAttachment.userId + taskId;
- TaskAttachment.userId + subtaskId;
- TaskAttachment.userId + sourceExternalId;
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
