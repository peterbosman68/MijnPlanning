# PLANS.md — regels voor uitvoeringsplannen

Dit bestand is de enige bron van waarheid voor uitvoeringsplannen binnen MijnPlanning.

Een uitvoeringsplan beschrijft vooraf hoe een betekenisvolle wijziging veilig, controleerbaar en terugdraaibaar wordt uitgevoerd. Het plan geeft nog geen toestemming om applicatiecode, dependencies, Git, databases of externe infrastructuur te wijzigen. Implementatie begint pas na expliciete goedkeuring van Peter.

## 1. Wanneer een uitvoeringsplan verplicht is

Een uitvoeringsplan is verplicht bij:

- een nieuwe productfase of grotere functionaliteit;
- een wijziging die meerdere modules of schermen raakt;
- een nieuw of gewijzigd datamodel;
- database- of Prisma-migraties;
- authenticatie-, autorisatie-, sessie-, privacy- of beveiligingswerk;
- een nieuwe externe koppeling, provider, infrastructuurdienst of productieafhankelijkheid;
- wijzigingen aan de planningsmotor of andere belangrijke bedrijfsregels;
- een destructieve, moeilijk terugdraaibare of operationeel risicovolle wijziging;
- een wijziging waarvoor productkeuzes of technische stop/go-besluiten nodig zijn.

Een klein, lokaal en eenvoudig terugdraaibaar documentatie- of codeherstel kan zonder afzonderlijk uitvoeringsplan, mits doel, scope, tests en resultaat vooraf kort worden benoemd en geen productregel wordt gewijzigd.

## 2. Plaats, naam en status

- Plaats uitvoeringsplannen in `plans/`.
- Gebruik een duidelijke naam, bijvoorbeeld `plans/phase-00-01-foundation.md`.
- Vermeld bovenaan minimaal status, datum, scope en of implementatie is gestart.
- Houd het plan tijdens uitvoering actueel; het is zowel ontwerpdocument als voortgangslogboek.
- Verwijs naar de relevante actuele projectdocumentatie en volg de vastgelegde volgorde van gezag.

## 3. Verplichte inhoud

Ieder uitvoeringsplan bevat minimaal de volgende onderdelen.

### 3.1 Doel en gebruikersresultaat

- Beschrijf welk probleem wordt opgelost.
- Beschrijf concreet wat de gebruiker na voltooiing kan doen of ervaren.
- Benoem wat nadrukkelijk buiten scope valt.

### 3.2 Huidige situatie

- Beschrijf de bestaande code, documentatie, infrastructuur en relevante beperkingen.
- Benoem bekende afwijkingen, ontbrekende onderdelen en bestaande gebruikerswijzigingen die behouden moeten blijven.
- Controleer vóór Git- of infrastructuurwerk de werkelijke lokale en externe toestand.

### 3.3 Functionele interpretatie

- Vertaal de opdracht naar expliciete product- en bedrijfsregels.
- Benoem randgevallen, foutgedrag en gebruikerskeuzes.
- Verzin geen nieuwe productregel; registreer meerdere mogelijke interpretaties als open beslissing.

### 3.4 Te wijzigen bestanden en structuur

- Noem per stap welke bestanden of mappen worden toegevoegd of gewijzigd.
- Leg uit waarom ieder bestand nodig is.
- Houd UI, domeinlogica, database, beveiliging en externe koppelingen gescheiden.

### 3.5 Datamodel en migraties

- Beschrijf nieuwe of gewijzigde modellen, velden, relaties, enums, indexen en constraints.
- Beschrijf migratievolgorde, datagevolgen, testomgeving en terugrol- of herstelstrategie.
- Markeer destructieve migraties afzonderlijk; deze vereisen expliciete toestemming.
- Gebruik geen productiegegevens voor tests.

### 3.6 Beveiliging en privacy

- Beoordeel authenticatie, autorisatie, sessies, secrets, logging, invoervalidatie, privacy en dataminimalisatie.
- Benoem eigenaarschapscontroles, misbruikscenario’s en gevoelige gegevensstromen.
- Leg vast welke controles server-side en welke aanvullend in de database plaatsvinden.

### 3.7 Implementatiestappen

Nummer de stappen in uitvoeringsvolgorde. Vermeld per stap minimaal:

- doel;
- toe te voegen of te wijzigen bestanden;
- databasegevolgen;
- beveiligings- en privacygevolgen;
- tests;
- acceptatiecriteria;
- risico’s;
- afhankelijkheden van eerdere stappen;
- eventuele stop/go-poort.

Een stap mag pas beginnen wanneer de vereiste eerdere stappen en goedkeuringen zijn afgerond.

### 3.8 Tests

Beschrijf minimaal:

- unit-tests voor domeinregels;
- integratietests voor database, transacties en servermutaties;
- autorisatie- en beveiligingstests;
- browsertests voor belangrijke gebruikersstromen;
- handmatige desktop- en mobiele controles;
- regressietests voor iedere geraakte niet-onderhandelbare productregel;
- de afsluitende lint-, typecheck-, test- en buildcontroles zodra deze scripts bestaan.

Tests moeten ook negatieve scenario’s, race conditions en terugrol of transactionele rollback behandelen wanneer die relevant zijn.

### 3.9 Acceptatiecriteria

- Formuleer observeerbare, toetsbare criteria per stap en per fase.
- Neem functioneel gedrag, beveiliging, database-integriteit, desktop, mobiel en documentatie mee.
- Vermijd criteria als “werkt goed” zonder meetbaar resultaat.

### 3.10 Risico’s en terugrol

- Benoem technische, functionele, beveiligings-, privacy-, kosten- en operationele risico’s.
- Geef per belangrijk risico een maatregel, detectiemethode en stopconditie.
- Beschrijf hoe applicatie, database, configuratie en feature veilig kunnen worden hersteld.
- Een mislukte stop/go-test wordt eerst gerapporteerd; de stack of productregel wordt niet zelfstandig gewijzigd.

### 3.11 Open beslissingen

- Nummer iedere open beslissing.
- Vermeld mogelijke keuzes, aanbeveling, gevolgen, eigenaar en of de beslissing blokkerend is.
- Maak onderscheid tussen productkeuzes van Peter, technische standaardbesluiten en veilig uitstelbare keuzes.
- Markeer een beslissing pas als besloten nadat Peter deze expliciet heeft vastgesteld.

### 3.12 Voortgang

- Gebruik per stap een duidelijke status: `niet gestart`, `bezig`, `geblokkeerd` of `gereed`.
- Noteer uitgevoerde controles, relevante resultaten en afwijkingen van het plan.
- Houd resterende risico’s en nieuwe beslissingen zichtbaar.
- Markeer een fase niet als gereed zolang verplichte tests of goedkeuringen ontbreken.

### 3.13 Goedkeuringsmomenten

- Peter keurt het uitvoeringsplan expliciet goed voordat implementatie begint.
- Nieuwe productkeuzes, stackafwijkingen, betaalde infrastructuur en destructieve migraties vereisen afzonderlijke expliciete toestemming.
- Bij frontendwerk geldt na de technische projectbasis een verplichte visuele stop/go-poort: eerst een concreet kleurenpalet met hexwaarden en vastgelegde typografie, spacing, knoppen, formulieren en statuslabels; daarna één werkende visuele versie van Taken op desktop en mobiel. Bouw geen overige volledige schermen en pas het ontwerp niet breder toe voordat Peter dit visueel heeft goedgekeurd.
- Een goedkeuring voor één stap geldt niet automatisch voor later toegevoegde scope.

## 4. Definition of Done

Een plan of fase is pas gereed wanneer:

- het afgesproken gebruikersresultaat is bereikt;
- alle relevante productregels aantoonbaar zijn gevolgd;
- alle implementatiestappen en acceptatiecriteria zijn afgerond;
- datamodel en migraties zijn gereviewd, uitgevoerd en getest waar van toepassing;
- server-side validatie, autorisatie, beveiliging en privacy zijn beoordeeld;
- foutgevallen, concurrency en terugrol passend zijn getest;
- relevante unit-, integratie- en browsertests slagen;
- lint, typecheck, tests en build slagen zodra de scripts bestaan;
- desktop en mobiel handmatig zijn gecontroleerd bij frontendwerk;
- de verplichte visuele goedkeuring is verkregen voordat het ontwerp breed is toegepast;
- documentatie, besluiten en voortgang zijn bijgewerkt;
- er geen onverklaarde afwijkingen of blokkerende open beslissingen overblijven;
- resterende operationele risico’s expliciet zijn gemeld.

## 5. Wijzigingen aan een goedgekeurd plan

Wanneer tijdens uitvoering nieuwe informatie de scope, stack, productregels, datamigratie of risicobeoordeling wezenlijk verandert:

1. stop het geraakte werk;
2. werk het uitvoeringsplan en zo nodig `docs/DECISIONS.md` bij;
3. leg gevolgen, alternatieven en terugrol vast;
4. vraag opnieuw expliciete goedkeuring voordat het gewijzigde deel wordt uitgevoerd.
