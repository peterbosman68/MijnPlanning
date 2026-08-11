# Uitvoeringsplan: hoofdtaak per subtaakdatum

## 1. Doel en gebruikersresultaat

Het hoofdtakenoverzicht moet zichtbaar maken op welke dagen werk voor een hoofdtaak staat gepland. Een hoofdtaak met niet-afgeronde subtaken op drie verschillende kalenderdagen verschijnt daarom op drie afzonderlijke datumrijen in het middenpaneel.

Na oplevering kan Peter:

- in `Vandaag`, `Week` en `Taken` per datum zien welke hoofdtaak werk bevat;
- per datum zien hoeveel resterende subtaaktijd op die datum staat;
- op iedere datumrij van een hoofdtaak klikken;
- rechts steeds het volledige overzicht van alle niet-gearchiveerde subtaken van die hoofdtaak bekijken.

Buiten deze wijziging vallen wijzigingen aan opgeslagen deadlines, automatische planning, afhankelijkheden, taakstatussen en databasegegevens.

## 2. Huidige situatie

- `lib/tasks/planned-load.ts` selecteert hoofdtaakwerk al op basis van subtaakdeadlines en berekent resterende minuten per dag.
- `app/taken/taken-visual-prototype.tsx` projecteert een hoofdtaak zonder eigen deadline momenteel alleen op de vroegste open subtaakdeadline.
- Het middenpaneel gebruikt `MainTask[]`, waardoor iedere hoofdtaak maximaal één keer voorkomt.
- `Vandaag` en `Week` selecteren taken op subtaakdatum, maar tonen een geselecteerde hoofdtaak slechts één keer.
- Het rechterpaneel filtert subtaken in `Vandaag` tot vandaag en in `Week` tot de huidige week. Daardoor zijn na een klik niet alle subtaken zichtbaar.
- De selectie gebruikt alleen `task.id`. Bij meerdere visuele voorkomens zou dat alle rijen van dezelfde taak tegelijk selecteren.
- `Task.deadline` en `Subtask.deadline` zijn bestaande gegevens; voor deze wijziging is geen databasemutatie nodig.

## 3. Functionele interpretatie

1. Een actieve hoofdtaak met subtaken krijgt één middenpaneelrij per unieke kalenderdatum waarop minimaal één niet-afgeronde en niet-gearchiveerde subtaak een deadline heeft.
2. Meerdere relevante subtaken op dezelfde kalenderdag leveren één rij op.
3. De tijd in die rij is de som van de resterende tijd van de relevante subtaken op exact die datum.
4. De rij toont de betreffende subtaakdatum, ook wanneer de hoofdtaak zelf een deadline heeft. De opgeslagen hoofdtaakdeadline blijft alleen in het detail en in deadlinevalidatie leidend.
5. `Vandaag` toont alleen voorkomens op vandaag; daardoor kan een hoofdtaak daar maximaal één keer voorkomen.
6. `Week` toont één voorkomen per relevante datum binnen de huidige maandag-tot-en-met-zondagweek.
7. `Taken` toont alle gedateerde voorkomens, chronologisch gesorteerd. Voor `Fietsweekend2027` met subtaken op 11 augustus, 15 augustus en 28 februari verschijnen dus drie rijen.
8. Een actieve hoofdtaak zonder subtaken blijft één rij houden op de eigen deadline of als `Geen deadline`.
9. Heeft een hoofdtaak subtaken maar alleen deadline-loze niet-afgeronde subtaken, dan blijft zij vindbaar via één rij `Geen deadline`.
10. Heeft een hoofdtaak zowel gedateerde als deadline-loze niet-afgeronde subtaken, dan verschijnen de gedateerde rijen plus één neutrale rij `Geen deadline` voor het nog niet aan een dag gekoppelde werk.
11. `Taken Mogelijk` en `Taken Afgerond` blijven beheerbakken en tonen iedere echte hoofdtaak één keer; zij worden niet per planningsdatum gedupliceerd.
12. Iedere datumrij krijgt een stabiele visuele sleutel op basis van taak-ID en datum. Alleen de aangeklikte rij wordt geselecteerd.
13. De geselecteerde hoofdtaak blijft op `task.id` gebaseerd. Daardoor delen alle datumrijen hetzelfde taakdossier, bijlagen en mutaties.
14. Na een klik toont het rechterpaneel in `Vandaag`, `Week` en `Taken` alle niet-gearchiveerde subtaken van de geselecteerde hoofdtaak, chronologisch gesorteerd. Het detail wordt niet langer tot de actieve dag of week beperkt.
15. Afgeronde subtaken mogen rechts zichtbaar blijven als onderdeel van het volledige taakoverzicht; gearchiveerde subtaken blijven buiten het actieve detail. In `Taken Afgerond` blijft het bestaande volledige overzicht behouden.
16. Na een geslaagde klik op `Mogelijk` verdwijnt de volledige hoofdtaak met al haar datumvoorkomens direct uit `Vandaag`, `Week` en `Taken` en verschijnt zij één keer onder `Taken Mogelijk`; alle subtaken en overige gegevens blijven gekoppeld.
17. Na `Inplannen` verdwijnt de taak direct uit `Taken Mogelijk` en worden haar relevante datumvoorkomens weer in de actieve overzichten opgebouwd.

## 4. Te wijzigen bestanden

- `lib/tasks/planned-load.ts`
  - Voeg pure helpers toe voor unieke, chronologisch gesorteerde subtaakdatums en voor de deadline-loze restgroep.
- `app/taken/taken-visual-prototype.tsx`
  - Introduceer een niet-opgeslagen rijprojectie per taak en datum.
  - Pas filtering, sortering, telling, rendering en selectie aan op rijvoorkomens.
  - Laat het rechterpaneel alle relevante subtaken van de geselecteerde hoofdtaak tonen.
  - Verwerk een geslaagde statuswijziging onmiddellijk lokaal, vóór de achtergrondrefresh.
- `tests/tasks-planned-load.test.ts`
  - Test unieke datums, sortering, samenvoegen op dezelfde dag, gesloten subtaken en deadline-loos werk.
- `docs/PRODUCT_PLAN.md`
  - Leg het datumgerichte hoofdtakenoverzicht en het volledige detail vast.
- `docs/PRODUCT_RULES.md`
  - Voeg de harde regels voor unieke datumvoorkomens, tijdaggregatie en detailweergave toe.
- `docs/ARCHITECTURE.md`
  - Documenteer de afgeleide rijprojectie en scheiding tussen occurrence-sleutel en taak-ID.
- `docs/DATA_MODEL.md`
  - Verduidelijk dat een datumvoorkomen een projectiewaarde is en geen nieuw record of deadlineveld.
- `docs/DESIGN_SYSTEM.md`
  - Leg vast hoe herhaalde hoofdtaakrijen en geselecteerde voorkomens zich visueel gedragen.
- `docs/DECISIONS.md`
  - Leg Peters goedgekeurde functionele keuze vast als nieuw besluit.

Er worden geen bestanden verwijderd.

## 5. Datamodel en migraties

- Geen nieuw Prisma-model.
- Geen nieuwe velden, relaties, constraints of indexen.
- Geen migratie en geen wijziging van bestaande gegevens.
- Een `TaskDateOccurrence` is uitsluitend een client/projectiewaarde met minimaal `task`, `occurrenceKey`, `dateValue`, zichtbaar datumlabel en minutenlabel.
- `Task.deadline` en alle `Subtask.deadline`-waarden blijven ongewijzigd.
- Terugrol bestaat uit het terugzetten van de projectie- en UI-wijzigingen; dataherstel is niet nodig.

## 6. Beveiliging en privacy

- Authenticatie, user-scoped dataophaling en server-side autorisatie wijzigen niet.
- Er komen geen nieuwe routes, Server Actions, tokens, secrets, logs of externe diensten.
- De projectie gebruikt uitsluitend reeds geautoriseerde taakgegevens in de bestaande clientweergave.
- Mutaties blijven de echte `task.id` gebruiken; een occurrence-sleutel wordt nooit als autorisatie-ID naar de server gestuurd.
- Er worden geen extra persoonsgegevens opgeslagen of gelogd.

## 7. Implementatiestappen

1. Voeg in `planned-load.ts` een pure helper toe die uit niet-gesloten subtaken unieke kalenderdatums afleidt en sorteert.
2. Voeg een pure controle toe voor niet-gesloten subtaken zonder deadline, zodat deze niet uit `Taken` verdwijnen.
3. Voeg unit-tests toe die het voorbeeld met drie datums, twee subtaken op één datum, gesloten subtaken en deadline-loze subtaken afdekken.
4. Bouw in de Taken-component per actieve weergave een lijst van datumvoorkomens op.
5. Laat `Vandaag`, `Week` en `Taken` dezelfde occurrence-projectie gebruiken met elk hun eigen datumbereik.
6. Behoud voor `Taken Mogelijk` en `Taken Afgerond` één rij per hoofdtaak.
7. Splits geselecteerde occurrence-sleutel en geselecteerde taak-ID, zodat slechts één rij gemarkeerd wordt en het detail dezelfde hoofdtaak gebruikt.
8. Laat iedere occurrence-rij haar eigen datum en minuten voor die datum tonen.
9. Laat het rechterpaneel na selectie alle niet-gearchiveerde subtaken tonen, onafhankelijk van de actieve datumweergave.
10. Laat een geslaagde statuswijziging de lokale taakprojectie onmiddellijk bijwerken, zodat alle occurrences tegelijk naar of uit `Taken Mogelijk` verplaatsen.
11. Werk documentatie en besluitlog bij.
12. Voer gerichte unit-tests uit en daarna de volledige kwaliteitscontroles.
13. Controleer het resultaat in desktop- en mobiele browserweergave, inclusief een taak met meerdere datumvoorkomens.

## 8. Testscenario's

### Unit-tests

- Een taak met open subtaken op 11 augustus, 15 augustus en 28 februari levert drie chronologisch gesorteerde datums.
- Twee open subtaken op dezelfde dag leveren één datumvoorkomen en hun gezamenlijke resterende tijd.
- Afgeronde en gearchiveerde subtaken maken geen actieve datumvoorkomens.
- Een deadline-loze open subtaak activeert één neutrale restgroep.
- Een combinatie van gedateerde en deadline-loze subtaken levert datumvoorkomens plus één neutrale restgroep.
- Een hoofdtaak met subtaken telt haar eigen resterende minuten niet nogmaals mee.

### Integratie- en validatietests

- Bestaande takenservice- en user-scoped tests blijven groen.
- Geen database-integratietest is nieuw nodig omdat geen opslagcontract wijzigt.
- Bestaande deadlinevalidatie blijft ongewijzigd groen.

### Fout- en randgevallen

- Ongeldige of ontbrekende deadlinewaarden veroorzaken geen kapotte rij.
- Een hoofdtaak met alleen gesloten subtaken wordt niet als nieuw zelfstandig gepland werk getoond.
- Een taak die tijdens selectie verdwijnt door statuswijziging valt terug op de eerste geldige occurrence.
- Een mutatie vanuit een herhaalde rij gebruikt altijd de echte taak-ID.
- Een geslaagde klik op `Mogelijk` verwijdert alle actieve occurrences van die taak en toont haar één keer onder `Taken Mogelijk`.
- Een mislukte statusmutatie laat de taak in de oorspronkelijke lijst staan en toont de serverfout.

### Browser en mobiel

- Desktop: drie voorkomens van dezelfde hoofdtaak zijn leesbaar, chronologisch en slechts één rij is geselecteerd.
- Desktop: klikken op elk voorkomen toont rechts alle subtaken.
- Mobiel: klikken op ieder voorkomen opent het detail en toont alle subtaken zonder horizontale overflow.
- `Vandaag`, `Week`, `Taken`, `Taken Mogelijk` en `Taken Afgerond` blijven navigeerbaar.

### Volledige controles

```bash
npm run prisma:validate
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## 9. Acceptatiecriteria

1. Wanneer `Fietsweekend2027` niet-afgeronde subtaken heeft op 11 augustus, 15 augustus en 28 februari, staat de hoofdtaak in `Taken` drie keer, eenmaal bij iedere datum.
2. Wanneer twee subtaken van `Fietsweekend2027` op 15 augustus staan, verschijnt slechts één rij voor 15 augustus en toont die rij de som van beide resterende tijden.
3. Wanneer een van de drie subtaken wordt afgerond of gearchiveerd, verdwijnt haar datumvoorkomen alleen wanneer op die datum geen andere relevante subtaak resteert.
4. Wanneer Peter op een van de drie rijen klikt, wordt alleen die rij geselecteerd en toont rechts hetzelfde hoofdtaakdetail met alle niet-gearchiveerde subtaken.
5. Wanneer Peter `Vandaag` opent, verschijnen alleen occurrences van vandaag.
6. Wanneer Peter `Week` opent, verschijnen alle occurrences binnen de huidige kalenderweek, ook meerdere van dezelfde hoofdtaak.
7. Wanneer een actieve hoofdtaak alleen deadline-loze subtaken heeft, blijft zij in `Taken` zichtbaar als `Geen deadline`.
8. De hoofdtaakdeadline en subtaakdeadlines in PostgreSQL wijzigen niet door deze weergave.
9. `Taken Mogelijk` en `Taken Afgerond` blijven één rij per hoofdtaak tonen.
10. Desktop en mobiel tonen geen overlappende of afgekorte essentiële datum- en tijdinformatie.
11. Na een geslaagde klik op `Mogelijk` verdwijnen alle regels van die hoofdtaak direct uit het actieve hoofdtakenoverzicht en staat de taak met al haar subtaken één keer in `Taken Mogelijk`.
12. Wanneer de statuswijziging mislukt, blijft de hoofdtaak in het actieve overzicht staan.

## 10. Risico's en terugval

- **Meer rijen:** grote taken met veel unieke subtaakdatums maken de lijst langer. Terugval: één rij per taak herstellen of later groepering inklapbaar maken na een apart besluit.
- **Selectieverwarring:** zonder occurrence-sleutel zouden meerdere rijen tegelijk geselecteerd lijken. Mitigatie: selectie expliciet splitsen in occurrence en taak-ID.
- **Mutaties vanuit duplicaten:** status- of archiveeractie op één occurrence raakt logisch de volledige hoofdtaak en laat alle occurrences verdwijnen of verplaatsen. Dit wordt door taak-ID en een achtergrondrefresh consistent gehouden.
- **Deadline-loze restgroep:** deze extra rij is nodig om optionele deadlines te respecteren en werk niet onzichtbaar te maken, maar vergroot het aantal rijen. Zij krijgt daarom een neutraal label.
- **Prestaties:** de projectie is lineair in het aantal taken en subtaken en gebruikt memoization; er komen geen extra databasequeries bij.
- **Datarisico:** geen, omdat de wijziging alleen een afgeleide presentatie betreft.
- **Terugrol:** revert van de code- en documentatiecommit; geen databaseterugrol vereist.

## 11. Open beslissingen

Geen blokkerende open beslissingen. Goedkeuring van dit plan bevestigt tevens:

- dat `Week` dezelfde hoofdtaak meerdere keren mag tonen wanneer relevante subtaken op meerdere weekdagen vallen;
- dat gedateerde én deadline-loze subtaken samen een extra neutrale `Geen deadline`-rij kunnen opleveren;
- dat het rechterpaneel in `Vandaag`, `Week` en `Taken` alle niet-gearchiveerde subtaken toont, inclusief afgeronde subtaken.

## 12. Voortgang

- [x] Verplichte product-, architectuur-, data-, ontwerp- en beveiligingsdocumentatie gelezen.
- [x] Huidige lijstprojectie, selectie en detailfiltering gelokaliseerd.
- [x] Uitvoeringsplan opgesteld.
- [x] Expliciete goedkeuring van Peter ontvangen.
- [x] Domeinhelpers en tests geïmplementeerd.
- [x] UI-projectie, selectie en directe statusverplaatsing geïmplementeerd.
- [x] Documentatie bijgewerkt met O38.
- [x] Prisma-validatie, lint, typecheck, 81 tests, productiebuild en 16 Playwright-tests geslaagd.
- [ ] Echte ingelogde desktop- en mobiele taakdata visueel gecontroleerd; de gedeelde browserpagina bevatte alleen de productie-login en er zijn geen inloggegevens via de agent verwerkt.
