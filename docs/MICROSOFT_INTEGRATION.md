# MijnPlanning — Microsoft-integratie

## 1. Uitgangspunt

MijnPlanning wordt gekoppeld aan een persoonlijk Microsoft-account binnen Microsoft 365 Family.

De MijnPlanning-login blijft volledig los van Microsoft.

Microsoft wordt gebruikt als externe gegevensbron.

---

## 2. Functies

Microsoft-integratie wordt gebruikt voor:

1. eenmalige Microsoft To Do-import;
2. Outlook-agenda lezen;
3. later eventueel geplande blokken terugschrijven;
4. Outlook-e-mail lezen;
5. later eventueel concepten opslaan.

---

## 3. Accountkoppeling

Gebruik OAuth via Microsoft Graph.

Bewaar:

- Microsoft-account-ID;
- e-mailadres;
- verleende scopes;
- versleutelde tokencache;
- laatste synchronisatietijd;
- ontkoppelstatus.

Tokens:

- alleen server-side;
- versleuteld;
- nooit in browser;
- nooit in logs;
- verwijderen bij ontkoppelen.

---

## 4. Machtigingen gefaseerd aanvragen

### Basis

```text
openid
profile
offline_access
```

### Eenmalige To Do-import

Gebruik alleen het minimale leesrecht dat nodig is voor import.

Na succesvolle import:

- To Do-toegang intrekken of niet meer gebruiken;
- geen schrijfrechten aanvragen;
- geen blijvende sync.

### Outlook-agenda

Eerste fase:

```text
Calendars.Read
```

Later, alleen na goedkeuring:

```text
Calendars.ReadWrite
```

### Outlook-e-mail

Eerste fase:

```text
Mail.Read
```

Later voor concepten:

```text
Mail.ReadWrite
```

Verzenden pas als laatste mogelijke uitbreiding:

```text
Mail.Send
```

Inhoudelijke e-mails worden nooit automatisch verzonden.

---

## 5. Eenmalige Microsoft To Do-import

### Doel

De bestaande To Do-taken één keer migreren naar MijnPlanning.

### Proces

1. Microsoft-account koppelen.
2. To Do-lijsten ophalen.
3. Gebruiker kiest lijsten.
4. Voorvertoning tonen.
5. Import bevestigen.
6. Taken importeren.
7. Resultaat controleren.
8. Importbatch afsluiten.
9. To Do-toegang verwijderen of niet meer gebruiken.

### Mapping

```text
To Do-titel
-> Task.title

To Do-notitie/body
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

### Geen automatische structuur

- Geen automatische subtaken.
- Geen automatische projectindeling.
- AI mag alleen een voorstel tonen.
- Gebruiker moet goedkeuren.

### Geen blijvende sync

Na import:

- geen delta-sync;
- geen webhook;
- geen terugschrijven;
- geen status-sync;
- geen conflictregels;
- MijnPlanning is leidend.

Bewaar import-ID’s en hashes om duplicaten te voorkomen.

---

## 6. Outlook-agenda

### Eerste fase

- agenda’s tonen;
- gebruiker kiest agenda’s;
- afspraken lezen;
- terugkerende afspraken verwerken;
- geannuleerde afspraken verwerken;
- bezette tijd bepalen;
- planning opnieuw berekenen.

Gebruik `calendarView` of gelijkwaardige Graph-functionaliteit voor een periode, zodat terugkerende afspraken als voorkomens worden verwerkt.

### Vrije tijd

Outlook-afspraken gelden als geblokkeerde tijd.

Later kunnen worden toegevoegd:

- reistijd;
- standaardbuffer;
- selectie op beschikbaarheidsstatus;
- aparte MijnPlanning-agenda.

### Schrijven naar Outlook

Niet in de eerste stap.

Later eventueel:

- aparte agenda `MijnPlanning-planning`;
- geplande taakblokken toevoegen;
- alleen na expliciete toestemming;
- handmatig vastgezette blokken behouden.

---

## 7. Outlook-e-mail

### Eerste fase

MijnPlanning mag:

- nieuwe e-mails ophalen;
- gesprekken groeperen;
- samenvatten;
- acties herkennen;
- deadlines herkennen;
- vaststellen wie op wie wacht;
- taken voorstellen;
- tijd inschatten;
- antwoordconcepten tonen.

### Opslag

Wel bewaren:

- Microsoft-message-ID;
- conversation-ID;
- onderwerp;
- afzender;
- ontvangstdatum;
- samenvatting;
- classificatie;
- actievoorstellen;
- herkende deadline.

Niet standaard bewaren:

- volledige body;
- volledige mailboxkopie;
- alle bijlagen;
- alle handtekeningen;
- alle disclaimers.

### Verzenden

Eerste versie:

- alleen concept tonen;
- niets automatisch verzenden.

Later:

- concept in Outlook opslaan;
- pas daarna eventueel handmatig verzenden.

---

## 8. Synchronisatie

### Agenda

Gebruik:

- eerste volledige sync;
- daarna delta-sync waar beschikbaar;
- webhook/change notification waar zinvol;
- periodieke controle als vangnet.

### E-mail

Gebruik:

- eerste verwerking vanaf gekozen startmoment;
- daarna alleen nieuwe en gewijzigde berichten;
- idempotente verwerking;
- herhaalbare foutafhandeling.

### To Do

Geen blijvende synchronisatie.

---

## 9. Foutafhandeling

Toon duidelijke statussen:

- gekoppeld;
- synchronisatie bezig;
- laatste sync;
- toestemming verlopen;
- opnieuw verbinden;
- gedeeltelijke fout;
- import afgerond.

Retries mogen geen dubbele taken of e-mailacties maken.

---

## 10. Privacy

- Vraag minimale rechten.
- Toon welke rechten actief zijn.
- Laat de gebruiker ontkoppelen.
- Verwijder tokens bij ontkoppeling.
- Bewaar geen onnodige broninhoud.
- Stuur alleen noodzakelijke tekst naar AI.
- Log geen volledige e-mails of tokens.
