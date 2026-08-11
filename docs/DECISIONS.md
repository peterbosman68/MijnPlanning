# MijnPlanning — besluiten

Dit bestand is het logboek van definitieve keuzes.

Nieuwe besluiten worden onderaan toegevoegd met datum.

---

## 17 juli 2026

### Product

- De productnaam is MijnPlanning.
- De oude naam Spoorwerk wordt alleen gebruikt voor het oude prototype.
- MijnPlanning wordt een eigen maatwerkapp en geen volledige Power Apps-oplossing.
- De kern is een persoonlijke planningsmotor met tijdsinschatting en deadline-alarmen.

### Ontwikkelomgeving

- VS Code is de centrale ontwikkelomgeving.
- Codex is de primaire programmeeragent.
- GitHub wordt de bron van waarheid.
- Claude Code kan incidenteel worden gebruikt voor een visueel alternatief of onafhankelijke review.
- Meerdere agents werken niet tegelijk in dezelfde branch.

### Technische stack

- Node.js 24 LTS.
- Next.js 16 App Router.
- React 19.
- TypeScript 5.
- Tailwind CSS 3.
- PostgreSQL.
- Prisma 6.
- Vercel.
- Vercel Blob Private.
- Resend.
- Microsoft Graph.
- Verwisselbare AI-providerlaag.

### Login

- MijnPlanning krijgt een eenvoudige eigen single-user login.
- Microsoft wordt niet gebruikt als primaire login.
- Auth.js is niet noodzakelijk voor de MVP.
- Wachtwoorden worden gehasht met Argon2id.
- Sessies worden server-side beveiligd.

### Taken

- Een taak is de hoofdtaak.
- Een taak kan nul, één of meerdere subtaken hebben.
- Een taakdeadline is optioneel.
- Iedere subtaak heeft verplicht een deadline.
- Alleen wanneer een taakdeadline bestaat, mag een subtaakdeadline nooit later zijn dan de taakdeadline.
- Subtaken van verschillende taken worden gezamenlijk gepland.
- Afhankelijkheden mogen tussen verschillende hoofdtaken lopen.

### Microsoft To Do

- Microsoft To Do wordt uitsluitend gebruikt voor een eenmalige import.
- Na de import wordt Microsoft To Do niet meer gebruikt.
- Er komt geen blijvende To Do-synchronisatie.
- Er wordt niets teruggeschreven naar To Do.
- To Do-titels worden exact taaknamen.
- To Do-notities worden één op één omschrijvingen.
- Subtaken worden niet automatisch uit notities gemaakt.
- MijnPlanning wordt na de import de enige leidende takenomgeving.

### Microsoft

- Microsoft 365 Family blijft de Microsoft-basis.
- MijnPlanning wordt later gekoppeld aan het persoonlijke Microsoft-account.
- Outlook-agenda wordt eerst alleen gelezen.
- Outlook-e-mail komt na de kernplanning.
- Schrijfrechten worden pas later toegevoegd.

### AI

- AI adviseert; de gebruiker beslist.
- AI mag doorvragen wanneer een taak onvoldoende duidelijk is.
- MijnPlanning leert van actieve werktijd en plangedrag.
- Pauzes, onderbrekingen en externe wachttijd tellen niet mee als persoonlijke uitvoersnelheid.
- Bij een optimistische gebruikersinschatting toont MijnPlanning een tweede risicoscenario.

### Communicatie

- Inhoudelijke e-mails worden nooit automatisch verzonden.
- Antwoordconcepten worden eerst aan de gebruiker getoond.

### Bestanden

- Bestanden worden privé opgeslagen in Vercel Blob.
- PostgreSQL bewaart alleen metadata.
- Grote of gevoelige bestanden worden niet openbaar toegankelijk.

### Scope

- WhatsApp Business valt buiten de eerste versie.
- WhatsApp wordt pas onderzocht nadat de kernapplicatie klaar, getest en stabiel is.
- Een aparte gespreks- of transcriptieverwerkingsapp valt buiten dit project.

### Documentatie

- Markdown-documentatie in de repository is leidend.
- Word-documenten zijn alleen leesbare momentopnamen.
- `AGENTS.md` bevat de vaste instructies voor Codex.
- Grote fasen krijgen eerst een uitvoeringsplan in `plans/`.

---

## 17 juli 2026 — besluiten fase 0 en fase 1

### O1 — GitHub-repository

- De bestaande repository is `https://github.com/peterbosman68/MijnPlanning`.
- De repository staat onder het persoonlijke GitHub-account `peterbosman68` en heet `MijnPlanning`.
- De repository is private.
- Er wordt geen nieuwe GitHub-repository aangemaakt.
- Bij de start van de implementatie wordt eerst gecontroleerd of de lokale projectmap al een Git-repository is.
- Als de lokale map nog geen Git-repository is, wordt Git pas na implementatiegoedkeuring in de bestaande map geïnitialiseerd en wordt de bestaande GitHub-repository als `origin` gekoppeld.
- Bestaande remote bestanden worden nooit overschreven voordat remote inhoud, lokale inhoud en Git-status zijn gecontroleerd.

### O2 — package manager en scaffold

- npm is de package manager.
- De applicatie krijgt een gecontroleerde scaffold in de bestaande projectmap.
- Versiemajors worden expliciet begrensd; een generator mag de gekozen stack niet stilzwijgend wijzigen.

### O3 — runtime en frameworkversies

- Node.js 24 LTS.
- Next.js 16 Active LTS met App Router.
- React 19.
- TypeScript 5.
- Tailwind CSS 3.
- Prisma 6.
- Binnen deze majors wordt steeds een actuele veilige versie gebruikt.
- Andere stackonderdelen blijven ongewijzigd.
- Node.js 24, Next.js 16, Prisma 6 en de gekozen actuele veilige patchversies vormen samen de eerste technische stop/go-test van fase 0.
- Bij incompatibiliteit wordt het resultaat eerst gerapporteerd en wordt om een nieuw besluit gevraagd; Prisma 7, Node.js 22 of een andere stackversie wordt niet stilzwijgend gekozen.

### O4 — loginvelden

- Alleen e-mailadres en wachtwoord zijn verplicht.
- Er is geen verplichte aparte gebruikersnaam.
- Een weergavenaam kan later optioneel worden toegevoegd.

### O5 — eerste gebruiker

- De eerste gebruiker wordt via een eenmalige server-only CLI aangemaakt.
- De CLI logt geen wachtwoord en geen wachtwoordhash.
- Voor deze bootstrapfunctie wordt geen publiek toegankelijke productieroute gemaakt.

### O6 — deadline en tijdzone

- Deadlines bevatten datum én tijd.
- Tijden worden getoond in `Europe/Amsterdam` en als UTC opgeslagen.
- Wanneer alleen een datum is gekozen, mag de interface 17.00 uur voorstellen.
- De voorgestelde tijd blijft aanpasbaar en wordt nooit stilzwijgend definitief gemaakt.

### O7 — omschrijvingen

- Een taak- of subtaakomschrijving mag leeg zijn.
- De titel blijft verplicht.
- `descriptionOriginal` blijft de ongewijzigde broninhoud en mag niet door afgeleide tekst worden overschreven.

### O8 — PostgreSQL-provider

- Managed PostgreSQL wordt geleverd door Neon Postgres via Vercel Marketplace.
- Er wordt begonnen met het gratis abonnement.
- Neon Free is geen open productbeslissing meer.
- Overschrijding van Free-limieten wordt als operationeel risico gerapporteerd en geeft geen toestemming voor een automatische upgrade.
- Een betaalde upgrade vereist vooraf expliciete toestemming.
- Een lokale PostgreSQL-installatie is niet nodig.

### O9 — password pepper

- De MVP gebruikt geen password pepper.
- Wachtwoorden worden gehasht met Argon2id en een goede unieke salt per wachtwoord.

### O10 — sessies

- De maximale absolute sessieduur is 30 dagen.
- De maximale inactiviteit is 7 dagen.
- Handmatig uitloggen trekt de actuele sessie in.
- Alle sessies kunnen gezamenlijk worden ingetrokken.

### O11 — browsermutaties

- Server Actions zijn de dunne transportlaag voor de eigen browserinterface.
- Bedrijfsregels blijven in domeinservices.
- Iedere Server Action voert opnieuw authenticatie, autorisatie en server-side invoervalidatie uit.

### O12 — validatie en tests

- Zod wordt gebruikt voor invoercontracten.
- Vitest wordt gebruikt voor unit- en integratietests.
- Playwright wordt gebruikt voor browsertests.

### O13 — integriteitsvalidatie

- Domeinservices verzorgen bedrijfsvalidatie en bruikbare foutmeldingen.
- PostgreSQL beschermt kritieke deadline-integriteit tegen ongeldige writes buiten de normale serviceflow.
- Het fase-1-uitvoeringsplan werkt deze databasebescherming concreet uit met versioned triggers die als integriteitsvangnet dienen.
- Cycluscontrole gebeurt transactioneel en voorkomt ook gelijktijdige write skew.
- Bedrijfslogica wordt niet onnodig gedupliceerd; per regel wordt gedocumenteerd welke laag leidend is en welke laag als integriteitsvangnet dient.

### O14 — infrastructuurvolgorde

- De oorspronkelijke volgorde was dat Vercel Preview pas na een lokaal geslaagde fase 0 werd ingericht. O27 verfijnt dit: de Git-providerkoppeling met het bestaande project mag eerder worden vastgelegd, maar functionele vrijgave en verdere infrastructuur blijven aan de relevante lokale controles gebonden.
- In fase 0 wordt alleen noodzakelijke configuratievoorbereiding voor latere infrastructuur opgenomen.
- Vercel Blob, uploads en bijlagen worden uitgesteld tot de daarvoor bestemde latere fase.

### O15 — opslaggedrag in de UI

- Formulieren voor taken en subtaken gebruiken een expliciete knop `Opslaan`.
- Timeracties, statuswijzigingen en verslepen mogen in een latere fase direct automatisch worden opgeslagen.
- Iedere latere automatische opslag toont een zichtbare bevestiging of foutmelding.

### O16 — archiveren en verwijderen

- Archiveren is de standaard in plaats van definitief verwijderen.
- Definitief verwijderen wordt geblokkeerd wanneer tijdregistraties, bijlagen, importhistorie of afhankelijkheden bestaan.
- Dependencies worden nooit stilzwijgend verwijderd en nooit automatisch gecascadeerd.

### O17 — taakduur

- Een taakduur mag bij de eerste invoer leeg zijn.
- Een taak zonder subtaken is pas planbaar nadat een tijdsinschatting is ingevuld of geaccepteerd.
- Een taak met subtaken krijgt geen extra hoofdtaakduur boven op de subtaken.

### O18 — statussen in fase 1

- Handmatig bedienbare fase-1-statussen zijn `OPEN`, `WAITING`, `COMPLETED`, `ARCHIVED` en `CANCELLED`.
- `BLOCKED` wordt afgeleid uit dependencies en is geen handmatig gekozen status.
- `ACTIVE`, `PAUSED` en `WAITING_EXTERNAL` worden pas in de tijdregistratiefase toegevoegd als bedienbare statussen.

### O19 — uitvoeringsplannen

- Alleen `PLANS.md` in de hoofdmap is de bron voor regels over uitvoeringsplannen.
- Alle verwijzingen naar regels voor uitvoeringsplannen wijzen naar top-level `PLANS.md`.

### O20 — verplichte visuele goedkeuring

- Na het opzetten van de technische projectbasis volgt vóór brede frontendimplementatie een verplicht visueel goedkeuringsmoment.
- Codex stelt eerst een concreet kleurenpalet met hexwaarden voor en legt typografie, spacing, knoppen, formulieren en statuslabels vast.
- Codex bouwt uitsluitend één werkende visuele versie van het scherm Taken en toont deze op desktop- en mobiel formaat.
- Overige volledige schermen en projectbrede toepassing van het ontwerp wachten op Peters expliciete goedkeuring.
- De uitstraling is rustig, volwassen, compact en betrouwbaar.
- Paarse gradients, een generiek AI-dashboard, grote lege vlakken, te veel afgeronde kaarten en te kleine grijze tekst worden vermeden.

## 19 juli 2026 — besluit O21

### O21 — subtaak toevoegen tijdens het werken

- Bij een open, actieve of wachtende hoofdtaak kan op ieder moment een subtaak worden toegevoegd.
- De actie `+ Subtaak` blijft zichtbaar in het detailpaneel zolang de hoofdtaak open, actief of wachtend is.
- Een actieve timer loopt door terwijl de gebruiker een subtaak toevoegt.
- Titel en deadline zijn verplicht voor de nieuwe subtaak.

## 10 augustus 2026 — bijlagen en To Do-import

### O22 — bijlagen voor taken en subtaken

- Hoofdtaken en subtaken krijgen een gedeelde bijlagenbasis.
- Een bijlage kan een echt bestand of een externe link zijn.
- Echte bestanden worden privé opgeslagen; links worden als metadata bewaard.
- De UI toont een paperclip zodra een taak of subtaak één of meer bijlagen heeft.

### O23 — To Do-import kopieert bijlagen

- Bij de eenmalige Microsoft To Do-import worden titels, vervaldatums, notities, links en documenten overgezet naar MijnPlanning.
- De originele To Do-items blijven in To Do staan; MijnPlanning maakt een kopie.
- Import van bijlagen gebeurt server-side en gebruikt waar mogelijk private blobopslag voor echte bestanden.
- Wanneer de hoofdtaak een deadline heeft, mag de subtaakdeadline daar niet voorbij liggen.
- Na expliciet opslaan wordt de planning opnieuw berekend.
- De nieuwe subtaak wordt niet automatisch actief.
- Bij een afgeronde hoofdtaak moet de gebruiker de taak eerst expliciet opnieuw openen voordat een subtaak kan worden toegevoegd.
- Een gearchiveerde of geannuleerde hoofdtaak moet eerst expliciet worden hersteld.

### O29 — eenmalige productie-import uit alle To Do-lijsten

- Alle Microsoft To Do-lijsten worden meegenomen.
- Open en afgeronde To Do-taken worden geïmporteerd.
- Iedere To Do-taak wordt precies één hoofdtaak; de import maakt geen subtaken.
- Titel en originele notitie worden exact bewaard.
- Deadline, status, documenten en links worden naar de overeenkomstige hoofdtaakvelden en bijlagen gemapt.
- De import is uitsluitend aanvullend en verwijdert of overschrijft geen bestaande MijnPlanning-taken.
- Bron-ID, bronhash, batch en itemresultaat worden bewaard om dubbele import te voorkomen en de uitvoering controleerbaar te maken.

## 11 augustus 2026 — documentbijlagen handmatig na To Do-import

### O30 — To Do-import zonder documentbestanden

- Microsoft Graph geeft voor Peters persoonlijke Microsoft-account `401 accessDenied` op de documentbijlagen-endpoint, ondanks een geldig token met `Tasks.Read`.
- Alle To Do-taken, inclusief de zes taken die documenten melden, worden normaal als hoofdtaken geïmporteerd.
- Titels, originele notities, deadlines, statussen en veilige gekoppelde links blijven onderdeel van de import.
- Documentbestanden worden niet door de automatische import opgevraagd of gekopieerd.
- De preview toont expliciet welke taken na de import handmatige documentoverdracht nodig hebben.

### O31 — handmatige selectie vóór de To Do-import

- Microsoft Graph kan taken blijven teruggeven die Peter niet meer in de To Do-interface ziet.
- De tijdelijke importpreview toont daarom alle nog importeerbare Graph-kandidaten en selecteert die standaard.
- Peter kan individuele kandidaten uitschakelen voordat hij de eenmalige import bevestigt.
- Alleen de expliciet geselecteerde bron-ID's worden geïmporteerd; de server controleert die selectie opnieuw tegen een actuele Graph-respons.
- Uitgeschakelde kandidaten worden niet in MijnPlanning aangemaakt en To Do blijft ongewijzigd.
- Peter heeft deze gerichte afwijking van O29 op 11 augustus 2026 expliciet goedgekeurd.

### O32 — alleen de standaardlijst Taken importeren

- Alleen Microsofts standaard To Do-lijst met `wellknownListName = defaultList` wordt geïmporteerd.
- Zowel open als afgeronde items uit deze lijst blijven importeerbaar.
- Een afgerond To Do-item wordt als afgeronde hoofdtaak in MijnPlanning opgeslagen.
- Boodschappenlijsten en `Flagged Emails` worden server-side volledig uitgesloten, ongeacht status of clientselectie.
- Peter heeft deze afbakening op 11 augustus 2026 expliciet bevestigd.
- De originele Microsoft To Do-taken en documenten blijven ongewijzigd.
- Peter heeft deze aangepaste importaanpak op 11 augustus 2026 expliciet opgedragen.
- De eerste echte import vindt op productie plaats na een afzonderlijke expliciete bevestiging op de gecontroleerde preview.
- Bij de eerste subtaak wordt een uitvoerbare hoofdtaak een verzameltaak; de hoofdtaakduur wordt niet naast de subtaken dubbel ingepland.

### O33 — optionele deadlines voor hoofd- en subtaken

- Zowel de deadline van een hoofdtaak als die van een subtaak is optioneel.
- Dit besluit vervangt de verplichte subtaakdeadline uit de besluiten van 17 juli 2026 en O21; titel en geplande actieve werktijd blijven voor een subtaak verplicht.
- Alleen wanneer de hoofdtaak en subtaak beide een deadline hebben, geldt `Subtask.deadline <= Task.deadline`.
- Tijd zonder datum is ongeldig. Datum zonder tijd gebruikt het bestaande voorstel van 17.00 uur in `Europe/Amsterdam`.
- Een deadline-loze subtaak blijft uitvoerbaar, telt mee in de resterende hoofdtaakduur en kan dependencies hebben, maar heeft geen speling of deadlinewaarschuwing.
- Binnen dezelfde status worden subtaken met deadline vóór deadline-loze subtaken gesorteerd.
- Een hoofdtaakdeadline wordt niet automatisch uit subtaakdeadlines afgeleid of gewijzigd.
- Peter heeft dit uitvoeringsplan op 11 augustus 2026 expliciet goedgekeurd.

## 19 juli 2026 — besluit O23

### O23 — instelbare desktopkolommen in de visuele proef

- De drie desktopzones van de visuele proef (navigatie, lijst, detailpaneel) blijven altijd alle drie zichtbaar; er komt geen functie om het detailpaneel of een andere zone volledig in te klappen.
- De twee verticale scheidingslijnen tussen de zones zijn op desktop met de muis versleepbaar en hebben elk een veilige minimum- en maximumbreedte, zodat geen zone onbruikbaar klein kan worden.
- De laatst gekozen indeling wordt onthouden via `localStorage` in de browser en hersteld na verversen, na sluiten en opnieuw openen van de browser, en bij een nieuwe lokale sessie.
- De visuele proef gebruikt uitsluitend `localStorage`; er wordt niets naar Neon geschreven. De definitieve applicatie kan de indeling later aan het gebruikersprofiel koppelen, maar dat is geen onderdeel van dit besluit.
- Wanneer het scherm smaller is geworden dan de opgeslagen indeling toelaat, wordt de opgeslagen indeling automatisch begrensd tot bruikbare waarden.
- Een actie "Kolombreedtes herstellen" is beschikbaar en keert direct terug naar de vaste standaardbreedtes; deze keuze wordt daarna opnieuw opgeslagen.
- Mobiel en smalle tablet gebruiken geen instelbare kolombreedtes en geen opslag van kolombreedtes; daar blijft de bestaande stapnavigatie navigatie → lijst → detail gelden.
- Het aanpassen van de kolombreedte heeft geen invloed op taakgegevens, timer, selectie of formulierstatus.

## 19 juli 2026 — besluit O24

### O24 — navigatielabel ToDo, WhatsApp-screeningsproef en e-mailcategorisatie

- Het navigatie-item dat voorheen "Hoofdtaken" heette, heet in de zichtbare gebruikersinterface voortaan "ToDo". Dit is uitsluitend een labelwijziging; het onderliggende datamodel, interne typenamen, de hoofdtaak- en subtaakregels en O21 blijven ongewijzigd.
- WhatsApp is nu zichtbaar als een visuele screeningsproef, direct onder E-mail in de navigatie, binnen dezelfde drieluikstructuur (navigatie, compacte lijst met voorbeeldgesprekken, detailpaneel met het geselecteerde gesprek).
- Deze proef gebruikt uitsluitend lokale voorbeeldgegevens. Er is geen WhatsApp Cloud API, geen koppeling met een privéaccount, geen extern telefoonnummer, geen verzenden of beantwoorden, geen synchronisatie en geen databaseopslag. Een echte WhatsApp-integratie blijft een latere, apart te besluiten fase en valt buiten deze proef, conform `AGENTS.md` §7.
- E-mail kent drie categorieën waaraan een gebruiker ieder bericht kan toewijzen: Belangrijk / urgent, Normaal en Nieuwsbrieven. Rood wordt uitsluitend gebruikt bij Belangrijk / urgent met een concrete reden (deadline, afspraak of financieel risico); Normaal is een neutrale categorie zonder groene succesmarkering.
- Nieuwsbrieven kunnen met een selectievakje worden gemarkeerd voor afmelding ("Markeren voor afmelding"), met een verzamelactie "Geselecteerde nieuwsbrieven afmelden". In deze proef wordt de selectie alleen lokaal in component-state bijgehouden; er vindt geen echte afmelding, geen externe aanroep en geen e-mailverzending plaats. De definitieve applicatie vraagt later altijd eerst Peters expliciete bevestiging voordat een echte afmelding wordt uitgevoerd.
- De proef gebruikt uitsluitend lokale voorbeeldgegevens; er zijn geen Neon-writes, geen Microsoft Graph-aanroepen en geen WhatsApp-API-aanroepen toegevoegd.

## 20 juli 2026 — besluiten O25–O27

### O25 — één ontwikkelhoofdlijn op main

- De nieuwste complete werkende versie is geconsolideerd in `main`.
- Verdere ontwikkeling vindt uitsluitend plaats op `main`, totdat Peter dit expliciet wijzigt.
- Er worden geen nieuwe featurebranches of andere branches aangemaakt zonder Peters expliciete opdracht.
- Bestaande oude branches blijven voorlopig als historische herstelpunten bestaan en worden niet verwijderd zonder expliciete opdracht.
- `main` wordt alleen gepusht nadat de voor de wijziging relevante lokale kwaliteitscontroles slagen; force push is niet toegestaan.

### O26 — visuele richting definitief goedgekeurd

- Peter heeft de blauw-gele drieluikrichting op 20 juli 2026 expliciet goedgekeurd op desktop en mobiel.
- De goedkeuring omvat de desktopstructuur navigatie → compacte lijst → detailpaneel, de mobiele stapweergave, het kleur- en contrastsysteem, de instelbare desktopkolommen uit O23 en de visuele patronen uit O24.
- De verplichte visuele goedkeuringspoort uit O20 is daarmee voltooid en de goedgekeurde richting mag per scherm gecontroleerd verder worden toegepast.
- Tijdelijke voorbeelddata, lokale React-state en proefmeldingen blijven prototypeonderdelen; productiefunctionaliteit vereist nog server-side validatie, autorisatie, domeinlogica en opslag.

### O27 — GitHub-repository gekoppeld aan Vercel

- De bestaande private repository `peterbosman68/MijnPlanning` is op 20 juli 2026 gekoppeld aan het bestaande Vercel-project `mijnplanning`.
- `main` is de productiebranch voor Git-gestuurde deployments.
- De koppeling is blijvend en mag automatische deployments na pushes naar `main` activeren.
- De koppeling wijzigt geen `.env`-bestanden en geeft geen toestemming voor nieuwe secrets, Neon-writes, Vercel Blob, betaalde infrastructuur of andere externe voorzieningen.
- Preview of productie wordt pas functioneel vrijgegeven nadat de relevante lokale kwaliteits-, beveiligings- en migratiecontroles slagen.

## 20 juli 2026 — besluit O28

### O28 — eigen login en wachtwoordbeleid

- De eigen MijnPlanning-login blijft losstaan van Microsoft; Microsoft wordt niet als primaire login ingevoerd.
- Een nieuw of gewijzigd wachtwoord bevat minimaal 8 tekens. Een langer, uniek wachtwoord uit een wachtwoordmanager blijft aanbevolen.
- De eerste gebruiker blijft via de eenmalige server-only bootstrapopdracht worden aangemaakt.
- Wachtwoordwijziging verloopt via een afzonderlijke lokale server-only opdracht die eerst het huidige wachtwoord controleert, geen invoer of hash logt en na succes alle bestaande sessies intrekt.

## 20 juli 2026 — besluit O29

### O29 — goedgekeurd drieluik als beveiligde applicatieshell

- De blauw-gele drieluikrichting uit O26 is niet langer een losstaande route naast een tweede technische applicatieshell, maar vormt de gedeelde beveiligde shell voor de werkweergaven.
- Na inloggen blijft `/vandaag` de functionele landingsroute; deze route toont het drieluik met `Vandaag` geselecteerd. `/taken` toont dezelfde shell met `ToDo` geselecteerd.
- De tijdelijke witte fase-0-header, technische statuskaarten en afzonderlijke Vandaag-opmaak worden niet naast het goedgekeurde ontwerp behouden.
- E-mailadres, `Uitloggen` en `Op alle apparaten uitloggen` worden compact in de linkernavigatie opgenomen. De bestaande server-side sessiecontrole, origincontrole, sessie-intrekking en veilige cookies blijven ongewijzigd leidend.
- De instelbare desktopkolommen en mobiele stapweergave uit O23 blijven behouden.
- Taken, Afspraken, E-mail, WhatsApp en de overige proefinteracties blijven voorlopig expliciete lokale voorbeelddata en React-state. Deze shellintegratie voegt geen productieopslag, externe synchronisatie of planningslogica toe.

## 20 juli 2026 — besluit O30

### O30 — uitsluitend lokaal wachtwoordnoodherstel

- Er komt in deze stap geen publieke accountregistratie, geen knop `Nieuw account aanmaken`, geen webgebaseerde resetroute en geen resetmail.
- Wanneer het huidige single-userwachtwoord echt vergeten is, mag het uitsluitend via een interactieve lokale server-only opdracht worden vervangen.
- De opdracht vereist het exacte account-e-mailadres en de hoofdlettergevoelige bevestiging `HERSTEL`. Het nieuwe wachtwoord en de herhaling blijven verborgen en kunnen niet via argumenten of procesvariabelen worden aangeleverd.
- Het nieuwe wachtwoord voldoet aan hetzelfde minimum van acht tekens, wordt met Argon2id gehasht en mag niet gelijk zijn aan het bestaande wachtwoord.
- Een geslaagde reset trekt transactioneel alle actieve sessies in en wist bestaande loginblokkades, zodat opnieuw inloggen direct mogelijk is.
- De opdracht logt geen wachtwoord, hash, database-URL of andere secret. De gebruiker moet zelf vooraf de bedoelde lokale, Preview- of Production-databaseomgeving kiezen.

## 20 juli 2026 — besluit O31

### O31 — aanvullend wachtwoordherstel per e-mail

- Peters actuele opdracht breidt O30 uit: het lokale noodherstel blijft bestaan, maar is niet langer de enige herstelroute.
- Het inlogscherm toont altijd `Wachtwoord vergeten?`, ook wanneer login na vijf mislukte pogingen tijdelijk is geblokkeerd.
- Een herstelverzoek toont altijd dezelfde neutrale bevestiging en verraadt niet of een account bestaat, een token is gemaakt of Resend de mail heeft geaccepteerd.
- Een resettoken bevat 32 cryptografisch willekeurige bytes, wordt uitsluitend als contextgescheiden HMAC-SHA-256-hash opgeslagen, is dertig minuten geldig en kan één keer worden gebruikt.
- Een geslaagde reset wijzigt het wachtwoord met Argon2id, maakt overige resettokens ongeldig, trekt alle sessies in en wist auththrottles transactioneel.
- Verzoeken worden begrensd op drie per uur per account/verzoekbron en tien per uur per verzoekbron; tokenpogingen op twintig per uur per verzoekbron. Alleen gehashte throttlesleutels worden opgeslagen.
- Peter heeft geen eigen domein. Voor deze persoonlijke single-user-MVP gebruikt Resend daarom uitsluitend `MijnPlanning <onboarding@resend.dev>` en alleen naar het e-mailadres van hetzelfde Resend-account.
- `resend.dev` is een beperkte testafzender. Een ander bestemmingsadres of meerdere gebruikers vereisen een eigen geverifieerd domein of een nieuw expliciet providerbesluit.
- `RESEND_API_KEY` wordt uitsluitend als server-side secret geconfigureerd en nooit via chat, Git of clientcode gedeeld.

## 11 augustus 2026 — snelle taakopslag

### O33 — Outlook blokkeert taakopslag niet

- De knoppen voor het opslaan van hoofdtaken en subtaken gebruiken exact hetzelfde prestatiecontract: de zichtbare opslagreactie streeft naar minder dan één seconde.
- Een live Microsoft Graph-aanroep maakt geen deel uit van het kritieke opslagpad, omdat externe responstijden niet betrouwbaar binnen die grens vallen.
- Outlook-agendagegevens worden bij het openen van een editor vooraf geladen en een recent resultaat wordt kort per datum hergebruikt voor de daglimietcontrole.
- Wanneer Graph nog bezig, traag of tijdelijk onbereikbaar is, wordt de geldige taak- of subtaakmutatie niet geblokkeerd.
- Een later ontvangen agendaresultaat blijft invoer voor herplanning en deadline-risicoanalyse; deze keuze schakelt Outlook niet uit en wijzigt geen taak- of deadlinegegevens zelfstandig.

## 11 augustus 2026 — snelle bevestiging en handmatige documenten

### O34 — redirectvrije save en private clientupload

- Een gewone hoofdtaak- of subtaaksave toont binnen 100 ms een zichtbare status en wacht voor succes op de echte databasebevestiging.
- Het warme productiedoel is p95 maximaal 500 ms; cold starts en netwerklatentie worden eerlijk als voortgang getoond en gelden niet als harde garantie.
- De twee gewone save-actions voeren geen redirect of volledige route-revalidatie uit. De client ververst Server Component-data na bevestiging op de achtergrond.
- Handmatige documenten gaan rechtstreeks van de browser naar Vercel Blob Private met een kortlevend token dat alleen na sessie-, origin- en doelautorisatie wordt uitgegeven.
- Metadatafinalisatie is idempotent. De bestandsnaam verschijnt pas na bevestigde opslag naast de paperclip.
- Private downloads lopen altijd via MijnPlanning met een nieuwe sessie- en eigendomscontrole; een permanente private Blob-URL wordt niet aan de client gegeven.

### O35 — serverfuncties naast Neon in Frankfurt

- Productiecontrole toonde dat Vercel Functions standaard in `iad1` draaiden terwijl Neon in `eu-central-1` staat.
- Omdat taakopslag uit meerdere seriële sessie- en transactierondes bestaat, veroorzaakte deze regioafstand onnodige latency.
- Alle Vercel Functions draaien daarom projectbreed in `fra1`. Statische content blijft via Vercels CDN wereldwijd beschikbaar.
- De directe Blob-uploadbestemmingen `https://vercel.com` (Blob API) en `https://*.blob.vercel-storage.com` worden expliciet en beperkt toegevoegd aan `connect-src`; zonder de API-host stopt de browserupload na succesvolle tokenuitgifte op 0%.
- Afbeeldingsbijlagen verschijnen na bevestigde opslag als klikbare thumbnail naast de paperclip en worden na refresh opnieuw via de geautoriseerde downloadroute geladen.
- Documenten, logo's, afbeeldingen en foto's kunnen via een afzonderlijke verwijderactie worden verwijderd. Na bevestiging controleert de server sessie en eigendom, verwijdert eerst een eventuele private Blob en daarna de user-scoped metadata.
