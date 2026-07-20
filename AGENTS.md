# AGENTS.md — MijnPlanning

Dit bestand bevat de vaste instructies voor Codex en andere programmeeragents die aan MijnPlanning werken.

## 1. Projectdoel

MijnPlanning is een persoonlijke, dynamische planningsassistent.

De applicatie moet steeds antwoord geven op vier vragen:

1. Wat moet de gebruiker nu doen?
2. Wat moet daarna gebeuren?
3. Hoeveel werktijd is werkelijk beschikbaar?
4. Welke deadline komt in gevaar wanneer de situatie niet verandert?

MijnPlanning combineert taken, subtaken, deadlines, afhankelijkheden, tijdsinschattingen, werkelijke actieve werktijd, Outlook-afspraken, Outlook-e-mail, bestanden en persoonlijke leergegevens.

De planning wordt opnieuw berekend na iedere relevante wijziging.

---

## 2. Verplichte documentatie

Lees vóór iedere betekenisvolle wijziging minimaal:

- `docs/PRODUCT_PLAN.md`
- `docs/PRODUCT_RULES.md`
- `docs/ARCHITECTURE.md`
- `docs/DATA_MODEL.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/SECURITY.md`
- `docs/DECISIONS.md`

Lees daarnaast het document dat hoort bij de functionaliteit waaraan wordt gewerkt.

Wanneer een genoemd document nog niet bestaat:

1. meld dit;
2. maak niet zelf nieuwe productregels;
3. vraag om goedkeuring voordat je het document aanmaakt of invult.

---

## 3. Werkwijze

### Grote wijzigingen

Maak eerst een uitvoeringsplan met minimaal:

1. doel en gebruikersresultaat;
2. huidige situatie;
3. functionele interpretatie;
4. te wijzigen of toe te voegen bestanden;
5. databasemigraties;
6. beveiligings- en privacygevolgen;
7. implementatiestappen;
8. testscenario's;
9. acceptatiecriteria;
10. risico's;
11. terugrolmogelijkheid;
12. open beslissingen.

Verander pas code nadat het uitvoeringsplan expliciet is goedgekeurd.

### Kleine wijzigingen

Bij een kleine, afgebakende wijziging:

1. leg kort uit wat je gaat veranderen;
2. beperk de wijziging tot het noodzakelijke;
3. voer relevante tests uit;
4. meld duidelijk wat is aangepast.

---

## 4. Niet-onderhandelbare productregels

### 4.1 Productnaam

- De productnaam is **MijnPlanning**.
- Gebruik niet de oude werknaam `Spoorwerk` in nieuwe code, UI of documentatie.
- Een bestaand Spoorwerk-prototype mag alleen als referentie worden gebruikt.

### 4.2 Taak en subtaak

- Een **taak** is de hoofdtaak.
- Een taak kan nul, één of meerdere subtaken hebben.
- Een taakdeadline is optioneel.
- Iedere subtaak heeft verplicht een deadline.
- Alleen wanneer een taakdeadline bestaat, mag de subtaakdeadline nooit later liggen dan de taakdeadline.
- Wanneer een taakdeadline wordt vervroegd, mogen bestaande subtaken niet stilzwijgend ongeldig worden.
- Een taak zonder subtaken kan zelf uitvoerbaar zijn.
- Zodra subtaken bestaan, wordt de hoofdtaak niet daarnaast nogmaals als extra werk ingepland.
- De resterende taakduur wordt dan afgeleid uit de open subtaken.

### 4.3 Afhankelijkheden

- Een subtaak kan afhankelijk zijn van een andere subtaak.
- Afhankelijkheden mogen tussen verschillende hoofdtaken lopen.
- Een geblokkeerde subtaak mag niet worden ingepland voordat alle verplichte voorgangers gereed zijn.
- Cyclische afhankelijkheden moeten worden voorkomen en server-side worden geweigerd.

### 4.4 Gezamenlijke planning

- Subtaken van verschillende hoofdtaken worden in één gezamenlijke planning geplaatst.
- Subtaken van één hoofdtaak hoeven niet achter elkaar te worden uitgevoerd.
- De planningsmotor houdt rekening met deadlines, resterende tijd, afhankelijkheden, prioriteit, vrije tijd en contextwisselkosten.

---

## 5. Microsoft To Do

Microsoft To Do wordt uitsluitend gebruikt voor een eenmalige import.

### 5.1 Importregels

- To Do-titel wordt exact `Task.title`.
- To Do-notitie/body wordt exact `Task.descriptionOriginal`.
- Bewaar regeleinden, lege regels, opsommingstekens, `-`, `*`, nummering, links, hoofdletters en leestekens.
- Overschrijf `descriptionOriginal` nooit met een genormaliseerde of AI-bewerkte versie.

### 5.2 Geen automatische herstructurering

- Maak niet automatisch subtaken uit de To Do-notitie.
- AI mag alleen een voorstel doen.
- Subtaken worden pas aangemaakt na expliciete goedkeuring van de gebruiker.

### 5.3 Geen synchronisatie na import

Na een succesvolle import:

- geen To Do-delta-sync;
- geen To Do-webhooks;
- geen terugschrijven naar To Do;
- geen `Tasks.ReadWrite`;
- geen conflictoplossing tussen To Do en MijnPlanning;
- MijnPlanning wordt de enige leidende takenomgeving.

Bewaar wel importmetadata om dubbele import te voorkomen.

---

## 6. Microsoft 365 Family en Outlook

Microsoft 365 Family is de Microsoft-basis voor MijnPlanning.

### 6.1 Login

- De MijnPlanning-login staat los van Microsoft.
- Microsoft wordt alleen als externe koppeling gebruikt.
- Gebruik geen Microsoft-login als primaire login voor MijnPlanning.

### 6.2 Agenda

Eerste fase:

- alleen agenda lezen;
- geselecteerde agenda's ophalen;
- terugkerende afspraken correct verwerken;
- afspraken als geblokkeerde tijd gebruiken;
- wijzigingen laten leiden tot herplanning.

Vraag alleen de minimaal noodzakelijke rechten. Schrijfrechten komen pas later en alleen na expliciete goedkeuring.

### 6.3 E-mail

Eerste fase:

- e-mail lezen;
- samenvatten;
- acties herkennen;
- deadlines herkennen;
- taakvoorstellen maken;
- antwoordconcepten tonen.

Niet automatisch:

- e-mails verzenden;
- mailboxinhoud wijzigen;
- volledige mailbox kopiëren;
- alle bijlagen opslaan.

Volledige inhoudelijke e-mails worden nooit automatisch verzonden.

---

## 7. WhatsApp

WhatsApp Business valt buiten de eerste versie.

- Bouw geen WhatsApp-integratie in de kernapplicatie.
- Voeg geen WhatsApp-tabellen, API's, webhooks of UI toe zonder expliciete nieuwe opdracht.
- WhatsApp komt pas nadat de kernapplicatie volledig gereed, getest en stabiel is.

---

## 8. AI-gedrag

AI ondersteunt de gebruiker, maar beslist niet zelfstandig.

AI mag:

- taakinhoud analyseren;
- ontbrekende informatie herkennen;
- gerichte vervolgvragen stellen;
- een algemene tijdsinschatting maken;
- vergelijkbare taken herkennen;
- een persoonlijke tijdsinschatting voorstellen;
- uitleg geven;
- e-mails samenvatten;
- taakvoorstellen maken.

AI mag niet:

- zelfstandig productregels wijzigen;
- automatisch subtaken aanmaken zonder toestemming;
- zelfstandig inhoudelijke e-mails verzenden;
- zelfstandig deadlines wijzigen;
- zelfstandig taken verwijderen;
- zelfstandig de definitieve gebruikerskeuze overschrijven.

De gebruiker houdt altijd de eindbeslissing.

---

## 9. Tijdsinschatting en persoonlijk leren

Bewaar afzonderlijk:

- algemene AI-inschatting;
- persoonlijke AI-inschatting;
- ondergrens;
- bovengrens;
- betrouwbaarheid;
- aantal vergelijkbare taken;
- door gebruiker gekozen tijd;
- werkelijke actieve tijd;
- totale doorlooptijd;
- onderbrekingen;
- externe wachttijd;
- gebruikte modelversie;
- uitleg.

### 9.1 Actieve tijd

Alleen actieve werktijd telt mee voor het persoonlijke leermodel.

Niet als uitvoersnelheid meetellen:

- pauzes;
- onderbrekingen;
- externe wachttijd;
- reistijd, tenzij die expliciet onderdeel is van de taak;
- vergeten timers zonder gebruikerscorrectie.

### 9.2 Voorzichtige personalisatie

- Gebruik weinig persoonlijke data voorzichtig.
- Laat algemene inschattingen zwaarder wegen bij weinig voorbeelden.
- Gebruik robuuste statistiek, bijvoorbeeld mediaan en percentielen.
- Laat één uitschieter het profiel niet sterk veranderen.
- Laat oudere data minder zwaar wegen wanneer recent gedrag duidelijk afwijkt.

### 9.3 Optimistische gebruikerskeuze

Wanneer de gebruiker minder tijd kiest dan MijnPlanning adviseert:

- respecteer de gebruikerskeuze;
- bereken daarnaast een waarschijnlijker risicoscenario;
- toon duidelijk welk deadline-effect hierdoor kan ontstaan;
- leg de waarschuwing uit met historische informatie.

---

## 10. Planningsmotor

De definitieve planning wordt berekend met controleerbare TypeScript-domeinlogica.

AI mag de planning niet rechtstreeks bepalen.

De planningsmotor gebruikt minimaal:

- open taken en subtaken;
- resterende actieve werktijd;
- deadlines;
- taakdeadline;
- vroegste start;
- afhankelijkheden;
- prioriteit;
- minimale blokduur;
- opsplitsbaarheid;
- Outlook-afspraken;
- werktijden;
- pauzes;
- buffers;
- reistijd;
- handmatig vastgezette blokken;
- persoonlijke voorkeuren;
- contextwisselkosten.

### 10.1 Vrije tijd

Bereken:

`werkvensters - afspraken - pauzes - buffers - reistijd - vastgezette blokken = vrije werkblokken`

### 10.2 Speling

De kernmaat voor deadlinegevaar is:

`speling = deadline - verwachte afronding`

### 10.3 Risiconiveaus

- Groen: voldoende marge.
- Oranje: kleine marge of optimistische aanname.
- Rood: deadline is op basis van de waarschijnlijke tijd niet haalbaar.

Iedere waarschuwing moet uitleggen waarom het risico is ontstaan.

### 10.4 Herberekening

Herbereken bij:

- nieuwe taak;
- nieuwe subtaak;
- gewijzigde deadline;
- gewijzigde tijdsinschatting;
- start, pauze of afronding;
- nieuwe of gewijzigde Outlook-afspraak;
- geaccepteerde actie uit e-mail;
- gewijzigde werktijden;
- handmatig verversen;
- periodieke alarmcontrole.

De zichtbare timer mag iedere seconde veranderen. Sla de volledige planning niet iedere seconde opnieuw op.

---

## 11. Technische stack

Gebruik als uitgangspunt:

- Node.js 24 LTS;
- Next.js 16 Active LTS met App Router;
- React 19;
- TypeScript 5;
- Tailwind CSS 3;
- PostgreSQL;
- Prisma 6;
- Vercel;
- Vercel Blob Private;
- Resend;
- Microsoft Graph;
- Git;
- GitHub;
- VS Code;
- Codex.

Voeg geen grote productieafhankelijkheid toe zonder toestemming.

Gebruik geen GiveWally-specifieke componenten tenzij MijnPlanning die aantoonbaar nodig heeft.

---

## 12. Architectuurregels

### 12.1 Scheiding van verantwoordelijkheden

Houd gescheiden:

- UI;
- domeinlogica;
- database;
- Microsoft-koppelingen;
- AI-provider;
- beveiliging;
- bestandstoegang;
- notificaties.

Plaats planningslogica niet in React-componenten.

### 12.2 Voorgestelde structuur

```text
app/
├── vandaag/
├── week/
├── taken/
├── inbox/
├── ochtendbrief/
├── alarmen/
├── instellingen/
└── api/

lib/
├── planner/
├── estimation/
├── learning/
├── tasks/
├── microsoft/
├── email/
├── notifications/
├── security/
└── db/
```

### 12.3 AI-provider

Gebruik een providerabstractie. De rest van de applicatie mag geen providerspecifieke prompt- of API-code bevatten.

---

## 13. Login en sessiebeveiliging

Voor de MVP volstaat een eenvoudige single-user login.

Vereisten:

- e-mailadres als enige verplichte login-identificatie; geen verplichte gebruikersnaam;
- wachtwoord van minimaal 8 tekens, bij voorkeur langer en uniek;
- Argon2id-wachtwoordhash;
- veilige server-side sessie;
- `HttpOnly` cookie;
- `Secure` cookie in productie;
- passende `SameSite`-instelling;
- rate limiting;
- sessie-intrekking;
- geen secrets in client-side code.

Gebruik geen leesbaar, gedeeld dashboardwachtwoord als structurele productielogin.

---

## 14. Microsoft-tokens en secrets

- Tokens alleen server-side gebruiken.
- Tokens versleuteld opslaan.
- Tokens nooit naar de browser sturen.
- Tokens nooit loggen.
- Tokens verwijderen bij ontkoppelen.
- Secrets uitsluitend in lokale `.env` of Vercel Environment Variables.
- Commit nooit `.env`, tokens, wachtwoorden, API-sleutels of productiedata.

Vraag Microsoft-rechten gefaseerd en minimaal aan.

---

## 15. Bestanden en bijlagen

Gebruik Vercel Blob Private.

PostgreSQL bewaart alleen metadata:

- blobpad;
- originele bestandsnaam;
- MIME-type;
- grootte;
- eigenaar;
- taak of subtaak;
- bron;
- datum.

Vereisten:

- eigenaarschap bij iedere download controleren;
- geen publieke voorspelbare URL's;
- tijdelijke geautoriseerde toegang;
- bestandstype en grootte valideren;
- risicovolle uitvoerbare bestanden blokkeren;
- bestand en databaseverwijzing samen verwijderen.

---

## 16. Privacy en dataminimalisatie

MijnPlanning verwerkt gevoelige persoonlijke informatie.

Daarom:

- kopieer niet standaard de volledige mailbox;
- bewaar e-mailbody's niet permanent wanneer samenvatting en metadata voldoende zijn;
- bewaar alleen gegevens die voor planning en opvolging nodig zijn;
- stuur naar AI alleen noodzakelijke inhoud;
- verwijder irrelevante handtekeningen en disclaimers voor analyse;
- log geen volledige vertrouwelijke inhoud;
- maak persoonsgegevens exporteerbaar en verwijderbaar;
- zorg voor databasebackups en herstelprocedures.

Single-user betekent niet onbeveiligd.

---

## 17. Grafisch ontwerp

Lees vóór frontendwerk `docs/DESIGN_SYSTEM.md`.

MijnPlanning moet zijn:

- rustig;
- volwassen;
- compact;
- betrouwbaar;
- functioneel;
- goed leesbaar op desktop en telefoon.

Vermijd:

- generiek AI-dashboard;
- paarse gradients;
- overmatig afgeronde tegels;
- grote lege vlakken;
- te kleine grijze tekst;
- te veel kleuren;
- decoratieve grafieken zonder besliswaarde;
- meerdere concurrerende primaire knoppen.

Kleursemantiek:

- neutraal: gewone informatie;
- groen: haalbaar;
- oranje: kleine marge;
- rood: daadwerkelijk deadlinegevaar;
- blauw of grijs: Outlook-afspraak;
- één accentkleur: primaire gebruikersactie.

### 17.1 Frontendproces

Na het opzetten van de technische projectbasis en vóór brede frontendimplementatie geldt een verplichte visuele goedkeuringspoort:

1. stel een concreet kleurenpalet met hexwaarden voor;
2. leg typografie, spacing, knoppen, formulieren en statuslabels vast;
3. bouw uitsluitend één werkende visuele versie van het scherm Taken;
4. toon deze versie op desktop- en mobiel formaat;
5. bouw nog geen volledige overige schermen;
6. wacht op expliciete goedkeuring van Peter voordat het ontwerp breder wordt toegepast.

Zonder deze goedkeuring stopt de bredere frontendimplementatie.

De visuele proef met de blauw-gele drieluikstructuur is op 20 juli 2026 door Peter expliciet goedgekeurd op desktop en mobiel. Deze eerste goedkeuringspoort is daarmee voltooid. `docs/DESIGN_SYSTEM.md`, O23, O24 en de goedgekeurde proef op `/taken` zijn vanaf dat moment de visuele basis voor verdere schermen.

Na goedkeuring, per volgend scherm:

1. maak eerst een visueel plan binnen het goedgekeurde systeem;
2. bouw één scherm;
3. test lokaal;
4. controleer desktop;
5. controleer mobiel;
6. beoordeel hiërarchie en leesbaarheid;
7. voer gerichte correcties uit;
8. bouw pas daarna het volgende scherm.

---

## 18. Git-werkwijze

- Werk vanaf 20 juli 2026 uitsluitend op `main`, totdat Peter deze werkwijze expliciet wijzigt.
- Maak geen nieuwe featurebranches of andere branches zonder Peters expliciete opdracht.
- Controleer vóór iedere wijziging dat `main` actief is en dat de lokale Git-status begrepen is.
- Laat niet meerdere agents tegelijk dezelfde bestanden in dezelfde branch wijzigen.
- Maak kleine, duidelijke commits.
- Vermeld in commits wat functioneel is veranderd.
- Push `main` alleen na de voor de wijziging relevante groene kwaliteitscontroles.
- Gebruik geen force push.
- Bestaande oude branches blijven als historie behouden en worden alleen op expliciete opdracht verwijderd.
- Voer geen destructieve databasemigratie uit zonder expliciete goedkeuring en terugrolplan.

---

## 19. Codekwaliteit

Gebruik:

- strikte TypeScript-typen;
- duidelijke domeinnamen;
- kleine functies;
- expliciete foutafhandeling;
- server-side validatie;
- transacties bij samenhangende databasewijzigingen;
- geen duplicatie van bedrijfsregels;
- geen `any` zonder sterke reden;
- geen stilzwijgend negeren van fouten.

Voeg tests toe voor iedere belangrijke productregel.

---

## 20. Verplichte tests

Voer na iedere betekenisvolle wijziging minimaal uit:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Wanneer scripts ontbreken, meld dit en voeg ze alleen toe binnen een goedgekeurde technische wijziging.

Minimale tests voor de kern:

1. subtaakdeadline na taakdeadline wordt geweigerd;
2. vervroegen van taakdeadline kan geen ongeldige subtaken veroorzaken;
3. subtaken van meerdere taken worden gezamenlijk gepland;
4. geblokkeerde subtaken worden niet te vroeg gepland;
5. niet-opsplitsbaar werk past alleen in een voldoende groot blok;
6. Outlook-afspraak vermindert beschikbare tijd;
7. taak met subtaken wordt niet dubbel ingepland;
8. taak zonder subtaken kan uitvoerbaar zijn;
9. optimistische gebruikersduur geeft een risicowaarschuwing;
10. To Do-notitie blijft exact behouden;
11. To Do-import maakt geen automatische subtaken;
12. een tweede import maakt geen stille duplicaten;
13. ongeautoriseerde gebruiker kan geen bestanden of taken lezen;
14. tokens en secrets komen niet in clientbundel of logs.

---

## 21. Definition of Done

Een wijziging is pas gereed wanneer:

- productregels zijn gevolgd;
- het uitvoeringsplan is bijgewerkt wanneer van toepassing;
- databasewijzigingen zijn gemigreerd en getest;
- beveiliging is beoordeeld;
- foutgevallen zijn afgehandeld;
- relevante tests slagen;
- lint slaagt;
- typecheck slaagt;
- build slaagt;
- desktopwerking is gecontroleerd;
- mobiele werking is gecontroleerd;
- documentatie en besluiten zijn bijgewerkt;
- open risico's duidelijk zijn gemeld.

---

## 22. Verboden zonder expliciete toestemming

Doe niet zelfstandig:

- productregels wijzigen;
- een andere stack kiezen;
- Microsoft To Do blijvend synchroniseren;
- WhatsApp toevoegen;
- Microsoft-login als primaire login invoeren;
- automatisch e-mails verzenden;
- subtaken automatisch uit tekst aanmaken;
- volledige mailboxinhoud permanent kopiëren;
- publieke bestandsopslag gebruiken;
- tokens of secrets loggen;
- productiedata verwijderen;
- destructieve migraties uitvoeren;
- nieuwe betaalde infrastructuur of externe dienst toevoegen;
- werken op `main`.

---

## 23. Onzekerheid en conflicten

Wanneer een opdracht conflicteert met dit bestand:

1. stop;
2. benoem de tegenstrijdigheid;
3. verwijs naar de relevante productregel;
4. vraag om expliciete bevestiging voordat je verdergaat.

Wanneer meerdere interpretaties mogelijk zijn:

- verzin geen productregel;
- geef de mogelijke interpretaties;
- adviseer één optie;
- wacht op keuze.

---

## 24. Bron van waarheid

De actuele Markdown-documentatie in de GitHub-repository is leidend.

Een Word-document is alleen een leesbare momentopname en geen bron van waarheid.

Volgorde van gezag:

1. expliciete actuele instructie van Peter;
2. `docs/DECISIONS.md`;
3. `docs/PRODUCT_RULES.md`;
4. dit `AGENTS.md`;
5. overige projectdocumentatie;
6. bestaande code;
7. prototype of oude documenten.
