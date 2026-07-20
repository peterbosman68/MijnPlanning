# Uitvoeringsplan — wachtwoordherstel per e-mail

**Status:** goedgekeurd, implementatie bezig
**Datum:** 20 juli 2026
**Scope:** eigen single-user-login, herstelmail via Resend en eenmalige resetlink
**Implementatie gestart:** ja, na expliciete goedkeuring van Peter op 20 juli 2026

## 1. Doel en gebruikersresultaat

MijnPlanning krijgt op het inlogscherm een altijd zichtbare actie `Wachtwoord vergeten?`. Peter kan zijn e-mailadres invullen, ontvangt bij het bekende account een herstelmail en kan via een eenmalige link een nieuw wachtwoord van minimaal acht tekens instellen. Na een geslaagde reset worden alle bestaande sessies ingetrokken en loginblokkades gewist.

Buiten scope:

- publieke accountregistratie;
- Microsoft-login als primaire login;
- herstel via sms, Microsoft Graph of handmatige beheerpagina;
- wijziging van het bestaande lokale noodherstel;
- meerdere gebruikers of organisaties.

## 2. Huidige situatie

- `main` is actief en staat lokaal twee commits voor op `origin/main`.
- De lokale commits bevatten het interactieve noodherstel en de oogknop voor het wachtwoordveld; deze blijven behouden.
- `.agents/` en `skills-lock.json` zijn niet-gerelateerde, niet-gevolgde bestanden en blijven buiten commits.
- De login gebruikt Argon2id, server-side sessies, `SameSite=Strict`, origincontrole en centrale PostgreSQL-rate-limiting.
- Na vijf mislukte logins binnen vijftien minuten volgt een blokkering van vijftien minuten.
- Herstel is nu uitsluitend mogelijk via `npm.cmd run user:reset-password`; er is geen webroute, resetmail of resettokenmodel.
- Peter heeft al een Resend-account met hetzelfde e-mailadres als het MijnPlanning-account. Er is geen eigen verzenddomein of DNS-beheer. Daarom wordt voor deze single-user-MVP uitsluitend de beperkte testafzender `MijnPlanning <onboarding@resend.dev>` gebruikt; deze mag alleen naar het eigen Resend-accountadres verzenden. Een API-key is nog niet ingericht.
- Besluit O30 sloot webherstel voor de eerdere stap uit. Peters actuele opdracht vervangt dat deel van O30; dit wordt als nieuw besluit vastgelegd zonder het lokale noodherstel te verwijderen.

## 3. Functionele interpretatie

1. `Wachtwoord vergeten?` is altijd zichtbaar en blijft dus ook bereikbaar na vijf mislukte logins.
2. Het herstelformulier vraagt alleen het e-mailadres.
3. De browser toont altijd dezelfde melding: `Als dit e-mailadres bij MijnPlanning bekend is, ontvang je een herstelmail.`
4. De melding verraadt niet of het account bestaat, of een token is gemaakt en of Resend de mail heeft geaccepteerd.
5. Herstelverzoeken worden per account/verzoekbron en per verzoekbron beperkt. Aanbevolen beleid: maximaal drie geaccepteerde verzoeken per uur per combinatie en maximaal tien per uur per bron.
6. De resetlink is cryptografisch willekeurig, eenmalig bruikbaar en dertig minuten geldig.
7. Alleen een HMAC-SHA-256-hash van de token wordt opgeslagen; de leesbare token komt niet in database of applicatielogs.
8. Een nieuw wachtwoord bevat minimaal acht en maximaal 1024 tekens, wordt tweemaal ingevoerd en mag niet gelijk zijn aan het bestaande wachtwoord.
9. Na succes worden alle actieve sessies ingetrokken, alle nog bruikbare resettokens van de gebruiker ongeldig gemaakt en bestaande loginblokkades gewist.
10. Een verlopen, gebruikte of ongeldige link geeft dezelfde neutrale foutmelding en biedt een nieuwe herstelactie.
11. Het lokale noodherstel blijft als laatste herstelmogelijkheid beschikbaar wanneer e-mail niet werkt.

## 4. Te wijzigen bestanden en structuur

Verwachte wijzigingen:

- `prisma/schema.prisma`: model en relatie voor wachtwoordresettokens.
- `prisma/migrations/<timestamp>_password_reset_tokens/migration.sql`: uitsluitend additieve tabel, indexen, constraints en foreign key.
- `lib/auth/password-reset-token.ts`: token genereren en contextgescheiden hashen.
- `lib/auth/password-reset-service.ts`: aanvraag, validatie, verbruik, wachtwoordwijziging en sessie-intrekking.
- `lib/security/password-reset-rate-limit.ts`: apart herstelbeleid met gehashte sleutels.
- `lib/email/resend.ts`: kleine server-only Resend-adapter via HTTPS `fetch`; geen nieuwe npm-productieafhankelijkheid.
- `lib/config/env-schema.ts`: validatie van `RESEND_API_KEY` en `PASSWORD_RESET_EMAIL_FROM` wanneer de herstelroute wordt gebruikt.
- `app/(auth)/login/login-form.tsx` en `login.module.css`: link `Wachtwoord vergeten?` binnen het bestaande goedgekeurde ontwerp.
- `app/(auth)/wachtwoord-vergeten/`: pagina, formulier en dunne Server Action.
- `app/(auth)/wachtwoord-herstellen/`: pagina, formulier, oogknoppen en dunne Server Action.
- `.env.example` en `README.md`: uitsluitend voorbeeldnamen en geheime configuratie-instructies; geen echte waarden.
- `tests/`: unit-, integratie-, beveiligings- en Playwright-tests.
- `docs/PRODUCT_PLAN.md`, `docs/PRODUCT_RULES.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/SECURITY.md` en `docs/DECISIONS.md`: definitieve regels en nieuw besluit na implementatie.

UI, authenticatiedomein, database, rate limiting en e-mailadapter blijven afzonderlijke modules.

## 5. Datamodel en migratie

Nieuw additief model `PasswordResetToken`:

- `id`: cuid, primaire sleutel;
- `userId`: verplichte relatie naar `User`;
- `tokenHash`: verplicht en uniek;
- `expiresAt`: verplicht;
- `usedAt`: optioneel;
- `createdAt`: verplicht, standaard huidige tijd.

Indexen:

- uniek op `tokenHash`;
- samengesteld op `userId, usedAt`;
- index op `expiresAt`.

Databaseconstraints bewaken dat `expiresAt > createdAt` en `usedAt`, indien gevuld, niet vóór `createdAt` ligt. De migratie verwijdert of wijzigt geen bestaande data. Verlopen records mogen later door gecontroleerde opruiming worden verwijderd; automatische periodieke opruiming valt buiten deze stap.

Migratievolgorde:

1. Prisma-schema en SQL lokaal valideren.
2. Additieve migratie tegen een expliciet geïdentificeerde niet-productieomgeving testen.
3. Integratietests uitvoeren zonder productiegegevens.
4. Pas na groene controles en aparte controle van de doelverbinding de migratie op Production uitvoeren.
5. Applicatie pas daarna vrijgeven.

## 6. Beveiliging en privacy

- Server Actions controleren trusted origin en valideren invoer met Zod.
- Accountbestaan, Resend-resultaat en throttlestatus worden niet aan de browser onthuld.
- E-mailadres, token, reset-URL, wachtwoord, hash, API-key en database-URL worden niet gelogd.
- De token bevat minimaal 32 cryptografisch willekeurige bytes.
- Tokenhashing gebruikt een expliciet contextlabel en het bestaande server-side `SESSION_SECRET`; er komt geen token in clientbundels.
- Resetacceptatie gebeurt transactioneel en met concurrencybescherming, zodat een token maar één keer kan slagen.
- Alle sessies en resterende resettokens worden na succes ingetrokken.
- De herstelpagina rendert geen onbehandelde HTML en zet het wachtwoord nooit in URL of browseropslag.
- E-mail bevat alleen de noodzakelijke resetlink, geldigheidsduur en veiligheidsuitleg; geen planning- of accountinhoud.
- Resend ontvangt uitsluitend afzender, bestemmingsadres, onderwerp en herstelbericht.
- Herstelmail gebruikt een idempotency key om dubbele verzending bij dezelfde sendpoging te voorkomen.

## 7. Implementatiestappen

### Stap 1 — besluit en configuratiecontract

- Leg vast dat O30 wordt uitgebreid met webherstel via Resend.
- Voeg alleen server-side configuratievelden toe.
- Tests: omgevingsvalidatie met en zonder herstelconfiguratie.
- Acceptatie: de bestaande app blijft bouwbaar zonder geheime waarden in Git.
- Stop/go: het Resend-accountadres moet exact gelijk blijven aan het MijnPlanning-accountadres en de beperkte testafzender moet een echte herstelmail naar dat adres kunnen afleveren.

### Stap 2 — additief datamodel

- Voeg `PasswordResetToken` en migratie toe.
- Tests: Prisma-validatie, constraint- en integratietests.
- Acceptatie: bestaande users, sessies en throttles blijven ongewijzigd.
- Terugrol: applicatiecode terugzetten; de ongebruikte additieve tabel mag blijven staan of pas na expliciete toestemming afzonderlijk worden verwijderd.

### Stap 3 — domeinservice, token en rate limiting

- Bouw aanvraag- en resetservice met generieke uitkomsten.
- Voeg een apart herstel-rate-limitbeleid toe.
- Tests: onbekend account, bekende gebruiker, verlopen token, dubbel gebruik, gelijk wachtwoord, concurrency, sessie-intrekking en throttlegegevens.
- Acceptatie: geen accountenumeratie via teksten of foutcodes; één token kan maar eenmaal slagen.

### Stap 4 — Resend-adapter

- Stuur tekst en eenvoudige HTML via de officiële HTTPS-API.
- Gebruik timeout, veilige foutmapping en idempotency key.
- Tests gebruiken een geïnjecteerde neptransportlaag en sturen geen echte e-mail.
- Acceptatie: API-key en token komen nooit in logging of testoutput.

### Stap 5 — browserinterface

- Voeg de link en de twee herstelpagina's toe binnen het bestaande blauw-gele loginontwerp.
- Voeg toegankelijke labels, focus, foutmeldingen en oogknoppen toe.
- Tests: desktop, mobiel, toetsenbord, ongeldige/verlopen link en succesvolle reset met testdatabase.
- Acceptatie: geen horizontale overflow en de herstelactie blijft zichtbaar na een rate-limitmelding.

### Stap 6 — documentatie, migratie en vrijgave

- Werk README, productregels, beveiliging, datamodel en besluiten bij.
- Configureer `RESEND_API_KEY` geheimhoudend en `PASSWORD_RESET_EMAIL_FROM="MijnPlanning <onboarding@resend.dev>"` voor de afgesproken Vercel-omgevingen.
- Voer migratie alleen uit tegen expliciet gecontroleerde doelen.
- Voer alle kwaliteitscontroles sequentieel uit.
- Push `main` uitsluitend wanneer alle controles en een echte end-to-end hersteltest slagen.

## 8. Tests

Minimaal:

1. token bevat voldoende entropie en alleen de hash wordt opgeslagen;
2. onbekend en bekend e-mailadres leveren dezelfde browsermelding;
3. herstelverzoeken worden correct beperkt zonder ruwe bron of e-mail op te slaan;
4. token vervalt na dertig minuten;
5. token kan maar eenmaal worden gebruikt;
6. twee gelijktijdige resetpogingen kunnen niet beide slagen;
7. nieuw wachtwoord voldoet aan minimaal acht tekens en beide velden moeten overeenkomen;
8. bestaand wachtwoord wordt geweigerd;
9. Argon2id-hash wordt vernieuwd;
10. alle actieve sessies worden ingetrokken;
11. overige bruikbare resettokens en loginblokkades worden ongeldig gemaakt;
12. origincontrole blokkeert een vreemde herkomst;
13. logs en clientbundel bevatten geen tokens of secrets;
14. Resend-fout veroorzaakt geen accountenumeratie;
15. login, oogknop en lokaal noodherstel blijven werken;
16. desktop- en mobiele Playwright-flow heeft geen overflow en is toetsenbordbedienbaar;
17. `npm.cmd run lint`;
18. `npm.cmd run typecheck`;
19. `npm.cmd run test`;
20. `npm.cmd run build`;
21. `npm.cmd run test:e2e`;
22. `npm.cmd audit`.

## 9. Acceptatiecriteria

- Op `/login` staat een zichtbare en toegankelijke link `Wachtwoord vergeten?`.
- Een geldig herstelverzoek levert binnen normale providerwerking één e-mail met een dertig minuten geldige link.
- De UI onthult nooit of een e-mailadres bestaat.
- Een geldige link accepteert tweemaal hetzelfde nieuwe wachtwoord van minimaal acht tekens.
- Na succes werkt het nieuwe wachtwoord, werkt het oude niet meer en zijn bestaande sessies ingetrokken.
- Dezelfde link werkt niet nogmaals.
- Na vijf foutieve logins blijft herstel bereikbaar.
- Het lokale noodherstel blijft bruikbaar.
- Desktop en mobiel volgen het goedgekeurde ontwerp.
- Alle genoemde kwaliteitscontroles zijn groen en er staan geen secrets in Git of logs.

## 10. Risico's en terugrol

- **Accountenumeratie:** generieke antwoorden, vergelijkbare verwerking en rate limiting; controleren met browsertests.
- **Tokenlek via logs of browserhistorie:** token nooit applicatief loggen, korte geldigheid, eenmalig gebruik en neutrale referrerpolicy; controleren met log- en headertests.
- **E-mailmisbruik:** dubbele bron/accountlimieten en generieke respons; blokkeren bij falende misbruiktests.
- **Resend-uitval:** gebruiker krijgt geen inhoudelijk detail en lokaal noodherstel blijft beschikbaar; technische fout wordt zonder persoonsgegevens gelogd.
- **Beperkte testafzender:** `resend.dev` mag alleen naar het eigen Resend-accountadres verzenden en is geen volwaardige productie-afzender; geen productiepush voordat exacte adresgelijkheid en echte ontvangst zijn gecontroleerd.
- **Migratierisico:** uitsluitend additieve migratie, doelverbinding vooraf identificeren en geen destructieve rollback uitvoeren.
- **Kosten:** binnen Resend Free blijven; geen betaalde upgrade zonder expliciete toestemming.

Applicatieterugrol gebeurt door de herstelroutes uit de vrijgegeven commit terug te draaien. Omdat de tabel additief is, hoeft zij niet direct te worden verwijderd. Secrets kunnen in Vercel worden ingetrokken. Reeds uitgegeven tokens worden door het intrekken van de gebruikte API-key niet automatisch ongeldig; bij incident worden de tokenrecords server-side ongeldig gemaakt en zo nodig `SESSION_SECRET` volgens incidentprocedure geroteerd.

## 11. Open beslissingen

### D1 — verzenddomein en afzender (technisch ingevuld, wacht op planakkoord)

- Peter heeft geen eigen domein en beheert geen DNS.
- Het bestaande Resend-account gebruikt hetzelfde adres als het MijnPlanning-account.
- Voor deze persoonlijke single-user-MVP wordt daarom `MijnPlanning <onboarding@resend.dev>` gebruikt.
- Deze afzender is door Resend beperkt tot verzending naar het eigen Resend-accountadres en geldt officieel als testvoorziening.
- Wanneer het accountadres later wijzigt of MijnPlanning meerdere gebruikers krijgt, stopt deze route en is een eigen geverifieerd domein of een nieuw expliciet providerbesluit nodig.

### D2 — Resend-omgevingen

- Aanbeveling: eerst lokaal en Preview testen; pas na echte ontvangst Production configureren.
- Dezelfde API-key mag technisch, maar afzonderlijke beperkt bevoegde keys per omgeving zijn veiliger.
- Eigenaar: Peter keurt de configuratievolgorde en eventuele Resend-accountinrichting goed.

## 12. Voortgang en goedkeuringsmomenten

- Documentatie en huidige code geïnspecteerd: gereed.
- Uitvoeringsplan opgesteld: gereed.
- Goedkeuring Peter: gereed op 20 juli 2026.
- Resend-account en voorlopige afzender vastgesteld: gereed.
- Implementatie: lokaal gereed; externe configuratie en migratie nog niet uitgevoerd.
- Databasemigratiebestand en Prisma-validatie: gereed; toepassing op een database nog niet gestart.
- Resend- en Vercel-configuratie: niet gestart.
- Tests en visuele controle: lint, typecheck, 33 unit-/mocktests, build, 16 Playwright-tests en audit groen; één optionele database-integratietest bewust overgeslagen totdat de doelomgeving is gecontroleerd.
- Commit/push: niet gestart.

Implementatie begint pas nadat Peter dit plan expliciet goedkeurt en D1 beantwoordt. Een productiepush volgt pas na de afzonderlijke migratie-, configuratie- en end-to-end stop/go-controle.
