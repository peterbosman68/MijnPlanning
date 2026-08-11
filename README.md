# MijnPlanning

MijnPlanning is een persoonlijke, dynamische planningsassistent. De huidige basis bevat de goedgekeurde responsive visuele richting en het beveiligde fase-0-fundament met een eigen single-user-login.

## Vereisten

- Node.js `24.18.x`;
- npm `11.16.x`;
- de bestaande geïsoleerde Neon-developmentdatabase;
- een lokale `.env` die nooit in Git wordt opgenomen.

## Lokale installatie

```powershell
npm.cmd ci
npm.cmd run prisma:generate
```

Vul uitsluitend lokaal in `.env` in:

```text
DATABASE_URL=...
SESSION_SECRET=...
RESEND_API_KEY=...
PASSWORD_RESET_EMAIL_FROM="MijnPlanning <onboarding@resend.dev>"
MICROSOFT_GRAPH_ACCESS_TOKEN=...
MICROSOFT_GRAPH_CALENDAR_ID=... # optioneel, standaard primaire agenda
```

`SESSION_SECRET` bevat minimaal 32 willekeurige tekens. Een veilige waarde kan lokaal worden gegenereerd zonder een waarde in Git te zetten:

```powershell
$mpBytes = New-Object byte[] 48
$mpGenerator = [Security.Cryptography.RandomNumberGenerator]::Create()
$mpGenerator.GetBytes($mpBytes)
[Convert]::ToBase64String($mpBytes)
$mpGenerator.Dispose()
```

De getoonde waarde is een secret: deel haar niet, log haar niet en plaats haar nooit in documentatie of broncode.

`RESEND_API_KEY` is eveneens een server-side secret. Voor de persoonlijke single-user-MVP mag `onboarding@resend.dev` uitsluitend verzenden naar het e-mailadres van het bijbehorende Resend-account. Deel de API-key nooit via chat en commit hem niet.

`MICROSOFT_GRAPH_ACCESS_TOKEN` is een server-side bearer token met minimaal `Calendars.Read` op het gekoppelde account. De daglimietcontrole haalt Outlook-gegevens buiten het kritieke opslagpad op en hergebruikt een recent resultaat kort. Een ontbrekende of trage Graph-respons blokkeert het opslaan van taken en subtaken niet.

## Database

Controleer en pas alleen de gereviewde migraties toe op de bedoelde developmentomgeving:

```powershell
npm.cmd run prisma:validate
npm.cmd run db:migrate:deploy
```

Gebruik geen `prisma db push` als migratiestrategie.

## Eerste gebruiker aanmaken

De bootstrapopdracht maakt uitsluitend de eerste gebruiker aan en weigert wanneer al een gebruiker bestaat. E-mailadres en wachtwoord worden interactief gevraagd; de wachtwoordinvoer blijft verborgen en invoer of hash wordt niet gelogd:

```powershell
npm.cmd run user:create
```

Een nieuw wachtwoord bevat minimaal 8 tekens. Een langer, uniek wachtwoord uit een wachtwoordmanager blijft aanbevolen.

Voor gecontroleerde automatisering accepteert de CLI ook tijdelijke procesvariabelen `MIJNPLANNING_BOOTSTRAP_EMAIL` en `MIJNPLANNING_BOOTSTRAP_PASSWORD`. Bewaar deze nooit in `.env`, scripts, shellhistorie of Git.

## Wachtwoord wijzigen

Wijzig het wachtwoord uitsluitend via de interactieve lokale opdracht. Het huidige wachtwoord wordt eerst gecontroleerd, invoer blijft verborgen en na een geslaagde wijziging worden alle bestaande sessies ingetrokken:

```powershell
npm.cmd run user:change-password
```

## Wachtwoord lokaal herstellen

Gebruik het interactieve noodherstel uitsluitend wanneer het huidige wachtwoord echt niet meer bekend is. De opdracht vereist het exacte account-e-mailadres en de bevestiging `HERSTEL`. De nieuwe wachtwoordinvoer blijft verborgen. Na succes worden alle actieve sessies ingetrokken en bestaande loginblokkades gewist:

```powershell
npm.cmd run user:reset-password
```

Gebruik deze opdracht alleen in een vertrouwde lokale terminal met de bewust gekozen `DATABASE_URL`. Geef het wachtwoord nooit mee als argument, procesvariabele of chatbericht.

## Wachtwoord herstellen per e-mail

Op `/login` staat `Wachtwoord vergeten?`. Het formulier geeft altijd dezelfde neutrale bevestiging, zodat niet zichtbaar wordt of een account bestaat. Een geldige herstelmail bevat een eenmalige link die dertig minuten geldig is. Na een geslaagde reset worden alle bestaande sessies uitgelogd, overige herstelcodes ongeldig en loginblokkades gewist.

De webroute vereist de additieve migratie `20260720210000_password_reset_tokens` en de twee Resend-variabelen hierboven. Het lokale noodherstel blijft beschikbaar wanneer e-mail niet werkt.

## Lokaal starten

```powershell
npm.cmd run dev
```

Belangrijke routes:

- `/login` — eigen MijnPlanning-login;
- `/wachtwoord-vergeten` — generiek aanvraagformulier voor een herstelmail;
- `/wachtwoord-herstellen` — eenmalige resetroute uit de herstelmail;
- `/vandaag` — beschermd drieluik met Vandaag geselecteerd;
- `/taken` — beschermd drieluik met ToDo geselecteerd;
- `/api/health` — minimale geheimvrije healthstatus.

## Kwaliteitscontroles

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npm.cmd run test:e2e
npm.cmd audit
```

De browsertests controleren desktop en mobiel. De gewone testopdracht schrijft niet naar Neon. De afzonderlijke authdatabase-integratietest is alleen voor een aantoonbaar lege developmentbasis en ruimt haar tijdelijke gegevens altijd op.

## Veiligheidsgrenzen

- commit nooit `.env`, wachtwoorden, sessietokens of database-URL's;
- voer geen migratie tegen productie uit zonder expliciete goedkeuring en terugrolcontrole;
- Vercel Blob, Microsoft Graph, Outlook, To Do en echte WhatsApp-integratie vallen buiten fase 0;
- de visuele E-mail- en WhatsApp-inhoud gebruikt nog lokale voorbeelddata.
