# Uitvoeringsplan — eenmalige Microsoft To Do-productie-import

## 1. Doel en gebruikersresultaat

Alle taken uit alle Microsoft To Do-lijsten worden éénmalig als hoofdtaken naar MijnPlanning gekopieerd.

Na oplevering kan Peter:

- vooraf aantallen, bijlagen, links en voorbeeldtitels controleren;
- de import één keer expliciet bevestigen;
- open én afgeronde To Do-taken als hoofdtaken terugvinden;
- de originele titel, notitie, deadline, status, documenten en links behouden;
- het importresultaat controleren zonder dat bestaande MijnPlanning-taken of To Do-brondata worden gewijzigd.

Buiten deze wijziging vallen:

- subtaken maken uit To Do-notities;
- blijvende synchronisatie, delta-sync, webhooks of terugschrijven;
- To Do-items verwijderen of aanpassen;
- planning door AI laten bepalen.

## 2. Huidige situatie

- Microsoft OAuth vraagt `Tasks.Read` en `Calendars.Read` aan.
- De preview leest alle To Do-lijsten en taken via Microsoft Graph.
- De huidige importservice kan taken, bestanden en links voorbereiden en opslaan.
- De execute-route is inmiddels uitsluitend aanvullend gemaakt; het destructieve codepad dat bestaande MijnPlanning-taken verwijderde is verwijderd.
- De preview toont totalen en maximaal tien voorbeeldtitels, maar heeft nog geen productiebevestiging of resultaatweergave.
- `TodoImportBatch` en `TodoImportItem` staan in Prisma, maar worden nog niet door de service gevuld.
- Migratie `20260810160000_add_attachments_and_todo_import` is nog niet toegepast op de gekoppelde Neon-database.
- De taken-UI gebruikt deels lokale prototypestate; database-import en zichtbare prototypegegevens zijn daardoor nog niet end-to-end gekoppeld.
- De GitHub-remote is `peterbosman68/MijnPlanning`; het lokale Vercel-project heet `mijnplanning`.

Gevonden tekortkomingen vóór productie:

- To Do-titels worden momenteel getrimd en zijn daardoor niet gegarandeerd exact;
- `dueDateTime.timeZone` wordt nog niet correct verwerkt wanneer Graph geen offset levert;
- batch- en itemhistorie wordt niet opgeslagen;
- de database heeft nog geen unieke constraint op `Task(userId, sourceExternalId)`;
- gelijktijdige importverzoeken zijn nog niet hard uitgesloten;
- de productie-importknop en duidelijke eindcontrole ontbreken.

## 3. Functionele interpretatie

De gekozen importomvang is:

- alle Microsoft To Do-lijsten;
- alle open en afgeronde taken;
- iedere To Do-taak wordt precies één hoofdtaak;
- er worden geen subtaken aangemaakt.

Mapping:

| Microsoft To Do | MijnPlanning |
|---|---|
| titel, exact | `Task.title` |
| notitie/body, exact | `Task.descriptionOriginal` |
| afgeleide platte tekst | `Task.descriptionPlain` |
| vervaldatum en tijdzone | `Task.deadline` in UTC |
| open/overige status | `Task.status = OPEN` |
| afgerond | `Task.status = COMPLETED` en `completedAt` op importtijdstip |
| bestand | private `TaskAttachment` op de hoofdtaak |
| link | read-only `TaskAttachment.sourceUrl` op de hoofdtaak |
| lijst- en taak-ID | importmetadata en `sourceExternalId` |

Regels:

- bestaande handmatige MijnPlanning-taken blijven altijd behouden;
- een reeds geïmporteerde To Do-ID wordt overgeslagen;
- een tweede of gelijktijdige import mag geen duplicaten maken;
- `descriptionOriginal` wordt niet genormaliseerd of door AI aangepast;
- de grote textarea is alleen presentatie en begrenst de opgeslagen notitie niet;
- de gebruiker bevestigt de import expliciet na de preview;
- na succes wordt To Do niet opnieuw gelezen door automatische processen.

## 4. Bestanden

Te wijzigen:

- `lib/microsoft/todo-import.ts`: exacte mapping, tijdzoneconversie, hashes, batchregistratie, idempotentie en resultaten.
- `app/api/todo/import/execute/route.ts`: strikt invoercontract, expliciete bevestiging en foutmapping.
- `app/(protected)/todo-import-preview/page.tsx`: preview, bevestigingssectie en resultaatstatus.
- `app/(protected)/todo-import-preview/todo-import-preview.module.css`: compacte bevestigings- en resultaatweergave.
- `prisma/schema.prisma`: harde uniciteit en waar nodig explicietere importrelaties/constraints.
- `prisma/migrations/20260810160000_add_attachments_and_todo_import/migration.sql`: aanvullen zolang deze migratie nergens is toegepast.
- `tests/todo-import.test.ts`: mapping, bronbehoud, duplicaatpreventie, batchstatus en foutrollback.
- `tests/stack-foundation.test.ts`: alleen indien modelverwachtingen wijzigen.
- `docs/MICROSOFT_INTEGRATION.md`: gekozen import van alle lijsten en afgeronde taken vastleggen.
- `docs/DECISIONS.md`: definitieve importomvang en niet-destructief gedrag registreren.
- dit plan: voortgang en uitgevoerde controles bijhouden.

Mogelijk toe te voegen:

- een klein clientcomponent onder `app/(protected)/todo-import-preview/` voor bevestigen en resultaat tonen.
- een pure Microsoft `dateTimeTimeZone`-converter met unit-tests wanneer geen bestaande helper geschikt is.

## 5. Datamodel en migraties

De bestaande additieve migratie maakt aan:

- `task_attachments`;
- `todo_import_batches`;
- `todo_import_items`;
- bijbehorende indexen en foreign keys.

Voor toepassing wordt de nog niet uitgevoerde migratie aangevuld met:

- een unieke index op `(userId, sourceExternalId)` voor geïmporteerde taken waarbij `sourceExternalId` niet null is;
- een check dat een bijlage aan precies één taak of subtaak hangt;
- een check dat een bijlage precies één toegangsbron heeft: `blobPath` of `sourceUrl`;
- zo nodig statuschecks voor importbatch en importitem.

Migratievolgorde:

1. Prisma-schema valideren en client genereren.
2. Migratie-SQL reviewen op uitsluitend additieve handelingen.
3. Migratiestatus tegen de productiedatabase read-only controleren.
4. Vóór deploy een herstelpunt/back-upmogelijkheid van Neon bevestigen.
5. `prisma migrate deploy` één keer tegen de beoogde productiedatabase uitvoeren.
6. Migratiestatus en aanwezigheid van tabellen/indexen read-only verifiëren.

Er worden tijdens de schemamigratie geen bestaande taakrecords verwijderd of gewijzigd.

## 6. Beveiliging en privacy

- Iedere preview en import vereist een geldige MijnPlanning-sessie.
- POST vereist een vertrouwde Origin en expliciete bevestigingswaarde.
- Microsoft-token blijft versleuteld en uitsluitend server-side.
- Alleen `Tasks.Read` wordt voor To Do gebruikt; geen schrijfrecht.
- Bestanden worden privé opgeslagen; productie vereist `BLOB_READ_WRITE_TOKEN`.
- Bestandsnaam, type en grootte worden gevalideerd; uitvoerbare bestanden worden geweigerd.
- Eigenaarschap wordt op gebruiker en doelrecord gecontroleerd.
- Tokens, bestandsinhoud, volledige notities en tijdelijke downloadlinks worden niet gelogd.
- Foutmeldingen tonen geen token, Graph-responsebody of lokale opslagpaden.
- Een importlock plus database-uniciteit voorkomt dubbele writes door dubbelklikken of gelijktijdige requests.

## 7. Implementatiestappen

1. Leg exacte titel- en notitiemapping vast met unit-tests.
2. Verwerk Graph `dateTime` plus `timeZone` correct naar UTC en test Amsterdam/DST en waarden met offset.
3. Breid kandidaten uit met lijst-ID, taak-ID, lijstnaam en een deterministische SHA-256-bronhash.
4. Maak de databaseconstraints voor taakuniciteit en geldige bijlagen compleet.
5. Registreer vóór import een batch met status `RUNNING` en alle bronlijsten.
6. Sla per bronitem resultaat, hash, doeltaak en aantal bijlagen op.
7. Sluit de batch af als `COMPLETED` of `FAILED`; verwijder extern geüploade blobs bij transactionele fout.
8. Blokkeer een tweede gelijktijdige import en sla reeds bekende bron-ID’s over.
9. Voeg aan de preview een expliciete bevestiging toe met de tekst dat alle lijsten, open en afgeronde taken worden gekopieerd en bestaande taken blijven staan.
10. Toon na uitvoering aantallen gevonden, geïmporteerd en overgeslagen; voer geen automatische tweede poging uit.
11. Werk documentatie en dit voortgangsdeel bij.
12. Voer alle kwaliteitscontroles uit.
13. Commit de complete, groene wijziging op `main` met een functionele commitboodschap.
14. Push `main` naar GitHub zonder force push.
15. Laat Vercel deployen en controleer deploymentstatus, login, preview en Microsoft-koppeling zonder de import te bevestigen.

De daadwerkelijke eenmalige productie-import valt buiten stappen 1–15 en gebeurt pas na een afzonderlijke laatste bevestiging op de werkende productiepreview.

## 8. Tests

Unit-tests:

- titel blijft byte-voor-byte gelijk;
- notitie behoudt regeleinden, lege regels, opsommingstekens, links, hoofdletters en leestekens;
- `descriptionPlain` mag afgeleid zijn zonder `descriptionOriginal` te veranderen;
- open en afgerond worden correct gemapt;
- deadline met Amsterdamse tijdzone en DST wordt correct UTC;
- bronhash is deterministisch;
- bestanden en links worden correct onderscheiden.

Service-/integratietests:

- bestaande handmatige taken blijven bestaan;
- bestaande bron-ID wordt overgeslagen;
- tweede en gelijktijdige import maakt geen duplicaat;
- batch- en itemaantallen kloppen;
- taak plus bijlagen worden atomair geregistreerd;
- databasefout rolt records terug en ruimt nieuwe blobs zo goed mogelijk op;
- andere gebruiker kan importrecords en bestanden niet lezen.

Route-tests:

- geen sessie wordt geweigerd;
- ongeldige Origin wordt geweigerd;
- ontbrekende expliciete bevestiging wordt geweigerd;
- Microsoft-configuratie- en Graph-fouten krijgen veilige foutcodes.

Handmatig vóór import:

- desktop en mobiel tonen preview en bevestiging leesbaar;
- productie-login werkt;
- preview toont geloofwaardige aantallen voor lijsten, taken, bestanden en links;
- er wordt nog niets aangemaakt door alleen preview te openen.

Verplichte gates:

```text
npm run lint
npm run typecheck
npm run test
npm run build
```

## 9. Acceptatiecriteria

- Alle gekozen To Do-lijsten zijn alle beschikbare lijsten.
- Open en afgeronde To Do-taken worden meegenomen.
- Eén To Do-taak levert maximaal één hoofdtaak op.
- Geen enkele import maakt automatisch subtaken.
- Titel en `descriptionOriginal` zijn exact gelijk aan de bron.
- Deadline vertegenwoordigt hetzelfde tijdstip als in To Do.
- Bestaande MijnPlanning-taken blijven behouden.
- Een tweede import maakt geen stille duplicaten.
- Documenten staan privé en links blijven als herkenbare read-only verwijzing beschikbaar.
- Iedere uitvoering heeft een controleerbare batch en itemhistorie.
- Preview en deploy wijzigen geen To Do-gegevens.
- De productie-import start pas na expliciete bevestiging op de productiepreview.

## 10. Risico’s

- Microsoft Graph kan grote of bijzondere bijlagen anders leveren dan `$expand`; dit moet met de echte preview worden gecontroleerd.
- Een verkeerde Graph-tijdzoneconversie kan deadlines verschuiven.
- Vercel-functielimieten kunnen een zeer grote import afbreken; aantallen uit preview bepalen of batching nodig is.
- Blobupload en databasetransactie zijn niet één transactioneel systeem; compensatieverwijdering blijft best effort.
- De actieve takenprototype-UI toont nog lokale voorbeeldstate en kan geïmporteerde databasegegevens niet vanzelf volledig visualiseren.
- Productie-import is operationeel gevoelig; resultaatcontrole en batchmetadata zijn daarom verplicht.

## 11. Terugrolmogelijkheid

- Code: revert van de importcommit en een nieuwe normale deployment; geen force push.
- Schema: de additieve tabellen en indexen blijven staan bij code-terugrol en beschadigen bestaande taken niet.
- Mislukte import: transactionele taakwrites rollen terug; nieuwe blobs worden best effort verwijderd; batchstatus wordt `FAILED`.
- Geslaagde import: geen automatische verwijdering. Een eventuele terugrol van geïmporteerde taken gebeurt uitsluitend na afzonderlijke expliciete toestemming, op basis van één batch en de opgeslagen `targetTaskId`-waarden, met voorafgaande telling en herstelplan.
- Microsoft To Do blijft gedurende alle scenario’s ongewijzigd en is de herstelbron tot Peter de import heeft gecontroleerd.

## 12. Open beslissingen en goedkeuring

Besloten door Peter op 10 augustus 2026:

- alle To Do-lijsten importeren;
- open én afgeronde taken importeren;
- alles wordt hoofdtaak;
- eerste echte uitvoering vindt op productie plaats;
- bestaande MijnPlanning-taken blijven behouden.

Nog vereist:

- na succesvolle deployment een afzonderlijke bevestiging vóór de daadwerkelijke productie-import.

## 13. Voortgang

- [x] Bestaande importcode, documentatie, GitHub-remote en Vercel-koppeling geïnventariseerd.
- [x] Destructief vervangen van bestaande taken uit de service en route verwijderd.
- [x] Gerichte regressietest toegevoegd: bestaand bronitem wordt overgeslagen, onbekend item wordt toegevoegd.
- [x] Read-only vastgesteld dat de additieve importmigratie nog niet op de gekoppelde Neon-database staat.
- [x] Importomvang door Peter vastgesteld.
- [x] Uitvoeringsplan opgesteld.
- [x] Plan expliciet goedgekeurd.
- [x] Importservice en databaseconstraints afgerond.
- [x] Previewbevestiging en resultaatweergave afgerond.
- [x] Private Vercel Blob-store aangemaakt en aan Development, Preview en Production gekoppeld.
- [x] Alle kwaliteitscontroles groen: lint, typecheck, tests en productiebuild.
- [x] Migratie gecontroleerd toegepast; Prisma bevestigt dat alle zes migraties actueel zijn.
- [ ] Commit en push uitgevoerd.
- [ ] Vercel-deployment gecontroleerd.
- [ ] Productiepreview door Peter gecontroleerd.
- [ ] Eenmalige productie-import afzonderlijk bevestigd en uitgevoerd.