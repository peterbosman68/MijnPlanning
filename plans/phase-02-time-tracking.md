# Uitvoeringsplan — fase 2 tijdregistratie en leerdata-basis

- Status: concept, wacht op expliciete goedkeuring
- Datum: 4 augustus 2026
- Scope: fase 2 tijdregistratie met betrouwbare actieve tijd als invoer voor latere persoonlijke leercorrectie
- Implementatie gestart: nee

## 1. Doel

Fase 2 levert een betrouwbare tijdregistratielaag op waarmee MijnPlanning werkelijke actieve werktijd per taak en subtaak vastlegt.

Na oplevering kan Peter:

- een taak of subtaak starten, pauzeren, hervatten, markeren als onderbroken en markeren als wachten op externe partij;
- een tijdsessie afronden met correcte totalen;
- per werkitem actieve tijd, pauzetijd, onderbrekingstijd, wachttijd en doorlooptijd inzien;
- statusovergangen gebruiken zonder bestaande fase-1-productregels te doorbreken.

Buiten scope:

- volledige planningsmotorberekening (fase 3);
- automatische AI-herinschatting in productie;
- Microsoft-koppelingen, e-mailautomatisering, WhatsApp en bijlagen;
- multi-user uitbreidingen.

## 2. Huidige situatie

- Fase 1 is op `main` afgerond met taken, subtaken, dependencies en basisvalidaties.
- Bestaande statusset in database en UI is gericht op fase 1 (`OPEN`, `WAITING`, `COMPLETED`, `ARCHIVED`, `CANCELLED`), met `BLOCKED` als afgeleide toestand.
- Er is nog geen persistente tijdsessietabel en geen server-side timerworkflow.
- `docs/ROADMAP.md` markeert fase 2 als de stap waarin werkelijke actieve tijd betrouwbaar wordt vastgelegd.
- `docs/DATA_MODEL.md` bevat al een doelmodel voor `TimeSession` en leergerelateerde entiteiten.

## 3. Functionele interpretatie

- Alleen actieve werktijd telt mee voor persoonlijke uitvoersnelheid en latere personalisatie.
- Pauzes, onderbrekingen, wachttijd en externe wachttijd worden wel gelogd, maar niet als actieve uitvoersnelheid meegeteld.
- Een sessie wordt gekoppeld aan een taak of subtaak; dubbele koppeling wordt alleen toegestaan met expliciete technische reden en gecontroleerde validatie.
- Fase-2-statussen (`ACTIEF`, `GEPAUZEERD`, `WACHT_OP_EXTERN`) worden toegevoegd zonder dat fase-1-archiverings- en dependencyregels vervallen.
- De gebruiker houdt altijd de eindbeslissing; AI mag alleen adviseren en niet zelfstandig status of tijd aanpassen.

## 4. Bestanden en structuur

Verwachte wijzigingen:

- `prisma/schema.prisma`: uitbreiding enums en nieuwe modellen voor tijdregistratie.
- `prisma/migrations/<timestamp>_time_tracking_phase2/migration.sql`: additieve migratie.
- `lib/tasks/domain/types.ts`: fase-2-statusset en overgangscontracten.
- `lib/tasks/domain/validation.ts`: statusovergangen en timergerelateerde domeinvalidaties.
- `lib/tasks/service.ts`: start/pauze/hervat/onderbreek/wacht/afrond-logica met transacties.
- `lib/tasks/repository.ts`: opslag en uitlezing van sessies en aggregaten.
- `app/taken/actions.ts`: dunne server actions voor timeracties.
- `app/taken/taken-visual-prototype.tsx`: vervangen van tijdelijke timerstate door server-side workflow.
- `tests/tasks-domain.test.ts`: statusovergangen en validatie van foutscenario's.
- `tests/tasks-service.integration.test.ts`: transacties, gelijktijdige requests en aggregatie.
- `tests/` aanvullende tests voor regressie op fase-1-regels.
- `docs/DATA_MODEL.md`, `docs/PRODUCT_RULES.md`, `docs/DECISIONS.md`: update na implementatie en expliciet besluit.

## 5. Datamodel en migraties

### 5.1 Nieuwe of aangepaste modellen

Voorstel op basis van bestaande documentatie:

- uitbreiding taak/subtaakstatus met fase-2-statussen voor actieve uitvoering;
- nieuw model `TimeSession` met minimaal:
  - `id`, `userId`, `taskId?`, `subtaskId?`, `sessionType`, `startedAt`, `endedAt?`;
  - `activeSeconds`, `note?`, `interruptionReason?`, `createdAt`, `updatedAt`.

### 5.2 Constraints en indexen

- check op geldige tijdsvolgorde (`endedAt >= startedAt` indien gezet);
- check op positieve of nul-waarden voor secondenvelden;
- indexen op `userId`, `taskId`, `subtaskId`, `startedAt`;
- unieke of conditionele bescherming tegen meerdere gelijktijdige actieve sessies voor hetzelfde werkitem.

### 5.3 Migratiestrategie

- uitsluitend additieve migratie in fase 2;
- geen destructieve wijziging of stille dataverwijdering;
- migratie eerst op developmentdatabase valideren;
- rollback via applicatieterugzetting en gecontroleerde, niet-destructieve dataneutralisatie van nieuwe records.

## 6. Beveiliging en privacy

- alle timerwrites alleen server-side achter `requireUser` en origincontrole;
- rate limiting op muterende timeracties ter bescherming tegen spam en racegedrag;
- geen gevoelige inhoud in logs (geen ruwe notities of tokens);
- dataminimalisatie: alleen registreren wat nodig is voor planning en leren;
- eigenaarschap afdwingen op iedere sessiewrite en sessieread.

## 7. Implementatiestappen

1. Status- en tijdregistratiecontracten finaliseren in domeinlaag.
2. Prisma-schema en additieve migratie voor `TimeSession` en fase-2-statussen toevoegen.
3. Repository- en servicelogica bouwen voor start/pauze/hervat/onderbreek/wacht/afrond.
4. Server actions koppelen en UI-acties op `/taken` server-side laten opslaan.
5. Aggregaties tonen per taak/subtaak (actief, pauze, onderbreking, wachten, doorlooptijd).
6. Regressietests voor fase-1-regels en nieuwe fase-2-routes uitvoeren.
7. Documentatie en besluiten bijwerken na geslaagde validatie.

## 8. Tests

Minimaal uit te voeren:

- unit-tests voor statusovergangen en tijdvalidatie;
- integratietests voor transacties, gelijktijdige updates en correcte secondenaggregatie;
- foutscenario's: dubbele start, ongeldige overgang, afronden zonder actieve sessie, eigenaarschapsfout;
- autorisatietests op timeractions;
- handmatige browsercontrole desktop en mobiel voor start/pauze/hervat/afrond;
- regressietests op fase-1 deadlinehiërarchie en dependencyblokkering.

Afsluitende technische gates:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## 9. Acceptatiecriteria

- Een gebruiker kan voor een taak of subtaak een sessie starten en hervatten zonder data-inconsistentie.
- Alleen actieve tijd telt mee als uitvoersnelheid; pauze-, onderbrekings- en wachttijd blijven apart zichtbaar.
- Ongeldige statusovergangen worden geweigerd met duidelijke foutmelding.
- Dependency- en deadlineproductregels uit fase 1 blijven volledig intact.
- Timergedrag werkt bruikbaar op desktop en mobiel zonder horizontale afhankelijkheid.

## 10. Risico's

- race conditions bij meerdere tabbladen of snelle klikreeksen;
- onduidelijke grenzen tussen `GEPAUZEERD`, `ONDERBROKEN` en `WACHT_OP_EXTERN` in UI;
- verkeerde aggregatie kan leermodel en latere planning vertekenen;
- migratie-impact op bestaande statuslogica;
- onbedoeld meetellen van niet-actieve tijd in leerdata.

Beheersmaatregelen:

- transactionele updates en idempotente service-operaties;
- expliciete domeinstatusmatrix met tests;
- gecontroleerde aggregatiefuncties met grenswaardetests;
- kleine incrementele rollout en snelle rollback op applicatieniveau.

## 11. Terugrol

- code-rollback via Git naar laatste stabiele commit;
- uitschakelen van timeracties in UI wanneer incident optreedt;
- nieuwe sessierecords behouden voor audit, tenzij expliciet opschonen is goedgekeurd;
- geen destructieve databaseactie zonder afzonderlijke expliciete toestemming.

## 12. Open beslissingen

- D1: blijft `TRAVEL` in fase 2 actief als `sessionType`, of pas in latere mobiliteitsfase?
- D2: één actieve sessie per gebruiker tegelijk, of één per werkitem met extra conflictwaarschuwing?
- D3: komen onderbrekingsredenen uit een vaste lijst of vrije tekst met optionele categorie?

Implementatiecode voor fase 2 start pas na expliciete goedkeuring van dit plan en beantwoording van de open beslissingen.