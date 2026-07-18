# MijnPlanning — productplan

## 1. Doel

MijnPlanning is een persoonlijke, dynamische planningsassistent.

De applicatie moet steeds antwoord geven op vier vragen:

1. Wat moet ik nu doen?
2. Wat moet ik daarna doen?
3. Hoeveel werktijd heb ik werkelijk beschikbaar?
4. Welke deadline komt in gevaar wanneer de situatie niet verandert?

MijnPlanning combineert taken, subtaken, deadlines, afhankelijkheden, Outlook-afspraken, tijdsinschattingen, werkelijke uitvoeringstijden, e-mail en bijlagen.

Na iedere relevante wijziging wordt de resterende planning opnieuw berekend.

---

## 2. Gebruiker

De eerste versie is een single-user-app voor Peter.

De applicatie moet goed werken op:

- Windows-computer;
- desktopbrowser;
- Samsung-telefoon;
- later als PWA.

De MijnPlanning-login staat los van Microsoft.

---

## 3. Hoofdonderdelen

MijnPlanning bestaat uit:

- eigen login;
- taken en subtaken;
- deadlines;
- afhankelijkheden;
- tijdregistratie;
- AI-intake en vervolgvragen;
- algemene en persoonlijke tijdsinschatting;
- persoonlijk leermodel;
- dag- en weekplanning;
- deadline-alarmen;
- eenmalige Microsoft To Do-import;
- Outlook-agenda via Microsoft 365 Family;
- Outlook-e-mail;
- ochtendbrief;
- bestanden, foto’s en screenshots;
- instellingen en beveiliging.

WhatsApp valt buiten de eerste versie.

Een aparte gespreks- of transcriptieverwerkingsapp valt buiten dit project.

---

## 4. Taken en subtaken

### 4.1 Taak

Een taak is de hoofdtaak.

Voorbeeld:

```text
Truckparking Duiven
```

Een taak heeft:

- titel;
- omschrijving;
- status;
- optioneel een eigen deadline;
- nul, één of meerdere subtaken;
- optioneel bijlagen;
- broninformatie.

### 4.2 Subtaak

Een subtaak is een concreet uitvoerbaar onderdeel.

Voorbeeld:

```text
Offerte laadpalen beoordelen
```

Iedere subtaak heeft verplicht:

- titel;
- deadline;
- geschatte actieve werktijd;
- resterende actieve werktijd;
- status.

Een subtaak kan daarnaast hebben:

- omschrijving;
- vroegste start;
- prioriteit;
- afhankelijkheden;
- minimale blokduur;
- wel of niet opsplitsbaar;
- context of locatie;
- bijlagen.

### 4.3 Deadlinehiërarchie

Een taakdeadline is optioneel.

Een subtaakdeadline is verplicht.

Wanneer de taak een deadline heeft:

```text
deadline subtaak <= deadline taak
```

Alleen wanneer de taak een deadline heeft, mag een subtaakdeadline nooit na de taakdeadline liggen.

Wanneer een taakdeadline wordt vervroegd, mogen bestaande subtaken niet stilzwijgend ongeldig worden.

### 4.4 Taak zonder subtaken

Een taak zonder subtaken kan zelf uitvoerbaar zijn.

Zodra subtaken bestaan:

- worden de subtaken ingepland;
- wordt de hoofdtaak niet daarnaast nogmaals als extra werk ingepland;
- wordt de resterende taakduur afgeleid uit de open subtaken.

---

## 5. Afhankelijkheden en gezamenlijke planning

Subtaken van verschillende hoofdtaken worden in één gezamenlijke planning geplaatst.

Voorbeeld:

```text
Taak A
- A1 deadline dinsdag
- A2 deadline vrijdag

Taak B
- B1 deadline woensdag
- B2 deadline donderdag
```

Mogelijke volgorde:

```text
A1 -> B1 -> B2 -> A2
```

Een subtaak kan afhankelijk zijn van een andere subtaak, ook wanneer die onder een andere hoofdtaak valt.

Een geblokkeerde subtaak mag pas worden ingepland wanneer alle verplichte voorgangers klaar zijn.

Cyclische afhankelijkheden moeten worden geweigerd.

---

## 6. Schermen

### 6.1 Vandaag

Binnen vijf seconden moet zichtbaar zijn:

- wat nu moet gebeuren;
- wat daarna komt;
- hoeveel vrije werktijd vandaag resteert;
- welke deadlines gevaar lopen;
- wanneer de planning voor het laatst is vernieuwd.

Onderdelen:

- status van de planning;
- knop Planning verversen;
- deadline-alarmen;
- actieve taak;
- tijdlijn met afspraken en taakblokken;
- eerstvolgende taken;
- dagbalans.

### 6.2 Week

De weekweergave toont:

- Outlook-afspraken;
- taakblokken;
- pauzes en buffers;
- vrije tijd;
- deadlinekleuren;
- vastgezette blokken;
- impact bij verslepen.

### 6.3 Taken

Het scherm Taken toont:

- hoofdtaak;
- omschrijving;
- subtaken;
- taakdeadline;
- subtaakdeadlines;
- tijdsinschattingen;
- afhankelijkheden;
- bestanden;
- logboek;
- werkelijke tijd.

### 6.4 Inbox

De Inbox bevat voorstellen uit:

- eenmalige To Do-import;
- Outlook-e-mail;
- handmatige invoer.

Per voorstel:

- bron;
- samenvatting;
- voorgestelde taak of subtaak;
- voorgestelde deadline;
- voorgestelde tijd;
- accepteren;
- aanpassen;
- negeren.

### 6.5 Ochtendbrief

De ochtendbrief toont:

- agenda van vandaag;
- belangrijke nieuwe e-mails;
- voorgestelde acties;
- beschikbare werktijd;
- gepland werk;
- deadlinegevaar;
- eventueel verwacht tijdtekort.

---

## 7. AI-tijdsinschatting

MijnPlanning schat hoeveel actieve werktijd een taak waarschijnlijk kost.

Werkwijze:

1. Analyseer titel en omschrijving.
2. Bepaal welke informatie ontbreekt.
3. Stel gerichte vervolgvragen.
4. Maak een algemene inschatting.
5. Pas een persoonlijke correctie toe.
6. Toon bandbreedte en betrouwbaarheid.
7. Laat de gebruiker kiezen.

Voorbeeld:

```text
Algemene inschatting:    55 minuten
Persoonlijk advies:      70 minuten
Bandbreedte:             60-85 minuten
Betrouwbaarheid:         redelijk hoog
Vergelijkbare taken:     9
```

De gebruiker kan:

- advies overnemen;
- eigen tijd behouden;
- een andere tijd kiezen.

AI adviseert. De gebruiker beslist.

---

## 8. Persoonlijk leren

MijnPlanning bewaart per werkitem:

- algemene AI-inschatting;
- persoonlijke AI-inschatting;
- ondergrens;
- bovengrens;
- betrouwbaarheid;
- aantal vergelijkbare taken;
- door gebruiker gekozen tijd;
- werkelijke actieve tijd;
- totale doorlooptijd;
- pauzes;
- onderbrekingen;
- externe wachttijd;
- modelversie;
- uitleg.

Alleen actieve werktijd telt mee voor de persoonlijke uitvoersnelheid.

Niet meetellen als uitvoersnelheid:

- pauze;
- onderbreking;
- wachten op externe partij;
- reistijd, tenzij onderdeel van de taak;
- een vergeten timer zonder correctie.

Bij weinig voorbeelden weegt de algemene inschatting zwaarder.

Gebruik robuuste statistiek, zoals mediaan en percentielen. Eén uitschieter mag het profiel niet sterk veranderen.

Wanneer de gebruiker opvallend weinig tijd kiest:

```text
Let op: deze tijd lijkt voor jou waarschijnlijk te kort.
MijnPlanning adviseert 70 minuten in plaats van 40 minuten.
```

De gebruikerskeuze blijft staan, maar het risicomodel rekent ook met het waarschijnlijkere scenario.

---

## 9. Tijdregistratie

Mogelijke statussen:

- actief;
- gepauzeerd;
- onderbroken;
- wachten op externe partij;
- afgerond.

MijnPlanning houdt apart bij:

- actieve werktijd;
- pauzetijd;
- onderbreking;
- wachttijd;
- totale doorlooptijd.

---

## 10. Planningsmotor

De definitieve planning wordt berekend met controleerbare TypeScript-domeinlogica.

AI bepaalt de planning niet rechtstreeks.

De planningsmotor houdt minimaal rekening met:

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

Vrije tijd:

```text
werkvensters
- Outlook-afspraken
- pauzes
- buffers
- reistijd
- vastgezette blokken
= vrije werkblokken
```

Deadlinegevaar:

```text
speling = deadline - verwachte afronding
```

---

## 11. Deadline-alarmen

### Groen

Voldoende marge.

### Oranje

Kleine marge of een optimistische aanname.

### Rood

Deadline is op basis van de waarschijnlijke tijd niet haalbaar.

Iedere waarschuwing vermeldt de oorzaak, bijvoorbeeld:

- nieuwe Outlook-afspraak;
- taak liep uit;
- inschatting verhoogd;
- deadline vervroegd;
- afhankelijkheid niet klaar;
- werkdag verkort;
- nieuwe urgente taak.

---

## 12. Herberekening

Herbereken bij:

- nieuwe taak;
- nieuwe subtaak;
- gewijzigde deadline;
- gewijzigde tijdsinschatting;
- start, pauze of afronding;
- nieuwe of gewijzigde Outlook-afspraak;
- geaccepteerde actie uit e-mail;
- gewijzigde werktijden;
- handmatig Planning verversen;
- periodieke alarmcontrole.

De zichtbare timer mag iedere seconde veranderen.

De volledige planning hoeft niet iedere seconde te worden opgeslagen.

---

## 13. Eenmalige Microsoft To Do-import

Microsoft To Do wordt uitsluitend gebruikt voor een eenmalige migratie.

Proces:

```text
Microsoft To Do tijdelijk koppelen
-> lijsten selecteren
-> importvoorvertoning
-> import uitvoeren
-> resultaat controleren
-> To Do-machtiging verwijderen
-> MijnPlanning wordt leidend
```

Mapping:

```text
To Do-titel
-> Task.title

To Do-notitie
-> Task.descriptionOriginal
```

Bewaar exact:

- regeleinden;
- lege regels;
- `-`;
- `*`;
- nummering;
- links;
- hoofdletters;
- leestekens.

MijnPlanning maakt niet automatisch subtaken uit de omschrijving.

Na import:

- geen synchronisatie;
- geen delta-sync;
- geen webhooks;
- geen terugschrijven;
- geen conflictoplossing;
- MijnPlanning is de enige takenomgeving.

Bewaar importmetadata om dubbele import te voorkomen.

---

## 14. Outlook-agenda via Microsoft 365 Family

MijnPlanning krijgt een afzonderlijke Microsoft Graph-koppeling met het persoonlijke Microsoft-account.

De MijnPlanning-login blijft los van Microsoft.

Eerste fase:

- agenda’s selecteren;
- afspraken lezen;
- terugkerende afspraken verwerken;
- afspraken als bezette tijd gebruiken;
- wijzigingen ophalen;
- planning herberekenen.

Later kan eventueel een aparte agenda worden gebruikt voor MijnPlanning-taakblokken.

Schrijfrechten worden pas later toegevoegd.

---

## 15. Outlook-e-mail

MijnPlanning kan later:

- één e-mail samenvatten;
- een gesprek samenvatten;
- acties herkennen;
- deadlines herkennen;
- afspraken herkennen;
- bepalen wie op wie wacht;
- een taak voorstellen;
- benodigde tijd inschatten;
- een antwoordconcept voorbereiden.

Eerste versie:

- lezen;
- analyseren;
- concept tonen;
- niets automatisch verzenden.

Bewaar standaard alleen noodzakelijke metadata, samenvattingen en actievoorstellen.

Kopieer niet standaard de volledige mailbox.

---

## 16. Bestanden

Gebruik Vercel Blob Private voor:

- foto’s;
- screenshots;
- afbeeldingen;
- scans;
- PDF’s;
- Word- en Excel-bestanden;
- bewust opgeslagen e-mailbijlagen.

PostgreSQL bewaart alleen metadata:

- blobpad;
- bestandsnaam;
- MIME-type;
- grootte;
- eigenaar;
- gekoppelde taak of subtaak;
- bron;
- datum.

---

## 17. Login en beveiliging

Voor de MVP:

- één gebruiker;
- e-mailadres en wachtwoord zijn verplicht;
- een gebruikersnaam is niet verplicht;
- een weergavenaam kan later optioneel worden toegevoegd;
- sterk wachtwoord;
- Argon2id-wachtwoordhash;
- veilige server-side sessie;
- HttpOnly-cookie;
- Secure-cookie in productie;
- passende SameSite-instelling;
- rate limiting;
- sessie-intrekking.

Microsoft wordt niet gebruikt als primaire MijnPlanning-login.

Tokens:

- alleen server-side;
- versleuteld opgeslagen;
- nooit in browser;
- nooit in logs;
- verwijderbaar bij ontkoppelen.

---

## 18. Grafisch ontwerp

MijnPlanning moet zijn:

- rustig;
- volwassen;
- compact;
- betrouwbaar;
- functioneel;
- goed leesbaar.

Vermijd:

- generiek AI-dashboard;
- paarse gradients;
- overmatig afgeronde kaarten;
- grote lege vlakken;
- te kleine grijze tekst;
- te veel kleuren;
- decoratieve grafieken zonder besliswaarde.

Kleursemantiek:

- neutraal: gewone informatie;
- groen: haalbaar;
- oranje: kleine marge;
- rood: werkelijk deadlinegevaar;
- blauw of grijs: Outlook-afspraak;
- één accentkleur: primaire actie.

---

## 19. Technische stack

- VS Code;
- Codex;
- Git;
- GitHub;
- Node.js 24 LTS;
- Next.js 16 App Router;
- React 19;
- TypeScript 5;
- Tailwind CSS 3;
- PostgreSQL;
- Prisma 6;
- Vercel;
- Vercel Blob Private;
- Resend;
- Microsoft Graph;
- verwisselbare AI-providerlaag.

---

## 20. Bouwvolgorde

1. Repository, projectbasis, database, login en beveiliging.
2. Taken, subtaken, deadlines en afhankelijkheden.
3. Timer en registratie van actieve tijd.
4. Dag- en weekplanning.
5. Deadline-alarmen.
6. AI-tijdsinschatting en vervolgvragen.
7. Persoonlijk leermodel.
8. Eenmalige To Do-import.
9. Outlook-agenda via Microsoft 365 Family.
10. Outlook-e-mail en ochtendbrief.
11. Bestanden en screenshots.
12. Mobiele optimalisatie en PWA.
13. Beveiliging, foutafhandeling en praktijktests.
14. WhatsApp Business pas later.
