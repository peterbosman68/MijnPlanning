# MijnPlanning — voorlopig visueel voorstel O20

- Status: **voorstel ter visuele beoordeling door Peter**
- Datum: **18 juli 2026**
- Scope: **uitsluitend visuele proef van `/taken`**
- Besluitstatus: **nog niet definitief; `docs/DECISIONS.md` blijft ongewijzigd**

## 1. Ontwerpintentie

MijnPlanning moet aanvoelen als een rustig en betrouwbaar werkinstrument: compact genoeg om snel te scannen, maar ruim en leesbaar genoeg voor dagelijks gebruik door een gebruiker van ongeveer zestig jaar. De interface gebruikt één duidelijke primaire actie, weinig schaduw, herkenbare hiërarchie en statuskleuren die altijd door tekst worden ondersteund.

De proef vermijdt paarse gradients, een generiek dashboard, decoratieve grafieken, grote lege vlakken, overmatig afgeronde kaarten, te kleine lichtgrijze tekst en meerdere concurrerende primaire knoppen.

## 2. Kleurenpalet

### 2.1 Neutrale basis

| Token | Hex | Gebruik |
|---|---:|---|
| Achtergrond | `#F3F5F2` | rustige pagina-achtergrond |
| Oppervlak | `#FFFFFF` | hoofdpanelen, formulieren |
| Oppervlak subtiel | `#F8FAF8` | compacte rijen en secundaire vlakken |
| Oppervlak geselecteerd | `#E7F1EE` | geselecteerde taak |
| Rand standaard | `#CDD6D0` | panelen, velden en scheidingen |
| Rand sterk | `#A9B7AF` | actieve of belangrijke scheiding |
| Tekst primair | `#19231F` | koppen en hoofdtekst |
| Tekst secundair | `#526159` | toelichting en metadata |
| Tekst gedempt | `#66756D` | uitsluitend niet-kritieke aanvullende tekst |

### 2.2 Primaire accentkleur

| Token | Hex | Gebruik |
|---|---:|---|
| Accent primair | `#0E6B63` | primaire actie en actieve selectie |
| Accent hover | `#0A554F` | hover en actieve knop |
| Accent zacht | `#E3F0ED` | geselecteerde achtergrond en subtiele nadruk |
| Accent op donker | `#FFFFFF` | tekst op primaire actie |

Petrol is gekozen omdat het volwassen en rustig oogt, duidelijk van de risico- en Outlookkleuren verschilt en voldoende contrast biedt met witte tekst.

### 2.3 Status- en betekeniskleuren

| Betekenis | Voorgrond | Achtergrond | Rand |
|---|---:|---:|---:|
| Groen — haalbaar of afgerond | `#23643F` | `#E9F5ED` | `#A7CFB5` |
| Oranje — kleine marge of aandacht | `#94500C` | `#FFF3E2` | `#E5B36D` |
| Rood — werkelijk deadlinegevaar of fout | `#A32D35` | `#FDECEE` | `#E3A0A5` |
| Outlook blauw | `#2E5F88` | `#EAF2F9` | `#A9C6DD` |
| Neutrale status | `#46534D` | `#EEF1EF` | `#C9D0CC` |

Rood wordt uitsluitend gebruikt wanneer daadwerkelijk actie nodig is. Iedere kleur verschijnt samen met een kort tekstlabel en waar nodig een oorzaak.

## 3. Typografie

Lettertypefamilie:

```text
ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Er wordt geen extern font geladen. Dit houdt de proef snel, privacyvriendelijk en herkenbaar op Windows en Samsung/Android.

| Niveau | Desktop | Mobiel | Regelhoogte | Gewicht |
|---|---:|---:|---:|---:|
| Paginatitel | 32 px | 28 px | 1.2 | 700 |
| Sectietitel | 22 px | 21 px | 1.35 | 700 |
| Kaarttitel | 18 px | 18 px | 1.4 | 650 |
| Basis tekst | 16 px | 16 px | 1.55 | 400 |
| Compacte tekst | 15 px | 15 px | 1.45 | 400–600 |
| Label en metadata | 14 px | 14 px | 1.45 | 600 |
| Knoptekst | 15 px | 15 px | 1.35 | 650 |

Tijden en duren gebruiken tabulaire cijfers. Ondersteunende tekst wordt niet kleiner dan 14 px.

## 4. Spacing en afmetingen

Vaste spacing-schaal:

```text
4, 8, 12, 16, 20, 24, 32, 40, 48 px
```

- Desktopinhoud: maximaal 1240 px breed, 32 px zijruimte.
- Compact desktop/tablet: 24 px zijruimte.
- Mobiel: 16 px zijruimte en 12–16 px paneelvulling.
- Standaard veld- en knophoogte: minimaal 44 px.
- Primaire mobiele actie: minimaal 48 px hoog.
- Klikvlak voor icoonknoppen: minimaal 44 × 44 px.
- Formulierbreedte: maximaal 760 px binnen het detailpaneel.

## 5. Hoeken, randen en schaduw

| Element | Radius |
|---|---:|
| Invoerveld en compacte knop | 6 px |
| Paneel en taakkaart | 8 px |
| Statuslabel | 999 px, uitsluitend voor korte labels |

- Standaard rand: 1 px `#CDD6D0`.
- Actieve selectie: 2 px accentlijn of duidelijke accentachtergrond.
- Standaardschaduw: `0 1px 2px rgba(25, 35, 31, 0.08)`.
- Geen grote zwevende schaduwen; hiërarchie komt primair uit randen, ruimte en achtergrond.

## 6. Knoppen

### Primary

- Petrol `#0E6B63`, witte tekst, minimaal 44 px hoog.
- Alleen voor de belangrijkste actie in het paneel, bijvoorbeeld `Nieuwe taak` of `Opslaan`.
- Hover `#0A554F`; disabled neutraal en duidelijk niet-actief.

### Secondary

- Wit oppervlak, rand `#A9B7AF`, tekst `#27342E`.
- Voor `Bewerken`, `Annuleren` en vergelijkbare acties.

### Ghost

- Geen blijvend vlak; subtiele neutrale hoverachtergrond.
- Voor uitklappen, inklappen en kleine navigatiehandelingen.

### Destructive

- Witte of lichtrode achtergrond met rode tekst en rand.
- Alleen voor echte destructieve handelingen; niet nodig in deze proef.

## 7. Formulieren en foutmeldingen

- Labels blijven altijd zichtbaar boven het veld.
- Velden hebben een 1 px neutrale rand, witte achtergrond en minimaal 44 px hoogte.
- Hover gebruikt de sterke neutrale rand; focus gebruikt de expliciete focusring.
- Helptekst staat direct onder het veld en is minimaal 14 px.
- Foutvelden gebruiken rode rand en lichtrode achtergrond.
- Foutmelding: rood tekstlabel met concreet hersteladvies direct onder het veld.
- Formulieren voor taken en subtaken gebruiken een expliciete knop `Opslaan`.
- In de visuele proef verwerkt `Opslaan` uitsluitend lokale React-state en meldt de interface expliciet dat niets extern is opgeslagen.

## 8. Statuslabels en waarschuwingen

Statuslabels zijn compact, maar bevatten altijd tekst:

- `Open`: neutraal;
- `Wachten`: neutraal met warmere nadruk;
- `Afgerond`: groen;
- `Geblokkeerd`: neutraal/donker met expliciete afhankelijkheidsuitleg;
- `Op tijd`: groen;
- `Kleine marge`: oranje;
- `Risico`: rood.

Een deadlinewaarschuwing bevat minimaal:

1. het niveau in tekst;
2. de relevante deadline;
3. de oorzaak;
4. de gewenste actie wanneer het niveau rood is.

## 9. Focus en toegankelijkheid

- Focusring: 3 px `#2563EB` met 2 px witte offset.
- Focus is zichtbaar op knoppen, links, invoervelden, selects en uitklapbediening.
- Kleur is nooit de enige informatiedrager.
- Interacties zijn met toetsenbord bedienbaar.
- Logische documentvolgorde blijft op mobiel gelijk aan de visuele volgorde.
- Statusupdates gebruiken waar relevant `aria-live="polite"`.
- De proef gebruikt semantische koppen, veldlabels, `aria-expanded` en duidelijke knopnamen.

## 10. Responsive breekpunten

| Bereik | Gebruik |
|---|---|
| 0–639 px | mobiel, één kolom, 16 px zijruimte |
| 640–1023 px | compacte tablet/desktop, gestapelde panelen |
| 1024–1279 px | desktop, taaklijst en detail naast elkaar |
| 1280 px en breder | brede desktop, inhoud begrensd op 1240 px |

Verplichte beoordelingsformaten: 1440×900, 1024×768, 390×844 en 360×800. Controleer daarnaast toetsenbordgebruik en 200% browserzoom.

## 11. Taken-proef

Desktop gebruikt een compacte taaklijst links en het geselecteerde taakdetail rechts. Mobiel stapelt kop, takenlijst, detail, subtaken en formulier in dezelfde logische volgorde. Hoofdtaken hebben meer visueel gewicht dan subtaken; subtaken gebruiken een ingesprongen lijn en compactere rijen.

Alle gegevens in `/taken` zijn expliciet gemarkeerde voorbeeldgegevens. De proef gebruikt geen API, databasewrite, productiegegevens of definitief productdatamodel.

## 12. Te beoordelen keuzes

Peter beoordeelt vóór definitieve vastlegging minimaal:

- petrol als primaire accentkleur;
- warmte en contrast van de neutrale basis;
- leesbaarheid van 14–16 px tekst;
- informatiedichtheid op desktop en mobiel;
- hiërarchie tussen taak en subtaak;
- vorm en nadruk van statuslabels;
- sterkte van groen, oranje en rood;
- formulierdichtheid en de zichtbaarheid van `Opslaan`;
- radii, randen, beperkte schaduw en focusring;
- de gekozen breekpunten en mobiele stapeling.
