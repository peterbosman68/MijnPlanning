# MijnPlanning — technische architectuur

## 1. Doel

Dit document beschrijft de technische opbouw van MijnPlanning.

De architectuur moet:

- begrijpelijk blijven;
- veilig zijn;
- goed testbaar zijn;
- onderdelen los van elkaar houden;
- later uitbreidbaar zijn;
- geen onnodige complexiteit toevoegen.

---

## 2. Gekozen stack

| Onderdeel | Keuze |
|---|---|
| Ontwikkelomgeving | VS Code |
| Programmeeragent | Codex |
| Versiebeheer | Git en GitHub |
| Package manager | npm |
| Runtime | Node.js 24 LTS |
| Framework | Next.js 16 Active LTS met App Router |
| Frontend | React 19 |
| Programmeertaal | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Database | Neon Postgres via Vercel Marketplace, start op Free |
| ORM | Prisma 6 |
| Hosting | Vercel |
| Bestanden | Vercel Blob Private |
| Invoervalidatie | Zod |
| Tests | Vitest en Playwright |
| Applicatie-e-mail | Resend |
| Microsoft-koppeling | Microsoft Graph |
| Microsoft-account | Microsoft 365 Family |
| AI | Verwisselbare AI-providerlaag |
| Mobiel | Responsive webapp, later PWA |

Gebruik binnen de gekozen majors actuele veilige versies en wijzig geen ander stackonderdeel zonder expliciete toestemming. Neon start op het gratis abonnement; een betaalde upgrade vereist expliciete toestemming. De bestaande private GitHub-repository is gekoppeld aan het bestaande Vercel-project `mijnplanning`; functionele vrijgave van Preview of productie blijft afhankelijk van geslaagde relevante lokale controles en geeft geen toestemming voor secret-, database- of betaalde infrastructuurwijzigingen.

---

## 3. Hoofdmodules

```text
MijnPlanning
├── Eigen login
├── Taken en subtaken
├── Afhankelijkheden
├── Tijdregistratie
├── AI-intake
├── Tijdsinschatting
├── Persoonlijk leermodel
├── Planningsmotor
├── Deadline-alarmen
├── Eenmalige To Do-import
├── Outlook-agenda
├── Outlook-e-mail
├── Ochtendbrief
├── Bijlagen
└── Instellingen
```

Buiten de eerste versie:

```text
WhatsApp Business
Aparte gespreks- of transcriptieverwerkingsapp
```

---

## 4. Applicatielagen

### 4.1 Presentatielaag

De presentatielaag bevat:

- pagina’s;
- formulieren;
- tabellen;
- tijdlijnen;
- modals;
- notificaties;
- mobiele weergaven.

Voorbeeldstructuur:

```text
app/
├── vandaag/
├── week/
├── taken/
├── inbox/
├── ochtendbrief/
├── alarmen/
├── instellingen/
├── login/
└── api/
```

De presentatielaag bevat geen complexe plannings- of bedrijfsregels.

Mutaties vanuit de eigen browserinterface gebruiken Server Actions als dunne transportlaag. Iedere action verzorgt alleen transport, authenticatie, autorisatie, invoervalidatie en foutmapping; bedrijfsregels blijven in domeinservices. Taak- en subtaakformulieren gebruiken in fase 1 een expliciete knop `Opslaan`. Direct opslaan voor timeracties, statuswijzigingen en verslepen kan pas in een latere fase en moet dan zichtbare bevestiging of een foutmelding tonen.

### 4.2 Domeinlaag

```text
lib/
├── tasks/
├── planner/
├── estimation/
├── learning/
├── time-tracking/
├── alerts/
├── microsoft/
├── email/
├── attachments/
├── notifications/
├── security/
└── db/
```

De domeinlaag bevat:

- deadlinevalidatie;
- afhankelijkheidscontrole;
- tijdsberekeningen;
- planning;
- risicoanalyse;
- persoonlijke tijdscorrectie;
- importregels;
- autorisatieregels.

Deadlines zijn tijdstippen met datum én tijd. Domeinservices converteren invoer uit `Europe/Amsterdam` naar UTC en valideren de deadlinehiërarchie. Een voorgestelde tijd van 17.00 uur bij datumkeuze blijft zichtbaar en aanpasbaar.

### 4.3 Datalayer

De datalaag bestaat uit:

- Neon Postgres via Vercel Marketplace;
- Prisma;
- repositories of services;
- transacties;
- migraties;
- indexen;
- constraints.

React-componenten mogen Prisma niet rechtstreeks gebruiken.

Een lokale PostgreSQL-installatie is niet nodig. Development-, test- en productiegegevens blijven aantoonbaar gescheiden. Kritieke deadline-integriteit krijgt naast servicevalidatie een PostgreSQL-vangnet; voor fase 1 zijn versioned triggers in de migratie de beoogde concrete vorm. Cycluscontrole op dependencies gebeurt transactioneel en serialiseert conflicterende graafwijzigingen. Archiveren is standaard. Definitief verwijderen is geblokkeerd bij tijdregistraties, bijlagen, importhistorie of dependencies; foreign keys voor dependencies gebruiken geen stille cascade.

---

## 5. Server en client

### Server-side

Server-side uitvoeren:

- authenticatie;
- sessiecontrole;
- databasebewerkingen;
- Microsoft Graph-aanroepen;
- AI-aanroepen;
- tokenverwerking;
- bestandstoegang;
- planning opslaan;
- import uitvoeren;
- e-mailanalyse;
- notificaties.

Server Actions zijn endpoints en herhalen daarom voor iedere mutatie authenticatie, autorisatie en Zod-validatie. Ze roepen domeinservices aan en bevatten zelf geen bedrijfsregels.

### Client-side

Client-side uitvoeren:

- formulierinteractie;
- timerweergave;
- lokale UI-status;
- drag-and-drop;
- modals;
- directe validatie voor gebruikersgemak.

Server-side validatie blijft altijd leidend.

---

## 6. Login

Voor de MVP:

- één gebruiker;
- eigen MijnPlanning-login;
- alleen e-mailadres en wachtwoord zijn verplicht;
- geen verplichte gebruikersnaam; een optionele weergavenaam kan later worden toegevoegd;
- Argon2id-wachtwoordhash;
- unieke salt per wachtwoord en geen password pepper in de MVP;
- veilige server-side sessie;
- HttpOnly-cookie;
- Secure-cookie in productie;
- passende SameSite-instelling;
- rate limiting;
- maximale absolute sessieduur van 30 dagen;
- maximale inactiviteit van 7 dagen;
- handmatig uitloggen en de mogelijkheid alle sessies in te trekken.

De eerste gebruiker wordt aangemaakt via de geïmplementeerde eenmalige server-only CLI `npm run user:create`. Deze opdracht vraagt e-mailadres en tweemaal een verborgen wachtwoord in een interactieve terminal; alleen voor gecontroleerde automatisering accepteert zij tijdelijke procesvariabelen. De CLI logt geen wachtwoord of wachtwoordhash, weigert wanneer al een gebruiker bestaat en heeft geen publiek toegankelijke productieroute.

Nieuwe en gewijzigde wachtwoorden bevatten minimaal 8 tekens; langer en uniek blijft aanbevolen. De lokale server-only CLI `npm run user:change-password` controleert het huidige wachtwoord, vraagt het nieuwe wachtwoord tweemaal verborgen, wijzigt de Argon2id-hash transactioneel en trekt daarna alle bestaande sessies in.

De sessie gebruikt een cryptografisch willekeurig opaque token. Alleen een HMAC-SHA-256-hash met het server-side `SESSION_SECRET` wordt opgeslagen. Login-rate-limiting staat centraal in PostgreSQL, zodat afzonderlijke serverless instanties dezelfde blokkering gebruiken.

Microsoft wordt niet gebruikt als primaire login.

---

## 7. AI-providerlaag

Gebruik een providerabstractie.

Voorbeeld:

```ts
export interface AiProvider {
  analyzeWorkItem(input: AnalyzeWorkItemInput): Promise<WorkItemAnalysis>;
  createClarificationQuestion(input: ClarificationInput): Promise<ClarificationQuestion>;
  estimateDuration(input: EstimateDurationInput): Promise<DurationEstimate>;
  summarizeEmail(input: SummarizeEmailInput): Promise<EmailSummary>;
  draftReply(input: DraftReplyInput): Promise<DraftReply>;
}
```

De rest van MijnPlanning mag geen providerspecifieke prompt- of API-code bevatten.

De AI-provider moet verwisselbaar zijn zonder de planningsmotor te herschrijven.

---

## 8. Planningsmotor

De planningsmotor is gewone TypeScript-domeinlogica.

AI mag:

- taakinhoud begrijpen;
- ontbrekende informatie herkennen;
- tijd adviseren;
- uitleg formuleren.

AI mag niet zelfstandig:

- de definitieve planning bepalen;
- deadlines wijzigen;
- taken verwijderen;
- taken definitief aanmaken zonder goedkeuring.

De planningsmotor gebruikt:

- open taken en subtaken;
- resterende actieve tijd;
- deadlines;
- afhankelijkheden;
- vroegste start;
- prioriteit;
- minimale blokduur;
- opsplitsbaarheid;
- Outlook-afspraken;
- werktijden;
- pauzes;
- buffers;
- reistijd;
- vastgezette blokken;
- persoonlijke voorkeuren;
- contextwisselkosten.

---

## 9. Microsoft-integratie

Microsoft Graph wordt gebruikt voor:

- eenmalige Microsoft To Do-import;
- Outlook-agenda lezen;
- later eventueel Outlook-agenda schrijven;
- Outlook-e-mail lezen;
- later eventueel concepten opslaan.

Microsoft 365 Family is de Microsoft-basis.

De MijnPlanning-login blijft los van Microsoft.

---

## 10. Achtergrondtaken

Achtergrondtaken zijn nodig voor:

- ochtendbrief;
- Outlook-sync;
- e-mail-sync;
- Microsoft-webhookvernieuwing;
- deadlinecontrole;
- notificaties;
- retries.

Eerste versie:

- beveiligde Vercel Cron-routes;
- duidelijke logging;
- idempotente verwerking;
- retry met limiet.

Voeg pas later een externe queue toe als volume of betrouwbaarheid dit nodig maakt.

---

## 11. Bestanden

Gebruik Vercel Blob Private.

Vercel Blob, uploads en bijlagen worden pas in de bijlagenfase ingericht. Fase 0 bevat geen Blob-SDK, token of uploadroute; hoogstens wordt de latere architectuurgrens gedocumenteerd.

PostgreSQL bewaart alleen metadata:

- blobpad;
- bestandsnaam;
- MIME-type;
- grootte;
- gebruiker;
- taak of subtaak;
- bron;
- datum.

Bestandstoegang verloopt altijd via autorisatie.

---

## 12. Foutafhandeling

Gebruik:

- duidelijke foutcodes;
- gebruikersvriendelijke meldingen;
- technische logs zonder gevoelige inhoud;
- retries voor externe diensten;
- idempotente import en synchronisatie;
- transacties voor samenhangende wijzigingen.

Slik fouten niet stilzwijgend in.

---

## 13. Omgevingsvariabelen

Minimaal verwacht in fase 0 en 1:

```text
DATABASE_URL
SESSION_SECRET
```

Er is in de MVP geen `PASSWORD_PEPPER`. De volgende variabelen horen pas bij hun latere integratiefase en worden niet in fase 0 geprovisioneerd:

```text
BLOB_READ_WRITE_TOKEN
RESEND_API_KEY
MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET
MICROSOFT_TOKEN_ENCRYPTION_KEY
AI_PROVIDER
AI_API_KEY
CRON_SECRET
```

Nooit committen.

---

## 14. Teststrategie

Gebruik minimaal:

- Zod voor invoercontracten aan de servergrens;
- Vitest voor unit-tests van domeinregels;
- Vitest-integratietests voor database en servermutaties;
- autorisatietests;
- importtests;
- planningsscenario’s;
- Playwright-browsertests voor belangrijke stromen;
- mobiele controle.

---

## 15. Voorgestelde repositorystructuur

Gebruik uitsluitend de bestaande private repository `https://github.com/peterbosman68/MijnPlanning`; maak geen nieuwe repository. Bij implementatiestart wordt eerst gecontroleerd of de bestaande projectmap al een Git-repository is. Alleen als dat niet zo is, wordt Git in die map geïnitialiseerd en wordt de bestaande repository na inhoudscontrole als `origin` gekoppeld.

Voor regels over uitvoeringsplannen is uitsluitend `PLANS.md` in de hoofdmap de bron van waarheid.

```text
mijnplanning/
├── app/
├── components/
├── lib/
├── prisma/
├── tests/
├── docs/
├── plans/
├── public/
├── AGENTS.md
├── PLANS.md
├── README.md
├── package.json
└── .gitignore
```
