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

### 18.2 Proces na goedkeuring

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
