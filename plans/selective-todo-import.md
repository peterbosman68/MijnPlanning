# Uitvoeringsplan — selectieve Microsoft To Do-import

## 1. Doel en gebruikersresultaat

Microsoft Graph levert minimaal één taak terug die Peter in To Do niet meer ziet. De importpreview moet daarom alle importeerbare Graph-taken ter controle tonen en Peter per taak laten bepalen of die wordt gekopieerd.

Na oplevering kan Peter alle kandidaten doorzoeken, taken uitsluiten en uitsluitend de geselecteerde taken eenmalig als hoofdtaken importeren. Het wijzigen of verwijderen van To Do-taken en het automatisch kopiëren van documentbestanden vallen buiten deze wijziging.

## 2. Huidige situatie

- De preview toont alleen de eerste tien titels.
- Alle 93 door Graph geleverde taken zijn automatisch importeerbaar.
- De uitvoerroute accepteert alleen een algemene bevestiging en importeert alle nog onbekende kandidaten.
- Bron-ID's, bronhashes, batch- en itemresultaten voorkomen dubbele import.
- Documentbestanden worden door Graph geblokkeerd en blijven handmatig; veilige links worden wel gekopieerd.

## 3. Functionele interpretatie

- Alle nog niet geïmporteerde Graph-taken worden zichtbaar in de preview.
- Alle kandidaten zijn standaard geselecteerd.
- Peter kan zoeken, alles selecteren, alles uitsluiten en individuele taken aan- of uitvinken.
- Alleen geselecteerde bron-ID's worden naar de uitvoerroute gestuurd.
- De server haalt Graph opnieuw op en importeert alleen geselecteerde ID's die in die actuele respons bestaan en nog niet zijn geïmporteerd.
- Minimaal één taak moet geselecteerd zijn.
- Uitgeschakelde taken worden niet in MijnPlanning aangemaakt en blijven in To Do ongewijzigd.
- Peter heeft deze afwijking van O29 op 11 augustus 2026 expliciet goedgekeurd.

## 4. Bestanden

- `plans/selective-todo-import.md`: dit uitvoeringsplan en voortgang.
- `docs/DECISIONS.md`: besluit over handmatige selectie voor de eenmalige import.
- `lib/microsoft/todo-import.ts`: preview-items en server-side selectiefilter.
- `app/api/todo/import/execute/route.ts`: strikt gevalideerd selectiecontract.
- `app/(protected)/todo-import-preview/page.tsx`: levert alle importeerbare kandidaten aan de client.
- `app/(protected)/todo-import-preview/todo-import-action.tsx`: zoeken, selecteren, bevestigen en uitvoeren.
- `app/(protected)/todo-import-preview/todo-import-preview.module.css`: compacte desktop- en mobiele selectielijst.
- `tests/todo-import.test.ts`: regressietests voor selectie en documentvrije import.

Er worden geen bestanden verwijderd.

## 5. Datamodel en migraties

Er zijn geen schema- of migratiewijzigingen. Bestaande batches en importitems blijven bruikbaar. `sourceCount` registreert alle bij uitvoering opgehaalde kandidaten; `skippedCount` omvat bestaande en bewust uitgesloten kandidaten.

Terugrol bestaat uit het terugdraaien van deze codewijziging vóór de import. Er worden tijdens preview en selectie geen productiegegevens geschreven.

## 6. Beveiliging en privacy

- Bestaande MijnPlanning-authenticatie en origin-controle blijven verplicht.
- De route accepteert maximaal 5.000 unieke, niet-lege bron-ID's.
- Clientselectie wordt niet vertrouwd: de server vergelijkt elk ID met de actuele, gebruikersgebonden Graph-respons.
- Tokens blijven versleuteld en server-side; notities worden niet extra naar logs gestuurd.
- Alleen titels, lijstnamen, status en bron-ID's die al voor de import nodig zijn gaan naar de ingelogde browser.
- De import schrijft niets terug naar Microsoft To Do.

## 7. Implementatiestappen

1. Breid de preview uit met importeerbare selectie-items.
2. Laat de domeinservice een set geselecteerde bron-ID's vereisen en server-side filteren.
3. Valideer de API-payload strikt en geef de selectie door.
4. Bouw een compacte, doorzoekbare selectielijst met alles standaard geselecteerd.
5. Werk bevestiging, aantallen en resultaattekst bij.
6. Documenteer de voortgang en voer alle kwaliteitscontroles uit.

## 8. Tests

- Unit: alleen geselecteerde kandidaten worden aangemaakt.
- Unit: onbekende of niet-geselecteerde bron-ID's leiden niet tot writes.
- Unit: documenttaken en veilige links blijven correct verwerkt.
- Validatie: lege, dubbele, te grote en verkeerd gevormde selecties worden geweigerd.
- Autorisatie/origin: bestaande routebeveiliging blijft actief.
- Handmatig: zoeken, alles selecteren, alles uitsluiten en individuele selectie.
- Browser: desktop en mobiel zonder overlap of onbereikbare actie.
- Volledig: lint, typecheck, tests, build en Playwright.

## 9. Acceptatiecriteria

- `sd` is zichtbaar als Graph-kandidaat en kan worden uitgevinkt.
- Na uitschakelen telt de knop één taak minder.
- De uitvoerpayload bevat uitsluitend geselecteerde bron-ID's.
- De server maakt geen taak aan voor een uitgesloten bron-ID.
- Een gewijzigde Graph-set wordt bij uitvoering opnieuw gecontroleerd.
- To Do blijft ongewijzigd en documentbestanden worden niet opgevraagd.

## 10. Risico's

- Graph kan ook andere niet-zichtbare taken leveren; daarom blijft menselijke controle noodzakelijk.
- 93 regels kunnen op mobiel lang zijn; zoeken en een begrensde scrollzone houden de actie bereikbaar.
- Een taak kan tussen preview en uitvoering veranderen; de server gebruikt daarom een nieuwe Graph-respons.
- Verkeerd uitschakelen kan een gewenste taak overslaan; de selectie is vóór uitvoering zichtbaar en standaard volledig aangevinkt.

## 11. Terugrolmogelijkheid

De wijziging kan vóór import codematig worden teruggedraaid. Na import blijven bestaande importmetadata en de regel tegen dubbele import leidend; er wordt geen automatische dataverwijdering toegevoegd.

## 12. Open beslissingen

Geen. Peter heeft op 11 augustus 2026 expliciet gekozen voor een standaard volledig geselecteerde lijst waarin ongewenste kandidaten handmatig worden uitgevinkt.

## 13. Voortgang

- [x] Probleem bevestigd: Graph levert `sd` nog met status 200 terwijl To Do de taak niet toont.
- [x] Functionele aanpak expliciet goedgekeurd door Peter.
- [x] Domein- en API-selectie geïmplementeerd en gericht getest.
- [x] Previewselectie responsief geïmplementeerd met zoeken en bulkselectie.
- [x] Documentatie bijgewerkt met O31.
- [x] Gerichte tests, lint, typecheck, volledige tests, build en bestaande desktop/mobiele Playwright-suite groen.
- [ ] Productiepreview gecontroleerd; productie-import blijft apart bevestigd.

Afwijking: de bestaande Playwright-opzet heeft geen ingelogde testgebruiker of Graph-fixture en kan de beschermde preview daarom niet lokaal met taakdata renderen. De productiepreview wordt na deployment visueel gecontroleerd; de importactie wordt daarbij niet uitgevoerd.