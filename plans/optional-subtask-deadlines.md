# Uitvoeringsplan — optionele deadlines voor hoofd- en subtaken

Status: door Peter goedgekeurd op 11 augustus 2026; implementatie en productiemigratie voltooid, deployment in uitvoering.

## 1. Doel en gebruikersresultaat

Peter kan een hoofdtaak of subtaak aanmaken en wijzigen zonder deadline. Een ingevulde deadline blijft een datum plus tijd in `Europe/Amsterdam`, wordt als UTC opgeslagen en blijft onder de bestaande deadlinehiërarchie vallen.

Na oplevering:

- zijn deadlinevelden voor hoofdtaak en subtaak optioneel;
- kan een subtaak zonder deadline worden opgeslagen, bekeken, gewijzigd, gearchiveerd en als afhankelijkheid gebruikt;
- toont de UI `Geen deadline` wanneer geen deadline bestaat;
- wordt een subtaak zonder deadline niet afgewezen door client-, server- of databasevalidatie;
- blijven subtaken mét deadline vóór deadline-loze subtaken staan binnen dezelfde statusgroep;
- veroorzaakt een deadline-loze subtaak geen deadlineconflict, speling of deadlinewaarschuwing;
- blijft een deadline-loze subtaak uitvoerbaar en meetellen in de resterende duur van de hoofdtaak.

Buiten scope:

- automatisch afleiden of wijzigen van de hoofdtaakdeadline uit subtaken;
- terugkerende taken;
- een nieuwe planningsmotor of nieuwe prioriteitsregels;
- automatisch toekennen van een deadline door AI;
- wijzigen van bestaande deadlines of taakinhoud.

## 2. Huidige situatie

- `Task.deadline` is in Prisma nullable, maar het actieve hoofdtaakformulier vereist momenteel toch een datum.
- `Subtask.deadline` is in Prisma en TypeScript verplicht.
- `parseSubtaskFormData()` werpt `MISSING_DEADLINE` wanneer geen datum is ingevuld.
- `createSubtask()`, `updateSubtask()`, repositorycontracten en boardmapping nemen een niet-null `Date` aan.
- De PostgreSQL-trigger controleert de deadlinehiërarchie bij taak- en subtaakwrites.
- Sortering gebruikt rechtstreeks `subtask.deadline.getTime()` en kan dus niet met `null` omgaan.
- De visuele mapping ondersteunt al de tekst `Geen deadline`, maar create/edit-validatie, datumvergelijking en formulierattributen vereisen nog een datum.
- Dagbelasting telt werk alleen op een concrete deadline-datum; deadline-loze subtaken worden daardoor niet aan een specifieke dag toegerekend.
- Bestaande gegevens hebben allemaal een deadline en hoeven niet te worden herschreven.

## 3. Functionele interpretatie

1. Zowel een hoofdtaakdeadline als een subtaakdeadline is optioneel.
2. Als geen datum is ingevuld, wordt ook geen tijd opgeslagen; `deadline = null`.
3. Als wel een datum maar geen tijd is ingevuld, wordt 17:00 voorgesteld/opgeslagen volgens het bestaande datumcontract.
4. Als een hoofdtaak én een subtaak een deadline hebben, blijft gelden: `subtaakdeadline <= hoofdtaakdeadline`.
5. Een deadline-loze subtaak conflicteert nooit met een hoofdtaakdeadline.
6. Bij het vervroegen van een hoofdtaakdeadline worden alleen subtaken mét een latere deadline als conflict gemeld.
7. Deadline-loze subtaken worden binnen dezelfde statusgroep na subtaken met deadline gesorteerd; onderling geldt de bestaande `updatedAt`/stabiele volgorde.
8. Deadline-loze subtaken blijven meetellen in de resterende minuten van de hoofdtaak en kunnen dependencies hebben.
9. Zonder deadline is geen speling of deadline-risiconiveau berekenbaar. De UI toont neutraal `Geen deadline` en verzint geen waarschuwing.
10. Een deadline-loze subtaak wordt in de huidige Taken-slice niet aan een specifieke kalenderdag toegerekend. De toekomstige gezamenlijke planner moet deze wel als uitvoerbaar werk zonder deadlinegrens behandelen, waarbij dependencies en overige prioriteitsfactoren blijven gelden.
11. De hoofdtaakdeadline wordt niet automatisch afgeleid van subtaken en niet stilzwijgend gewijzigd.

Deze interpretatie vervangt expliciet de eerdere regel dat iedere subtaak een deadline moet hebben.

## 4. Te wijzigen of toe te voegen bestanden

### Product- en besluitdocumentatie

- `AGENTS.md`: harde regels en verplichte testlijst aanpassen naar optionele subtaakdeadline.
- `docs/PRODUCT_PLAN.md`: subtaakvelden en deadlinehiërarchie aanpassen.
- `docs/PRODUCT_RULES.md`: deadline optioneel maken en null-gedrag vastleggen.
- `docs/ARCHITECTURE.md`: nullable deadline en plannerbetekenis documenteren.
- `docs/DATA_MODEL.md`: `Subtask.deadline` nullable maken.
- `docs/DESIGN_SYSTEM.md`: neutrale weergave `Geen deadline` vastleggen.
- `docs/DECISIONS.md`: nieuw besluit toevoegen dat oudere verplichte-deadlinebesluiten overschrijft.
- `plans/optional-subtask-deadlines.md`: voortgang en eventuele afwijkingen bijhouden.

Historische plannen worden niet stilzwijgend herschreven; het nieuwe besluit vermeldt expliciet welke oude regel is vervangen.

### Database en domein

- `prisma/schema.prisma`: `Subtask.deadline` wijzigen van `DateTime` naar `DateTime?`.
- `prisma/migrations/<timestamp>_optional_subtask_deadline/migration.sql`: `subtasks.deadline` nullable maken en de deadlinehiërarchietrigger null-veilig vervangen/controleren.
- `lib/tasks/domain/types.ts`: `SubtaskFormInput.deadline` wijzigen naar `Date | null`.
- `lib/tasks/domain/validation.ts`: lege deadline accepteren; tijd zonder datum duidelijk weigeren of negeren volgens het bestaande formuliercontract (advies: weigeren met gerichte melding).
- `lib/tasks/repository.ts`: create/update-contracten voor subtaken nullable maken.
- `lib/tasks/service.ts`: create/update, conflictcontrole, sortering en boardmapping null-veilig maken.
- `lib/tasks/planned-load.ts`: expliciet bewaken dat een deadline-loze subtaak niet aan een datum wordt toegerekend.

### UI en actions

- `app/taken/taken-visual-prototype.tsx`: `required`, sterretjes, minimumdatumvalidatie, datumvergelijkingen, daglimietcontrole en labels voor hoofd- en subtaakdeadline aanpassen.
- `app/taken/actions.ts`: foutmapping aanpassen zodat een ontbrekende deadline niet langer als fout geldt; tijd-zonder-datum blijft gericht gemeld.

### Tests

- `tests/tasks-domain.test.ts`: parser- en deadlinehiërarchietests voor null toevoegen.
- `tests/tasks-service.integration.test.ts`: create/update/read/projectie met deadline-loze subtaken en conflictgedrag testen.
- `tests/tasks-planned-load.test.ts`: deadline-loze subtaken niet aan een specifieke dag toerekenen.
- Eventuele bestaande stack-/schema-asserties aanpassen wanneer Prisma-nullability daarin wordt gecontroleerd.
- Browsertests uitbreiden zodra een ingelogde Taken-fixture beschikbaar is; anders handmatige productiecontrole expliciet uitvoeren.

## 5. Datamodel en migratie

Wijziging:

```prisma
model Subtask {
  deadline DateTime?
}
```

Migratie:

```sql
ALTER TABLE "subtasks" ALTER COLUMN "deadline" DROP NOT NULL;
```

De bestaande triggerfunctie wordt aangepast of aantoonbaar behouden met expliciete null-logica:

- bij `NEW.deadline IS NULL` bestaat geen subtaak-taakdeadlineconflict;
- bij een niet-null subtaakdeadline en niet-null taakdeadline blijft de bovengrens gelden;
- bij vervroegen van een taakdeadline worden alleen niet-null subtaakdeadlines vergeleken.

Gevolgen voor bestaande data:

- geen records worden gewijzigd;
- bestaande deadlines blijven exact behouden;
- nieuwe en gewijzigde subtaken mogen daarna `NULL` opslaan;
- indexen op deadline blijven bruikbaar; PostgreSQL sorteert nullwaarden expliciet volgens de gekozen queryvolgorde (`NULLS LAST`/Prisma-equivalent of domeinsortering).

Dit is een niet-destructieve verruiming van nullability. De migratie wordt eerst gevalideerd en daarna pas op productie toegepast.

## 6. Beveiligings- en privacygevolgen

- Authenticatie, origincontrole en user-scoped autorisatie blijven ongewijzigd.
- Er komen geen nieuwe persoonsgegevens, secrets, tokens, externe diensten of logs bij.
- De server blijft alle overige verplichte velden en eigenaarschap valideren.
- Een gemanipuleerde browser kan geen deadlinehiërarchie omzeilen wanneer beide deadlines bestaan.
- Foutmeldingen noemen geen taken van andere gebruikers.
- De migratie verwijdert of herschrijft geen gebruikersdata.

## 7. Implementatiestappen

1. Werk productdocumentatie en `DECISIONS.md` bij met Peters expliciete nieuwe regel.
2. Maak `Subtask.deadline` nullable in Prisma en voeg een versioned, null-veilige SQL-migratie toe.
3. Werk domeintypen en pure deadlinevalidatie bij; voeg gerichte unit-tests toe.
4. Werk parser, repositories en services null-veilig bij.
5. Maak sortering, boardmapping, deadlineconflicten en projectie null-veilig.
6. Maak deadlinevelden in beide hoofdtaak- en beide subtaakformulieren optioneel; verwijder alleen deadlinegerelateerde verplichte validatie.
7. Zorg dat daglimietcontrole alleen draait wanneer een concrete datum bestaat.
8. Voeg integratie- en planned-load-tests toe.
9. Voer Prisma-validatie/generatie en alle kwaliteitspoorten uit.
10. Controleer desktop en mobiel: aanmaken, bewerken, sluiten na opslaan en `Geen deadline`.
11. Pas de migratie gecontroleerd toe op de bedoelde productieomgeving, deploy de code en voer read-only nacontrole uit.
12. Werk voortgang, resultaten en eventuele afwijkingen in dit plan bij.

## 8. Testscenario's

### Unit en validatie

- Hoofdtaak zonder deadline wordt geaccepteerd.
- Subtaak zonder deadline wordt geaccepteerd.
- Datum zonder tijd gebruikt 17:00.
- Tijd zonder datum geeft een gerichte foutmelding.
- Subtaak zonder deadline conflicteert niet met een hoofdtaakdeadline.
- Subtaak met deadline na de hoofdtaakdeadline wordt nog steeds geweigerd.
- Vervroegen van een hoofdtaakdeadline negeert deadline-loze subtaken en meldt alleen werkelijke conflicten.
- Sortering zet subtaken met deadline vóór subtaken zonder deadline binnen dezelfde status.
- Deadline-loze subtaken tellen mee in resterende hoofdtaakminuten.
- Deadline-loze subtaken tellen niet mee voor een specifieke dagbelasting.

### Integratie en database

- Prisma kan een subtaak met `deadline = null` aanmaken en wijzigen.
- Directe SQL met `deadline = null` wordt toegestaan.
- Directe SQL met een te late niet-null deadline blijft door de trigger geweigerd.
- Een andere gebruiker kan de subtaak niet lezen of wijzigen.
- Bestaande subtaken met deadlines blijven ongewijzigd na migratie.

### Browser en handmatig

- Desktop: hoofdtaak en subtaak zonder deadline aanmaken en opnieuw openen.
- Mobiel: dezelfde scenario's zonder overflow of onbereikbare knop.
- `Geen deadline` verschijnt in lijst en detail.
- Een later toegevoegde deadline wordt correct opgeslagen.
- Een bestaande deadline kan bewust worden leeggemaakt.
- Validatiefouten laten het formulier open; succes sluit het formulier.

Verplichte commando's:

```text
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## 9. Acceptatiecriteria

- Peter kan een hoofdtaak zonder deadline opslaan.
- Peter kan een subtaak zonder deadline opslaan.
- De opgeslagen databasewaarde is in beide gevallen `NULL`.
- De UI toont na verversen `Geen deadline` en vraagt niet opnieuw om een datum.
- Een deadline-loze subtaak blijft zichtbaar, uitvoerbaar en onderdeel van de resterende hoofdtaakduur.
- Een deadline-loze subtaak veroorzaakt geen deadlineconflict of deadlinewaarschuwing.
- Als beide deadlines bestaan, blijft een subtaakdeadline na de hoofdtaakdeadline onmogelijk.
- Bestaande taak- en subtaakdeadlines blijven intact.
- Desktop en mobiel werken volgens de goedgekeurde drieluik-/stapweergave.
- Alle verplichte kwaliteitscontroles zijn groen vóór productie-uitrol.

## 10. Risico's

- Bestaande code gebruikt op meerdere plekken `deadline.getTime()` en datumformatters zonder null-check; één gemiste plek kan runtimefouten veroorzaken.
- Een deadline-loze subtaak heeft geen speling en kan zonder toekomstige plannerprioriteit te lang blijven liggen. De UI moet daarom neutraal en eerlijk `Geen deadline` tonen.
- Prisma kan null-sortering niet overal even expliciet uitdrukken; domeinsortering moet deterministisch blijven.
- De database-trigger is custom SQL en moet als geheel worden gereviewd na aanpassing.
- Terugrollen naar `NOT NULL` is niet mogelijk zolang deadline-loze subtaken bestaan zonder eerst een door Peter gekozen deadline of archiveringsactie toe te passen.
- De huidige Playwright-suite heeft geen ingelogde Taken-fixture; handmatige browsercontrole blijft nodig totdat die fixture afzonderlijk is toegevoegd.

## 11. Terugrolmogelijkheid

Code en documentatie kunnen met een normale revertcommit worden teruggezet.

Database:

- `DROP NOT NULL` verliest geen data en hoeft bij een functionele rollback niet onmiddellijk te worden teruggedraaid;
- opnieuw `SET NOT NULL` uitvoeren mag alleen wanneer er geen null-deadlines bestaan;
- deadline-loze gebruikersrecords krijgen nooit automatisch een verzonnen deadline;
- als volledige schematerugrol noodzakelijk is, wordt eerst read-only geïnventariseerd welke records null zijn en beslist Peter per record of de deadline wordt ingevuld of de rollback wordt uitgesteld.

Er wordt geen force push, destructieve datamigratie of automatische datacorrectie gebruikt.

## 12. Open beslissingen

Er zijn geen blokkerende open productbeslissingen als Peter onderstaande aanbevolen interpretatie samen met dit plan goedkeurt:

- deadline-loze subtaken blijven uitvoerbaar maar hebben geen deadline-risico/speling;
- subtaken met deadline sorteren vóór subtaken zonder deadline binnen dezelfde status;
- de hoofdtaakdeadline wordt niet automatisch uit subtaken afgeleid;
- tijd zonder datum blijft ongeldig, omdat een los tijdstip geen deadline vormt.

Een toekomstige regel voor automatische hoofdtaakdeadlines of terugkerende taken valt buiten dit plan en vereist een afzonderlijk besluit.

## 13. Voortgang

- [x] Peters expliciete opdracht ontvangen dat een subtaakdeadline niet verplicht mag zijn.
- [x] Verplichte product-, architectuur-, data-, ontwerp- en beveiligingsdocumentatie gelezen.
- [x] Bestaande schema-, trigger-, domein-, service-, UI- en testafhankelijkheden geïnventariseerd.
- [x] Uitvoeringsplan opgesteld.
- [x] Expliciete goedkeuring van Peter ontvangen.
- [x] Productdocumentatie en besluitlog bijgewerkt.
- [x] Prisma-schema en migratie geïmplementeerd en gevalideerd.
- [x] Domein-, service- en UI-wijzigingen geïmplementeerd.
- [x] Tests en bestaande browsercontroles uitgevoerd.
- [x] Productiemigratie gecontroleerd uitgevoerd; bestaande subtaakdeadline bleef behouden.
- [ ] Deployment gecontroleerd uitgevoerd.

## 14. Goedkeuringspoort

Peter heeft het plan en de functionele interpretatie expliciet goedgekeurd. De productiemigratie en deployment volgen pas nadat alle lokale kwaliteitspoorten groen zijn.
