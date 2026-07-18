# MijnPlanning — regels voor uitvoeringsplannen

Grote wijzigingen worden eerst uitgewerkt in een uitvoeringsplan.

De plannen staan in:

```text
plans/
```

Voorbeelden:

```text
plans/phase-00-01-foundation.md
plans/phase-02-time-tracking.md
plans/phase-03-planning-engine.md
```

---

## 1. Wanneer is een uitvoeringsplan verplicht?

Een uitvoeringsplan is verplicht bij:

- nieuwe grote functionaliteit;
- databasewijziging;
- nieuwe externe integratie;
- wijziging van de planningsmotor;
- wijziging van login of beveiliging;
- grote UI-herbouw;
- nieuwe AI-provider;
- datamigratie;
- wijziging met meerdere bestanden en afhankelijkheden.

Een kleine tekstcorrectie of afgebakende bugfix hoeft geen volledig plan te krijgen.

---

## 2. Verplichte inhoud

Ieder uitvoeringsplan bevat minimaal de volgende onderdelen.

### 2.1 Doel

Beschrijf:

- welk gebruikersprobleem wordt opgelost;
- wat de gebruiker na oplevering kan;
- wat buiten deze wijziging valt.

### 2.2 Huidige situatie

Beschrijf:

- relevante bestaande code;
- relevante tabellen en modellen;
- bestaande schermen;
- bestaande beperkingen;
- technische schuld die deze wijziging raakt.

### 2.3 Functionele interpretatie

Beschrijf in gewone taal:

- hoe de functie moet werken;
- welke productregels gelden;
- welke uitzonderingen bestaan;
- welke keuzes nog openstaan.

Verzin geen productregels.

### 2.4 Bestanden

Noem alle bestanden die worden:

- toegevoegd;
- gewijzigd;
- verwijderd.

Leg per bestand kort uit waarom.

### 2.5 Datamodel en migraties

Beschrijf:

- nieuwe modellen;
- nieuwe velden;
- relaties;
- constraints;
- indexen;
- migratiestappen;
- terugrolmogelijkheid;
- gevolgen voor bestaande gegevens.

### 2.6 Beveiliging en privacy

Beschrijf:

- authenticatie;
- autorisatie;
- tokenopslag;
- dataminimalisatie;
- logging;
- bestanden;
- secrets;
- mogelijke misbruikscenario’s.

### 2.7 Implementatiestappen

Maak genummerde, controleerbare stappen.

Iedere stap moet klein genoeg zijn om apart te testen.

### 2.8 Tests

Beschrijf minimaal:

- unit-tests;
- integratietests;
- validatietests;
- foutscenario’s;
- autorisatietests;
- handmatige browsertests;
- mobiele tests.

### 2.9 Acceptatiecriteria

Formuleer waarneembare criteria.

Voorbeeld:

```text
Wanneer een taakdeadline 31 juli 17.00 is,
kan een subtaakdeadline op 1 augustus niet worden opgeslagen.
```

### 2.10 Risico’s

Beschrijf:

- technische risico’s;
- datarisico’s;
- privacyrisico’s;
- prestatieproblemen;
- afhankelijkheden van externe diensten;
- mogelijke terugvalopties.

### 2.11 Open beslissingen

Noem alles wat Peter nog moet beslissen.

Ga niet programmeren wanneer een open beslissing de functionele werking wezenlijk verandert.

### 2.12 Voortgang

Houd tijdens de uitvoering bij:

- wat klaar is;
- wat gewijzigd is ten opzichte van het plan;
- welke problemen zijn gevonden;
- welke besluiten zijn genomen;
- welke tests zijn uitgevoerd.

---

## 3. Goedkeuringsmoment

Codex maakt eerst het plan.

Daarna stopt Codex en wacht op expliciete goedkeuring van Peter.

Gebruik bijvoorbeeld:

```text
Het uitvoeringsplan is gereed.
Er is nog geen code gewijzigd.
Wacht op goedkeuring voordat de implementatie begint.
```

---

## 4. Uitvoering na goedkeuring

Na goedkeuring:

1. Maak of gebruik een featurebranch.
2. Voer de stappen in de afgesproken volgorde uit.
3. Werk het plan bij wanneer er iets verandert.
4. Voer na iedere betekenisvolle stap relevante tests uit.
5. Voer vóór afronding uit:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

6. Meld afwijkingen en open risico’s.
7. Voeg niet stilzwijgend extra scope toe.

---

## 5. Definition of Done voor een uitvoeringsplan

Een plan is gereed wanneer:

- het zelfstandig leesbaar is;
- productregels correct zijn verwerkt;
- bestanden zijn benoemd;
- databasegevolgen zijn beschreven;
- beveiliging is beoordeeld;
- tests zijn beschreven;
- acceptatiecriteria concreet zijn;
- risico’s zijn benoemd;
- open beslissingen zichtbaar zijn;
- Codex nog geen code heeft gewijzigd.
