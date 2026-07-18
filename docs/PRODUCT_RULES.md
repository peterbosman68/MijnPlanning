# MijnPlanning — productregels

Dit document bevat de harde functionele regels.

Codex mag deze regels niet zelfstandig veranderen.

---

## 1. Terminologie

- Een taak is de hoofdtaak.
- Een subtaak is een concreet uitvoerbaar onderdeel van een taak.
- Gebruik in de UI de woorden `taak` en `subtaak`.
- Gebruik de oude naam `Spoorwerk` niet in nieuwe code of schermen.

---

## 2. Taken

- Een taak heeft verplicht een titel.
- Een taakomschrijving mag leeg zijn.
- Een taak kan nul, één of meerdere subtaken hebben.
- Een taakdeadline is optioneel.
- Een taakduur mag bij de eerste invoer leeg zijn.
- Een taak zonder subtaken is pas planbaar wanneer een tijdsinschatting is ingevuld of geaccepteerd.
- Een taak zonder subtaken kan zelf uitvoerbaar zijn.
- Zodra subtaken bestaan, wordt de taak niet daarnaast nogmaals als extra werk ingepland.
- De resterende taakduur wordt dan afgeleid uit open subtaken.

---

## 3. Subtaken

- Iedere subtaak heeft verplicht een titel.
- Een subtaakomschrijving mag leeg zijn.
- Iedere subtaak heeft verplicht een deadline.
- Iedere subtaak heeft een geschatte actieve werktijd.
- Iedere subtaak heeft een resterende actieve werktijd.
- Iedere subtaak heeft een status.
- Een subtaak kan afhankelijkheden hebben.
- Een subtaak kan opsplitsbaar of niet-opsplitsbaar zijn.
- Een subtaak kan een vroegste start hebben.
- Een subtaak kan een minimale blokduur hebben.

---

## 4. Deadlinehiërarchie

- Deadlines bevatten datum én tijd.
- Tijden worden in `Europe/Amsterdam` getoond en in UTC opgeslagen.
- Wanneer alleen een datum wordt gekozen, mag de interface 17.00 uur voorstellen; dit voorstel blijft aanpasbaar.

Wanneer een taak een deadline heeft:

```text
deadline subtaak <= deadline taak
```

- Een subtaakdeadline na de taakdeadline wordt geweigerd.
- Controleer dit in de interface.
- Controleer dit in de domeinservice als leidende bedrijfsvalidatie.
- Bescherm kritieke deadline-integriteit aanvullend in PostgreSQL.
- Het fase-1-uitvoeringsplan gebruikt daarvoor versioned triggers als integriteitsvangnet; foutpresentatie en overige bedrijfsregels blijven in de service.
- Een taakdeadline mag niet stilzwijgend worden vervroegd wanneer subtaken daardoor ongeldig worden.
- De gebruiker moet eerst de conflicterende subtaken aanpassen of de wijziging annuleren.

---

## 5. Afhankelijkheden

- Afhankelijkheden mogen tussen subtaken van verschillende taken lopen.
- Een geblokkeerde subtaak mag niet worden ingepland voordat alle verplichte voorgangers klaar zijn.
- Cyclische afhankelijkheden worden transactioneel geweigerd, ook bij gelijktijdige wijzigingen.
- Dependencies worden nooit stilzwijgend of via een automatische cascade verwijderd.

## 6. Statussen in fase 1

Handmatig bedienbaar:

- Open;
- Wachten;
- Afgerond;
- Gearchiveerd;
- Geannuleerd.

`Geblokkeerd` wordt berekend uit dependencies en is geen handmatige status.

`Actief`, `Gepauzeerd` en `Wachten op externe partij` worden pas in de tijdregistratiefase toegevoegd.

## 7. Archiveren en definitief verwijderen

- Archiveren is de standaard in plaats van definitief verwijderen.
- Definitief verwijderen wordt geblokkeerd wanneer tijdregistraties, bijlagen, importhistorie of afhankelijkheden bestaan.
- Een dependency verdwijnt alleen na een expliciete dependencyhandeling.

---

## 8. Gezamenlijke planning

- Alle open taken en subtaken worden in één gezamenlijke planning beschouwd.
- Subtaken van één taak hoeven niet achter elkaar te worden gepland.
- Deadline en speling zijn belangrijke prioriteitsfactoren.
- Afhankelijkheden gaan vóór gewone prioriteit.
- De actieve taak wordt zo mogelijk behouden om onnodige contextwissels te beperken.
- Niet-opsplitsbaar werk mag alleen in een voldoende groot vrij blok worden geplaatst.

---

## 9. Microsoft To Do

Microsoft To Do wordt uitsluitend gebruikt voor een eenmalige import.

### Importmapping

```text
To Do-titel -> Task.title
To Do-notitie -> Task.descriptionOriginal
```

### Exact bewaren

Bewaar:

- regeleinden;
- lege regels;
- `-`;
- `*`;
- nummering;
- links;
- hoofdletters;
- leestekens.

### Niet toegestaan

- Geen automatische subtaken uit de notitie.
- Geen blijvende synchronisatie.
- Geen delta-sync.
- Geen To Do-webhooks.
- Geen terugschrijven.
- Geen Tasks.ReadWrite voor de blijvende applicatie.
- Geen conflictoplossing tussen To Do en MijnPlanning.

### Na import

- MijnPlanning wordt de enige leidende takenomgeving.
- Bewaar importmetadata om dubbele import te voorkomen.
- Een herimport mag alleen als expliciete migratieactie.

---

## 10. Outlook en Microsoft 365 Family

- Microsoft 365 Family is de Microsoft-basis.
- De MijnPlanning-login staat los van Microsoft.
- Microsoft wordt alleen als externe koppeling gebruikt.
- Begin met alleen-lezen toegang tot de agenda.
- De gebruiker kiest welke agenda’s worden meegenomen.
- Terugkerende afspraken moeten correct worden verwerkt.
- Afspraken gelden als geblokkeerde tijd.
- Een wijziging in Outlook kan een herplanning activeren.
- Schrijfrechten worden pas later toegevoegd.

---

## 11. Outlook-e-mail

AI mag:

- e-mails samenvatten;
- gesprekken samenvatten;
- acties herkennen;
- deadlines herkennen;
- taken voorstellen;
- antwoordconcepten voorbereiden.

AI mag niet:

- automatisch e-mails verzenden;
- automatisch een taak definitief aanmaken zonder gebruikersgoedkeuring;
- automatisch deadlines wijzigen;
- standaard de volledige mailbox kopiëren;
- standaard alle bijlagen opslaan.

---

## 12. AI

- AI adviseert.
- De gebruiker beslist.
- AI mag vervolgvragen stellen.
- AI mag een tijdsadvies, bandbreedte en betrouwbaarheid geven.
- AI mag vergelijkbare taken herkennen.
- AI mag uitleggen waarop een advies is gebaseerd.
- AI mag geen productregels wijzigen.
- AI mag niet zelfstandig taken verwijderen.
- AI mag niet zelfstandig deadlines overschrijven.
- AI mag niet zelfstandig inhoudelijke communicatie verzenden.

---

## 13. Tijdsinschatting

Bewaar afzonderlijk:

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

Wanneer de gebruiker een opvallend korte tijd kiest:

- respecteer de keuze;
- toon een waarschuwing;
- bereken daarnaast een waarschijnlijker risicoscenario;
- leg uit welk deadline-effect kan ontstaan.

---

## 14. Persoonlijk leren

Alleen actieve werktijd telt mee voor persoonlijke uitvoersnelheid.

Niet meetellen:

- pauzes;
- onderbrekingen;
- externe wachttijd;
- reistijd, tenzij onderdeel van de taak;
- een vergeten timer zonder correctie.

Gebruik weinig persoonlijke data voorzichtig.

Gebruik robuuste statistiek.

Eén uitschieter mag het profiel niet sterk veranderen.

Een nieuwe planningsvoorkeur wordt alleen na uitleg en toestemming actief.

---

## 15. Planningsmotor

- De definitieve planning wordt berekend met TypeScript-domeinlogica.
- AI bepaalt de planning niet rechtstreeks.
- Bedrijfsregels staan niet in React-componenten.
- Vrije tijd wordt berekend uit werktijden minus afspraken, pauzes, buffers, reistijd en vastgezette blokken.
- Deadlinegevaar wordt gebaseerd op speling.
- Iedere waarschuwing vermeldt de oorzaak.

---

## 16. Herberekening

Herbereken bij:

- nieuwe taak;
- nieuwe subtaak;
- gewijzigde deadline;
- gewijzigde tijdsinschatting;
- start;
- pauze;
- hervatten;
- afronding;
- gewijzigde Outlook-afspraak;
- geaccepteerde e-mailactie;
- gewijzigde werktijden;
- handmatig verversen;
- periodieke alarmcontrole.

De zichtbare timer mag iedere seconde veranderen.

Sla de volledige planning niet iedere seconde opnieuw op.

---

## 17. Alarmen

- Groen betekent voldoende marge.
- Oranje betekent kleine marge of optimistische aanname.
- Rood betekent dat de deadline waarschijnlijk niet haalbaar is.
- Rood wordt alleen gebruikt wanneer daadwerkelijk actie nodig is.
- Iedere waarschuwing bevat oorzaak en verwacht tekort of resterende marge.

---

## 18. Bestanden

- Gebruik Vercel Blob Private.
- PostgreSQL bewaart alleen metadata.
- Controleer eigenaarschap bij iedere download.
- Gebruik geen publieke voorspelbare links.
- Valideer bestandstype en grootte.
- Verwijder bestand en databaseverwijzing samen.

---

## 19. Login en beveiliging

- Eerste versie: één gebruiker.
- Eigen login, los van Microsoft.
- Alleen e-mailadres en wachtwoord zijn verplicht.
- Er is geen verplichte gebruikersnaam; een weergavenaam kan later optioneel worden toegevoegd.
- De eerste gebruiker wordt via een eenmalige server-only CLI aangemaakt; deze logt geen wachtwoord of hash en is geen publieke productieroute.
- Wachtwoord met Argon2id en een goede unieke salt.
- Geen password pepper in de MVP.
- Veilige server-side sessie.
- HttpOnly-cookie.
- Secure-cookie in productie.
- Passende SameSite-instelling.
- Rate limiting.
- Maximale sessieduur: 30 dagen.
- Maximale inactiviteit: 7 dagen.
- Handmatig uitloggen en alle sessies intrekken worden ondersteund.
- Tokens alleen server-side.
- Tokens versleuteld opslaan.
- Tokens en secrets nooit loggen.
- Geen `.env` of productiedata committen.

---

## 20. Grafisch ontwerp

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
- grote lege vlakken;
- overmatig afgeronde kaarten;
- te kleine tekst;
- decoratieve grafieken zonder besliswaarde;
- meerdere concurrerende primaire knoppen.

Formulieren voor taken en subtaken gebruiken een expliciete knop `Opslaan`. Timeracties, statuswijzigingen en verslepen mogen in een latere fase direct automatisch opslaan, mits iedere opslag een zichtbare bevestiging of foutmelding toont.

## 21. Technische uitvoeringsregels voor fase 0 en 1

- Gebruik npm en een gecontroleerde scaffold.
- Gebruik Node.js 24 LTS, Next.js 16 Active LTS met App Router, React 19, TypeScript 5, Tailwind CSS 3 en Prisma 6.
- Gebruik binnen deze majors actuele veilige versies en wijzig geen ander stackonderdeel zonder toestemming.
- Gebruik Neon Postgres via Vercel Marketplace, begin op Free en voer geen betaalde upgrade uit zonder expliciete toestemming.
- Een lokale PostgreSQL-installatie is niet nodig.
- Gebruik Server Actions alleen als dunne transportlaag; bedrijfsregels blijven in domeinservices.
- Gebruik Zod, Vitest en Playwright.
- Richt Vercel Preview pas in nadat fase 0 lokaal slaagt.
- Voeg Vercel Blob, uploads en bijlagen pas in de latere bijlagenfase toe.
- Gebruik uitsluitend de bestaande private repository `https://github.com/peterbosman68/MijnPlanning` en maak geen nieuwe repository.
- Gebruik uitsluitend `PLANS.md` in de hoofdmap als bron voor uitvoeringsplanregels; `docs/PLANS.md` is geen bron van waarheid.

---

## 22. Buiten scope eerste versie

- WhatsApp Business.
- Een aparte gespreksverwerkingsapp.
- Multi-userorganisaties.
- Automatisch verzenden van inhoudelijke e-mails.
- Blijvende Microsoft To Do-synchronisatie.
