# MijnPlanning — ontwerpvoorstel O22: drieluik-navigatie (herzien)

**Status:** door Peter als basis gekozen voor de tweede lokale visuele proef; actuele correcties van 19 juli 2026 verwerkt
**Rol:** uitsluitend UX/UI-ontwerp en -beoordeling
**Aanleiding:** O20 (inline-uitklap in `/taken`) is afgekeurd: te druk, onvoldoende strak
**Herziening:** verwerkt Peters correcties van 18 juli 2026 op de eerste versie van dit voorstel
**Gevraagde richting:** interactiepatroon van Microsoft To Do (navigatie / lijst / detail), zonder To Do visueel te kopiëren

---

## 0. Wat er mis was met O20

De huidige proef (`app/taken/taken-visual-prototype.tsx`) klapt de geselecteerde hoofdtaak **inline** open in de lijst. Dat betekent:

- de lijst verspringt verticaal zodra je een taak selecteert — andere taken schuiven weg;
- subtakenlijst, risicotekst, detailtabel (`dl`) en het subtaakformulier zitten allemaal in dezelfde kolom, onder elkaar — veel verschillende bloktypes in één visuele baan;
- er is geen vaste plek voor "wat zie ik altijd" versus "wat zie ik pas na een klik";
- op desktop oogt het als een lange, wisselende kaart in plaats van een rustig werkinstrument.

Het antwoord is geen inline-uitklap, maar drie **vaste** zones die niet verspringen: links navigatie en filters, midden een compacte lijst, rechts het detail van precies één geselecteerd item. Dat interactiepatroon — niet het uiterlijk van Microsoft To Do — is wat wordt overgenomen.

---

## 1. De drie vaste zones

Dit ontwerp is opnieuw uitgewerkt vanuit drie zones met elk één duidelijke taak. Geen zone doet het werk van een andere.

### Zone links — navigatie en filters

Uitsluitend filters op dezelfde onderliggende taken-, subtaken-, afspraken- en e-mailverzameling. Geen aparte functies, geen instellingen, geen acties.

**Definitieve correctie van Peter:** Hoofdtaken blijft een zelfstandig navigatie-item en `Alles` wordt niet opgenomen. De navigatie toont alleen de ingangen die in deze proef een duidelijke gebruikersvraag beantwoorden.

Linkernavigatie, definitief voor dit voorstel:

```
Vandaag
Week
Hoofdtaken
─────────────
Afspraken
E-mail
─────────────
Wachten
Afgerond
```

Twee visuele groepen (dun scheidingslijntje, geen kader): **taakfilters op tijd** boven (Vandaag, Week, Hoofdtaken), **kanalen en status** eronder (Afspraken, E-mail, Wachten, Afgerond). Geen "Instellingen" hier — dat hoort niet in dit scherm-ontwerp en staat al in de hoofdnavigatie per `DESIGN_SYSTEM.md` §4.

**WhatsApp — uitsluitend documentair vastgelegd, geen UI-item:**
WhatsApp wordt nu niet toegevoegd als zichtbaar navigatie-item, knop of placeholder. Dit is verplicht: `AGENTS.md` §7 en §22 verbieden WhatsApp-UI zonder expliciete nieuwe opdracht, en zelfs een uitgegrijsde placeholder is UI. Voor toekomstig ontwerpgebruik wordt hier alleen vastgelegd wáár WhatsApp structureel zou landen, mocht die opdracht ooit komen: **als derde communicatiekanaal in de onderste groep, naast E-mail** — dus niet bij de tijdfilters, niet als eigen groep. Dit is een aantekening in dit document, geen onderdeel van enige wireframe of bouwopdracht.

### Zone midden — compacte lijst

Toont exact één type item tegelijk (hoofdtaken, of afspraken, of e-mailvoorstellen — nooit gemengd), in rijen die niet verspringen wanneer een rij wordt geselecteerd. Zie §3.

### Zone rechts — detail van één geselecteerd item

Toont alles over precies het item dat in de middenlijst is geselecteerd, gelaagd: kernvelden altijd zichtbaar, aanvullende informatie pas na een expliciete klik. Zie §4.

---

## 2. Geen navigatiebadges in deze proef

Peter heeft bepaald dat de linkernavigatie in deze proef geen aantallen of badges toont. Deadlinegevaar blijft zichtbaar in de taaklijst en wordt in het detailpaneel met oorzaak en gevolg uitgelegd.

---

## 3. Wat zichtbaar is in iedere regel van de middenlijst

Doel: **scanbaar in twee oogopslagen**, niet lezen.

Vaste kolomstructuur per hoofdtaakregel (één regel, geen wrap van meerdere blokken):

```
[hiërarchie-indicator] Titel                    Deadline    Resterend   [risico-stip]
                        status-ondertekst (klein, alleen indien relevant)
```

Concreet, links naar rechts:

1. **Titelkolom** — taaktitel, één regel, ellipsis bij overflow. Direct eronder (kleiner, gedempt): ofwel een statuswoord (`Wachten`) ofwel een subtaaktelling (`3 subtaken · 1 geblokkeerd`) — nooit beide, kies de meest relevante.
2. **Deadlinekolom** — vaste breedte, rechts uitgelijnd, compacte Nederlandse datum (`vr 24 jul`). Leeg (niet "–") wanneer de taak geen deadline heeft.
3. **Resterend-kolom** — vaste breedte, tabulaire cijfers (`3u 40m`). Voor een verzameltaak: som van open subtaken (conform `AGENTS.md` §4.2).
4. **Risico-indicator** — alleen bij aandacht of werkelijk deadlinegevaar een kleine oranje of rode vorm, **geen tekstlabel in de rij zelf**. Een normale taak krijgt geen groene status. Kleur is nooit de enige drager: oranje en rood gebruiken ook een verschillende vorm.

Wat expliciet **niet** in de rij staat: omschrijving, tijdsinschatting-detail, afhankelijkheden, bijlagen, logboek.

Subtaken zijn geen aparte rijen in deze middenlijst — die verschijnen pas in het detailpaneel rechts (zie §5). De middenlijst binnen "Hoofdtaken" toont uitsluitend hoofdtaken.

Rijhoogte: compact maar met minimaal 44px klikvlak. Geselecteerde rij krijgt een vlakke achtergrondkleur (geen schaduw, geen kaartrand).

---

## 4. Wat pas in het detailpaneel rechts verschijnt

Alles wat de rij bewust weglaat, staat hier — gelaagd, niet alles tegelijk zichtbaar.

**Altijd zichtbaar zodra een taak geselecteerd is:**
- titel (bewerkbaar veld);
- taakstatus als tekstlabel;
- taakdeadline (bewerkbaar);
- risicoregel — volledige tekst: niveau + oorzaak + gevolg;
- subtakenlijst (zie §6) — of, bij een uitvoerbare taak zonder subtaken, het tijdsinschattingsblok direct;
- knop **`+ Subtaak`** — permanent zichtbaar zolang de taak open/actief/wachtend is (O21, §7).

**Pas na expliciete uitklap ("Details tonen", ghost-knop):**
- omschrijving (`descriptionOriginal`, ongewijzigd getoond);
- AI-tijdsinschatting-blok (algemeen / persoonlijk advies / bandbreedte / gebruikerskeuze);
- afhankelijkheden;
- bijlagen;
- logboek/werkelijke tijd.

---

## 5. Hoofdtaak versus subtaak — visueel onderscheid

Drie signalen tegelijk, geen van drieën alleen op kleur:

1. **Typografisch gewicht**: hoofdtaaktitel in het detailpaneel is de zwaarste tekst op de pagina; subtaaktitels zijn basis-tekst-gewicht, nooit zwaarder dan de hoofdtaak.
2. **Inspringing + geleidelijn**: subtaken krijgen een vaste linker inspringing met een dunne verticale lijn (1px, neutrale randkleur) — geen "kaarten-in-kaarten".
3. **Positie**: subtaken staan uitsluitend ín het detailpaneel, onder de hoofdtaak-info, nooit als eigen rij in de middenlijst.

Iedere subtaakregel in het detailpaneel: titel, deadline, resterend, statuslabel — compacter dan de hoofdtaakrij, op één regel met scheidingstekens.

---

## 6. O21 — subtaak toevoegen tijdens het werken (inhoudelijk goedgekeurd)

**Definitief besluit:** O21 is door Peter goedgekeurd en vastgelegd in `docs/DECISIONS.md`. Dit ontwerp gaat uit van de volgende regels:

- bij een open, actieve of wachtende hoofdtaak kan op ieder moment een subtaak worden toegevoegd;
- `+ Subtaak` blijft zichtbaar in het detailpaneel;
- een actieve timer loopt door tijdens het toevoegen;
- titel en deadline zijn verplicht;
- de subtaakdeadline mag niet later zijn dan de hoofdtaakdeadline, als die hoofdtaakdeadline bestaat;
- na opslaan wordt de planning opnieuw berekend;
- de nieuwe subtaak wordt niet automatisch actief;
- bij een afgeronde hoofdtaak wordt gevraagd of de taak opnieuw moet worden geopend, vóórdat een subtaak kan worden toegevoegd;
- een gearchiveerde of geannuleerde taak moet eerst worden hersteld, vóórdat een subtaak kan worden toegevoegd;
- bij de eerste subtaak wordt een uitvoerbare hoofdtaak een verzameltaak en wordt de hoofdtaakduur niet dubbel ingepland.

**Visuele gevolgen van de twee nieuwe regels (afgeronde / gearchiveerde-geannuleerde taak):**

- Op een **afgeronde** hoofdtaak toont het detailpaneel in plaats van een direct werkend `+ Subtaak`-formulier eerst een korte bevestigingsvraag: "Deze taak is afgerond. Opnieuw openen om een subtaak toe te voegen?" met knoppen `Opnieuw openen` / `Annuleren`. Pas na `Opnieuw openen` verschijnt het normale subtaakformulier.
- Op een **gearchiveerde of geannuleerde** hoofdtaak toont het detailpaneel in plaats van `+ Subtaak` een tekstregel met een herstelactie: "Deze taak is gearchiveerd/geannuleerd. Herstel de taak om een subtaak toe te voegen." met knop `Taak herstellen`. Pas na herstel verschijnt `+ Subtaak` weer normaal.
- Dit zijn dezelfde detailpaneel-zone, geen aparte modal-schermen — consistent met het principe dat het detailpaneel per status toont wat op dat moment mogelijk is.

---

## 7. Afspraken tonen zonder ze als taken te behandelen

Een Outlook-afspraak heeft geen status, geen subtaken, geen `+ Subtaak`-knop, geen risicoberekening op zichzelf. Ze krijgen een **wezenlijk andere rijvorm**, niet dezelfde rij in een andere kleur:

- kleurcode blauw/grijs — dit is de **enige** plek in de UI waar blauw/grijs betekenis draagt;
- rijstructuur: **tijd eerst** (`14:00–14:30`), dan titel, geen deadline-kolom, geen resterend-kolom, geen risico-stip — die kolommen bestaan hier structureel niet;
- detailpaneel bij een afspraak toont: tijd, locatie/online-link indien aanwezig, deelnemers-samenvatting — nooit een `Opslaan`-knop, want Outlook is alleen-lezen. Het detailpaneel maakt dat expliciet zichtbaar met een gedempte tekstregel "Alleen-lezen via Outlook".

---

## 8. E-mail in hetzelfde patroon

E-mail is geen taak en geen afspraak — het is een **voorstel-bron** (Inbox). Het past in hetzelfde drieluik zo:

- linkernavigatie-item "E-mail" filtert de middenkolom naar **voorstellen**, niet naar taken — de middenlijst wisselt dan van kolomkop (geen Deadline/Resterend/Risico, maar Bron/Samenvatting/Betrouwbaarheid);
- iedere rij toont: korte samenvatting, voorgestelde actie in één regel;
- het detailpaneel rechts toont bij selectie: volledige samenvatting, voorgestelde taak/subtaak/deadline/tijd, en de drie knoppen `Accepteren` / `Aanpassen` / `Negeren` — nooit meer dan één primaire knop tegelijk benadrukt;
- **broninhoud blijft beschikbaar** als uitklapbaar blok, zelfde tweetrapspatroon als §4.

Zoals in §1 vastgelegd: WhatsApp zou hier ooit als tweede rij in dezelfde onderste navigatiegroep bijkomen, maar dat is nu uitsluitend een aantekening, geen ontwerp.

---

## 9. Mobiele navigatie

Drie kolommen naast elkaar kan niet op een telefoon. Het patroon wordt **stapelend**, met behoud van dezelfde volgorde als desktop (navigatie → lijst → detail):

- de linkernavigatie wordt op mobiel het **startscherm** van `/taken`;
- een gekozen filter opent de lijst **vervangend**, niet als overlay, met `←`-terugknop bovenaan die teruggaat naar de navigatie;
- een gekozen item opent het detail **vervangend**, met `←`-terugknop die teruggaat naar de lijst;
- `+ Subtaak` blijft ook hier permanent zichtbaar zodra het detailpaneel open is — geen mobiele uitzondering op O21;
- exact drie stappen diep, nooit meer.

---

## 10. Risico zichtbaar zonder het scherm druk te maken

Drie vaste plekken, elk met een andere informatiedichtheid, nooit dezelfde info dubbel voluit herhaald:

1. **Middenlijst-rij**: alleen de kleine risico-stip (vorm + kleur, geen tekst) — zie §3.
2. **Detailpaneel, altijd zichtbaar deel**: volledige risicoregel met niveau, oorzaak en gevolg in tekst — dit is de enige plek waar risico met volledige uitleg staat.
3. **Subtaakregel in detail**: eigen kleine risico-stip per subtaak, zodat zichtbaar is *welke* subtaak het risico veroorzaakt.

Rood wordt nooit gebruikt als achtergrondvlak van een rij of paneel — alleen als stip, randlijn of tekstlabel.

---

## 11. Minimaal gebruik van kleur, rand en witruimte

- **Eén achtergrondkleur voor de pagina**, één (net iets lichtere/donkerdere) voor de twee zijkolommen tegenover de middenkolom — geen drie verschillende paneelkleuren.
- **Eén verticale scheidingslijn** tussen navigatie en lijst, en tussen lijst en detail — 1px, neutrale randkleur. Geen schaduwen tussen de kolommen.
- **Geen kaartranden binnen de middenlijst** — rijen scheiden met alleen een 1px onderrand of alleen witruimte + hover/selectie-achtergrond.
- **Kleur uitsluitend semantisch**: petrol-accent alleen voor de ene primaire actie per paneel. Groen/oranje/rood uitsluitend voor risico. Blauw/grijs uitsluitend voor Outlook.
- **Witruimte functioneel, niet decoratief**: vaste spacing-schaal bepaalt de ruimte tussen rijen en velden; een leeg detailpaneel krijgt een korte informatieve tekst ("Selecteer een item om de details te zien"), nooit een leeg wit vlak.

---

## Definitief tekstueel wireframe

Eén versie per scherm, geen alternatieven meer.

### A. Hoofdtaken — geopende hoofdtaak met subtaken (desktop)

```
┌ Nav ──────────┬ Hoofdtaken ──────────────────────────┬ Detail ─────────────────────────────┐
│ Vandaag        │ Hoofdtaken            [Nieuwe taak]  │ Truckparking Duiven voorbereiden     │
│ Week           │ ──────────────────────────────────   │ Wachten                              │
│ Hoofdtaken(sel)│▶Truckparking Duiven vo…      (sel.)  │ Deadline: vr 24 jul, 17:00            │
│                │  Wachten            vr 24jul  3u40m ◐│                                       │
│ ────────────   │ ──────────────────────────────────   │ ⚠ Kleine marge — gekozen duur ligt    │
│ Afspraken      │ Administratie 2e kwartaal              │   30 min onder persoonlijk advies.    │
│ E-mail         │  1 subtaak            —      1u15m    │                                       │
│ ────────────   │ ──────────────────────────────────   │ [+ Subtaak]      [Details tonen ▾]   │
│ Wachten        │                                        │                                       │
│ Afgerond       │                                        │ Subtaken (4)                          │
│                │                                        │ │ Locatiegegevens controleren  ✓klaar │
│                │                                        │ │ Offerte laadpalen ● timer    ◐45m   │
│                │                                        │ │ Vergunningsstukken  geblokk. ●70m   │
│                │                                        │ │ Terugkoppeling eigenaar wacht  30m  │
└────────────────┴────────────────────────────────────────┴───────────────────────────────────────┘
```

`◐` = oranje aandacht; `●` = rood deadlinegevaar. Een normale taak heeft geen groene stip of statuslabel.

Bij klik op `+ Subtaak`: een formulier verschijnt **onderaan in het detailpaneel** (geen modal), met titel* en deadline* verplicht, deadline begrensd (`max`) door de taakdeadline, en knoppen `Annuleren`/`Opslaan`. Een lopende timer blijft zichtbaar en loopt door tijdens het invullen.

Bij een **afgeronde** hoofdtaak vervangt de detailzone tijdelijk `+ Subtaak` door: "Deze taak is afgerond. Opnieuw openen om een subtaak toe te voegen?" met `Opnieuw openen` / `Annuleren`.

Bij een **gearchiveerde of geannuleerde** hoofdtaak vervangt de detailzone `+ Subtaak` door: "Deze taak is gearchiveerd/geannuleerd. Herstel de taak om een subtaak toe te voegen." met `Taak herstellen`.

### B. Afspraken (desktop)

```
┌ Nav ──────────┬ Afspraken ────────────────────────┬ Detail ──────────────────────┐
│ Vandaag        │ Vandaag, 18 juli                   │ Overleg Erwin — Roodwilligen │
│ Week           │ ──────────────────────────────────│                               │
│ Hoofdtaken     │ 09:00–09:30  Dagstart               │ 14:00–14:30                  │
│                │ 14:00–14:30  Overleg Erwin (sel.)   │ Locatie: Teams               │
│ ────────────   │ ──────────────────────────────────│ 2 deelnemers                 │
│ Afspraken (sel)│ Morgen, 19 juli                     │                               │
│ E-mail         │ 10:00–11:00  TP Duiven bezoek        │ Alleen-lezen via Outlook.    │
│ ────────────   │                                       │                               │
│ Wachten        │                                       │                               │
│ Afgerond       │                                       │                               │
└────────────────┴───────────────────────────────────────┴───────────────────────────────┘
```

Geen `Nieuwe taak`-knop boven deze lijst (afspraken worden niet in MijnPlanning aangemaakt), geen deadline/resterend/risico-kolommen — structureel afwezig, blauwe/grijze tijdbalk-kleur i.p.v. risicostip.

### C. E-mail / Inbox (desktop)

```
┌ Nav ──────────┬ E-mail ───────────────────────────┬ Detail ──────────────────────────┐
│ Vandaag        │ 3 voorstellen                       │ Van: installateur@…              │
│ Week           │ ──────────────────────────────────│ "Offerte laadpalen Duiven"        │
│ Hoofdtaken     │ Offerte laadpalen…      (sel.)      │                                    │
│                │  taak · hoge betrouwbaarheid         │ Samenvatting: levertijd 6 weken,  │
│ ────────────   │ ──────────────────────────────────│ prijs incl. installatie…          │
│ Afspraken      │ Vraag Erwin over stroom…             │                                    │
│ E-mail    (sel)│  subtaak · gemiddeld                 │ Voorstel: subtaak bij Truckparking│
│ ────────────   │ ──────────────────────────────────│ Duiven, deadline 22 jul            │
│ Wachten        │ Reminder factuur boekhouder          │                                    │
│ Afgerond       │  taak · laag                         │ [Accepteren] Aanpassen  Negeren   │
│                │                                       │ Broninhoud tonen ▾                 │
└────────────────┴───────────────────────────────────────┴────────────────────────────────────┘
```

### D. Mobiel — drie stappen

```
Stap 1: navigatie          Stap 2: lijst              Stap 3: detail
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│ Vandaag          │  tik   │ ← Hoofdtaken     │  tik   │ ← Terug          │
│ Week             │ ─────► │                  │ ─────► │                  │
│ Hoofdtaken       │        │ Truckparking...  │        │ Truckparking...  │
│                  │        │ vr 24jul  3u40m ◐│        │ Wachten          │
│ ─────────────    │        │                  │        │ ⚠ Kleine marge…  │
│ Afspraken        │        │ Administratie... │        │ [+ Subtaak]      │
│ E-mail           │        │ —          1u15m │        │ Subtaken (4)     │
│ ─────────────    │        │                  │        │  ...             │
│ Wachten          │        │                  │        │                  │
│ Afgerond         │        │                  │        │                  │
└─────────────────┘        └─────────────────┘        └─────────────────┘
```

Zelfde volgorde nav→lijst→detail als desktop, vervangend gestapeld, nooit als overlay of aparte tabbalk. `+ Subtaak` en de O21-uitzonderingen (afgerond/gearchiveerd/geannuleerd) gedragen zich in stap 3 identiek aan desktop.

---

## Wat in de volgende visuele proef wordt gebouwd — en wat niet

**Wel bouwen (volgende visuele proef):**

- de drie vaste zones (navigatie / lijst / detail) als werkend layoutskelet op desktop en mobiel, met de stapelende mobiele navigatie uit §9;
- de linkernavigatie exact zoals in §1: Vandaag, Week, Hoofdtaken, Afspraken, E-mail, Wachten, Afgerond, in de twee groepen, zonder WhatsApp en zonder badges;
- de middenlijst voor **Hoofdtaken** met de vier kolommen uit §3, met voorbeelddata;
- het detailpaneel voor een geselecteerde hoofdtaak, inclusief het tweetraps "Details tonen"-gedrag uit §4 en het hoofdtaak/subtaak-onderscheid uit §5;
- het volledige O21-gedrag: permanente `+ Subtaak`, het subtaakformulier, de deadlinebegrenzing, en de twee statusuitzonderingen (afgeronde taak → heropenvraag; gearchiveerd/geannuleerd → herstelvraag) uit §6;
- de rijvorm voor **Afspraken** (§7) inclusief het alleen-lezen-detailpaneel;
- de rijvorm voor **E-mail** (§8) inclusief de drie actieknoppen, zonder dat `Accepteren` al iets echt opslaat.

**Niet bouwen in deze volgende proef:**

- navigatiebadges of aantallen;
- enige vorm van WhatsApp-UI, ook geen uitgegrijsde placeholder;
- echte dataverbindingen: geen API, geen Neon-write, geen Microsoft Graph-koppeling — alle content blijft lokale, expliciet gemarkeerde voorbeelddata, zoals bij O20;
- de statussen "Wachten" en "Afgerond" als volledig uitgewerkte, eigen middenlijst-kolomopmaak — deze navigatie-items mogen in de proef aanwezig zijn en naar dezelfde hoofdtakenlijst filteren, maar krijgen geen apart uitgewerkt detailgedrag in deze ronde;
- planningsmotor-logica: de "planning opnieuw berekend"-melding na het opslaan van een subtaak blijft, net als in O20, een zichtbare maar nog niet functioneel aangesloten bevestiging.

---

*Dit voorstel is op 19 juli 2026 als basis gebruikt voor de lokale proef die later via `feature/visual-foundation-v3` in `main` is geconsolideerd. Peter heeft de uiteindelijke blauw-gele drieluikrichting op 20 juli 2026 goedgekeurd op desktop en mobiel. De proef gebruikt nog steeds uitsluitend tijdelijke voorbeelddata en lokale state; echte domeinlogica en opslag volgen per implementatiefase.*
