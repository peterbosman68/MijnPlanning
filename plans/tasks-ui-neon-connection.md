# Uitvoeringsplan — Taken-UI koppelen aan Neon

- Status: **expliciet goedgekeurd door Peter op 10 augustus 2026**
- Datum: **10 augustus 2026**
- Scope: **de bestaande goedgekeurde Taken/Vandaag-shell laten lezen en schrijven via de bestaande server-side takenlaag**

## 1. Doel en gebruikersresultaat

Na uitvoering toont de Taken-UI uitsluitend de taken en subtaken van de ingelogde gebruiker uit Neon. De 93 Microsoft To Do-taken zijn na import en verversen zichtbaar als hoofdtaken, met titel, originele omschrijving, deadline, status en geïmporteerde links of bestanden.

Nieuwe en gewijzigde taken en subtaken worden niet langer alleen in lokale React-state bewaard, maar via de bestaande beveiligde Server Actions en domeinservices opgeslagen.

## 2. Huidige situatie

- `lib/tasks/service.ts` bevat al `getTaskBoardData`, CRUD-services, deadlinevalidatie, dependencycontrole en gebruikersfiltering.
- `app/taken/actions.ts` bevat al beveiligde Server Actions voor taken, subtaken, archiveren en dependencies.
- `AuthenticatedPlanningShell` controleert de sessie, maar haalt nog geen taakdata op.
- `TakenVisualPrototype` gebruikt nog lokale beginstate en lokale mutaties.
- De productie-import schrijft wel naar Neon, maar geïmporteerde taken worden daardoor nog niet in de huidige Taken-UI getoond.
- De twee gevraagde prototypehoofdtaken zijn uit de frontend verwijderd en bestonden niet als Neon-record.

## 3. Functionele interpretatie

- Neon is de enige bron van waarheid voor taken en subtaken.
- Alle gebruikersdata wordt server-side op de ingelogde gebruiker gefilterd.
- Geïmporteerde To Do-taken blijven hoofdtaken en krijgen geen automatische subtaken.
- `descriptionOriginal` wordt ongewijzigd getoond en bewaard.
- Open, wachtende, afgeronde, gearchiveerde en geannuleerde records worden volgens de bestaande navigatiefilters getoond.
- Na een succesvolle mutatie wordt `/taken` opnieuw server-side geladen.
- Bij een fout blijft het formulier bruikbaar en verschijnt de bestaande veilige foutmelding.
- De huidige visuele drieluikstructuur, mobiele stapnavigatie en kolombreedtes blijven behouden.

## 4. Te wijzigen bestanden

Verwacht:

- `app/authenticated-planning-shell.tsx` — gebruikersgebonden boarddata en attachmentmetadata server-side laden.
- `app/(protected)/vandaag/page.tsx` en `app/taken/page.tsx` — geldige taak-/subtaakselectie uit queryparameters doorgeven.
- `app/taken/taken-visual-prototype.tsx` — lokale prototypebron vervangen door serverdata; formulieren en statusacties aan bestaande Server Actions koppelen.
- `app/taken/taken-visual-prototype.module.css` — uitsluitend kleine lege-, laad- of fouttoestanden indien nodig.
- `lib/tasks/service.ts` en `lib/tasks/repository.ts` — alleen het bestaande read model uitbreiden met attachmentmetadata wanneer dat niet via de attachments-module kan.
- `lib/attachments/repository.ts` — gebruikersgebonden batch-read voor taak- en subtaakbijlagen.
- `app/taken/actions.ts` — alleen ontbrekende veilige mutatie- of foutmapping toevoegen.
- gerichte tests onder `tests/` en `tests/e2e/`.
- relevante documentatie en dit plan.

## 5. Datamodel en migraties

Er is geen nieuwe migratie voorzien. De benodigde tabellen, relaties, indexen en constraints bestaan al en de productiedatabase is actueel.

Voor implementatie wordt read-only gecontroleerd dat:

- `Task`, `Subtask` en `TaskAttachment` beschikbaar zijn;
- alle reads op `userId` of via een gebruikersgebonden relatie filteren;
- attachmentrecords precies één taak- of subtaakdoel hebben.

Wanneer tijdens implementatie onverwacht toch een schemawijziging nodig blijkt, stopt de uitvoering en volgt eerst een aanvullend migratievoorstel.

## 6. Beveiliging en privacy

- De servercomponent gebruikt uitsluitend het user-ID uit `requireUser()`.
- Clientdata bevat geen Microsoft-token, sessietoken, Blob-token of databasecredential.
- Server Actions blijven Origin, sessie, eigenaarschap en Zod-invoer valideren.
- Private blobpaden worden niet als publieke URL gerenderd.
- Externe linkbijlagen worden alleen als gevalideerde HTTP(S)-verwijzing getoond.
- Volledige omschrijvingen en bestandsnamen komen niet in logs.

## 7. Implementatiestappen

1. Leg een expliciet, serialiseerbaar Taken-viewmodel vast op basis van `getTaskBoardData`.
2. Breid het read model gebruikersgebonden uit met taak- en subtaakbijlagen.
3. Laat `AuthenticatedPlanningShell` na `requireUser()` de boarddata laden en als initiële props doorgeven.
4. Verwijder de resterende lokale takenbron als productiedatabron uit de clientcomponent.
5. Map database-statussen, deadlines, resterende minuten, blokkades en bijlagen naar de bestaande visuele patronen.
6. Ondersteun een lege database zonder fictieve taken of clientfouten.
7. Geef `taskId` en `subtaskId` uit de URL server-side door zodat redirects na mutaties de juiste selectie openen.
8. Koppel aanmaken en wijzigen van taken en subtaken aan de bestaande Server Actions.
9. Koppel archiveren, afronden, heropenen en dependencyacties aan server-side mutaties; geen lokale schijnopslag blijft actief.
10. Toon geïmporteerde link- en bestandsmetadata in het bestaande compacte bijlagenpatroon zonder private paden prijs te geven.
11. Vervang `$expand=attachments` door de officiële Graph-flow: per taak attachmentmetadata pagineren en ieder bestand afzonderlijk ophalen.
12. Blokkeer preview en import bij een verschil tussen `hasAttachments`, gevonden metadata en succesvol opgehaalde inhoud.
13. Voeg gerichte tests toe voor mapping, lege state, eigenaarschap, bijlagenvolledigheid en zichtbaarheid van geïmporteerde taken.
14. Controleer desktop en mobiel lokaal, voer alle kwaliteitsgates uit, commit en push naar `main`, en verifieer Vercel-productie.
15. Controleer de productiepreview opnieuw. Start de eenmalige To Do-import pas na een daaropvolgende afzonderlijke expliciete bevestiging.

## 8. Testscenario's

- Een geïmporteerde hoofdtaak zonder subtaken verschijnt exact één keer.
- Titel en `descriptionOriginal` blijven exact gelijk aan de databasewaarde.
- Een taak zonder deadline rendert zonder fout.
- Een afgeronde importtaak verschijnt onder Afgerond en niet onder open taken.
- Een lege database toont een rustige lege toestand en geen voorbeelddata.
- Een gebruiker ziet geen taken of bijlagen van een andere gebruiker.
- Na aanmaken, wijzigen of archiveren toont verversen de opgeslagen Neon-waarde.
- Een subtaakdeadline na de taakdeadline blijft server-side geweigerd.
- Een private bijlage toont metadata maar geen publiek blobpad.
- Een veilige linkbijlage is herkenbaar en klikbaar; onveilige schema's worden niet gerenderd.
- Desktop en mobiel behouden de goedgekeurde navigatie, lijst en detailhiërarchie.

Verplichte gates:

```text
npm run lint
npm run typecheck
npm run test
npm run build
```

De database-integratietest wordt alleen tegen een aantoonbaar geïsoleerde testdatabase uitgevoerd; nooit tegen productie wanneer de test records verwijdert.

## 9. Acceptatiecriteria

- Neon is de enige taken- en subtakenbron in de productie-UI.
- Na de To Do-import zijn alle geïmporteerde hoofdtaken na verversen zichtbaar.
- Er verschijnen geen vaste voorbeeldtaken.
- Alle taak- en subtaakmutaties zijn server-side opgeslagen of duidelijk als nog niet beschikbaar uitgeschakeld; lokale schijnopslag bestaat niet.
- Eigenaarschap, deadlinehiërarchie en importbronbehoud blijven gehandhaafd.
- Bijlagen worden compact en veilig getoond.
- Lint, typecheck, tests en build zijn groen.
- Productie-healthcheck, desktopweergave en mobiele weergave zijn gecontroleerd.

## 10. Risico's

- De clientcomponent bevat veel lokale interactielogica; een gedeeltelijke omzetting kan schijnopslag achterlaten.
- De 93 geïmporteerde taken kunnen de huidige compacte lijst belasten; filtering en rendering moeten zonder merkbare blokkering blijven werken.
- Geïmporteerde taken hebben vaak nog geen tijdsinschatting; de UI moet `Nog te schatten` correct tonen.
- Private bestanden vereisen later mogelijk een afzonderlijke geautoriseerde downloadroute; tot die tijd wordt geen onveilige directe bloblink getoond.
- Gedeeltelijk doorschuiven naar een tweede taak of subtaak vereist een atomische servermutatie; de UI blokkeert dit voorlopig met uitleg in plaats van één deel lokaal of onvolledig op te slaan.
- `Vandaag` is nog geen volledige planningsmotorweergave; deze wijziging maakt echte taken zichtbaar maar introduceert geen nieuwe planningregels.

## 11. Terugrolmogelijkheid

- Code kan met een normale revertcommit worden teruggedraaid; geen force push.
- Er is geen schemamigratie en geen dataconversie.
- De To Do-import wordt pas na productiecontrole gestart, zodat terugrol vóór import geen geïmporteerde records raakt.
- Bestaande Neon-taken blijven bij een code-terugrol intact.

## 12. Open beslissingen en goedkeuring

Aanbevolen keuze voor deze stap:

- implementeer de volledige minimale verticale slice: database-read, zichtbare bijlagenmetadata en alle reeds aanwezige taak-/subtaakmutaties via de bestaande Server Actions;
- voeg geen planningsmotor, e-mailfunctionaliteit of nieuwe databasevelden toe;
- stel echte private bestandsdownload uit wanneer daarvoor nog geen geautoriseerde route bestaat, maar toon bestandsmetadata wel.

Na expliciete goedkeuring wordt deze afgebakende implementatie uitgevoerd. De daadwerkelijke eenmalige productie-import blijft daarna een afzonderlijk bevestigingsmoment.

## 13. Voortgang

- [x] Productdocumentatie en bestaande takenlaag geïnventariseerd.
- [x] Vastgesteld dat geen databasemigratie nodig is.
- [x] Gericht uitvoeringsplan opgesteld.
- [x] Plan expliciet goedgekeurd.
- [x] Server-side boardread en bijlagenread gekoppeld.
- [x] Lokale schijnopslag vervangen door Server Actions.
- [x] Officiële Graph list/get-flow voor bestandsbijlagen fail-closed gemaakt.
- [x] Na vastgestelde `401 accessDenied` voor persoonlijke To Do-documenten aangepast: documenten worden niet opgevraagd, zes betrokken taken worden in de preview voor handmatige overdracht gemarkeerd en links blijven importeerbaar (goedgekeurd 11 augustus 2026).
- [x] Gerichte tests en alle kwaliteitsgates groen (lint, typecheck, 46 tests, build en 16 Playwright-tests).
- [x] Commit, push en Vercel-productiecontrole afgerond; deployment `ff52688` is Ready en de healthroute meldt `ok`.
- [ ] Ingelogde desktop-/mobiele Taken-controle en productiepreview opnieuw uitgevoerd met Peters bestaande sessie.
- [ ] Productie-import afzonderlijk bevestigd en uitgevoerd.