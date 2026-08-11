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

Gebruik binnen de gekozen majors actuele veilige versies en wijzig geen ander stackonderdeel zonder expliciete toestemming. Neon start op het gratis abonnement; een betaalde upgrade vereist expliciete toestemming. De bestaande private GitHub-repository is gekoppeld aan het bestaande Vercel-project `mijnplanning`; functionele vrijgave van Preview of productie blijft afhankelijk van geslaagde relevante lokale controles en geeft geen toestemming voor secret-, database- of betaalde infrastructuurwijzigingen. Vercel Functions draaien in `fra1`, naast Neon in `eu-central-1`, zodat iedere databasequery geen onnodige trans-Atlantische netwerkronde maakt.

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

De opslagrespons van taak- en subtaakformulieren wacht niet op Microsoft Graph. Outlook-agendagegevens worden bij het openen van een editor vooraf geladen, kort per datum hergebruikt en buiten het kritieke mutatiepad vernieuwd. Hierdoor blijft de eigen database-mutatie beschikbaar wanneer Graph traag of tijdelijk onbereikbaar is; een later agendaresultaat blijft aanleiding voor herplanning en risicoanalyse.

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

De attachments-module beheert zowel echte bestandskopieën als externe links. Gekoppelde bestanden worden server-side opgeslagen in Vercel Blob Private, terwijl linkbijlagen als metadata worden bewaard en als read-only verwijzing worden getoond. To Do-import mag bijlagen kopiëren naar de bijbehorende hoofdtaak of subtaak, maar schrijft niets terug naar Microsoft.

Deadlines zijn optionele tijdstippen met datum én tijd. Domeinservices converteren invoer uit `Europe/Amsterdam` naar UTC en valideren de deadlinehiërarchie wanneer de hoofdtaak en subtaak beide een deadline hebben. Een voorgestelde tijd van 17.00 uur bij datumkeuze blijft zichtbaar en aanpasbaar; tijd zonder datum wordt geweigerd.

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

Een lokale PostgreSQL-installatie is niet nodig. Development-, test- en productiegegevens blijven aantoonbaar gescheiden. Kritieke deadline-integriteit krijgt naast servicevalidatie een PostgreSQL-vangnet; voor fase 1 zijn versioned triggers in de migratie de beoogde concrete vorm. Cycluscontrole op dependencies gebeurt transactioneel en serialiseert conflicterende graafwijzigingen. Archiveren en verwijderen zijn technisch gescheiden: archiveren is een statusupdate naar `ARCHIVED`, terwijl verwijderen een hard-delete is en nooit de archiveerservice aanroept. Definitief verwijderen vereist een expliciete gebruikersbevestiging; een hoofdtaak wordt server-side geweigerd zolang een subtaak bestaat. De domeinservice verwijdert daarna user-scoped private bestanden, tijdregistraties en dependencies voordat de taak- of subtaakrecord uit PostgreSQL wordt verwijderd. Importhistorie blijft losgekoppeld behouden.

De bestaande taakstatus `WAITING` vertegenwoordigt voor hoofdtaken de parkeerfunctie `Taken Mogelijk`. Een gerichte, user-scoped domeinmutatie staat uitsluitend overgangen `OPEN` naar `WAITING` en `WAITING` naar `OPEN` toe. De planningslogica sluit `WAITING`-hoofdtaken uit van datumselectie en minutenbelasting; de record en alle relaties blijven behouden. Voor subtaken behoudt `WAITING` de betekenis tijdelijk wachten.

Bijlagen zijn first-class gegevens en bestaan zowel voor hoofdtaken als subtaken. De datalaag bewaart daarom attachmentmetadata apart van de taak- of subtaakrecord zelf; echte bestanden worden privé opgeslagen en links blijven als metadata beschikbaar.

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

Webherstel verloopt via een dunne aanvraagaction, een afzonderlijke authenticatieservice en een kleine server-only Resend-adapter. Een cryptografisch willekeurige token wordt dertig minuten geldig uitgegeven; alleen de contextgescheiden HMAC-SHA-256-hash wordt in PostgreSQL opgeslagen. De aanvraagmelding is altijd generiek. Tokenverbruik, Argon2id-wachtwoordwijziging, intrekking van sessies en overige tokens en het wissen van auththrottles gebeuren transactioneel. Het bestaande interactieve lokale noodherstel blijft de provider-onafhankelijke terugvalroute.

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

Deadline-loze subtaken blijven uitvoerbaar werk en tellen mee in de resterende hoofdtaakduur. Ze hebben geen speling of deadlinewaarschuwing en worden niet aan een specifieke kalenderdag toegerekend.

De pure taakdomeinlogica selecteert datumgebonden werk voor `Vandaag` en `Deze week`. Bij een taak met subtaken worden uitsluitend open subtaken op hun eigen deadline geselecteerd; de hoofdtaak is alleen de visuele groepering en levert geen tweede planningitem. De boardprojectie mag voor een hoofdtaak zonder eigen deadline de vroegste open subtaakdeadline als `Eerstvolgende subtaak` tonen. De tijd naast die datum is de som van open subtaakminuten op exact die datum, niet de totale resterende hoofdtaaktijd. Deze afgeleide waarden blijven gescheiden van `Task.deadline`, zodat formulieren en deadlinehiërarchie uitsluitend de opgeslagen hoofdtaakdeadline gebruiken.

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

Handmatige bijlagen gebruiken een directe browserupload naar Vercel Blob Private. Een serverroute geeft pas na sessie-, origin- en doelautorisatie een kortlevend uploadtoken uit. De Content Security Policy staat hiervoor alleen `https://vercel.com` voor de Blob API en `https://*.blob.vercel-storage.com` als externe `connect-src` toe. De ondertekende completioncallback en een idempotente browserfinalisatie bewaren dezelfde metadata zonder duplicaten. Download loopt via een MijnPlanning-route die sessie en eigendom opnieuw controleert; de browser krijgt geen permanente private Blob-URL. Afbeeldingsbijlagen worden via diezelfde geautoriseerde route inline als compacte, klikbare thumbnail naast de paperclip getoond en blijven daardoor na verversen zichtbaar.

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
RESEND_API_KEY
PASSWORD_RESET_EMAIL_FROM
```

Er is in de MVP geen `PASSWORD_PEPPER`. De volgende variabelen horen pas bij hun latere integratiefase en worden niet in fase 0 geprovisioneerd:

```text
BLOB_READ_WRITE_TOKEN
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
