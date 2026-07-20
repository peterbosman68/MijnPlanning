# MijnPlanning — roadmap

## 1. Uitgangspunt

De kernplanning wordt eerst betrouwbaar gebouwd.

Integraties komen pas daarna.

WhatsApp Business komt pas nadat de kernapp volledig klaar en stabiel is.

---

## Fase 0 — Projectbasis

Doel:

Een veilige en testbare technische basis.

Onderdelen:

- bestaande private GitHub-repository `peterbosman68/MijnPlanning`, zonder een nieuwe repository aan te maken;
- bij implementatiestart eerst controleren of de lokale map al een Git-repository is en alleen zo nodig lokaal initialiseren en de bestaande repository als `origin` koppelen;
- npm en een gecontroleerde scaffold;
- Node.js 24 LTS;
- Next.js 16 Active LTS met App Router;
- React 19 en TypeScript 5;
- Tailwind CSS 3;
- Neon Postgres via Vercel Marketplace op het gratis abonnement, zonder lokale PostgreSQL-installatie;
- Prisma 6;
- koppeling van de bestaande private GitHub-repository aan het bestaande Vercel-project `mijnplanning`, zonder daarmee secrets, databases of betaalde infrastructuur vrij te geven;
- eenvoudige single-user login;
- alleen e-mailadres en wachtwoord als verplichte loginvelden;
- eerste gebruiker via een eenmalige server-only CLI;
- Argon2id met unieke salt en zonder password pepper;
- sessies van maximaal 30 dagen en maximaal 7 dagen inactiviteit;
- handmatig uitloggen en alle sessies intrekken;
- basislogging;
- Zod, Vitest en Playwright;
- `.env`-structuur;
- verplicht visueel voorstel met kleurenpalet inclusief hexwaarden, typografie, spacing, knoppen, formulieren en statuslabels;
- uitsluitend één werkende visuele versie van Taken op desktop en mobiel;
- expliciete visuele goedkeuring van Peter voordat overige volledige schermen of projectbrede componentpatronen worden gebouwd;
- na goedkeuring de eerste gedeelde ontwerpcomponenten;
- beschermde technische basis van Vandaag, zonder planningsmotor.

Peter heeft de blauw-gele drieluikrichting op 20 juli 2026 expliciet goedgekeurd op desktop en mobiel; de visuele goedkeuringspoort is voltooid. De bestaande GitHub-repository is aan Vercel-project `mijnplanning` gekoppeld. Preview of productie wordt pas functioneel vrijgegeven nadat de relevante lokale controles slagen. Vercel Blob, uploads en bijlagen horen niet bij fase 0 en blijven uitgesteld tot fase 10. Een betaalde Neon-upgrade vereist altijd expliciete toestemming.

Resultaat:

De gebruiker kan veilig inloggen en de lege applicatie openen.

---

## Fase 1 — Taken en subtaken

Onderdelen:

- Task;
- Subtask;
- TaskDependency;
- taak CRUD;
- subtaak CRUD;
- Server Actions als dunne transportlaag en bedrijfsregels in domeinservices;
- taakdeadline optioneel;
- subtaakdeadline verplicht;
- deadlines met datum en tijd, weergave in `Europe/Amsterdam` en opslag in UTC;
- aanpasbaar voorstel van 17.00 uur bij keuze van alleen een datum;
- verplichte titel en optioneel lege omschrijving;
- deadlinehiërarchie;
- servicevalidatie en aanvullende PostgreSQL-bescherming voor kritieke deadline-integriteit;
- transactionele cycluscontrole;
- taak zonder subtaken;
- taak met subtaken;
- optionele taakduur bij eerste invoer en planbaarheid pas na een ingevulde of geaccepteerde tijdsinschatting;
- geen extra hoofdtaakduur wanneer subtaken bestaan;
- statussen Open, Wachten, Afgerond, Gearchiveerd en Geannuleerd;
- afgeleide status Geblokkeerd;
- standaard archiveren en streng geblokkeerd definitief verwijderen bij gekoppelde historie of dependencies;
- expliciete knop `Opslaan` voor taak- en subtaakformulieren;
- eerste scherm Taken.

Resultaat:

De takenstructuur werkt correct en is server-side beschermd.

---

## Fase 2 — Tijdregistratie

Onderdelen:

- statussen Actief, Gepauzeerd en Wachten op externe partij toevoegen;
- timer starten;
- pauzeren;
- hervatten;
- wachten op externe partij;
- afronden;
- actieve tijd;
- onderbreking;
- wachttijd;
- logboek.

Resultaat:

Werkelijke actieve tijd wordt betrouwbaar vastgelegd.

---

## Fase 3 — Basisplanning

Onderdelen:

- werktijden;
- pauzes;
- buffers;
- vrije blokken;
- planning van taken;
- opsplitsbaarheid;
- minimale blokduur;
- afhankelijkheden;
- volledige invulling van scherm Vandaag op de technische routeshell uit fase 0;
- scherm Week;
- handmatig verversen.

Resultaat:

MijnPlanning maakt een bruikbare dag- en weekplanning zonder Microsoft-integratie.

---

## Fase 4 — Deadline-alarmen

Onderdelen:

- speling;
- groen;
- oranje;
- rood;
- tekort in minuten;
- oorzaak van risico;
- alarmenscherm;
- periodieke controle.

Resultaat:

Deadlinegevaar wordt vooraf zichtbaar.

---

## Fase 5 — AI-intake en tijdsinschatting

Onderdelen:

- AI-providerabstractie;
- taakanalyse;
- kenmerken;
- vervolgvragen;
- algemene schatting;
- bandbreedte;
- betrouwbaarheid;
- uitleg;
- gebruikerskeuze.

Resultaat:

Nieuwe taken krijgen een bruikbaar tijdsadvies.

---

## Fase 6 — Persoonlijk leren

Onderdelen:

- TaskEstimate;
- UserTaskProfile;
- vergelijkbare taken;
- persoonlijke correctiefactor;
- mediaan en percentielen;
- waarschuwing bij optimistische keuze;
- tweede risicoscenario;
- leren van plangedrag.

Resultaat:

MijnPlanning wordt persoonlijk realistischer.

---

## Fase 7 — Eenmalige To Do-import

Onderdelen:

- Microsoft OAuth;
- To Do-lijsten ophalen;
- lijstselectie;
- importvoorvertoning;
- exacte tekstimport;
- importbatch;
- duplicaatpreventie;
- controleverslag;
- To Do-toegang daarna verwijderen.

Resultaat:

Bestaande To Do-taken staan correct in MijnPlanning.

---

## Fase 8 — Outlook-agenda

Onderdelen:

- agenda’s selecteren;
- afspraken lezen;
- terugkerende afspraken;
- kalendercache;
- vrije tijd herberekenen;
- delta-sync;
- periodieke controle;
- planning aanpassen bij agenda-update.

Resultaat:

MijnPlanning plant rond echte afspraken.

---

## Fase 9 — Outlook-e-mail en ochtendbrief

Onderdelen:

- Mail.Read;
- e-mail ophalen;
- gesprek groeperen;
- samenvatten;
- acties herkennen;
- deadlines herkennen;
- taakvoorstellen;
- antwoordconcept;
- ochtendbrief;
- Resend-melding.

Resultaat:

E-mail levert gecontroleerde acties voor de planning op.

---

## Fase 10 — Bestanden en bijlagen

Onderdelen:

- upload;
- private Blob;
- metadata;
- autorisatie;
- foto;
- screenshot;
- PDF;
- documenten;
- verwijderen;
- grootte- en typegrenzen.

Resultaat:

Taken kunnen veilig bronmateriaal bevatten.

---

## Fase 11 — Mobiel en PWA

Onderdelen:

- mobiele navigatie;
- Vandaag mobiel;
- timer mobiel;
- taak snel toevoegen;
- foto toevoegen;
- installable PWA;
- offline basisweergave indien zinvol;
- notificatieonderzoek.

Resultaat:

Dagelijks gebruik op telefoon is praktisch.

---

## Fase 12 — Stabilisatie

Onderdelen:

- foutafhandeling;
- retries;
- logging;
- monitoring;
- backups;
- beveiligingstest;
- prestatietest;
- praktijktest;
- datamigratietest;
- documentatie;
- kostencontrole.

Resultaat:

De kernapp is klaar voor dagelijks gebruik.

---

## Later — WhatsApp Business

Pas starten nadat fase 12 is afgerond.

Niet onderdeel van de eerste versie.

Mogelijke latere scope:

- apart zakelijk nummer;
- Cloud API;
- berichten samenvatten;
- acties herkennen;
- antwoordconcepten;
- media;
- koppeling met Inbox en ochtendbrief.
