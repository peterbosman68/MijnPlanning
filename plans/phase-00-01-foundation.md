# Uitvoeringsplan fase 0 en fase 1 — fundament, taken en subtaken

- Status: **technische foundation goedgekeurd; O20-visuele proef wacht op Peters expliciete goedkeuring**
- Datum: **18 juli 2026**
- Scope: **fase 0 (projectbasis) en fase 1 (taken en subtaken)**
- Implementatie: **technische fase-0A-basis gevalideerd; productfunctionaliteit en productie-infrastructuur nog niet gestart**

Dit document is het uitvoeringsplan dat vóór de eerste applicatiecode moet worden goedgekeurd. Goedkeuring van dit plan geeft nog geen toestemming voor afwijkingen van de gekozen stack, betaalde infrastructuur, destructieve migraties of nieuwe niet-vastgelegde productregels.

## 1. Doel en gebruikersresultaat

Na fase 0 kan Peter veilig inloggen op een lege, responsieve MijnPlanning-applicatie. De technische basis is reproduceerbaar, testbaar en geschikt voor PostgreSQL, Prisma en Vercel.

Na fase 1 kan Peter:

- taken aanmaken, bekijken, wijzigen en standaard archiveren;
- nul, één of meerdere subtaken aan een taak koppelen;
- optioneel een taakdeadline en verplicht een subtaakdeadline vastleggen;
- geen subtaak opslaan met een deadline na een bestaande taakdeadline;
- geen taakdeadline vervroegen wanneer bestaande subtaken daardoor ongeldig worden;
- afhankelijkheden tussen subtaken van dezelfde of verschillende taken vastleggen;
- geen zelfafhankelijkheid, dubbele afhankelijkheid of cyclische afhankelijkheid opslaan;
- de basis van `Vandaag` openen zonder dat al een planningsmotor wordt gesimuleerd.

De uitkomst van fase 1 is een server-side beschermd taakdomein. Timer, planningsmotor, weekplanning, alarmberekening, AI, Microsoft-koppelingen, bestanden en PWA-functionaliteit vallen buiten dit plan.

## 2. Gelezen bronnen en gezag

Voor dit plan zijn volledig gelezen:

- `AGENTS.md`;
- `PLANS.md`;
- `README.md`;
- `docs/PRODUCT_PLAN.md`;
- `docs/PRODUCT_RULES.md`;
- `docs/ARCHITECTURE.md`;
- `docs/DATA_MODEL.md`;
- `docs/DESIGN_SYSTEM.md`;
- `docs/MICROSOFT_INTEGRATION.md`;
- `docs/SECURITY.md`;
- `docs/ROADMAP.md`;
- `docs/DECISIONS.md`.

Voor regels over uitvoeringsplannen wordt uitsluitend `PLANS.md` in de hoofdmap gebruikt.

Bij verschillen geldt de vastgelegde volgorde: actuele instructie van Peter, `docs/DECISIONS.md`, `docs/PRODUCT_RULES.md`, `AGENTS.md`, overige documentatie, code en ten slotte prototypes.

## 3. Huidige situatie

- De werkmap bevat uitsluitend Markdown-documentatie; er is nog geen applicatiecode, `package.json`, Prisma-schema, migratie, testconfiguratie of CI-configuratie.
- De bestaande private GitHub-repository is `https://github.com/peterbosman68/MijnPlanning`. Er wordt geen nieuwe repository aangemaakt.
- De lokale Git-status wordt pas bij de goedgekeurde implementatiestart opnieuw gecontroleerd. Als de bestaande projectmap dan nog geen Git-repository is, wordt Git daar geïnitialiseerd en wordt de bestaande repository als `origin` gekoppeld.
- Bestaande lokale of remote bestanden worden niet overschreven voordat inhoud en Git-status zijn gecontroleerd.
- Alleen het top-level `PLANS.md` is de bron voor uitvoeringsplanregels.
- `plans/phase-00-01-foundation.md` was leeg vóór deze planwijziging.
- Neon Postgres via Vercel Marketplace is als provider gekozen, maar er is nog geen database geprovisioneerd.
- Er zijn nog geen npm-pakketten geïnstalleerd en er is geen lockfile.
- De map staat in OneDrive. Dat is bruikbaar voor documentatie, maar `node_modules`, `.next` en gelijktijdige synchronisatie kunnen performance-, lock- of padproblemen geven.

## 4. Consistentiecontrole

### 4.1 Onderling consistente hoofdkeuzes

De kerndocumenten zijn op de volgende punten consistent:

- de productnaam is MijnPlanning en `Spoorwerk` is alleen een oude referentie;
- de eerste versie is single-user en gebruikt een eigen login, los van Microsoft;
- de stack is Node.js 24 LTS, Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS 3, PostgreSQL en Prisma 6;
- een taakdeadline is optioneel en iedere subtaakdeadline is verplicht;
- als een taakdeadline bestaat, geldt `subtaakdeadline <= taakdeadline`;
- een taakdeadline mag niet stilzwijgend worden vervroegd als subtaken daardoor ongeldig worden;
- afhankelijkheden lopen tussen subtaken en mogen hoofdtaakgrenzen overschrijden;
- cycli moeten server-side worden geweigerd;
- React-componenten bevatten geen bedrijfsregels en gebruiken Prisma niet rechtstreeks;
- AI adviseert en beslist niet zelfstandig;
- Microsoft To Do is alleen een eenmalige import en WhatsApp valt buiten de eerste versie;
- privacy, minimale rechten en server-side autorisatie zijn verplichte basisvoorwaarden.

### 4.2 Opgeloste documentatieverschillen en resterende scope-aandacht

1. **Planinstructies:** het top-level `PLANS.md` is gevuld en is de enige bron voor uitvoeringsplanregels. Een bestand met dezelfde naam onder `docs/` wordt niet gebruikt.
2. **Vandaag:** fase 0 bouwt uitsluitend een beschermde routeshell en eerlijke lege staat; de volledige functionele invulling blijft fase 3. De roadmap maakt dit onderscheid expliciet.
3. **Bestanden:** fase 0 bevat geen Blob-SDK, token of uploadfunctionaliteit; Vercel Blob Private wordt pas in de bijlagenfase toegevoegd.
4. **Naam `TaskDependency`:** deze naam blijft op expliciete opdracht behouden, terwijl beide foreign keys naar `Subtask` wijzen. Dit is een benoemd semantisch risico, geen tegenstrijdige productregel.
5. **Deadlines:** alle leidende documenten formuleren nu conditioneel dat de subtaakdeadline alleen aan de taakdeadline is begrensd wanneer een taakdeadline bestaat.
6. **Login en wachtwoordopslag:** de leidende documenten gebruiken alleen e-mailadres en wachtwoord, geen verplichte gebruikersnaam en geen password pepper in de MVP.

### 4.3 Besluitenstatus

O1 tot en met O20 zijn door Peter beantwoord en staan definitief in hoofdstuk 15 en `docs/DECISIONS.md`. Er resteert geen open productkeuze uit deze lijst.

Voor de implementatiestart blijven wel controlepoorten bestaan:

- expliciete goedkeuring om dit uitvoeringsplan uit te voeren;
- controle van lokale en remote Git-inhoud voordat Git wordt geïnitialiseerd of een `origin` wordt gekoppeld;
- als eerste technische fase-0-poort: compatibiliteitstest van Node.js 24, Next.js 16, Prisma 6 en de gekozen actuele veilige patchversies;
- operationele controle dat de voorgenomen development- en testbelasting binnen Neon Free past.

Neon Free is geen open productbeslissing meer. Overschrijding van Free-limieten is een operationeel risico dat eerst wordt gerapporteerd en beperkt; een betaalde upgrade wordt nooit zonder Peters expliciete toestemming geactiveerd.

Als de eerste compatibiliteitscontrole faalt, wordt het resultaat eerst aan Peter gerapporteerd en stopt de verdere implementatie. Codex wijkt niet zelfstandig af naar Prisma 7, Node.js 22 of enige andere stackversie.

## 5. Compatibiliteitscontrole van de afgesproken stack

De gekozen hoofdversies vormen de vaste basis. De combinatie van Node.js 24, Next.js 16, Prisma 6 en de gekozen actuele veilige patchversies wordt de eerste technische stop/go-test van fase 0, vóór bredere implementatie. De stack wordt niet stilzwijgend gewijzigd.

| Onderdeel | Controle en uitkomst | Vastgelegde randvoorwaarde |
|---|---|---|
| Next.js 16 + React 19 | Next.js 16 is Active LTS en gebruikt React 19.2 binnen major 19. | Gebruik de nieuwste veilige stabiele patch binnen `16.x`, geen canary, en houd `react` en `react-dom` op dezelfde `19.x`-versie. |
| Next.js 16 + Node.js 24 | Next.js 16 vereist minimaal Node.js 20.9; Node.js 24 is LTS. | Gebruik een actuele veilige Node.js `24.x`-patch en leg die vast in runtimeconfiguratie. |
| Next.js 16 + TypeScript 5 | Next.js 16 vereist minimaal TypeScript 5.1. | Gebruik een actuele veilige TypeScript `5.x`-versie die door de gekozen Next.js-patch wordt ondersteund. |
| Prisma 6 + Node.js 24 | Prisma 6 blijft een expliciete productkeuze. De Prisma 6-upgradehandleiding noemt ondersteuning tot Node.js 22 en noemt Node.js 24 niet expliciet. | Voer vóór verdere implementatie een minimale generate-, connectie-, migratie- en querytest uit met de gekozen nieuwste Prisma `6.x`-patch op Node.js `24.x`. Stop bij incompatibiliteit. |
| Prisma 6 + Neon Postgres | Prisma 6 ondersteunt PostgreSQL en Neon Serverless Postgres. | Gebruik Neon via Vercel Marketplace, begin gratis en houd runtime- en migratieverbindingen passend bij de door Neon geleverde configuratie. |
| Tailwind CSS 3 + Next.js 16 | Tailwind 3 werkt via PostCSS en expliciete contentconfiguratie; actuele generators kunnen standaard Tailwind 4 kiezen. | Pin `tailwindcss` op major 3 en maak de configuratie gecontroleerd. |
| Vercel | Next.js 16 draait native op Vercel; de runtime- en database-instellingen moeten bij Node.js 24 en Neon passen. | Richt Preview pas in nadat fase 0 lokaal slaagt; voeg geen betaalde Neon-upgrade toe zonder toestemming. |

De eerste technische stop/go-test legt de exacte gekozen patchversies vast en bewijst minimaal: een Next.js-productiebuild op Node.js 24, Prisma Client-generatie met Prisma 6, verbinding met een geïsoleerde Neon Free-developmentomgeving, een minimale migratie en een lees-/schrijfquery. Bij een fout worden de exacte versies, de mislukte stap en een geheimvrije foutdiagnose eerst aan Peter gerapporteerd. Verdere implementatie stopt; Codex kiest niet zelfstandig Prisma 7, Node.js 22 of een andere stackversie.

Actuele technische aandachtspunten:

- Next.js 16 gebruikt Turbopack standaard voor development en builds; er worden geen overbodige Turbopackflags toegevoegd.
- `next lint` is in Next.js 16 verwijderd. Het verplichte `npm run lint`-script roept ESLint rechtstreeks aan.
- De exacte patchversies worden niet blind op basis van `latest` gekozen. Security advisories worden gecontroleerd, majors worden begrensd en `package-lock.json` legt de resolve vast.
- De scaffold wordt gecontroleerd gemaakt, omdat actuele defaults Tailwind CSS 4 kunnen kiezen terwijl Tailwind CSS 3 is besloten.

Officiële compatibiliteitsbronnen:

- [Next.js 16 release](https://nextjs.org/blog/next-16)
- [Next.js 16 upgradevereisten](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js support policy](https://nextjs.org/support-policy)
- [React 19 stable](https://react.dev/blog/2024/12/05/react-19)
- [Tailwind CSS v3 met Next.js](https://v3.tailwindcss.com/docs/guides/nextjs)
- [Prisma ORM 6 upgradevereisten](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v6)
- [Prisma 6 ondersteunde databases](https://docs.prisma.io/docs/orm/v6/reference/supported-databases)
- [Node.js releasestatus](https://nodejs.org/en/about/previous-releases)
- [Neon via Vercel Marketplace](https://vercel.com/marketplace/neon)

## 6. Functionele interpretatie voor fase 0 en 1

### 6.1 Taak en subtaak

- Een taak is de hoofdtaak en heeft minimaal een verplichte titel. De omschrijving bestaat als veld maar mag leeg zijn.
- Een taakdeadline is nullable.
- Deadlines bevatten datum én tijd, worden getoond in `Europe/Amsterdam` en worden als UTC opgeslagen.
- Wanneer de gebruiker alleen een datum kiest, mag de interface 17.00 uur voorstellen. De tijd blijft zichtbaar en aanpasbaar voordat wordt opgeslagen.
- Een subtaak heeft altijd een titel, deadline, geschatte actieve werktijd, resterende actieve werktijd en status.
- Als `Task.deadline` null is, mag een subtaak iedere geldige toekomstige of historische deadline hebben; er is dan geen bovenlimiet vanuit de taak.
- Als `Task.deadline` niet null is, wordt een latere `Subtask.deadline` in UI, server/service, transactie en database geweigerd.
- Een taak zonder subtaken mag aanvankelijk geen duur hebben en is dan nog niet planbaar. Na invullen of accepteren van een tijdsinschatting kan de planner deze later als werkitem gebruiken.
- Zodra één of meer subtaken bestaan, worden de eigen duurvelden van de taak niet als extra werk meegerekend. Een fase-1-projectie geeft de resterende duur dan als som van open subtaken terug; de echte planning volgt in fase 3.

### 6.2 Vervroegen van een taakdeadline

De gekozen interpretatie uit `docs/PRODUCT_RULES.md` is:

1. valideer de voorgestelde nieuwe taakdeadline;
2. zoek alle niet-verwijderde subtaken met een latere deadline;
3. sla de taakwijziging niet op als conflicten bestaan;
4. retourneer de conflicterende subtaken met id, titel en deadline;
5. toon een conflictvenster met alleen de opties `Subtaken aanpassen` en `Wijziging annuleren`;
6. pas nooit automatisch subtaakdeadlines aan;
7. na aanpassing van alle conflicten kan Peter de taakdeadline opnieuw opslaan.

### 6.3 Afhankelijkheden

- `TaskDependency.subtaskId` is de opvolger/geblokkeerde subtaak.
- `TaskDependency.dependsOnSubtaskId` is de verplichte voorganger.
- Fase 1 ondersteunt alleen `FINISH_TO_START`.
- Beide subtaken moeten bij de ingelogde gebruiker horen, maar hoeven niet dezelfde hoofdtaak te hebben.
- Zelfafhankelijkheid en duplicaten worden door servervalidatie én databaseconstraints geweigerd.
- Een cyclus wordt vóór commit bepaald op de volledige relevante graaf. Mutaties aan de afhankelijkheidsgraaf worden per gebruiker geserialiseerd om twee gelijktijdige, afzonderlijk geldige maar gezamenlijk cyclische inserts te voorkomen.

### 6.4 CRUD en autorisatie

- Alle reads en writes lopen via server-side services/repositories.
- Iedere operatie krijgt de geauthenticeerde `userId` uit de sessie, nooit uit een vertrouwd browserveld.
- Iedere taakquery wordt op `userId` begrensd.
- Iedere subtaak- of afhankelijkheidsquery bewijst eigenaarschap via de bovenliggende taak of via beide bovenliggende taken.
- UI-validatie is alleen gebruiksgemak; server- en databasevalidatie blijven leidend.
- Mutatiefouten hebben stabiele foutcodes, bijvoorbeeld `AUTH_REQUIRED`, `NOT_FOUND`, `DEADLINE_CONFLICT`, `DEPENDENCY_CYCLE` en `VALIDATION_ERROR`, zonder gevoelige details te lekken.
- Formulieren voor taken en subtaken gebruiken een expliciete knop `Opslaan`.
- Archiveren is de standaard. Definitief verwijderen is niet toegestaan als tijdregistraties, bijlagen, importhistorie of afhankelijkheden bestaan; dependencies worden nooit stilzwijgend gecascadeerd.
- Handmatig bedienbare fase-1-statussen zijn Open, Wachten, Afgerond, Gearchiveerd en Geannuleerd. Geblokkeerd wordt uit dependencies afgeleid. Actief, Gepauzeerd en Wachten op externe partij volgen pas in fase 2.

## 7. Voorgesteld datamodel

Definitieve veldkeuzes worden pas na besluit over hoofdstuk 15 in Prisma vastgelegd.

### 7.1 `User`

| Veld | Voorstel |
|---|---|
| `id` | UUID primary key |
| `email` | verplicht, genormaliseerd en uniek; het enige login-identificatieveld in de MVP |
| `passwordHash` | volledige Argon2id encoded hash, nooit selecteren buiten auth-code |
| `timeZone` | IANA-zone, standaard `Europe/Amsterdam` |
| `createdAt`, `updatedAt` | UTC-timestamps |

Er is geen verplicht `username`-veld. Een optionele weergavenaam kan in een latere, afzonderlijk goedgekeurde wijziging worden toegevoegd.

### 7.2 `Session`

| Veld | Voorstel |
|---|---|
| `id` | UUID primary key |
| `userId` | foreign key naar `User`, delete cascade bij expliciete accountverwijdering |
| `tokenHash` | unieke SHA-256-hash van een cryptografisch willekeurig opaque token |
| `expiresAt` | absolute vervaldatum, maximaal 30 dagen na creatie |
| `revokedAt` | nullable; gezet bij logout/intrekking |
| `createdAt`, `lastUsedAt` | UTC-timestamps; maximaal 7 dagen inactiviteit en `lastUsedAt` begrensd verversen |

Alleen het ruwe token staat in de cookie; alleen de hash staat in PostgreSQL.

### 7.3 Technisch auth-throttlemodel

Een databasegedragen rate limiter is nodig omdat in-memory counters niet betrouwbaar zijn over Vercel-instances. Voorstel: `AuthThrottle` met een gehashte sleutel, vensterstart, foutteller, `blockedUntil` en `updatedAt`. Er worden geen ruwe wachtwoorden of volledige IP-adressen opgeslagen. Dit is een technisch ondersteunend model; de precieze velden worden binnen de goedgekeurde beveiligingsarchitectuur gereviewd en vormen geen nieuwe productregel.

### 7.4 `Task`

| Veld | Voorstel |
|---|---|
| `id` | UUID primary key |
| `userId` | foreign key naar `User` |
| `title` | verplicht, getrimd, maximale lengte server-side vastgelegd |
| `descriptionOriginal` | originele invoer; mag leeg zijn en wordt niet door normalisatie overschreven |
| `descriptionPlain` | afgeleide veilige platte tekst of lege string; overschrijft nooit het origineel |
| `status` | fase-1-enum met `OPEN`, `WAITING`, `COMPLETED`, `ARCHIVED` en `CANCELLED`; timerstatussen worden pas via een latere migratie toegevoegd |
| `deadline` | nullable `timestamptz`/Prisma `DateTime` |
| `estimatedMinutes` | nullable; een taak zonder subtaken is zonder geaccepteerde duur niet planbaar |
| `remainingMinutes` | nullable; alleen als eigen taakduur gebruiken zonder subtaken en niet boven op subtaken tellen |
| `sourceType` | default `MANUAL`, voorbereid op latere import |
| `sourceExternalId` | nullable; geen importlogica in fase 1 |
| `createdAt`, `updatedAt`, `completedAt` | UTC-timestamps |

Indexen: `userId`, `(userId, status)`, `(userId, deadline)` en eventueel een unieke bronindex pas bij de importfase.

### 7.5 `Subtask`

| Veld | Voorstel |
|---|---|
| `id` | UUID primary key |
| `taskId` | foreign key naar `Task` |
| `title` | verplicht, getrimd |
| `descriptionOriginal`, `descriptionPlain` | dezelfde bronbehoudregel als taak; omschrijving mag leeg zijn |
| `deadline` | verplicht `timestamptz`/Prisma `DateTime` |
| `earliestStart` | nullable |
| `estimatedMinutes` | verplicht positief geheel aantal minuten |
| `remainingMinutes` | verplicht niet-negatief; technische integer- en payloadgrenzen worden gedocumenteerd zonder een nieuwe productregel over maximale taakduur te verzinnen |
| `minimumBlockMinutes` | positief; default na functioneel besluit |
| `splittable` | boolean |
| `priority` | in fase 1 nullable en niet bedienbaar; prioriteitssemantiek wordt pas met de planningsmotor vastgesteld |
| `context` | nullable korte tekst |
| `status` | fase-1-enum met `OPEN`, `WAITING`, `COMPLETED`, `ARCHIVED` en `CANCELLED`; `BLOCKED` is afgeleid en geen opgeslagen keuze |
| `createdAt`, `updatedAt`, `completedAt` | UTC-timestamps |

Indexen: `taskId`, `(taskId, status)`, `deadline` en `(status, deadline)` voor latere gezamenlijke planning.

### 7.6 `TaskDependency`

| Veld | Voorstel |
|---|---|
| `id` | UUID primary key |
| `subtaskId` | foreign key naar de opvolger |
| `dependsOnSubtaskId` | foreign key naar de voorganger |
| `dependencyType` | default en voorlopig enige waarde `FINISH_TO_START` |
| `createdAt` | UTC-timestamp |

Constraints en indexen:

- unique op `(subtaskId, dependsOnSubtaskId, dependencyType)`;
- check `subtaskId <> dependsOnSubtaskId`;
- index op `subtaskId` en op `dependsOnSubtaskId`;
- foreign keys met `RESTRICT`; dependencies worden nooit via een automatische cascade verwijderd.

### 7.7 Databaseafdwinging deadlinehiërarchie

Een gewone PostgreSQL `CHECK`-constraint kan niet veilig een waarde uit een andere tabel raadplegen. Daarom is het voorstel:

- normale veldchecks voor nullability, positieve minuten en zelfafhankelijkheid;
- een versioned SQL-trigger op insert/update van `Subtask` die de bovenliggende taak controleert;
- een versioned SQL-trigger op update van `Task.deadline` die latere subtaken weigert;
- dezelfde regel eerst in pure TypeScript-domeinlogica en in de service-transactie uitvoeren voor bruikbare foutmeldingen;
- een vaste lockvolgorde op de bovenliggende `Task` om races te voorkomen;
- integratietests die bewijzen dat ook directe SQL buiten de applicatieservice de regel niet kan doorbreken.

De trigger komt als leesbare custom SQL in een Prisma-migratie. De domeinservice is leidend voor bedrijfsvalidatie en bruikbare fouten; de trigger is het integriteitsvangnet voor writes die de service omzeilen. Deze verantwoordelijkheidsverdeling wordt naast de migratie gedocumenteerd.

## 8. Voorgestelde projectstructuur na fase 1

```text
app/
├── (auth)/
│   └── login/
├── (protected)/
│   ├── layout.tsx
│   ├── taken/
│   └── vandaag/
├── api/
│   └── health/
├── globals.css
└── layout.tsx
components/
├── layout/
└── ui/
lib/
├── auth/
├── db/
├── logging/
├── security/
└── tasks/
    ├── domain/
    ├── repositories/
    └── services/
prisma/
├── migrations/
└── schema.prisma
scripts/
└── create-user.ts
tests/
├── unit/
├── integration/
└── e2e/
docs/
plans/
public/
```

Routegroepen veranderen de URL niet. De URL’s blijven `/login`, `/taken` en `/vandaag`.

## 9. Visuele aanpak

### 9.1 Verplichte visuele goedkeuringspoort

Na het opzetten van de technische projectbasis en vóór brede frontendimplementatie geldt een afzonderlijke stop/go-poort:

1. Codex stelt een concreet kleurenpalet met hexwaarden voor.
2. Codex legt typografie, spacing, knoppen, formulieren en statuslabels concreet vast.
3. Codex bouwt uitsluitend één werkende visuele versie van het scherm Taken. Deze versie mag representatieve niet-gevoelige voorbeelddata en lokale interactiestaten gebruiken, maar wordt niet als volledig afgeronde CRUD gepresenteerd.
4. Codex toont deze versie op desktop- en mobiel formaat, inclusief relevante browserweergaven of screenshots.
5. Codex bouwt nog geen volledige overige schermen en past het ontwerp nog niet projectbreed toe.
6. Codex wacht op expliciete goedkeuring van Peter. Pas daarna mogen de goedgekeurde tokens, componentpatronen en visuele taal breder worden toegepast.

De beoordeling gaat minimaal over rust, volwassenheid, compactheid, betrouwbaarheid, leesbaarheid, informatiehiërarchie, mobiele bruikbaarheid en toegankelijkheid. Paarse gradients, een generiek AI-dashboard, grote lege vlakken, te veel afgeronde kaarten en te kleine grijze tekst zijn afkeurcriteria.

### 9.2 Taken — eerste visuele plan

Desktop:

```text
┌ navigatie ─────────────────────────────────────────────────┐
│ Taken                              [Nieuwe taak]           │
├ lijst/filter ────────┬ taakdetail ─────────────────────────┤
│ taak + status        │ titel, omschrijving, taakdeadline   │
│ deadline             │ subtakenlijst                       │
│ compact risico-icoon │ afhankelijkheden en duur            │
│                      │ [Opslaan]                            │
└──────────────────────┴─────────────────────────────────────┘
```

Mobiel:

```text
kop + [Nieuwe taak]
zoek/filter
compacte takenlijst
→ taakdetail als aparte gestapelde weergave
→ subtaken onder de hoofdtaak
vaste, niet-overlappende opslagactie indien nodig
```

Ontwerpregels:

- één primaire actie per paneel;
- hoofdtaak en subtaak visueel duidelijk onderscheiden;
- deadlines met tekst en niet alleen kleur;
- rood alleen bij ongeldige invoer of echt risico;
- zichtbare labels, focusstatus, toetsenbordbediening en klikvlakken van minimaal praktisch mobiel formaat;
- formulieren compact, maar foutmeldingen direct onder het relevante veld;
- bij deadlineconflict een modal omdat dit een belangrijke keuze is;
- taak- en subtaakformulieren gebruiken expliciet `Opslaan`;
- timeracties, statuswijzigingen en verslepen mogen in een latere fase direct opslaan, maar tonen dan altijd zichtbare bevestiging of een foutmelding.

### 9.3 Vandaag — technische basis

```text
statusbalk: “Planning nog niet berekend”
laatst vernieuwd: niet beschikbaar
primaire lege staat: planningsmotor volgt in fase 3
link: taken beheren
gereserveerde, semantische secties voor alarm, actief werk en wachtrij
```

Er worden geen verzonnen taakvolgorde, vrije werktijd of risicokleuren getoond. Desktop en mobiel gebruiken dezelfde informatiehiërarchie.

Te controleren viewports: minimaal 1440×900, 1024×768, 390×844 en 360×800, plus toetsenbordgebruik en zoom tot 200%.

## 10. Implementatiestappen fase 0

### Stap 0.1 — Besluiten en goedkeuringspoort

- **Doel:** bevestigen dat O1–O20 zijn vastgelegd en daarna expliciete toestemming krijgen voordat code, dependencies, Git of infrastructuur wordt gewijzigd.
- **Bestanden:** dit plan en `docs/DECISIONS.md` bevatten de vastgestelde besluiten; latere planwijzigingen worden tijdens de uitvoering bijgehouden.
- **Databasegevolgen:** geen.
- **Beveiligingsgevolgen:** voorkomt dat login-, secret-, sessie- of hostingkeuzes impliciet worden ingevuld.
- **Tests:** controlelijst dat ieder blokkerend besluit een eigenaar, keuze en datum heeft.
- **Acceptatiecriteria:** Peter heeft het bijgewerkte uitvoeringsplan expliciet goedgekeurd; de status wordt `goedgekeurd` voordat implementatie begint.
- **Risico’s:** de besluiten zijn vastgelegd, maar vormen nog geen toestemming om externe state of applicatiecode te wijzigen.
- **Afhankelijkheden:** geen.

### Stap 0.2 — Git- en repositorybasis

- **Doel:** de bestaande private repository `https://github.com/peterbosman68/MijnPlanning` veilig koppelen zonder rechtstreeks op `main` te ontwikkelen of bestaande inhoud te overschrijven.
- **Bestanden:** na vergelijking van lokale en remote inhoud eventueel `.gitignore`, `.gitattributes`, `.editorconfig` en aanvulling van `README.md`; top-level `PLANS.md` blijft de enige planinstructiebron.
- **Databasegevolgen:** geen.
- **Beveiligingsgevolgen:** `.env*`, logs, backups, exports, Prisma testdata, `.next`, `node_modules` en private bestanden expliciet uitsluiten; bij implementatiestart bevestigen dat de bestaande repository nog privé is en secret scanning en branch protection controleren waar beschikbaar.
- **Tests:** pas na implementatiegoedkeuring: lokale Git-status, remote inhoud, tracked files, dummy-secretbestandsnamen en actieve branch controleren vóór een write of push.
- **Acceptatiecriteria:** er is geen nieuwe repository aangemaakt; de bestaande repository is privé; zo nodig is Git in de bestaande map geïnitialiseerd; de bestaande repository is als `origin` gekoppeld; lokale en remote inhoud zijn eerst vergeleken; implementatie gebeurt op `feature/phase-00-foundation` en geen secret of bestaande inhoud is overschreven.
- **Risico’s:** remote en lokale documentatie kunnen uiteenlopen; een onzorgvuldige eerste koppeling kan bestaande bestanden overschrijven. OneDrive kan Git-lockfiles tijdelijk blokkeren.
- **Afhankelijkheden:** stap 0.1 en vastgestelde besluiten O1–O2.

### Stap 0.3 — Gecontroleerde scaffold en eerste technische stop/go-test

- **Doel:** de afgesproken stack met expliciete actuele veilige patchversies minimaal opzetten en vóór bredere implementatie bewijzen dat Node.js 24, Next.js 16 en Prisma 6 gezamenlijk werken.
- **Bestanden:** `package.json`, `package-lock.json`, `.node-version` of `.nvmrc`, `next.config.ts`, `next-env.d.ts`, `tsconfig.json`, ESLint-config, `postcss.config`, `tailwind.config.ts`, minimale `app/`, basis `public/` en een minimaal `prisma/schema.prisma` voor de compatibiliteitsproef.
- **Databasegevolgen:** uitsluitend na implementatiegoedkeuring een geïsoleerde Neon Free-developmentomgeving en een minimale tijdelijke compatibiliteitsmigratie/query; geen producttabellen of productiedata.
- **Beveiligingsgevolgen:** alleen ondersteunde stabiele patches; geen secrets in clientvariabelen of testlogs; server-only modules vanaf het begin markeren; geen canary-pakket; database-URL uitsluitend server-side.
- **Tests:** exacte versiematrix vastleggen; Next.js-productiebuild op Node.js 24; Prisma 6 Client genereren; verbinden met geïsoleerde Neon Free-developmentdata; minimale migratie en lees-/schrijfquery; controle dat clientbundel geen servervariabelen bevat.
- **Acceptatiecriteria:** alle compatibiliteitsproeven slagen met de vastgelegde patches binnen Node.js 24, Next.js 16, React 19, TypeScript 5, Tailwind 3 en Prisma 6. Pas daarna beginnen stap 0.4 en overige implementatie.
- **Risico’s:** Prisma 6 noemt Node.js 24 niet expliciet in de v6-upgradevereisten; actuele generators kunnen ongewenste majors kiezen; Neon Free-limieten kunnen de testomgeving beperken. Een mislukking of limietoverschrijding wordt eerst gerapporteerd.
- **Afhankelijkheden:** stap 0.2 en vastgestelde besluiten O2–O3 en O8. Installatie-, Prisma- en Neon-opdrachten worden pas na goedkeuring uitgevoerd. Codex wijzigt bij falen geen stackversie zonder Peters toestemming.

### Stap 0.4 — Test-, kwaliteits- en CI-basis

- **Doel:** verplichte kwaliteitscontroles vanaf de eerste codewijziging afdwingbaar maken.
- **Bestanden:** scripts in `package.json`, testconfiguratie voor unit/integratie/e2e, `tests/`-mappen, `.github/workflows/ci.yml`, eventuele test-`.env.example` zonder secrets.
- **Databasegevolgen:** integratietests krijgen later een geïsoleerde PostgreSQL-database; nooit productie gebruiken.
- **Beveiligingsgevolgen:** minimale GitHub Actions-rechten, gelockte action-majors/commits waar passend, secrets alleen via GitHub/Vercel; testlogs redigeren.
- **Tests:** een minimale Vitest-smoketest, Playwright-smoketest en CI-run; scripts `lint`, `typecheck`, `test` en `build` bestaan en falen correct; `lint` roept ESLint rechtstreeks aan omdat Next.js 16 geen `next lint` biedt.
- **Acceptatiecriteria:** de vier verplichte scripts kunnen lokaal en in CI worden uitgevoerd; CI start op pull requests en schrijft geen secrets uit.
- **Risico’s:** Zod, Vitest en Playwright voegen dependencies toe; browserdownloads kosten CI-tijd.
- **Afhankelijkheden:** stap 0.3 en vastgesteld besluit O12.

### Stap 0.5 — PostgreSQL- en Prisma-basis

- **Doel:** één veilige Neon Postgres-verbinding via Vercel Marketplace, Prisma 6-configuratie en reproduceerbare migratiewerkwijze maken zonder lokale PostgreSQL-installatie.
- **Bestanden:** `prisma/schema.prisma`, `lib/db/client.ts`, `.env.example`, documentatie in `README.md`, databasehelpers voor tests; nog geen producttabellen buiten de authstap.
- **Databasegevolgen:** Neon wordt na implementatiegoedkeuring op het gratis abonnement ingericht; `_prisma_migrations` ontstaat pas bij de eerste goedgekeurde migratie; development en test worden aantoonbaar van productie gescheiden binnen de mogelijkheden van het gratis abonnement.
- **Beveiligingsgevolgen:** TLS in productie, minimaal databaseaccount, geen URL in logs, Node-runtime voor Prisma, connection limits/pooling, `DATABASE_URL` en waar nodig `DIRECT_URL` alleen server-side.
- **Tests:** de in stap 0.3 geaccepteerde versiematrix opnieuw gebruiken; connectiviteit naar development/test, negatieve test met ontbrekende variabelen en bewijs dat een productie-URL in test wordt geweigerd.
- **Acceptatiecriteria:** de gekozen Prisma 6-patch werkt aantoonbaar op Node.js 24; Neon gebruikt het gratis abonnement; testdata is geïsoleerd; databaseclient is singleton-safe en niet importeerbaar in clientcode.
- **Risico’s:** Neon Free heeft capaciteits- en restorebeperkingen; verkeerde pooling kan connecties uitputten. Overschrijding wordt als operationeel risico gerapporteerd en beperkt; een betaalde upgrade wordt niet zelfstandig geactiveerd.
- **Afhankelijkheden:** stappen 0.3–0.4 en vastgestelde besluiten O3, O8 en O14.

### Stap 0.6 — Authdatamodel en eerste niet-destructieve migratie

- **Doel:** `User`, `Session` en het goedgekeurde rate-limitmodel opslaan.
- **Bestanden:** `prisma/schema.prisma`, `prisma/migrations/<timestamp>_auth_foundation/migration.sql`, authfixtures/factories voor tests.
- **Databasegevolgen:** nieuwe tabellen, foreign keys, verplicht uniek genormaliseerd e-mailadres, unieke tokenhash, indexen voor actieve sessies en throttle-expiry; geen username en geen seed met standaardwachtwoord.
- **Beveiligingsgevolgen:** passwordhash nooit plaintext; tokenhash uniek; sessie-intrekking ondersteund; gehashte throttlekeys; consistente UTC-opslag.
- **Tests:** migratie op lege testdatabase, unique constraints, cascade/restrict volgens ontwerp, rollback-oefening alleen in wegwerpdatabase, schema-driftcontrole.
- **Acceptatiecriteria:** migratie is herhaalbaar via een schone testdatabase; constraints werken; er is geen standaardaccount of secret in Git.
- **Risico’s:** verkeerde e-mailnormalisatie is later kostbaar; het technische rate-limitmodel moet klein, privacybewust en reviewbaar blijven.
- **Afhankelijkheden:** stap 0.5 en vastgestelde besluiten O4 en O8.

### Stap 0.7 — Wachtwoord, eerste gebruiker, login en sessies

- **Doel:** Peter veilig laten inloggen en uitloggen met een intrekbare server-side sessie.
- **Bestanden:** `lib/auth/password.ts`, `lib/auth/session.ts`, `lib/auth/service.ts`, `lib/auth/repository.ts`, `lib/security/rate-limit.ts`, `scripts/create-user.ts`, `app/(auth)/login/page.tsx`, loginactie, logoutactie en relevante tests.
- **Databasegevolgen:** handmatige, eenmalige creatie van één `User`; nieuwe `Session` per succesvolle login; absolute expiry na maximaal 30 dagen, idle expiry na maximaal 7 dagen, intrekking bij logout of van alle sessies; throttleupdates bij mislukte login.
- **Beveiligingsgevolgen:** Argon2id met minimaal OWASP-baseline en unieke salt; geen pepper; cryptografisch willekeurig opaque token; alleen tokenhash in DB; `HttpOnly`, productie-`Secure`, expliciete `SameSite`, host-only cookie, generieke loginfout, timingbewuste controle, rate limiting en geen accountenumeratie. De CLI logt geen wachtwoord of hash en is geen productieroute.
- **Tests:** correcte/verkeerde e-maillogin, onbekend e-mailadres, rate limit, 30-dagen-expiry, 7-dagen-idle-expiry, actuele sessie uitloggen, alle sessies intrekken, cookieflags, tokenhash versus raw token, geen wachtwoord/hash/token in logs en ongeautoriseerde route.
- **Acceptatiecriteria:** alleen het geldige e-mailadres en wachtwoord geven toegang; ruwe wachtwoorden, hashes en sessietokens staan niet in logs; logout en “alle sessies intrekken” werken direct; rate limit werkt over afzonderlijke requests.
- **Risico’s:** native Argon2-packagecompatibiliteit; te agressieve rate limit kan Peter buitensluiten; first-user flow kan een publiek registratierisico worden als die via web gebeurt.
- **Afhankelijkheden:** stap 0.6 en vastgestelde besluiten O5 en O9–O10.

### Stap 0.8 — Autorisatielaag, securityheaders en veilige logging

- **Doel:** één server-side toegangspad maken dat alle beschermde pagina’s en toekomstige mutations gebruiken.
- **Bestanden:** `lib/auth/require-user.ts`, `lib/security/origin.ts`, `lib/logging/logger.ts`, `app/(protected)/layout.tsx`, rootredirect, `next.config.ts` voor headers, optionele `app/api/health/route.ts` zonder gevoelige details.
- **Databasegevolgen:** sessieleesquery’s; `lastUsedAt` begrensd bijwerken om schrijflast te voorkomen.
- **Beveiligingsgevolgen:** authcontrole in data access/service en niet alleen middleware; `Cache-Control: no-store` voor persoonlijke pagina’s; CSP/`frame-ancestors`, content type, referrer- en permissionsbeleid; Origin/Host-controle voor state changes; logs op foutcode/correlatie-id zonder inhoud.
- **Tests:** directe URL zonder sessie, vervalste cookie, cross-origin mutation, cacheheaders, securityheaders, healthroute zonder database- of secretlek.
- **Acceptatiecriteria:** iedere beschermde route weigert een ongeldige sessie; private content is niet publiek cachebaar; autorisatie berust niet uitsluitend op een clientredirect of middleware.
- **Risico’s:** een te strikte CSP kan Next.js-assets breken; host/originlogica moet previews en lokaal gebruik gecontroleerd ondersteunen.
- **Afhankelijkheden:** stap 0.7 en vastgesteld besluit O11.

### Stap 0.9 — Visueel voorstel en werkende Taken-versie

- **Doel:** vóór brede frontendimplementatie het visuele systeem concreet maken, één werkende responsive Taken-versie tonen en expliciete goedkeuring van Peter verkrijgen.
- **Bestanden:** voorstel en eventuele aanscherping in `docs/DESIGN_SYSTEM.md`; tijdens de latere uitvoering minimale Tailwindtokens, noodzakelijke UI-primitives en `app/(protected)/taken/page.tsx` met representatieve niet-gevoelige voorbeeldstaten. Nog geen overige volledige schermen.
- **Databasegevolgen:** geen nieuwe tabellen of productiewrites; de visuele versie gebruikt geen productiegegevens en hoeft nog niet aan volledige CRUD gekoppeld te zijn.
- **Beveiligingsgevolgen:** alleen niet-gevoelige voorbeelddata; beschermde route waar auth al beschikbaar is; geen misleidende opslag of verborgen externe requests.
- **Tests:** browsercontrole op minimaal 1440×900, 1024×768, 390×844 en 360×800; toetsenbord, focus, contrast, zoom tot 200%, lange titels, foutstatus en lege staat.
- **Acceptatiecriteria:** Peter ontvangt een concreet kleurenpalet met hexwaarden en vastgelegde typografie, spacing, knoppen, formulieren en statuslabels; één werkende Taken-versie is op desktop en mobiel getoond; Peter heeft het ontwerp expliciet goedgekeurd voordat andere schermen of projectbrede patronen worden gebouwd.
- **Risico’s:** een visueel prototype kan ten onrechte als functioneel afgeronde CRUD worden gezien; voorbeeldinteracties en nog niet aangesloten functies worden daarom expliciet gemarkeerd. Te brede componentbouw vóór goedkeuring veroorzaakt rework.
- **Afhankelijkheden:** stappen 0.3 en 0.8, hoofdstuk 9 en vastgesteld besluit O20. Deze stap eindigt verplicht met wachten op Peter.

### Stap 0.10 — App-shell, goedgekeurde ontwerptokens en technische basis Vandaag

- **Doel:** een rustig, toegankelijk en responsive beschermd skelet met de eerste niet-misleidende `/vandaag`-route leveren.
- **Bestanden:** `components/layout/*`, minimale `components/ui/*`, Tailwindtokens, `app/(protected)/vandaag/page.tsx`, navigatie, fout- en laadstatussen.
- **Databasegevolgen:** geen nieuwe tabellen of writes.
- **Beveiligingsgevolgen:** geen private data in statische cache; logout zichtbaar; geen onbehandelde HTML; navigatie toont alleen geautoriseerde pagina’s.
- **Tests:** component/toegankelijkheid waar zinvol, browser op desktop/mobiel, toetsenbord/focus, 200% zoom, unauthenticated redirect.
- **Acceptatiecriteria:** Peter kan na login `/vandaag` openen; de pagina noemt expliciet dat planning in fase 3 volgt; layout werkt op de vier viewports; er is maximaal één primaire actie per paneel.
- **Risico’s:** te veel UI vooruitbouwen geeft rework; daarom alleen bewezen primitives en geen plannercomponenten.
- **Afhankelijkheden:** stappen 0.3, 0.8 en Peters expliciete visuele goedkeuring in stap 0.9.

### Stap 0.11 — Fase-0-verificatie en overdracht

- **Doel:** aantonen dat de basis veilig en reproduceerbaar is voordat fase 1 start.
- **Bestanden:** testresultaten/voortgang in dit plan, `README.md` met setup zonder secrets en pas na lokale groene gates de noodzakelijke Vercel Preview-configuratie; geen Blob-SDK.
- **Databasegevolgen:** migraties op schone testdatabase en staging; geen productiedata.
- **Beveiligingsgevolgen:** dependency audit, secretscan, clientbundelcontrole, sessie-/authreview en database-TLS/poolingreview.
- **Tests:** `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, e2e login/logout en handmatige desktop/mobiele controle.
- **Acceptatiecriteria:** alle lokale gates slagen voordat Vercel Preview wordt ingericht; open risico’s zijn vastgelegd; fase-0-branch heeft kleine commits en een reviewbare PR; Peter kan veilig inloggen op de overeengekomen omgeving; Blob, uploads en bijlagen zijn niet toegevoegd.
- **Risico’s:** Neon en Vercel zijn externe state; het gratis abonnement heeft limieten en iedere betaalde upgrade vereist nieuwe toestemming.
- **Afhankelijkheden:** stappen 0.2–0.10 en vastgestelde besluiten O14 en O20.

## 11. Implementatiestappen fase 1

### Stap 1.1 — Featurebranch en domeincontracten

- **Doel:** fase 1 geïsoleerd starten en alle invoer-, output- en foutcontracten vastleggen vóór database- of UI-code.
- **Bestanden:** nieuwe branch `feature/phase-01-task-core`; `lib/tasks/domain/types.ts`, `status.ts`, `errors.ts`, `validation.ts`; unit-tests.
- **Databasegevolgen:** geen in deze stap.
- **Beveiligingsgevolgen:** allowlists, lengtegrenzen, datumvalidatie en veilige foutcodes; geen `any` of vertrouwen in browserpayloads.
- **Tests:** geldige/ongeldige titel, duur, enum, datum, lege strings, te grote payloads en locale datumranden.
- **Acceptatiecriteria:** domeincontracten zijn pure TypeScript, frameworkonafhankelijk en volledig met Vitest getest; datum/tijd, lege omschrijvingen, duur en de fase-1-statusset volgen de vastgestelde besluiten.
- **Risico’s:** date parsing kan timezonefouten introduceren; statussen die pas in fase 2 bedienbaar worden mogen niet voortijdig via de UI worden gezet.
- **Afhankelijkheden:** afgeronde fase 0 en vastgestelde besluiten O6–O7, O12 en O17–O18.

### Stap 1.2 — Prisma-kernmodellen voor taken

- **Doel:** `Task`, `Subtask` en `TaskDependency` volgens het goedgekeurde model toevoegen.
- **Bestanden:** `prisma/schema.prisma`, `prisma/migrations/<timestamp>_task_core/migration.sql`, testfactories.
- **Databasegevolgen:** nieuwe enums, tabellen, foreign keys, unieke afhankelijkheidsconstraint, self-dependencycheck en indexen uit hoofdstuk 7; nog geen cross-tabletrigger als die apart reviewbaar blijft.
- **Beveiligingsgevolgen:** `Task.userId` verplicht; foreign keys voorkomen verweesde subtaken; dependencyrelaties gebruiken `RESTRICT` en worden nooit gecascadeerd.
- **Tests:** migratie op schoon en bestaand fase-0-schema; nullability, enum-, unique-, check- en foreign-keytests; tweede userfixture voor isolatietests.
- **Acceptatiecriteria:** Prisma Client genereert; schema en SQL zijn reviewbaar; alle vijf kernmodellen bestaan; geen destructieve wijziging aan authdata.
- **Risico’s:** enum- en nullabilitywijzigingen zijn later migratiegevoelig; `TaskDependency` heeft indirect eigenaarschap.
- **Afhankelijkheden:** stap 1.1 en vastgestelde besluiten O6–O8 en O16–O18.

### Stap 1.3 — Deadline-integriteit in domein, transactie en database

- **Doel:** de deadlinehiërarchie onder alle schrijfwegen afdwingen.
- **Bestanden:** pure deadlinefunctie in `lib/tasks/domain/deadline.ts`, services, repositoryqueries, custom SQL-migratie met triggers/functies, unit- en integratietests.
- **Databasegevolgen:** trigger/functie op `Subtask` insert/update en `Task.deadline` update; vaste foutcode/SQLSTATE; taakrow wordt in consistente volgorde gelockt.
- **Beveiligingsgevolgen:** beschermt integriteit ook bij directe databasewrites en race conditions; foutrespons onthult alleen conflicten die van de ingelogde gebruiker zijn.
- **Tests:** subtaak vóór/op/na taakdeadline; taak zonder deadline; taakdeadline verwijderen; taakdeadline vervroegen met nul/één/meerdere conflicten; gelijktijdige task/subtaskupdates; directe SQL-bypasspoging.
- **Acceptatiecriteria:** geen commit kan een subtaak later dan een bestaande taakdeadline achterlaten; bij conflict blijft de taakdeadline ongewijzigd en ontvangt de UI de conflicterende subtaken.
- **Risico’s:** Prisma kent cross-tabletriggers niet declaratief; migratie en shadow database moeten custom SQL behouden; lockvolgorde kan deadlocks geven als services afwijken.
- **Afhankelijkheden:** stap 1.2 en vastgesteld besluit O13.

### Stap 1.4 — Repository- en serviceslaag met autorisatie

- **Doel:** alle CRUD-regels centraliseren buiten React en Prisma niet rechtstreeks vanuit pagina’s gebruiken.
- **Bestanden:** `lib/tasks/repositories/task-repository.ts`, `subtask-repository.ts`, `dependency-repository.ts`, services en DTO-mappers.
- **Databasegevolgen:** scoped CRUD-query’s; transacties voor samengestelde mutaties; selecteer alleen benodigde velden.
- **Beveiligingsgevolgen:** iedere operatie vereist server-derived `userId`; not-found en forbidden worden extern niet onderscheidbaar waar dat objectenumeratie voorkomt; broninhoud wordt niet gelogd.
- **Tests:** CRUD voor eigen objecten, archiveren, geblokkeerde hard-delete bij dependency en later beschikbare historie, tweede gebruiker kan niets lezen/wijzigen/verwijderen, gemanipuleerd `taskId`, subtaak onder andere user en transactie-rollback bij fout.
- **Acceptatiecriteria:** geen React-component importeert Prisma; alle reads/writes zijn user-scoped; samenhangende wijzigingen zijn atomair; standaardverwijdering archiveert en dependencies verdwijnen nooit stilzwijgend.
- **Risico’s:** indirecte ownershipjoins kunnen vergeten worden; brede includes kunnen later privacy/performance schaden.
- **Afhankelijkheden:** stappen 1.2–1.3.

### Stap 1.5 — Afhankelijkheidsgraaf en cycluscontrole

- **Doel:** geldige finish-to-startrelaties opslaan en cycli ook bij gelijktijdige mutaties voorkomen.
- **Bestanden:** `lib/tasks/domain/dependency-graph.ts`, dependencyservice/repository, tests.
- **Databasegevolgen:** dependencyinsert/update/delete in transactie; lock op de betrokken userrow of gelijkwaardige serialisatie vóór graafcontrole; unieke constraint blijft laatste vangnet.
- **Beveiligingsgevolgen:** beide subtaken worden op eigenaarschap gecontroleerd; foutdetails bevatten geen titels van andere gebruikers; graphinput en omvang worden begrensd.
- **Tests:** self-loop, duplicaat, directe tweeknoopcyclus, langere cyclus, geldige diamant, cross-taskrelatie, cross-userpoging, delete volgens beleid en twee gelijktijdige inserts die samen een cyclus vormen.
- **Acceptatiecriteria:** geen cyclische graaf kan committen; afhankelijkheden tussen twee eigen hoofdtaken werken; geblokkeerde status is afleidbaar zonder al te plannen.
- **Risico’s:** zonder serialisatie kan write skew een cyclus toelaten; volledige graafcontrole wordt later duurder en vraagt meetpunten/indexen.
- **Afhankelijkheden:** stap 1.4 en vastgestelde besluiten O8 en O13 over PostgreSQL en locking.

### Stap 1.6 — Taak- en subtaakmutaties voor de browser

- **Doel:** getypeerde, server-side gevalideerde create/update/archiveacties via dunne Server Actions beschikbaar maken.
- **Bestanden:** Server Actions onder `app/(protected)/taken/`, gedeelde inputmappers, responsecontracten en integratietests; geen aparte CRUD-API zonder aantoonbare integratiebehoefte.
- **Databasegevolgen:** roept uitsluitend de services uit stappen 1.4–1.5 aan; idempotentie of dubbele-submitbescherming bij create.
- **Beveiligingsgevolgen:** iedere mutation herhaalt auth; Origin/Host/CSRF-strategie; bodylimieten; generieke foutrespons; geen stacktrace naar client.
- **Tests:** alle CRUD-paden, dubbele submit, verlopen sessie, cross-origin request, malformed payload, stale update en deadline-/cyclusfoutmapping.
- **Acceptatiecriteria:** browsercode kan geen domeinregel omzeilen; responses zijn stabiel en toegankelijk te tonen; mutationtests bewijzen autorisatie.
- **Risico’s:** Server Actions blijven publiek aanroepbare endpoints en moeten auth, autorisatie, Origin en Zod-validatie per action herhalen.
- **Afhankelijkheden:** stappen 1.3–1.5 en vastgesteld besluit O11.

### Stap 1.7 — Scherm Taken: taakoverzicht en taak-CRUD

- **Doel:** het in stap 0.9 door Peter goedgekeurde desktop- en mobiele patroon uitbouwen tot werkelijk hoofdtaakbeheer.
- **Bestanden:** `app/(protected)/taken/page.tsx`, taaklijst/detail/formulier, UI-primitives en browsertests.
- **Databasegevolgen:** gepagineerde of begrensde user-scoped reads; create/update en standaard archive via de mutationlaag.
- **Beveiligingsgevolgen:** React rendert tekst veilig; geen raw HTML; foutmeldingen lekken geen objecten; destructieve actie vraagt bevestiging.
- **Tests:** lege staat, create, edit, expliciet opslaan, annuleren, ongeldige invoer, deadlineweergave, archiveren, geblokkeerde definitieve verwijdering, statuswijziging via het formulier, toetsenbord en viewports.
- **Acceptatiecriteria:** Peter kan een taak met of zonder deadline beheren; taakformulieren, inclusief statusvelden, slaan alleen via `Opslaan` op; directe statusacties worden niet vooruitgebouwd; mobiel vereist geen horizontaal scrollen.
- **Risico’s:** te veel informatie in één detailpaneel; datum/tijd-control verschilt per browser; optimistic UI kan stale data tonen.
- **Afhankelijkheden:** stap 1.6, Peters visuele goedkeuring in stap 0.9 en vastgestelde besluiten O6–O7, O15–O18 en O20.

### Stap 1.8 — Scherm Taken: subtaken en deadlineconflicten

- **Doel:** subtaken inline of in een duidelijk detailpaneel beheren en de deadlinehiërarchie begrijpelijk maken.
- **Bestanden:** subtaaklijst/formulier, deadlineveld, duurvelden, conflictmodal en relevante tests.
- **Databasegevolgen:** subtaak-CRUD; taakprojectie berekent resterende duur uit open subtaken zonder taakduur dubbel te tellen.
- **Beveiligingsgevolgen:** task ownership vóór subtaskmutatie; serverfout blijft leidend; conflictlijst alleen voor eigen taak.
- **Tests:** verplichte datum én tijd, voorstel 17.00 uur bij datum-only invoer en handmatige aanpassing daarvan, taak zonder deadline, exact gelijke deadline, latere deadline, vervroegde taakdeadline met conflicten, geen automatische definitieve datumwijziging en taakduurprojectie met nul/één/meerdere subtaken.
- **Acceptatiecriteria:** datum-only invoer toont een aanpasbaar voorstel van 17.00 uur; ongeldige subtaakdeadline wordt bij veld en server geweigerd; conflictmodal biedt aanpassen of annuleren; resterende taakduur telt geen hoofdtaak extra mee.
- **Risico’s:** lokale datumconversie kan een geldig gelijk tijdstip één uur verschuiven rond DST; formulierstate kan conflicteren met serverdata.
- **Afhankelijkheden:** stappen 1.3, 1.7 en vastgesteld besluit O6.

### Stap 1.9 — Scherm Taken: afhankelijkheden

- **Doel:** Peter een voorganger laten kiezen en serverfouten over blokkades/cycli helder tonen.
- **Bestanden:** dependencyselector, compact overzicht van voorgangers/opvolgers, foutpresentatie en browsertests.
- **Databasegevolgen:** reads van beschikbare eigen subtaken over hoofdtaakgrenzen; create/delete dependency.
- **Beveiligingsgevolgen:** zoekresultaten strikt user-scoped; ids uit de browser nooit vertrouwen; geen onbeperkte dataset naar client.
- **Tests:** cross-taskselectie, zelf niet selecteerbaar, duplicaat, cyclefout, expliciet verwijderen van een dependency, geen cascade bij archiveren/verwijderpoging, mobiel en toetsenbord.
- **Acceptatiecriteria:** geldige cross-taskrelatie is zichtbaar; ongeldige relatie wordt niet opgeslagen; een dependency verdwijnt alleen door een expliciete dependencyhandeling en nooit stilzwijgend.
- **Risico’s:** selector schaalt later slecht zonder zoek/paginering; richting van de relatie kan onduidelijk zijn.
- **Afhankelijkheden:** stappen 1.5–1.8.

### Stap 1.10 — Fase-1-integratie, handmatige browsercontrole en overdracht

- **Doel:** bewijzen dat taak-, deadline-, afhankelijkheids- en autorisatieregels gezamenlijk werken.
- **Bestanden:** complete testsuites, voortgang/testresultaten in dit plan, gerichte README-documentatie en zo nodig besluitregistratie na goedkeuring.
- **Databasegevolgen:** alle fase-0/1-migraties vanaf nul en vanaf het fase-0-schema uitvoeren; schema-driftcheck; stagingmigratie vóór productie.
- **Beveiligingsgevolgen:** IDOR-review, CSRF-review, XSS-review, logreview, dependency audit en clientbundelcontrole.
- **Tests:** volledige matrix uit hoofdstuk 12 plus `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`; handmatig Chrome/Edge desktop en Samsung-formaat.
- **Acceptatiecriteria:** alle fase-0/1-criteria slagen; database kan niet ongeldig worden gemaakt via app of directe integratietest; desktop en mobiel zijn gecontroleerd; PR is klein en reviewbaar per commit.
- **Risico’s:** handmatige browsercontrole kan machine-/browserafhankelijk zijn; stagingprovider kan afwijkende pooling of timezone-instellingen hebben.
- **Afhankelijkheden:** alle eerdere fase-1-stappen.

## 12. Testplan

### 12.1 Unit-tests

- taakdeadline null: iedere valide subtaakdeadline is toegestaan;
- subtaakdeadline vóór en exact op taakdeadline is toegestaan;
- subtaakdeadline na taakdeadline wordt geweigerd;
- taakdeadline vervroegen levert alle conflicten en wijzigt niets;
- hoofdtaakduur wordt gebruikt bij nul subtaken;
- resterende duur wordt uit open subtaken afgeleid zodra subtaken bestaan;
- self-loop, duplicaat, tweeknoopcyclus en langere cyclus worden geweigerd;
- geldige cross-taskgraaf wordt geaccepteerd;
- invoergrenzen, enums, minuten en foutcodes;
- e-mailnormalisatie, absolute sessieverval na 30 dagen en idle-verval na 7 dagen;
- logredactie voor wachtwoord, token en taakomschrijving.

### 12.2 Integratietests met echte PostgreSQL

- alle migraties op een schone database;
- auth-, taak-, subtaak- en dependencyconstraints;
- cross-tabledeadline-trigger in beide richtingen;
- directe SQL-poging kan deadlinehiërarchie niet breken;
- transaction rollback houdt alle betrokken records ongewijzigd;
- gelijktijdige deadlinewrites laten geen ongeldige toestand achter;
- gelijktijdige dependencywrites laten geen cyclus achter;
- gebruiker B kan records van gebruiker A niet lezen of muteren;
- sessiehash, intrekking, expiry en rate limiting;
- archivegedrag, geblokkeerde definitieve verwijdering en `RESTRICT` op dependencies.

Integratietests gebruiken een apart databaseaccount en een herkenbare testdatabasenaam. De testhelper weigert uitvoering wanneer de URL niet expliciet als testomgeving is gemarkeerd.

### 12.3 Geautomatiseerde browsertests

- login, mislukte login en logout;
- beschermde URL zonder sessie;
- taak zonder deadline aanmaken;
- taak met deadline en geldige subtaak aanmaken;
- ongeldige subtaakdeadline bij veld en server;
- taakdeadline vervroegen en conflict annuleren;
- conflicterende subtaken aanpassen en daarna taakdeadline opslaan;
- cross-taskdependency aanmaken;
- cyclepoging krijgt uitleg en maakt geen record;
- tweede sessie/intrekking waar relevant;
- desktop- en mobiele kernflow.

### 12.4 Handmatige browsertests

- Chrome en Edge op Windows;
- Samsung/Android Chrome of een gelijkwaardige echte-devicecontrole;
- viewports 1440×900, 1024×768, 390×844 en 360×800;
- toetsenbord-only, zichtbare focus, logische tabvolgorde;
- zoom 200%, lange Nederlandse titels en lege staten;
- Nederlandse datum-/tijdnotatie en DST-randen;
- geen dubbele primaire knoppen, geen horizontale mobiele overflow;
- screenshots voor Taken desktop/mobiel en Vandaag desktop/mobiel.

### 12.5 Verplichte afsluitende gates

```text
npm run lint
npm run typecheck
npm run test
npm run build
```

Daarnaast: e2e-suite, migratiecheck, dependency audit, secretscan, clientbundelcontrole en handmatige browsercontrole.

## 13. Beveiliging en privacy

| Risico | Maatregel in fase 0/1 |
|---|---|
| Wachtwoordlek | Argon2id encoded hash met unieke salt; geen pepper in de MVP; geen plaintext, hash of wachtwoordlogging. |
| Credential stuffing | Databasegedragen rate limit, generieke fout, beperkte vertraging en geen accountenumeratie. |
| Sessiediefstal | Hoge-entropytoken, alleen hash in DB, `HttpOnly`, `Secure` in productie, expliciete `SameSite`, host-only cookie, expiry en revoke. |
| Session fixation | Nieuw token na login; bestaand anoniem token niet hergebruiken. |
| CSRF | Geen state change via GET; SameSite; Origin/Host-validatie en, afhankelijk van mutationkeuze, frameworkbescherming of tokenstrategie. |
| IDOR | `userId` uitsluitend uit sessie; iedere repositoryquery scoped; tweede-userintegratietests. |
| XSS | React escaping; geen raw HTML; CSP; lengtegrenzen; `descriptionOriginal` als tekst behandelen. |
| SQL-injectie | Prisma parameters; raw SQL alleen constant/parameterized en beperkt tot migratie/locks. |
| Race conditions | Transacties, vaste lockvolgorde, triggerconstraints en concurrencytests. |
| Gevoelige logs | Alleen foutcode, route/module, correlatie-id en resultaat; geen taakinhoud, wachtwoord, cookie of token. |
| Secretlek | `.env` genegeerd; alleen `.env.example`; GitHub/Vercel secrets; secretscan en clientbundlecheck. |
| Privécaching | `Cache-Control: no-store` op persoonlijke/authresponses. |
| Denial of service | Payload-/lengtegrenzen, rate limiting, begrensde graafqueries en database-indexen. |

De OWASP-minimumbaseline voor Argon2id is 19 MiB geheugen, 2 iteraties en parallelisme 1. Bij implementatie wordt op de gekozen Vercel Node-runtime gemeten en waar haalbaar sterker ingesteld zonder logininstabiliteit. Bron: [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

## 14. Migratie-, Git- en terugrolstrategie

### 14.1 Migraties

Voorgestelde volgorde:

1. `<timestamp>_auth_foundation` — `User`, `Session`, goedgekeurde `AuthThrottle`, constraints en indexen;
2. `<timestamp>_task_core` — enums, `Task`, `Subtask`, `TaskDependency`, foreign keys en indexen;
3. `<timestamp>_task_integrity` — custom SQL voor deadline-triggers en aanvullende constraints.

Regels:

- migrations worden door Prisma aangemaakt maar de SQL wordt altijd gereviewd;
- `migrate dev` wordt uitsluitend vanuit de lokale ontwikkelomgeving tegen de geïsoleerde Neon-developmentdatabase uitgevoerd; een lokale PostgreSQL-installatie is niet nodig;
- CI bouwt een schone geïsoleerde testdatabase of testbranch op binnen de goedgekeurde Neon-inrichting;
- staging/production gebruikt `migrate deploy` na backup- en URL-controle;
- geen `db push` als productiemigratiestrategie;
- geen destructieve wijziging zonder afzonderlijke toestemming en terugrolplan;
- test- en productiedatabase-URL’s mogen nooit gelijk zijn.

### 14.2 Branches en commits

- gebruik uitsluitend de bestaande repository `https://github.com/peterbosman68/MijnPlanning`;
- controleer vóór iedere koppeling lokale inhoud, remote inhoud en Git-status; initialiseer alleen zo nodig in de bestaande projectmap en koppel daarna `origin`;
- fase 0 op `feature/phase-00-foundation`;
- fase 1 pas na fase-0-review op `feature/phase-01-task-core`;
- niet rechtstreeks op `main` werken;
- kleine commits per functionele stap, bijvoorbeeld `chore: scaffold pinned application stack`, `feat(auth): add revocable database sessions`, `feat(tasks): enforce deadline hierarchy` en `feat(tasks): reject dependency cycles`;
- geen twee agents tegelijk dezelfde bestanden in dezelfde branch;
- merge alleen na groene gates en review.

### 14.3 Terugrol

- **Applicatie:** vorige bekende goede Vercel-deployment herstellen en de bijbehorende Git-commit/tag aanwijzen.
- **Database:** bij additive fase-0/1-migraties bij voorkeur een voorwaartse herstelmigratie; geen automatische drop van tabellen in productie.
- **Auth:** bij probleem nieuwe sessiecreatie stoppen, bestaande sessies intrekken en vorige deployment terugzetten; secrets alleen gecontroleerd roteren.
- **Triggers:** bij fout eerst appwrites blokkeren/read-only maken, daarna een gereviewde voorwaartse migratie; trigger niet stilzwijgend uitschakelen terwijl writes doorgaan.
- **Feature:** UI kan tijdelijk achter een server-side featureflag of routeblokkade worden gehouden zonder dat schema wordt verwijderd.
- **Backups:** vóór eerste productie- of stagingmigratie de beschikbare Neon Free-restorefunctie en beperkingen controleren; geen backup in Git of OneDrive-projectmap en geen betaalde upgrade zonder toestemming.

## 15. Vastgestelde besluiten O1–O20

Alle onderstaande besluiten zijn definitief vastgelegd. Ze zijn geen open keuzes meer; implementatie wacht uitsluitend op expliciete goedkeuring van dit bijgewerkte plan en de technische controlepoorten uit paragraaf 4.3.

| ID | Definitief besluit | Gevolg voor fase 0/1 | Status |
|---|---|---|---|
| O1 | Gebruik uitsluitend de bestaande private repository `peterbosman68/MijnPlanning`. Controleer bij implementatiestart lokale en remote inhoud en Git-status; initialiseer lokaal en koppel als `origin` alleen als de bestaande projectmap nog geen Git-repository is. | Geen nieuwe repository en nooit bestaande inhoud blind overschrijven. | Besloten |
| O2 | npm en een gecontroleerde scaffold in de bestaande map. | Expliciete majorgrenzen en een exacte npm-lockfile. | Besloten |
| O3 | Node.js 24 LTS, Next.js 16 Active LTS, React 19, TypeScript 5, Tailwind 3 en Prisma 6; actuele veilige patches binnen deze majors. | De volledige versiematrix is de eerste technische fase-0-stop/go-test. Een fout wordt eerst gerapporteerd; geen stille stackafwijking. | Besloten |
| O4 | Alleen e-mailadres en wachtwoord zijn verplicht; geen username. | `User.email` is verplicht, uniek en genormaliseerd; weergavenaam pas later optioneel. | Besloten |
| O5 | Eerste gebruiker via eenmalige server-only CLI zonder wachtwoord- of hashlogging. | Geen publieke registratie- of bootstraproute. | Besloten |
| O6 | Deadlines bevatten datum en tijd, tonen `Europe/Amsterdam` en slaan UTC op; 17.00 uur mag als aanpasbaar voorstel. | Expliciete timezoneconversie en DST-/17.00-tests. | Besloten |
| O7 | Omschrijving mag leeg zijn; titel blijft verplicht. | `descriptionOriginal` mag leeg zijn en wordt nooit door afgeleide tekst overschreven. | Besloten |
| O8 | Neon Postgres via Vercel Marketplace op Free, zonder lokale PostgreSQL-installatie. Dit is geen open productbeslissing meer. | Free-limieten zijn een operationeel risico; geen betaalde upgrade zonder Peters expliciete toestemming. | Besloten |
| O9 | Geen password pepper in de MVP; Argon2id met unieke salt. | Geen `PASSWORD_PEPPER`-afhankelijkheid in fase 0. | Besloten |
| O10 | Sessies maximaal 30 dagen absoluut en 7 dagen inactief; actuele of alle sessies intrekbaar. | Sessionservice en tests handhaven beide termijnen en beide revokeflows. | Besloten |
| O11 | Server Actions als dunne transportlaag; bedrijfsregels in domeinservices. | Iedere action herhaalt auth, autorisatie, Origin- en Zod-validatie. | Besloten |
| O12 | Zod, Vitest en Playwright. | Vastgelegde validatie-, unit/integratie- en browsertestbasis. | Besloten |
| O13 | Servicevalidatie, PostgreSQL-bescherming voor kritieke deadline-integriteit en transactionele cycluscontrole. Het fase-1-plan werkt de databasebescherming concreet uit als versioned triggers. | Verantwoordelijkheid per validatieregel documenteren; PostgreSQL is het integriteitsvangnet en de domeinservice is leidend voor bedrijfsfouten. | Besloten |
| O14 | Vercel Preview pas na lokaal geslaagde fase 0; Blob/uploads/bijlagen later. | Fase 0 bevat alleen noodzakelijke configuratievoorbereiding en geen Blob-SDK. | Besloten |
| O15 | Taak- en subtaakformulieren gebruiken `Opslaan`; timer, status en verslepen mogen later direct opslaan met feedback. | Fase 1 gebruikt expliciete formuliercommits; eventuele latere directe acties krijgen zichtbare bevestiging of een foutmelding. | Besloten |
| O16 | Standaard archiveren; hard delete blokkeren bij tijdregistratie, bijlagen, importhistorie of dependencies; nooit dependencycascade. | `RESTRICT`, referentiechecks en geen stille gegevensverwijdering. | Besloten |
| O17 | Taakduur mag eerst leeg zijn; taak zonder subtaken is dan niet planbaar; taak met subtaken krijgt geen extra hoofdtaakduur. | Nullable taakduur en afgeleide som van open subtaken. | Besloten |
| O18 | Fase 1 bedient Open, Wachten, Afgerond, Gearchiveerd en Geannuleerd; Geblokkeerd is afgeleid; timerstatussen volgen in fase 2. | Fase-1-UI kan geen toekomstige timerstatussen zetten. | Besloten |
| O19 | Alleen top-level `PLANS.md` is de planinstructiebron. | Alle verwijzingen naar uitvoeringsplanregels gebruiken top-level `PLANS.md`. | Besloten |
| O20 | Na de technische projectbasis volgt vóór brede frontendimplementatie een verplichte visuele goedkeuringspoort: concreet palet met hexwaarden, vastgelegde typografie, spacing, knoppen, formulieren en statuslabels, plus één werkende Taken-versie op desktop en mobiel. | Geen overige volledige schermen of brede toepassing van het ontwerp vóór Peters expliciete goedkeuring. | Besloten |

## 16. Belangrijkste risico’s

1. **Stackcompatibiliteit.** Node.js 24, Next.js 16, Prisma 6 en de exacte actuele veilige patchversies worden als eerste technische fase-0-test gezamenlijk gecontroleerd. Een mislukking wordt eerst gerapporteerd en blokkeert verdere implementatie; er volgt geen zelfstandige stackwissel.
2. **Cross-tableintegriteit.** Prisma modelleert geen cross-tablecheck; custom PostgreSQL SQL moet bewust worden onderhouden.
3. **Concurrency.** Single-user betekent niet single-request; meerdere tabs of retries kunnen deadline- en graafraces veroorzaken.
4. **Serverless rate limiting en Neon-pooling.** In-memory state is onbetrouwbaar; verkeerde connectieconfiguratie kan database-uitputting geven.
5. **Native packages op Windows/Vercel.** Argon2 en Prisma moeten op Node-runtime en ondersteunde binaries worden geverifieerd.
6. **Datum/tijd en DST.** UTC-opslag met Nederlandse invoer moet rond zomer-/wintertijd expliciet worden getest.
7. **Onbedoelde dataverwijdering.** Cascades bij taak/subtaak/dependency kunnen bron- of historiegegevens verliezen; standaard `RESTRICT`/archiveren is veiliger.
8. **OneDrive-werkmap.** Sync kan buildperformance, file watchers en Git-locks verstoren; bij concrete problemen is verplaatsing naar een lokale niet-gesynchroniseerde ontwikkelmap een apart besluit.
9. **Canoniek PLANS-bestand.** Alleen het gevulde top-level `PLANS.md` wordt gebruikt; een bestand met dezelfde naam onder `docs/` wordt genegeerd.
10. **Externe infrastructuur en kosten.** Neon Free en Vercel vereisen accounts/rechten en kennen limieten. Overschrijding van Free-limieten is een operationeel risico; elke betaalde upgrade vereist vooraf Peters expliciete toestemming.

## 17. Acceptatiecriteria per fase

### Fase 0 gereed

- de bestaande private GitHub-repository is na inhoudscontrole veilig gekoppeld en de featurebranchworkflow is ingericht;
- de eerste technische stop/go-test voor Node.js 24, Next.js 16, Prisma 6 en de gekozen actuele veilige patches is geslaagd voordat bredere implementatie begon;
- Next.js 16 App Router draait met React 19, TypeScript 5 en Tailwind 3 op Node.js 24;
- de gekozen Prisma 6-patch is aantoonbaar compatibel met Node.js 24 en maakt veilig verbinding met geïsoleerde Neon-omgevingen;
- Peter kan via een eigen Argon2id-login inloggen en uitloggen;
- sessies zijn server-side, gehasht, maximaal 30 dagen absoluut en 7 dagen inactief, individueel en gezamenlijk intrekbaar en veilig gecookied;
- rate limiting, veilige logging, server-side auth en basisheaders zijn getest;
- het kleurenpalet met hexwaarden, typografie, spacing, knoppen, formulieren en statuslabels zijn concreet voorgesteld;
- één werkende visuele Taken-versie is op desktop en mobiel aan Peter getoond en expliciet goedgekeurd voordat het ontwerp breder is toegepast;
- `/vandaag` toont een responsieve, eerlijke technische lege staat;
- lint, typecheck, unit/integratietests en build slagen;
- desktop en mobiel zijn handmatig gecontroleerd;
- er is geen secret, token, wachtwoord, productiedata of private inhoud gecommit;
- Vercel Preview is pas na de lokale gates ingericht; Blob, uploads en bijlagen zijn niet toegevoegd.

### Fase 1 gereed

- `Task`, `Subtask` en `TaskDependency` zijn gemigreerd, geïndexeerd en user-scoped;
- taak- en subtaak-CRUD werken via services met server-side validatie;
- taakdeadline is optioneel en subtaakdeadline verplicht;
- deadlines bevatten datum en tijd, tonen `Europe/Amsterdam`, slaan UTC op en gebruiken 17.00 uur alleen als zichtbaar aanpasbaar voorstel;
- taak- en subtaakomschrijvingen mogen leeg zijn, terwijl titels verplicht blijven;
- de deadlinehiërarchie is in UI, TypeScriptservice, transactie en PostgreSQL beschermd;
- vervroegen van een taakdeadline met conflicten wijzigt niets en benoemt de conflicterende subtaken;
- dependencyrelaties mogen hoofdtaakgrenzen overschrijden;
- self-loops, duplicaten en cycli worden ook bij concurrency geweigerd;
- een taak met subtaken telt niet als extra werk in de resterendeduurprojectie;
- een taak zonder subtaken en zonder geaccepteerde duur is zichtbaar nog niet planbaar;
- taak- en subtaakformulieren, inclusief statusvelden, gebruiken expliciet `Opslaan`; directe statusacties worden pas in een latere fase overwogen;
- archiveren is standaard, hard delete met gekoppelde historie wordt geblokkeerd en dependencies worden nooit gecascadeerd;
- Geblokkeerd is uit dependencies afgeleid en timerstatussen zijn nog niet handmatig bedienbaar;
- tweede-userfixtures bewijzen dat ongeautoriseerde toegang niet mogelijk is;
- Taken werkt en is gecontroleerd op desktop en mobiel;
- alle afsluitende gates en migratietests slagen;
- plan, besluiten en bekende risico’s zijn bijgewerkt.

## 18. Expliciete stopconditie

Dit document bevat twee afzonderlijke stopcondities.

**Vóór implementatie:** tot Peter dit bijgewerkte plan expliciet goedkeurt:

- wordt geen applicatiecode geschreven;
- wordt geen package geïnstalleerd;
- wordt Git niet geïnitialiseerd en wordt geen remote gekoppeld of gewijzigd;
- wordt geen database of Vercel-project geprovisioneerd;
- wordt geen Prisma-migratie uitgevoerd.

**Tijdens de latere uitvoering, na de technische projectbasis:** zodra de werkende visuele Taken-versie op desktop en mobiel is getoond:

- stopt Codex met bredere frontendimplementatie;
- worden geen overige volledige schermen gebouwd;
- worden visuele tokens en patronen nog niet projectbreed uitgerold;
- wordt gewacht op Peters expliciete visuele goedkeuring.

**Tijdens de eerste technische stop/go-test:** als Node.js 24, Next.js 16, Prisma 6 of de gekozen actuele veilige patchversies niet compatibel blijken:

- stopt de verdere implementatie;
- rapporteert Codex eerst de exacte geteste versies, de mislukte stap en een geheimvrije diagnose;
- kiest Codex niet zelfstandig Prisma 7, Node.js 22 of een andere stackversie;
- wordt gewacht op Peters besluit over het vervolg.

## 19. Voortgang fase 0A

### 18 juli 2026

- Peter heeft fase 0A en de eerste compatibiliteits-stop/go-test expliciet goedgekeurd.
- De bestaande lokale map bevatte alleen de vastgestelde Markdown-documentatie en was nog geen Git-repository.
- De bestaande private GitHub-repository is read-only gecontroleerd en bevatte geen refs of remote historie.
- Git is in de bestaande map geïnitialiseerd, de bestaande repository is als `origin` gekoppeld en `feature/phase-00-foundation` is actief. Er is niets gecommit of gepusht.
- Aangetroffen runtime: Node.js `24.15.0` en npm `11.12.1` via `npm.cmd`.
- De eerste technische poort is vóór de scaffold gestopt: de actuele Node.js 24 LTS-patch is `24.18.0` en de tussenliggende `24.17.0` bevatte een beveiligingsfix. Node.js `24.15.0` voldoet daardoor niet aan de eis om met een actuele veilige patch te testen.
- Er is geen Node-versiebeheerder (`nvm`, `fnm` of Volta) aangetroffen en Codex heeft geen systeemsoftware geïnstalleerd of gewijzigd.
- Er zijn nog geen npm-pakketten geïnstalleerd, geen projectbestanden toegevoegd, geen Prisma-opdracht uitgevoerd en geen Neon- of Vercel-infrastructuur aangemaakt.
- Vervolg vereist dat Peter Node.js `24.18.0` LTS installeert of afzonderlijk toestemming geeft voor een gecontroleerde runtime-update. Daarna wordt de compatibiliteitsproef hervat zonder majorwijziging.

### 18 juli 2026 — hervatting na handmatige runtime-update

- Actieve runtime opnieuw gecontroleerd: Node.js `24.18.0` en npm `11.16.0`; de PowerShell execution policy is niet gewijzigd en npm-opdrachten zijn via `npm.cmd` uitgevoerd.
- De exacte stabiele compatibiliteitsmatrix binnen de besloten majors is vastgelegd: Next.js `16.2.10`, React en React DOM `19.2.7`, TypeScript `5.9.3`, Tailwind CSS `3.4.19` en Prisma/Prisma Client `6.19.3`.
- De minimale gecontroleerde scaffold uit stap 0.3 is lokaal aangemaakt met exacte dependencyversies, Node/npm-runtimegrenzen, App Router, TypeScript strict, Tailwind 3, ESLint en een tijdelijk technisch `CompatibilityProbe`-model voor de Prisma/Neon-proef.
- npm `11.16.0` heeft installatiescripts standaard tegengehouden. Alleen de aangetroffen scripts van `@prisma/client@6.19.3`, `@prisma/engines@6.19.3`, `prisma@6.19.3`, `sharp@0.34.5` en `unrs-resolver@1.12.2` zijn expliciet en versiegepinnd toegestaan in `allowScripts`.
- De eerste audit meldde een matige PostCSS-XSS-kwetsbaarheid doordat Next.js `16.2.10` intern PostCSS `8.4.31` vastlegde. De door npm voorgestelde downgrade naar Next.js 9 is niet uitgevoerd. Een gerichte override naar PostCSS `8.5.19` binnen dezelfde PostCSS-major verwijdert de kwetsbare transitive versie; de definitieve `npm audit` meldt nul kwetsbaarheden.
- Lokale stop/go-resultaten: Prisma Client-generatie geslaagd op Prisma `6.19.3` en Node.js `24.18.0`; `npm run lint`, `npm run typecheck` en `npm run build` geslaagd; Next.js-productiebuild geslaagd met Turbopack; geen `DATABASE_URL` of PostgreSQL-URL in `.next/static` gevonden.
- De volledige technische stop/go-test is nog niet gereed: er is geen `DATABASE_URL` of lokaal `.env`-bestand aanwezig. Conform Peters stopvoorwaarde zijn geen Neon-handeling, secret, databaseverbinding, migratie of lees-/schrijfquery uitgevoerd. Vervolg vereist eerst Peters instructie voor de geïsoleerde Neon Free-developmentomgeving en het veilig lokaal beschikbaar stellen van de bijbehorende secret.
- Er is niets gecommit of gepusht.

### 18 juli 2026 — Neon-compatibiliteitsproef afgerond

- Vooraf is bevestigd dat `.env` door Git wordt genegeerd, niet wordt gevolgd, exact één niet-lege `DATABASE_URL` bevat en dat de waarde niet voorkomt in Git-diffs of commitbare bestanden. De waarde is niet getoond, gekopieerd of gelogd.
- De directe verbinding met de geïsoleerde Neon Free-developmentdatabase en een minimale `SELECT 1` zijn geslaagd.
- De minimale migratie `20260718122440_phase_0a_compatibility` is aangemaakt en toegepast. Deze bevat uitsluitend de technische tabel `compatibility_probe`; er zijn geen definitieve productmodellen toegevoegd.
- Eén herkenbaar tijdelijk compatibiliteitsrecord is geschreven en via de eerste Prisma Client teruggelezen.
- Een volledig nieuwe Prisma Client-instantie heeft opnieuw verbinding gemaakt en hetzelfde tijdelijke record teruggelezen.
- Het tijdelijke record is verwijderd en de afwezigheid ervan is bevestigd. De tabel en migratie blijven uitsluitend technische fase-0A-compatibiliteitsstructuur.
- Vitest `4.1.10`, dat Node.js 24 expliciet ondersteunt, is als exact gepinde developmentdependency toegevoegd om de opgedragen testgate uit te voeren. De minimale tests controleren Node-major 24 en dat het Prisma-schema uitsluitend het tijdelijke compatibiliteitsmodel bevat.
- Afsluitende gates geslaagd: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run test` met twee geslaagde tests en `npm.cmd run build`.
- De afsluitende secretcontrole bevestigt dat geen connection string in Git-diffs, commitbare bestanden of de statische clientbundel staat. `.env` blijft lokaal genegeerd.
- De volledige eerste technische fase-0A-stop/go-test is geslaagd met de vastgelegde stackmajors en patchversies. Er is niets gecommit of gepusht; verdere fase-0-implementatie wacht op Peters expliciete goedkeuring.

### 18 juli 2026 — tijdelijke compatibiliteitsdatabase opgeschoond

- Peter heeft de geslaagde fase-0A-stop/go-test goedgekeurd en expliciet opdracht gegeven de tijdelijke compatibiliteitsfunctionaliteit vóór de eerste commit te verwijderen.
- `CompatibilityProbe` is uit `prisma/schema.prisma` verwijderd. Het Prisma-schema bevat daardoor alleen de generator en PostgreSQL-datasource en nog geen productmodel.
- De uitsluitend tijdelijke migratie `20260718122440_phase_0a_compatibility`, de bijbehorende SQL en de lokale tijdelijke migratiemap zijn verwijderd vóórdat enige migratiehistorie werd gedeeld of gecommit.
- De lege, geïsoleerde Neon Free-developmentdatabase is met `prisma migrate reset` opgeschoond. Een eerste poging stopte veilig met `P3015` doordat de al lege migratiemap nog bestond; na controle en verwijdering van uitsluitend die lege map is de reset geslaagd.
- Een afsluitende read-only databasecontrole bevestigt dat geen tijdelijke of producttabel resteert en dat de Prisma-migratiehistorie nul records bevat. Alleen Prisma's generieke lege `_prisma_migrations`-metadatatabel mag aanwezig zijn.
- Het tijdelijke testrecord was al verwijderd en blijft afwezig. Er is geen compatibiliteitsdata behouden.
- Het tijdelijke roundtrip-script is vervangen door een generieke, read-only databaseprobe die alleen verbinding, `SELECT 1` en desgewenst een schone Prisma-basis controleert zonder database-inhoud te schrijven.
- De Vitest-test is generiek gemaakt en controleert alleen Node.js-major 24 en dat nog geen productdatamodel bestaat. Historische documentatie van de uitgevoerde stop/go-test blijft behouden.
- Login, gebruikers- en sessiemodellen, takenmodellen, frontendontwerp, Vercel en externe koppelingen zijn niet gestart.

### 18 juli 2026 — O20-visuele goedkeuringspoort voorbereid

- Vanaf de actuele `main` is de aparte branch `feature/visual-foundation` gemaakt; er is niets gecommit of gepusht.
- Het voorlopige kleurenpalet, de typografie, spacing, knoppen, formulieren, statuslabels, focusweergave en responsive breekpunten zijn vastgelegd in `docs/VISUAL_PROPOSAL.md`. `docs/DECISIONS.md` is bewust niet gewijzigd vóór Peters beoordeling.
- Alleen `/taken` bevat een werkende visuele proef met duidelijk gemarkeerde fictieve voorbeeldgegevens en lokale React-state. De proef gebruikt geen API, Neon-write of tijdelijk productiedatamodel.
- De proef toont twee hoofdtaken, verplichte subtaakdeadlines, Open, Wachten, Afgerond en afgeleid Geblokkeerd, de drie deadlinebeelden, tijdsinschattingen en een bewerkingsformulier met expliciet `Opslaan`.
- Desktop en mobiel zijn lokaal gecontroleerd. De mobiele pagina gebruikt een expliciete `device-width`-viewport en heeft bij 390 px geen horizontale overflow.
- De stopconditie uit O20 is actief: geen ander scherm en geen bredere frontendimplementatie vóór Peters expliciete visuele goedkeuring.
