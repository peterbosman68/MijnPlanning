# Uitvoeringsplan — volledige MijnPlanning-implementatie

- Status: **concept; nog geen code gewijzigd**
- Datum: **10 augustus 2026**
- Scope: **volledige productimplementatie van kernapp, gegevenslagen, integraties, bijlagen, planningsmotor en UI-afwerking**

Dit plan beschrijft de route om MijnPlanning van de huidige basis uit te bouwen naar het volledige product zoals vastgelegd in `docs/PRODUCT_PLAN.md`, `docs/PRODUCT_RULES.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/DESIGN_SYSTEM.md`, `docs/SECURITY.md` en `docs/DECISIONS.md`.

Goedkeuring van dit plan geeft nog geen toestemming voor destructieve migraties, betaalde infrastructuur, nieuwe externe diensten of afwijking van de vastgelegde productregels.

## 1. Doel en gebruikersresultaat

Na uitvoering van dit plan kan Peter MijnPlanning gebruiken als dagelijkse, persoonlijke planningsassistent met:

- eigen login en veilige sessies;
- taken en subtaken met deadlines, afhankelijkheden en tijdsinschattingen;
- gezamenlijke planning van open taken en subtaken;
- Outlook-agenda als geblokkeerde tijd;
- eenmalige Microsoft To Do-import met behoud van titel, deadline, notitie, links en documenten;
- bestanden en bijlagen op zowel hoofdtaak- als subtaakniveau;
- inboxvoorstellen uit To Do en e-mail;
- ochtendbrief en waarschuwingen voor deadlinegevaar;
- een rustige, volwassen UI op desktop en mobiel.

Buiten scope van dit plan vallen WhatsApp Business, een aparte transcriptie-app en niet-vastgelegde productuitbreidingen.

## 2. Huidige situatie

- De app heeft al een werkende Next.js 16 / React 19 / TypeScript 5 basis.
- De eigen single-user-login bestaat al, inclusief sessiebeheer en wachtwoordherstel.
- De takenweergave op `/taken` draait nog grotendeels op prototype-state, terwijl de server-side takenlaag en Prisma-tabellen al bestaan.
- Outlook-afspraken worden al live uit Microsoft Graph opgehaald en in de UI getoond.
- De eenmalige To Do-import bestaat al als backend-voorbereiding en tijdelijke preview-route, maar nog niet als volledige importflow met bijlagen.
- Er bestaat al documentatie voor taken, subtaken, beveiliging, data en architectuur; deze vormen de functionele bron van waarheid.
- Bijlagen zijn al conceptueel vastgelegd als first-class onderdeel voor taken en subtaken, maar niet volledig in code uitgewerkt.

## 3. Functionele interpretatie

### 3.1 Kerngedrag

MijnPlanning moet altijd antwoord geven op vier vragen:

1. Wat moet ik nu doen?
2. Wat moet daarna gebeuren?
3. Hoeveel werktijd is werkelijk beschikbaar?
4. Welke deadline komt in gevaar als niets verandert?

Daarvoor moet de app taken, subtaken, deadlines, afhankelijkheden, Outlook-afspraken, werkelijke werktijd, tijdsinschattingen en bijlagen combineren.

### 3.2 Taken en subtaken

- Een taak is de hoofdtaak en kan een eigen deadline hebben.
- Een taak kan nul, één of meerdere subtaken hebben.
- Een taak zonder subtaken kan zelf uitvoerbaar zijn.
- Zodra subtaken bestaan, wordt de hoofdtaak niet dubbel ingepland.
- Een subtaak heeft altijd een deadline en kan afhankelijk zijn van andere subtaken.
- Wanneer een taakdeadline bestaat, mag een subtaakdeadline daar niet overheen gaan.
- Een taakdeadline mag niet stilzwijgend worden vervroegd als daarmee bestaande subtaken ongeldig zouden worden.

### 3.3 Bijlagen

- Hoofdtaken en subtaken krijgen dezelfde bijlagenbasis.
- Een bijlage kan een echt bestand zijn of een externe link.
- De UI toont een paperclip zodra een taak of subtaak één of meer bijlagen heeft.
- Echte bestanden worden server-side opgeslagen in private blobopslag.
- Links worden als metadata bewaard en getoond.

### 3.4 Microsoft To Do-import

- Microsoft To Do wordt uitsluitend gebruikt voor een eenmalige import.
- De import kopieert titel, vervaldatum, notitie, links en documenten naar MijnPlanning.
- De originele To Do-items blijven in To Do staan.
- Er is geen blijvende synchronisatie, geen delta-sync, geen webhook en geen terugschrijven.
- De import moet duplicaten kunnen voorkomen via bron-ID’s en hashes.

### 3.5 Outlook

- Outlook-agenda wordt eerst alleen gelezen.
- Afgesloten of vrije blokken tellen niet mee als geblokkeerde tijd.
- Herhalende afspraken moeten als concrete voorkomens worden meegenomen.
- De afsprakenlijst moet altijd chronologisch worden getoond op datum en tijd.

### 3.6 Inbox en e-mail

- De inbox bevat voorstellen uit To Do-import, e-mail en handmatige invoer.
- Outlook-e-mail mag worden samengevat en geanalyseerd, maar niet automatisch worden verzonden of massaal worden gekopieerd.

## 4. Bestanden

Verwachte bestanden die worden toegevoegd of uitgebreid:

- `prisma/schema.prisma` — datamodel voor attachments, import batches en koppelingen.
- `prisma/migrations/*` — additieve migraties voor bijlagen, importmetadata, indexen en constraints.
- `lib/attachments/*` — upload, validatie, metadata, kopieerlogica en autorisatie.
- `lib/microsoft/todo-import.ts` — import van taken, notities, links en documenten.
- `lib/microsoft/outlook-calendar.ts` — chronologische agenda-ophaling en filtering.
- `lib/tasks/*` — domeinlogica voor taken, subtaken, deadlines, bijlagen en importkoppelingen.
- `app/taken/*` — UI voor taken, subtaken, attachments en importactiepunten.
- `app/inbox/*` — inboxoverzicht voor To Do-, e-mail- en handmatige voorstellen.
- `app/ochtendbrief/*` — dagoverzicht met planning, waarschuwingen en samenvattingen.
- `app/api/*` — import-, upload-, download-, Outlook- en e-mailroutes.
- `docs/*` — bijwerken van productplan, regels, architectuur, datamodel, beveiliging en besluiten.
- `tests/*` — unit-, integratie-, e2e- en beveiligingstests.

## 5. Datamodel en migraties

### 5.1 Nieuwe of uitgebreide modellen

Het plan gebruikt in elk geval de volgende concepten:

- `Task` — hoofdtaak, met optioneel attachment count en broninformatie.
- `Subtask` — subtaak, met optioneel attachment count.
- `TaskAttachment` — bestand of link, gekoppeld aan precies één taak of subtaak.
- `MicrosoftConnection` — koppeling en tokencache.
- `CalendarEvent` — gesynchroniseerde Outlook-gebeurtenis of cache voor weergave.
- `TodoImportBatch` — batch voor éénmalige import.
- `TodoImportItem` — per geïmporteerde To Do-taak een controleerbaar item.
- `EmailMessage` en `EmailActionProposal` — samenvattingen en voorstellen uit e-mail.

### 5.2 Bijlagenmodel

- Een attachment hangt aan precies één `Task` of `Subtask`.
- Metadata bevat minimaal bestandsnaam, bron, grootte of link, en een bron-ID voor deduplicatie.
- Echte bestanden krijgen een private blobverwijzing.
- Linkbijlagen bewaren alleen veilige metadata; ze worden niet automatisch uitgevoerd.

### 5.3 Migratiestrategie

1. Voeg alleen additieve kolommen en tabellen toe.
2. Houd bestaande task- en subtaskgegevens intact.
3. Voeg indexen toe voor eigenaarschap, deadlines en attachment-deduplicatie.
4. Voeg constraints toe voor deadlinehiërarchie en eigenaarschap.
5. Gebruik transactionele migraties voor import- en bijlagekoppelingen.

### 5.4 Terugrolmogelijkheid

- Migraties blijven additief.
- Bij regressie kan de nieuwe applicatielaag worden teruggedraaid zonder data te wissen.
- Indien een migratie onjuist blijkt, wordt eerst een voorwaartse herstelmigratie gemaakt in plaats van destructief terugzetten.

## 6. Beveiliging en privacy

- Authenticatie blijft los van Microsoft.
- Tokens van Microsoft worden alleen server-side opgeslagen en versleuteld.
- Bestanden gaan naar private blobopslag; geen publieke voorspelbare URL’s.
- Linkbijlagen worden gevalideerd en als metadata behandeld.
- Er wordt niet standaard een volledige mailbox of volledige To Do-inhoud gekopieerd; alleen noodzakelijke inhoud voor planning en opvolging.
- Logs mogen geen tokens, secrets, volledige documenten of volledige vertrouwelijke body’s bevatten.
- Iedere route valideert eigenaarschap en autorisatie server-side.
- Uploads moeten bestandstype, grootte en bron controleren voordat ze worden opgeslagen.

## 7. Implementatiestappen

### Stap 1 — datamodel voor taken, subtaken en bijlagen

- Maak `TaskAttachment` en de noodzakelijke relatievelden definitief.
- Voeg attachment counts of equivalente afleidingen toe waar dat functioneel nuttig is.
- Test: schema-validatie, relationele integriteit en deleteblokkades.

### Stap 2 — attachments-domein en opslaglaag

- Bouw upload-, kopieer-, download- en metadata-services.
- Ondersteun zowel echte bestanden als linkbijlagen.
- Test: autorisatie, bestandstype, grootte, deduplicatie en private toegang.

### Stap 3 — To Do-import uitbreiden

- Breid import uit met notities, links en documenten.
- Koppel geïmporteerde content aan een hoofdtaak of, waar relevant, subtaak.
- Bewaar importmetadata om dubbele import te voorkomen.
- Test: één batch, herimport, bron-ID-deduplicatie en bijlagenkopie.

### Stap 4 — taken- en subtaken-UI

- Voeg paperclipindicatoren toe.
- Toon bijlagen in hoofdtaak- en subtaakdetail.
- Voeg upload- en verwijderacties toe met bevestiging.
- Test: desktop, mobiel, keyboard en foutmeldingen.

### Stap 5 — Outlook en afspraken

- Zorg dat afspraken strikt chronologisch worden gesorteerd.
- Blijf alleen-lezen werken voor kalenderdata.
- Test: meerdere dagen, tijdsgrenzen, terugkerende afspraken en pagination.

### Stap 6 — inbox, ochtendbrief en samenvattingen

- Voeg voorstellen uit To Do en e-mail samen in één inbox.
- Toon samenvattingen en acties zonder automatische uitvoering.
- Test: filters, lege toestanden en bronherkomst.

### Stap 7 — planningsmotor en risicoanalyse

- Koppel taken, subtaken, deadlines, beschikbaarheid en afhankelijkheden aan een controleerbare planningslaag.
- Laat tijd en deadlines leiden door domeinlogica, niet door de UI.
- Test: deadlinegevaar, afhankelijkheden, beschikbare tijd, niet-opsplitsbaar werk en herplanning.

### Stap 8 — afronding en hardening

- Werk documentatie, besluitregistratie en regressietests bij.
- Voer volledige kwaliteitscontroles uit.
- Registreer open risico’s en restpunten.

## 8. Tests

Minimaal te testen:

1. subtaakdeadline na taakdeadline wordt geweigerd;
2. vervroegen van een taakdeadline kan geen ongeldige subtaken stilzwijgend corrigeren;
3. taken en subtaken worden gezamenlijk gepland;
4. geblokkeerde subtaken worden niet te vroeg ingepland;
5. niet-opsplitsbaar werk past alleen in een voldoende groot blok;
6. Outlook-afspraak vermindert beschikbare tijd;
7. taak met subtaken wordt niet dubbel ingepland;
8. taak zonder subtaken kan uitvoerbaar zijn;
9. optimale of te korte gebruikerskeuze toont een risicowaarschuwing;
10. To Do-notitie blijft exact behouden;
11. To Do-import maakt geen automatische subtaken;
12. een tweede import maakt geen stille duplicaten;
13. To Do-bijlagen worden gekopieerd of als veilige linkmetadata opgeslagen;
14. alleen geautoriseerde gebruiker kan bestanden en taken lezen;
15. tokens en secrets komen niet in clientbundels of logs;
16. upload, preview, import en download werken op desktop en mobiel;
17. lint, typecheck, unit tests, integratietests, build en e2e slagen.

## 9. Acceptatiecriteria

Het plan is pas echt geslaagd wanneer:

- Peter hoofd- en subtaken met bijlagen kan beheren;
- een To Do-import een volledige kopie maakt, inclusief documenten en links;
- echte bijlagen privé zijn opgeslagen en veilig opvraagbaar blijven;
- de afspraakvolgorde altijd chronologisch klopt;
- de UI op desktop en mobiel rustig, leesbaar en bruikbaar blijft;
- alle relevante tests groen zijn;
- documentatie en besluiten zijn bijgewerkt;
- er geen onbedoelde secrets, logs of publieke bestandspaden bestaan.

## 10. Risico’s

- **Datamigratie:** nieuwe attachmenttabellen en importmetadata kunnen bestaande data raken als relaties onjuist worden gemodelleerd.
- **Bestandsopslag:** echte bijlagen vragen een veilige private opslag- en downloadflow.
- **Duplicatie:** To Do-bijlagen en herimports kunnen dubbele records veroorzaken zonder goede bron-ID-deduplicatie.
- **Prestatie:** imports van veel To Do-items of bijlagen kunnen traag worden zonder batch- en paginationbeleid.
- **Privacy:** bestandsnamen, notities en links mogen niet onbedoeld in logs of publieke URL’s belanden.
- **UI-complexiteit:** paperclip, upload- en importacties mogen de rust van het ontwerp niet ondermijnen.

Terugvaloptie: bij problemen worden nieuwe attachment- of importstappen tijdelijk uitgeschakeld terwijl bestaande taken, subtaken en Outlook-functies blijven werken.

## 11. Open beslissingen

Deze punten moeten Peter nog expliciet bevestigen voordat implementatie begint:

1. Of alle To Do-bijlagen altijd als echte kopie moeten worden opgeslagen wanneer technisch mogelijk.
2. Of linkbijlagen alleen metadata moeten zijn of ook als klikbare externe bron mogen worden geopend.
3. Of bijlagen direct op zowel hoofdtaak als subtaak in het detailpaneel moeten verschijnen of eerst alleen in een aparte bijlagensectie.
4. Of de import van To Do één grote batch blijft of in deelstappen moet worden opgesplitst bij zeer grote lijsten.
5. Of de huidige Taken- en Afspraken-UI de eerste plek is voor uploadacties, of dat er eerst een apart bijlagenpaneel komt.

## 12. Voortgang tijdens uitvoering

Tijdens uitvoering wordt dit plan bijgehouden met:

- afgeronde stappen;
- gewijzigde bestanden;
- gevonden risico’s;
- genomen besluiten;
- testresultaten;
- eventuele scope-afwijkingen.

## 13. Goedkeuringsmoment

Het uitvoeringsplan is gereed.
Er is nog geen code gewijzigd.
Wacht op expliciete goedkeuring van Peter voordat de implementatie begint.