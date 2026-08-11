# Uitvoeringsplan - snelle taakopslag en handmatige bijlagen

Status: geimplementeerd en naar productie uitgerold. Alleen de ingelogde echte upload/downloadproef en de warme 20+20 prestatiemeting staan nog open.

## 1. Doel en gebruikersresultaat

Deze wijziging lost twee concrete problemen op:

1. Opslaan van een hoofdtaak of subtaak voelt traag doordat de huidige actie na de databasewrite de volledige Taken-route opnieuw opbouwt.
2. De paperclip voor een handmatige bijlage is nog prototypegedrag en slaat het gekozen bestand bewust niet op.

Na oplevering:

- reageert de interface binnen 100 ms zichtbaar op `Opslaan`;
- is de warme productiebevestiging voor een gewone hoofdtaak- of subtaakupdate p95 maximaal 500 ms onder normale netwerkcondities;
- veroorzaakt opslaan geen redirect en geen volledige board- en bijlagenreload;
- sluit de editor na succesvolle bevestiging en toont de opgeslagen waarden direct;
- blijft bij een fout de editor met invoer en foutmelding beschikbaar;
- kan Peter bij een bestaande hoofdtaak of subtaak een toegestaan bestand van maximaal 25 MB kiezen;
- uploadt de browser het bestand rechtstreeks naar Vercel Blob Private via een kortlevend, server-side geautoriseerd uploadtoken;
- wordt de bijlagemetadata user-scoped in PostgreSQL opgeslagen;
- verschijnt de bestandsnaam na bevestigde upload direct rechts naast de paperclip;
- kan de opgeslagen private bijlage alleen na een nieuwe sessie- en eigendomscontrole worden gedownload.

Buiten scope:

- uploaden bij een nog niet opgeslagen nieuwe taak of subtaak;
- meerdere bestanden in één selectie;
- documentpreview of inhoudsanalyse;
- OCR, virusscanning door een externe betaalde dienst of AI-analyse;
- links handmatig als bijlage toevoegen;
- wijziging van Microsoft To Do-importgedrag;
- automatische planning in hetzelfde kritieke opslagpad.

## 2. Huidige situatie en diagnose

### Taakopslag

De huidige browserflow wacht synchroon op:

1. origincontrole;
2. sessiequery in Neon;
3. Prisma-transactie en PostgreSQL advisory lock;
4. taak- of subtaakread;
5. bij een hoofdtaak een read van alle subtaken van de gebruiker, gevolgd door filtering in TypeScript;
6. updatewrite;
7. bij subtaken of taken met subtaken een extra subtakenread plus projectie-update;
8. `revalidatePath('/taken')`;
9. `redirect('/taken?...')`;
10. een tweede sessiequery tijdens de nieuwe pagina-opbouw;
11. parallelle volledige reads van alle taken, subtaken, dependencies en bijlagen;
12. Server Component-render en clientreconciliatie.

Microsoft Graph staat niet meer in dit kritieke pad. De resterende vertraging komt hoofdzakelijk door de redirect/full reload en daarnaast door brede, herhaalde databasequeries.

### Bijlagen

De volgende basis bestaat al:

- Prisma-model en tabel `TaskAttachment`;
- constraints voor precies één doel en precies één opslaglocatie;
- private Blob-adapter met maximum 25 MB;
- blokkering van risicovolle uitvoerbare extensies;
- bestandsnaamopschoning;
- user-scoped repositoryqueries;
- boardmapping en UI-weergave van bestaande metadata;
- lokaal een geconfigureerde `BLOB_READ_WRITE_TOKEN`-sleutel;
- package `@vercel/blob` 2.7.0.

De handmatige upload werkt niet omdat `handleTaskAttachmentSelect()` en `handleSubtaskAttachmentSelect()` uitsluitend melden dat upload nog niet beschikbaar is, het inputveld leegmaken en geen route, Blob-upload of metadatawrite aanroepen. Een private opgeslagen Blob heeft bovendien nog geen geautoriseerde downloadroute.

## 3. Functionele interpretatie en prestatiecontract

### Opslaan

Een harde end-to-end garantie van 500 ms is op internet en serverless infrastructuur niet technisch afdwingbaar door browsernetwerk, Neon-resume en Vercel cold starts. Daarom wordt de eis controleerbaar opgesplitst:

- zichtbare reactie op klikken: maximaal 100 ms;
- warme productiebevestiging van een gewone update: p95 maximaal 500 ms, gemeten over minimaal 20 opeenvolgende updates;
- cold start of tijdelijk netwerkprobleem: duidelijke status `Opslaan...`; geen tweede submit; invoer blijft herstelbaar;
- succes: editor sluit en de lokale boardstate wordt met de serverrespons bijgewerkt;
- fout: editor blijft of wordt heropend met dezelfde invoer en een concrete melding;
- geen optimistische melding `Opgeslagen` voordat de databasewrite werkelijk is bevestigd.

Hoofdtaak en subtaak gebruiken hetzelfde contract.

### Handmatige bijlage

- Alleen een reeds opgeslagen taak of subtaak kan een bijlage ontvangen.
- Na kiezen verschijnt een compacte uploadstatus naast de paperclip.
- Na bevestigde Blob-upload en metadatawrite verandert die status in een klikbare bestandsnaam.
- De bijlage wordt niet onderdeel van het gewone taakformulier; een mislukte upload verandert de taakinhoud niet.
- Eén bestand per keuze, maximaal 25 MB.
- Lege bestanden en bestaande geblokkeerde uitvoerbare extensies worden geweigerd.
- MIME-type wordt niet blind vertrouwd; extensie, grootte en doel worden server-side opnieuw gecontroleerd.
- De UI toont geen private Blob-URL.
- Download verloopt via een user-scoped MijnPlanning-route.
- Hoofdtaak en subtaak krijgen hetzelfde uploadgedrag.

## 4. Te wijzigen of toe te voegen bestanden

### Opslagprestatie

- `app/taken/actions.ts`: save-actions laten een klein gestructureerd resultaat teruggeven; redirect en volledige revalidatie uit het kritieke pad verwijderen; veilige duurmeting zonder taakinhoud toevoegen.
- `app/taken/taken-visual-prototype.tsx`: lokale bevestigde boardstate en submitstatus beheren; serverresultaat gericht toepassen; dubbelklikken blokkeren; editor pas bij succes sluiten.
- `lib/tasks/service.ts`: mutaties een kleine actuele taak-/subtaakprojectie laten retourneren en brede reads uit updates verwijderen.
- `lib/tasks/repository.ts`: gerichte queries toevoegen voor subtaken van één taak, deadlineconflicten en resterende-minutenaggregatie.
- `lib/logging/logger.ts`: alleen indien nodig typeveilige prestatievelden ondersteunen; nooit titel, omschrijving of bestandsnaam loggen.

### Handmatige bijlagen

- `app/api/attachments/upload/route.ts`: Vercel Blob `handleUpload`-route voor kortlevende clienttokens en completioncallback; sessie, origin, doelautorisatie, uploadregels en idempotente metadataopslag.
- `app/api/attachments/finalize/route.ts`: idempotente browserbevestiging na Blob-succes, zodat de UI direct het database-id ontvangt.
- `app/api/attachments/[attachmentId]/download/route.ts`: geautoriseerde private download na user-scoped lookup.
- `lib/attachments/blob-storage.ts`: bestaande validatie herbruikbaar/exporteerbaar maken voor tokenuitgifte en private download; geen secret naar de browser.
- `lib/attachments/service.ts`: doel-eigenaarschap, idempotente completion/finalisatie en user-scoped downloadmetadata toevoegen.
- `lib/attachments/repository.ts`: gerichte find/upsert-query op gebruiker en unieke Blob-identiteit toevoegen.
- `app/taken/taken-visual-prototype.tsx`: prototypehandlers vervangen door echte clientupload, voortgang/foutstatus en bestandsnaam rechts naast de paperclip.
- `app/taken/taken-visual-prototype.module.css`: compacte uploadstatus en bestandsknop binnen bestaande goedgekeurde stijl.

### Tests en documentatie

- `tests/task-actions.test.ts` of een nieuwe gerichte actiontest: geen redirect/revalidate en compact succesresultaat.
- `tests/tasks-service.integration.test.ts`: gerichte mutatie en projectie blijven correct.
- `tests/attachments-validation.test.ts`: grootte, lege bestanden, extensies, bestandsnaam en doelcontract.
- `tests/attachments-service.integration.test.ts`: eigenaarschap, idempotente metadata en taak/subtaakkoppeling in een geisoleerde testdatabase.
- `tests/e2e/task-save-and-attachments.spec.ts`: ingelogde save- en uploadflow zodra een veilige testfixture beschikbaar is.
- `docs/ARCHITECTURE.md`, `docs/PRODUCT_RULES.md`, `docs/SECURITY.md`, `docs/DESIGN_SYSTEM.md` en `docs/DECISIONS.md`: definitieve respons-, upload- en downloadregels vastleggen.
- dit plan: voortgang, meetresultaten en afwijkingen bijhouden.

## 5. Datamodel en migraties

De bestaande tabel en constraints zijn voldoende. Er is naar verwachting geen schemamigratie nodig.

`TaskAttachment.sourceExternalId` wordt voor handmatige uploads gevuld met een stabiele, niet-geheime Blob-identiteit, bijvoorbeeld de pathname. De bestaande unieke index `(userId, sourceExternalId)` maakt callbacks en retries idempotent.

Voor implementatie wordt read-only gecontroleerd dat:

- de bijlagemigratie op productie is toegepast;
- de exactly-one-target- en exactly-one-location-constraints bestaan;
- de unieke index voor idempotentie bestaat.

Als die controle een afwijking vindt, stopt de uitvoering en wordt eerst een aanvullend migratievoorstel voorgelegd.

## 6. Beveiliging en privacy

- Uploadtokenuitgifte vereist een geldige MijnPlanning-sessie.
- De browser bepaalt nooit de `userId`.
- De server controleert dat de gekozen taak of subtaak van de ingelogde gebruiker is.
- De token bevat alleen minimale ondertekende doelmetadata; geen titel, omschrijving, e-mail, sessietoken of secret.
- Origincontrole geldt bij browsergestuurde tokenuitgifte en metadatafinalisatie.
- De Vercel completioncallback wordt via de Blob-SDK gevalideerd en verwerkt idempotent.
- Toegestane pathnameprefix bevat een ontsmette gebruikers- en doelidentiteit en een willekeurige suffix.
- Bestandsnaam, grootte, extensie en contenttype worden server-side gevalideerd.
- Private Blob-URL's en tijdelijke downloadgegevens worden niet gelogd of in permanente clientstate opgeslagen.
- Download vereist bij ieder verzoek opnieuw sessie en eigendom.
- Bij Blob-succes maar metadatafout wordt de Blob opgeruimd of door een expliciete herstelactie gemarkeerd; geen stille orphan.
- Bij metadata-succes maar ontbrekende Blob wordt geen kapotte bijlage als succesvol getoond.
- Uploadroute krijgt een passende request-rate-limit zonder bestandinhoud of naam in de sleutel/logs.
- `BLOB_READ_WRITE_TOKEN` blijft uitsluitend server-side en wordt niet gewijzigd of gelogd.

## 7. Implementatiestappen

1. Voeg gerichte, inhoudsvrije timinginstrumentatie toe rond sessie, domeinmutatie en totale action; meet eerst de bestaande lokale/warm-productieflow.
2. Voeg repositoryqueries toe die uitsluitend de gekozen taak of subtaken van die taak lezen en aggregaties in PostgreSQL uitvoeren.
3. Laat taak- en subtaakmutaties een compacte bevestigde projectie retourneren.
4. Verwijder `redirect` en `revalidatePath` uit alleen de twee save-actions; overige archive/dependencyflows blijven buiten deze wijziging.
5. Maak de Taken-clientstate gericht bijwerkbaar, voeg `Opslaan...` toe en voorkom dubbele submits.
6. Meet minimaal twintig warme updates voor hoofdtaak en subtaak en rapporteer p50, p95 en maximum zonder gebruikersinhoud te loggen.
7. Maak bestandsvalidatie gedeeld tussen Blob-opslag en tokenuitgifte.
8. Implementeer de geautoriseerde client-uploadroute met private toegang, minimale tokenpayload en idempotente completion.
9. Implementeer de user-scoped private downloadroute.
10. Vervang beide prototype-selecthandlers door echte upload met voortgang, foutmelding en lokale bevestigde toevoeging naast de paperclip.
11. Voeg unit-, integratie-, autorisatie- en browsertests toe.
12. Controleer desktop en mobiel op layout, lange bestandsnamen, uploadstatus, foutstatus en toetsenbordbediening.
13. Werk documentatie en besluitlog bij.
14. Voer alle kwaliteitspoorten uit, deploy naar productie en voer een echte gecontroleerde upload/downloadtest uit met een onschadelijk klein testdocument; verwijder dat testdocument daarna via de normale applicatieroute zodra verwijderen in scope is, of gebruik een expliciet gemarkeerde tijdelijke testbijlage en rapporteer die.

## 8. Tests

### Unit

- lege upload wordt geweigerd;
- bestand groter dan 25 MB wordt geweigerd;
- geblokkeerde extensies worden geweigerd;
- toegestane PDF, Word-, Excel- en afbeeldingstypen worden geaccepteerd;
- bestandsnaam wordt veilig ontsmet maar herkenbaar getoond;
- precies één target is verplicht;
- save-action geeft compact succes of fout terug en redirect niet;
- clientstate past alleen het bevestigde record aan.

### Integratie

- hoofdtaakupdate bewaart alle productregels en retourneert actuele waarden;
- subtaakupdate herberekent resterende hoofdtaakminuten;
- een andere gebruiker kan geen uploadtoken voor de taak krijgen;
- callback/finalisatie met dezelfde Blob-identiteit maakt geen duplicaat;
- metadata koppelt aan precies de bedoelde taak of subtaak;
- private download door eigenaar slaagt;
- private download zonder sessie of door andere gebruiker wordt geweigerd;
- Blob- of metadatafout wordt zichtbaar afgehandeld.

Database-integratietests draaien uitsluitend tegen een aantoonbaar geisoleerde testdatabase, nooit tegen productie.

### Prestatie

- browserfeedback begint binnen 100 ms;
- minimaal 20 warme hoofdtaakupdates en 20 warme subtaakupdates;
- p50, p95 en maximum worden apart gerapporteerd;
- acceptatiedoel voor normale warme productie: p95 maximaal 500 ms van submit tot databasebevestiging;
- test bevestigt dat geen volledige route-redirect of boardreload plaatsvindt;
- cold-startresultaat wordt apart gerapporteerd en niet verborgen in het warme gemiddelde.

### Browser en mobiel

- editor sluit na bevestigde save;
- bij fout blijft invoer beschikbaar;
- dubbelklikken maakt geen dubbele mutatie;
- gekozen bestand toont eerst uploadstatus en daarna naam rechts naast de paperclip;
- lange naam breekt of verkort zonder knoppen te overlappen;
- refresh behoudt de bijlage uit PostgreSQL;
- klikken downloadt alleen met geldige sessie;
- desktop en Samsung-formaat hebben geen overflow.

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

- Binnen 100 ms na klikken is zichtbaar dat MijnPlanning opslaat.
- Bij een normale warme productieverbinding is p95 van een gewone hoofdtaak- en subtaakupdate maximaal 500 ms over minimaal twintig metingen per type.
- Opslaan voert geen `redirect('/taken')`, geen `revalidatePath('/taken')` en geen volledige boardreload uit.
- De server bevestigt de databasewrite voordat `Opgeslagen` wordt getoond.
- Een fout sluit het formulier niet en verliest de invoer niet.
- Een toegestane PDF of Office-document van maximaal 25 MB wordt privé opgeslagen.
- De bestandsnaam verschijnt na bevestiging rechts naast de paperclip en blijft na verversen bestaan.
- Alleen Peter kan de bijlage via MijnPlanning downloaden.
- Een uitvoerbaar, leeg of te groot bestand wordt met een duidelijke melding geweigerd.
- Dezelfde completionretry maakt geen dubbele metadatarecord.
- Er worden geen secrets, private Blob-URL's of documentinhoud gelogd.

## 10. Risico's en terugval

- Een harde 500 ms-grens blijft onmogelijk te garanderen bij cold starts, Neon-resume of slecht clientnetwerk. De UI blijft daarom onmiddellijk reageren en toont eerlijke voortgang.
- Lokale optimalisatie zonder productiemeting kan misleidend zijn; de definitieve beoordeling gebruikt productieachtige warme metingen.
- Clientupload is direct naar Blob en vereist correcte tokenautorisatie; een fout daar kan ongeautoriseerde opslag mogelijk maken. Daarom wordt doel-eigenaarschap vóór tokenuitgifte getest.
- De Blob completioncallback kan later arriveren of opnieuw worden aangeboden; idempotentie is verplicht.
- Lokale development ontvangt zonder tunnel niet vanzelf de Vercel completioncallback. Tests mocken die grens en productie krijgt een echte gecontroleerde verificatie.
- Een upload kan slagen terwijl metadataopslag faalt. Compensatie/opruiming voorkomt of rapporteert orphaned Blobs.
- De huidige `BLOB_READ_WRITE_TOKEN` is lokaal aanwezig, maar productieconfiguratie moet read-only worden bevestigd voordat deployment functioneel wordt vrijgegeven.

Terugval:

- De saveflow kan per commit worden teruggezet naar redirect/revalidatie zonder datamodelwijziging.
- De uploadroute kan worden uitgeschakeld zonder bestaande bijlagen te verwijderen.
- Bestaande geïmporteerde bijlagen en metadata blijven ongewijzigd.
- Geen databasekolom wordt verwijderd of herschreven.

## 11. Open beslissingen

Er is één technische interpretatie die Peter met goedkeuring van dit plan bevestigt:

- `binnen 0,5 seconde` betekent een onmiddellijke zichtbare reactie binnen 100 ms en voor normale warme productie een meetbaar p95-doel van maximaal 500 ms tot echte databasebevestiging. Cold starts en netwerkstoringen krijgen een zichtbare voortgangsstatus en worden apart gerapporteerd; er wordt geen onware succesmelding getoond.

Alle overige functionele keuzes volgen al uit bestaande product-, beveiligings- en ontwerpregels.

## 12. Voortgang

- [x] Actieve branch en schone werkmap gecontroleerd.
- [x] Verplichte product-, architectuur-, data-, ontwerp-, beveiligings- en besluitdocumentatie gelezen.
- [x] Kritieke opslagpad en brede query-/reloadlast geinventariseerd.
- [x] Bestaande bijlagenbasis en ontbrekende handmatige uploadflow geinventariseerd.
- [x] Officiele Vercel Blob-clientuploadmethode en requestlimiet gecontroleerd.
- [x] Lokale aanwezigheid van de Blob-tokenconfiguratiesleutel bevestigd zonder secretwaarde te lezen.
- [x] Uitvoeringsplan opgesteld.
- [x] Expliciete goedkeuring van Peter ontvangen.
- [x] Redirect en route-revalidatie uit beide gewone save-actions verwijderd.
- [x] Gerichte hoofdtaakquery en redirectvrije clientbevestiging geimplementeerd.
- [x] Private upload-, finalize- en downloadroutes geimplementeerd.
- [x] Bestandsnaam en uploadstatus naast de paperclip gekoppeld.
- [x] Implementatie volledig afgerond.
- [x] Uploadvalidatie-, lint-, typecheck-, unit-, build- en bestaande desktop/mobiele browsercontroles uitgevoerd.
- [x] Productie-aanwezigheid van `BLOB_READ_WRITE_TOKEN` bevestigd zonder de secretwaarde te lezen.
- [ ] Warme productieprestatie over twintig hoofdtaak- en twintig subtaakupdates gemeten.
- [x] Productiedeployment, publieke healthcheck en weigering van private download zonder sessie gecontroleerd.
- [x] Productie-uploaddefect herleid tot geblokkeerde Blob-verbinding in CSP en lokaal hersteld.
- [x] Uploadstatus verplaatst naar direct rechts van de bijbehorende paperclip.
- [x] Vercel Functions van `iad1` naar `fra1` verplaatst om aan te sluiten op Neon `eu-central-1`.
- [ ] Echte upload/download met Peters ingelogde productiesessie gecontroleerd.
