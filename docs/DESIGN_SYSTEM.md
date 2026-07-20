# MijnPlanning — design system

## 1. Ontwerpdoel

MijnPlanning moet rustig, betrouwbaar, volwassen en direct bruikbaar aanvoelen.

De interface ondersteunt besluitvorming en planning.

De interface is niet bedoeld als decoratief dashboard.

---

## 2. Kernprincipes

- Toon alleen informatie die helpt kiezen of handelen.
- Gebruik duidelijke visuele hiërarchie.
- Houd schermen compact maar niet benauwd.
- Gebruik vaste patronen.
- Geef iedere status één duidelijke betekenis.
- Toon oorzaken bij waarschuwingen.
- Geef de gebruiker controle.
- Ontwerp desktop en mobiel tegelijk.

---

## 3. Wat binnen vijf seconden duidelijk moet zijn

Op Vandaag:

1. wat nu moet gebeuren;
2. wat daarna komt;
3. hoeveel vrije werktijd resteert;
4. welke deadlines risico lopen;
5. wanneer de planning is vernieuwd.

---

## 4. Hoofdnavigatie

- Vandaag;
- Week;
- Taken;
- Inbox;
- Ochtendbrief;
- Alarmen;
- Instellingen.

Op mobiel:

- maximaal vijf primaire navigatie-items;
- overige functies onder Meer of Instellingen.

---

## 5. Kleursemantiek

### Neutraal

Voor gewone informatie.

### Groen

Voor:

- haalbaar;
- afgerond;
- voldoende marge;
- succesvolle synchronisatie.

### Oranje

Voor:

- kleine marge;
- onzeker advies;
- optimistische gebruikerskeuze;
- aandacht nodig.

### Rood

Alleen voor:

- daadwerkelijk deadlinegevaar;
- mislukte kritieke actie;
- beveiligingsprobleem;
- ongeldige deadline.

### Blauw of grijs

Voor Outlook-afspraken en externe kalenderblokken.

Gebruik één hoofdkleur voor primaire acties.

---

## 6. Vermijden

- paarse gradients;
- overmatig afgeronde kaarten;
- te veel schaduwen;
- te veel losse tegels;
- grote lege vlakken;
- hele kleine grijze tekst;
- decoratieve grafieken zonder besliswaarde;
- meerdere even sterke hoofdknoppen;
- kleur zonder betekenis;
- animaties zonder functie.

---

## 7. Typografie

- goed leesbaar op desktop en telefoon;
- standaardtekst niet kleiner dan praktisch leesbaar;
- tijden en duur mogen tabulaire cijfers gebruiken;
- maximaal enkele duidelijke tekstniveaus;
- Nederlandse datum- en tijdnotatie;
- korte labels;
- volledige uitleg onder details of toelichting.

Voorkeur:

- systeemfont of goed leesbare sans-serif;
- geen decoratieve displayfonts voor lange tekst.

---

## 8. Afmetingen en ruimte

- vaste spacing-schaal;
- voldoende klikruimte op mobiel;
- formulieren niet onnodig breed;
- belangrijke informatie boven de vouw;
- geen onnodige verticale leegte;
- maximaal één primaire actie per paneel.

---

## 9. Componenten

### Knoppen

Typen:

- Primary;
- Secondary;
- Ghost;
- Destructive.

Een paneel heeft bij voorkeur één primary-knop.

### Statuslabels

Gebruik korte labels:

- Op tijd;
- Kleine marge;
- Risico;
- Geblokkeerd;
- Wachten;
- Actief;
- Klaar.

### Formulieren

- labels altijd zichtbaar;
- foutmelding direct bij het veld;
- deadlinefout duidelijk uitleggen;
- autosave zichtbaar aangeven;
- gewijzigde broninhoud niet stilzwijgend aanpassen.

### Modals

Alleen voor:

- bevestiging;
- belangrijke keuzes;
- conflict oplossen;
- destructieve handeling.

---

## 10. Scherm Vandaag

Volgorde:

1. statusbalk met laatst vernieuwd;
2. knop Planning verversen;
3. deadline-alarm indien relevant;
4. actieve taak;
5. dagtijdlijn;
6. eerstvolgende wachtrij;
7. dagbalans.

Actieve taak toont:

- taakpad;
- titel;
- verstreken tijd;
- resterende tijd;
- voortgang;
- pauze;
- wachten;
- afronden.

---

## 11. Scherm Week

Toon:

- Outlook-afspraken;
- taakblokken;
- buffers;
- vrije tijd;
- vastgezette blokken;
- risico-indicatie.

Bij verslepen:

- toon direct effect;
- waarschuw bij deadlinegevaar;
- laat annuleren.

---

## 12. Scherm Taken

Toon:

- taaknaam;
- taakdeadline;
- omschrijving;
- subtaken;
- subtaakdeadlines;
- afhankelijkheden;
- tijdsadvies;
- eigen keuze;
- werkelijke tijd;
- bijlagen.

Een hoofdtaak is visueel duidelijk te onderscheiden van subtaken.

### 12.1 Instelbare desktopkolommen (O23)

Het scherm Taken gebruikt op desktop drie vaste zones naast elkaar: navigatie, compacte lijst en detailpaneel. Alle drie de zones blijven altijd zichtbaar; er is geen functie om een zone volledig in te klappen.

- De twee verticale scheidingslijnen tussen de zones zijn met de muis versleepbaar en met het toetsenbord bedienbaar (pijltjestoetsen wanneer de scheidingslijn focus heeft).
- Iedere zone heeft een vaste minimum- en maximumbreedte, zodat geen enkele zone door slepen onbruikbaar klein kan worden.
- De laatst gekozen indeling wordt per browser onthouden via `localStorage` en teruggezet na verversen, na het opnieuw openen van de browser en in een nieuwe lokale sessie.
- Wanneer het scherm smaller wordt dan de opgeslagen indeling toelaat, wordt de indeling automatisch begrensd tot bruikbare waarden.
- Een rustige actie "Standaardindeling herstellen" zet de drie zones direct terug op de vaste standaardbreedtes.
- Mobiel en smalle tablet gebruiken geen versleepbare scheidingslijnen en geen opslag van kolombreedtes; daar geldt de bestaande stapnavigatie navigatie → lijst → detail.
- Het slepen zelf heeft geen invloed op taakgegevens, timer, taakselectie of een geopend formulier.

### 12.2 Navigatielabel en contrast (O24)

- Het navigatie-item voor hoofdtaken heet in de zichtbare gebruikersinterface "ToDo". Dit is uitsluitend een labelwijziging; het datamodel en de interne typenamen blijven ongewijzigd.
- Ieder navigatie-item is in alle toestanden goed leesbaar: standaard, hover, geselecteerd, toetsenbordfocus en actief tijdens klikken.
- Bij een witte of lichtblauwe achtergrond (hover en geselecteerd) gebruikt de tekst donkerblauw en het icoon blauw. Witte tekst op een witte of zeer lichte achtergrond komt niet voor.
- Hover en geselecteerd zijn visueel verschillend van elkaar: hover gebruikt een lichtblauwe achtergrond, geselecteerd een wit oppervlak met extra gewicht en een lichte schaduw.
- Kleur is bij navigatiestatussen nooit de enige informatiedrager; toetsenbordfocus krijgt een eigen zichtbare buitenring.

---

## 13. Scherm Inbox

Per voorstel:

- bron;
- korte samenvatting;
- voorgestelde actie;
- deadline;
- tijd;
- betrouwbaarheid;
- accepteren;
- aanpassen;
- negeren.

Broninhoud blijft beschikbaar.

### 13.1 E-mailcategorisatie (O24)

Het scherm E-mail laat de gebruiker ieder bericht aan één van drie categorieën toewijzen:

1. **Belangrijk / urgent** — snelle actie vereist, belangrijke afzender, of een deadline, afspraak of financieel risico. Rood wordt uitsluitend gebruikt wanneer sprake is van echte urgentie of concreet risico, altijd met een tekstlabel en een korte reden erbij.
2. **Normaal** — gewone berichten die gelezen of later afgehandeld kunnen worden. Deze categorie gebruikt een neutrale markering, nooit een groene succesmarkering.
3. **Nieuwsbrieven** — getoond in een eigen filter binnen dezelfde lijst. Iedere nieuwsbrief heeft een selectievakje "Markeren voor afmelding"; een verzamelactie "Geselecteerde nieuwsbrieven afmelden" verwerkt de selectie.

In de visuele proef blijft de selectie uitsluitend lokale component-state. Er wordt geen echte afmelding uitgevoerd, geen externe website geopend en geen e-mail verzonden; na de verzamelactie verschijnt uitsluitend een duidelijke proefmelding. De definitieve applicatie vraagt vóór een echte afmelding altijd eerst Peters expliciete bevestiging.

### 13.2 WhatsApp-screeningsproef (O24)

WhatsApp is zichtbaar als navigatie-item direct onder E-mail en gebruikt dezelfde drieluikstructuur: links de algemene navigatie, midden een compacte lijst met voorbeeldgesprekken, rechts het geselecteerde gesprek. Per gesprek toont de lijst minimaal naam of afzender, een korte voorvertoning, tijd, ongelezen-status en waar functioneel relevant een label "Aandacht".

Dit is uitsluitend een screeningsproef met lokale voorbeeldgegevens: geen WhatsApp Cloud API, geen koppeling met een privéaccount, geen extern telefoonnummer, geen verzenden of beantwoorden, geen synchronisatie en geen databaseopslag. De algemene MijnPlanning-huisstijl (blauw met geel als spaarzaam accent) blijft leidend; er wordt geen decoratieve groene WhatsApp-kleur op grote vlakken gebruikt.

---

## 14. Ochtendbrief

Toon eerst:

- wat vandaag aandacht nodig heeft;
- beschikbare versus benodigde tijd;
- deadlinegevaar.

Daarna:

- e-mailacties;
- agenda;
- overige informatie.

---

## 15. AI-advies

Toon altijd:

- advies;
- bandbreedte;
- betrouwbaarheid;
- korte uitleg;
- aantal vergelijkbare taken;
- gebruikerskeuze.

Voorbeeld:

```text
Jouw keuze: 40 minuten
MijnPlanning adviseert: 70 minuten
Bandbreedte: 60-85 minuten
Gebaseerd op 9 vergelijkbare taken
```

Knoppen:

- Advies overnemen;
- Mijn tijd behouden;
- Andere tijd kiezen.

---

## 16. Mobiel

Mobiel moet bruikbaar zijn voor:

- taak starten;
- pauzeren;
- afronden;
- planning verversen;
- alarmen bekijken;
- korte taak invoeren;
- bijlage of foto toevoegen.

Grote beheerfuncties mogen primair desktopgericht zijn.

---

## 17. Toegankelijkheid

- voldoende contrast;
- toetsenbordbediening;
- zichtbare focus;
- labels voor iconen;
- kleur niet als enige statusdrager;
- foutmeldingen in tekst;
- klikvlakken groot genoeg;
- logische tabvolgorde.

---

## 18. Frontendproces

### 18.1 Verplichte eerste visuele goedkeuringspoort

Na het opzetten van de technische projectbasis en vóór brede frontendimplementatie:

1. stel een concreet kleurenpalet met hexwaarden voor;
2. leg typografie, spacing, knoppen, formulieren en statuslabels concreet vast;
3. bouw uitsluitend één werkende visuele versie van het scherm Taken;
4. toon Taken op desktop- en mobiel formaat, inclusief relevante browserweergaven of screenshots;
5. beoordeel rust, volwassenheid, compactheid, betrouwbaarheid, hiërarchie, leesbaarheid en toegankelijkheid;
6. bouw nog geen volledige overige schermen en rol de visuele patronen nog niet projectbreed uit;
7. wacht op expliciete goedkeuring van Peter.

Zonder deze goedkeuring stopt de bredere frontendimplementatie. Paarse gradients, een generiek AI-dashboard, grote lege vlakken, te veel afgeronde kaarten en te kleine grijze tekst zijn afkeurcriteria.

### 18.2 Goedkeuringsstatus

Peter heeft de blauw-gele drieluikrichting op 20 juli 2026 expliciet goedgekeurd op desktop en mobiel. De goedkeuring omvat:

- navigatie links, compacte lijst in het midden en detailpaneel rechts;
- de mobiele stapweergave navigatie → lijst → detail;
- het blauw-gele palet en de vastgelegde kleursemantiek;
- de instelbare desktopkolommen uit O23;
- het navigatiecontrast, het label `ToDo`, de lokale WhatsApp-screeningsproef en de e-mailcategorisatie uit O24.

Deze goedkeuring betreft de visuele richting en interactiepatronen. Voorbeeldgegevens, lokale React-state en proefmeldingen zijn daarmee niet automatisch als productiefunctionaliteit goedgekeurd; zij worden per implementatiefase vervangen door gevalideerde domeinlogica en opslag.

### 18.3 Proces na goedkeuring

Pas na Peters visuele goedkeuring wordt per volgend scherm gewerkt:

1. maak een visueel plan binnen het goedgekeurde systeem;
2. bouw één scherm;
3. open het in de browser;
4. controleer desktop;
5. controleer mobiel;
6. maak screenshots;
7. beoordeel hiërarchie en leesbaarheid;
8. voer gerichte correcties uit;
9. bouw pas daarna het volgende scherm.
