# MijnPlanning — beveiliging en privacy

## 1. Uitgangspunt

MijnPlanning verwerkt gevoelige persoonlijke gegevens:

- taken;
- deadlines;
- planning;
- e-mailmetadata;
- e-mailsamenvattingen;
- Microsoft-tokens;
- bestanden;
- persoonlijke leergegevens;
- werktijden.

Beveiliging is onderdeel van de basisarchitectuur.

---

## 2. Authenticatie

Voor de MVP:

- één gebruiker;
- login uitsluitend met e-mailadres en wachtwoord;
- geen verplichte gebruikersnaam;
- een weergavenaam kan later optioneel worden toegevoegd;
- sterk wachtwoord;
- Argon2id-wachtwoordhash met een goede unieke salt per wachtwoord;
- geen password pepper in de MVP;
- veilige server-side sessie;
- sessie-intrekking;
- rate limiting;
- vertraging na mislukte pogingen;
- generieke foutmelding bij onjuiste login.

Gebruik geen eenvoudig gedeeld dashboardwachtwoord als structurele productielogin.

Fase-0-implementatie:

- Argon2id gebruikt minimaal 19 MiB geheugen, twee iteraties en parallelisme één;
- de bootstrap- en wijzigings-CLI vereisen een wachtwoord van minimaal 8 tekens en loggen geen invoer of hash; een langer, uniek wachtwoord blijft aanbevolen;
- de wijzigings-CLI controleert het huidige wachtwoord en trekt na succes alle bestaande sessies in;
- onbekend e-mailadres en verkeerd wachtwoord geven dezelfde gebruikersmelding;
- na vijf mislukte pogingen binnen vijftien minuten volgt een blokkering van vijftien minuten;
- de throttlekey is gehasht en bevat geen leesbaar e-mailadres of IP-adres.

---

## 3. Sessies

Vereisten:

- sessietoken willekeurig en sterk;
- alleen tokenhash in database;
- HttpOnly-cookie;
- Secure-cookie in productie;
- passende SameSite-instelling;
- maximale absolute sessieduur van 30 dagen;
- maximale inactiviteit van 7 dagen;
- vernieuwen bij gebruik indien gewenst;
- handmatig uitloggen trekt de actuele sessie direct in;
- de gebruiker kan alle sessies gezamenlijk intrekken;
- oude sessies kunnen worden verwijderd.

Fase-0-implementatie:

- sessietokens bevatten 32 cryptografisch willekeurige bytes;
- alleen een HMAC-SHA-256-hash wordt in PostgreSQL opgeslagen;
- productie gebruikt de host-only cookie `__Host-mijnplanning_session`;
- de cookie is `HttpOnly`, in productie `Secure`, `SameSite=Strict` en heeft pad `/`;
- `lastUsedAt` wordt hoogstens eens per vijftien minuten bijgewerkt om onnodige schrijflast te voorkomen;
- zowel de actuele sessie als alle sessies van de gebruiker kunnen direct worden ingetrokken.

---

## 4. Autorisatie

Iedere serverroute controleert:

- gebruiker is ingelogd;
- object hoort bij de gebruiker;
- bestand hoort bij de gebruiker;
- Microsoft-verbinding hoort bij de gebruiker.

Vertrouw nooit alleen op een userId uit de browser.

---

## 5. Microsoft-tokens

- alleen server-side;
- versleuteld opgeslagen;
- encryptiesleutel alleen in omgevingsvariabele;
- nooit naar client sturen;
- nooit loggen;
- verwijderen bij ontkoppeling;
- minimale scopes;
- scopes gefaseerd uitbreiden.

---

## 6. Secrets

Secrets alleen in:

- lokale `.env`;
- Vercel Environment Variables;
- eventueel aparte secret manager later.

Nooit committen:

- `.env`;
- API-sleutels;
- wachtwoorden;
- tokenwaarden;
- productiedata;
- databasebackups;
- privébestanden.

---

## 7. Database

- PostgreSQL met TLS;
- minimale databasegebruiker;
- automatische backups;
- herstelprocedure testen;
- migraties eerst in testomgeving;
- transacties voor samenhangende wijzigingen;
- constraints voor belangrijke regels;
- indexen tegen onnodig zware queries.

---

## 8. Bestanden

Gebruik Vercel Blob Private.

Vereisten:

- bestandstype valideren;
- bestandsgrootte begrenzen;
- uitvoerbare bestanden blokkeren;
- eigenaarschap controleren;
- geen publieke voorspelbare URL;
- tijdelijke toegang;
- bestand en metadata samen verwijderen;
- originele bestandsnaam ontsmetten;
- nooit lokale padinformatie tonen.

---

## 9. AI en privacy

- stuur alleen noodzakelijke inhoud;
- verwijder irrelevante handtekeningen en disclaimers;
- stuur geen tokens of secrets;
- log geen volledige vertrouwelijke prompts;
- bewaar provider, model en versie;
- gebruik gestructureerde output;
- valideer AI-uitvoer server-side;
- behandel AI-uitvoer als voorstel;
- laat inhoudelijke verzending onder menselijke controle.

---

## 10. E-mail

- kopieer niet de volledige mailbox;
- bewaar standaard metadata en samenvattingen;
- bewaar volledige body alleen wanneer functioneel noodzakelijk;
- sla bijlagen alleen op na bewuste keuze;
- verzend niets automatisch;
- toon bron en context bij taakvoorstellen.

---

## 11. Logging

Wel loggen:

- tijdstip;
- technische foutcode;
- route of module;
- correlatie-ID;
- retry-aantal;
- resultaatstatus.

Niet loggen:

- wachtwoorden;
- sessietokens;
- Microsoft-tokens;
- API-sleutels;
- volledige e-mails;
- volledige documenten;
- tijdelijke downloadlinks;
- gevoelige AI-prompts.

---

## 12. Rate limiting

Minimaal op:

- login;
- wachtwoordcontrole;
- AI-routes;
- import;
- bestandupload;
- e-mailanalyse;
- Microsoft-callbacks waar relevant.

---

## 13. CSRF, XSS en invoer

- gebruik veilige frameworkstandaarden;
- valideer invoer server-side;
- ontsmet bestandsnamen;
- render geen onbehandelde HTML;
- gebruik CSRF-bescherming waar nodig;
- gebruik prepared statements via Prisma;
- accepteer alleen toegestane waarden;
- valideer datum en tijd;
- valideer uploadtype en grootte.

---

## 14. Privacy en bewaartermijnen

Maak instelbaar of documenteer:

- bewaartermijn e-mailsamenvattingen;
- bewaartermijn oude sessies;
- bewaartermijn logs;
- bewaartermijn exports;
- verwijdering van bijlagen;
- verwijdering van Microsoft-koppeling.

Gegevens moeten exporteerbaar en verwijderbaar zijn.

---

## 15. Backups

- automatische databasebackups;
- regelmatige hersteltest;
- duidelijk herstelproces;
- geen backups in GitHub;
- backups versleuteld;
- beperkte toegang.

---

## 16. Productiecontrole

Voor productie:

- lint;
- typecheck;
- tests;
- build;
- dependency-audit;
- secretscan;
- controle clientbundel;
- controle publieke routes;
- autorisatietests;
- uploadtests;
- hersteltest;
- loggingcontrole.

---

## 17. Incidenten

Bij vermoeden van een lek:

1. tokens intrekken;
2. sessies intrekken;
3. secrets roteren;
4. logs veiligstellen;
5. oorzaak vaststellen;
6. toegang blokkeren;
7. herstel uitvoeren;
8. maatregelen documenteren.
