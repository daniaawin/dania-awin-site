# Dania Awin — site & CMS handleiding

Je site staat op je Bureaublad in de map `dania-awin-site`. Vanaf nu kun je deze ook bewerken via een browser-interface — net als WordPress. In dit document leg ik uit hoe je dat instelt en hoe je hem gebruikt.

---

## Snel overzicht

Wat je hebt:

- Een **statische site** in de map `dania-awin-site` op je Bureaublad
- Een **admin-interface** (Decap CMS) die je via `jouwdomein.com/admin` bereikt — daar log je in en kun je alle teksten en artikelen visueel bewerken
- Bestanden waar je verder niks mee hoeft. De CMS regelt het.

Wat je nog moet doen om de CMS te activeren — dat is dit document. Drie stappen, één keer:

1. Account maken bij GitHub (gratis) → je site komt daar te staan
2. Account maken bij Netlify (gratis) → je site wordt daar gehost
3. Identity aanzetten in Netlify → daarmee log jij in op /admin

Ga er even rustig voor zitten. Dertig minuten. Daarna is het voor altijd geregeld.

---

## Stap 1 — GitHub account

GitHub is waar je sitebestanden gaan wonen. De CMS schrijft daar naartoe als je iets aanpast.

1. Ga naar [github.com/signup](https://github.com/signup)
2. Maak een gratis account aan (gebruik je gewone e-mail)
3. Verifieer je e-mail
4. Je bent klaar — niet doorklikken naar betaalde plannen

### GitHub Desktop installeren

GitHub Desktop is een app waarmee je niet hoeft te typen in een Terminal. Veel makkelijker.

1. Ga naar [desktop.github.com](https://desktop.github.com)
2. Download voor Mac, sleep naar je Programma's-map
3. Open de app, log in met je GitHub-account

### Je site uploaden naar GitHub

1. In GitHub Desktop: **File → Add Local Repository**
2. Kies je map: `Bureaublad/dania-awin-site`
3. GitHub Desktop zegt waarschijnlijk: "this isn't a Git repository, create one". Klik **Create a repository**
4. Vul in: Name = `dania-awin-site`, Description = je site
5. Klik **Create repository**
6. Klik bovenaan op **Publish repository**
7. Vink **Keep this code private** UIT (Netlify moet erbij kunnen — je teksten zijn toch publiek)
8. Klik **Publish repository**

Klaar — je site staat nu op GitHub. Je vindt 'm op `github.com/[jouw-username]/dania-awin-site`.

---

## Stap 2 — Netlify account & deployen

Netlify is waar je site live komt te staan op het internet.

1. Ga naar [app.netlify.com/signup](https://app.netlify.com/signup)
2. Klik **Sign up with GitHub** (logt in met je GitHub-account dat je net hebt aangemaakt)
3. Geef toestemming

### Je site deployen

1. In Netlify dashboard: klik **Add new site → Import an existing project**
2. Kies **Deploy with GitHub**
3. Geef Netlify toestemming om je GitHub repos te zien
4. Kies de repo `dania-awin-site`
5. Bij build settings: laat alles leeg/default — het is een statische site, geen build nodig
6. Klik **Deploy site**

Een halve minuut later is je site live op iets als `dreamy-pasta-12ab34.netlify.app`.

### Je eigen domein eraan koppelen

1. In Netlify: ga naar je site → **Domain settings** → **Add custom domain**
2. Vul je domein in
3. Netlify geeft je DNS-instellingen die je bij je domein-registrar moet invullen (waar je het domein gekocht hebt)
4. Wacht een paar uur. Klaar.

Vertel me waar je het domein hebt gekocht, dan help ik je door dat stukje.

---

## Stap 3 — Identity aanzetten (de admin-login)

Dit maakt het mogelijk dat alleen jij mag inloggen op `/admin`.

1. In Netlify: ga naar je site → tabblad **Site configuration** → links **Identity**
2. Klik **Enable Identity**
3. Bij **Registration preferences**: zet op **Invite only** (zodat niemand anders zich kan aanmelden)
4. Scrol naar **Services → Git Gateway** → klik **Enable Git Gateway**
5. Scrol naar **Identity → Invite users**, vul je e-mailadres in, klik Invite
6. Je krijgt een mail met een **Accept the invite**-link → klik die
7. Stel een wachtwoord in

Klaar. Je kunt nu inloggen.

---

## De CMS gebruiken

1. Ga naar `jouwdomein.com/admin` (of `[netlify-url]/admin` als je nog geen eigen domein hebt)
2. Log in met je e-mail + wachtwoord
3. Je ziet een interface met links: **Essays** en **Sitetekst**

### Een nieuw essay schrijven

1. Klik links op **Essays → Alle essays**
2. Klik **Add Essay**
3. Vul de velden: titel (NL + EN), datum, categorie, samenvatting, inhoud
4. Klik **Publish** rechtsboven
5. Wacht een minuut — Netlify rebuildt je site automatisch
6. Refresh je site → het essay staat erop

### Tekst op de homepage of een andere pagina aanpassen

1. Klik links op **Sitetekst → 2. Homepage** (of een andere pagina)
2. Pas de velden aan die je wilt
3. Klik **Publish**
4. Wacht een halve minuut, refresh je site

### Je portretfoto plaatsen

1. Klik links op **Sitetekst → 3. Over-pagina**
2. Bij **Portretfoto** klik je op **Choose an image** of sleep je foto erin
3. Klik **Publish**
4. Je foto staat op de Over-pagina, met de stylized layout

---

## Updates van mij verwerken

Als ik (Claude) iets voor je aanpas — bijvoorbeeld een design-tweak of een nieuwe sectie — krijg je nieuwe bestanden van mij. Hoe verwerk je die in je live site?

1. Vervang de oude bestanden in `Bureaublad/dania-awin-site` met de nieuwe
2. Open GitHub Desktop — die ziet automatisch wat is veranderd
3. Onderin: vul een korte beschrijving in (bv. "design-update")
4. Klik **Commit to main**, daarna **Push origin**
5. Netlify rebuildt automatisch binnen een minuut

Of stuur me een berichtje en ik leg het stap-voor-stap uit voor die specifieke wijziging.

---

## Wat als ik gewoon snel iets wil aanpassen, zonder admin?

Kan ook. Je opent het bestand in TextEdit, zoals voorheen — maar nu zijn de tekst-bestanden in `.json` formaat in de map `content/`:

- `content/site.json` — alle teksten van de site
- `content/articles.json` — alle essays

Open ze in TextEdit. Pas tekst aan tussen aanhalingstekens. Sla op. Open GitHub Desktop, commit + push. Netlify rebuildt.

Maar voor de meeste dingen is de admin-interface op `/admin` echt fijner. Dat is waar dit allemaal voor bedoeld is.

---

## Bestandenoverzicht

| Wat | Waarom |
|---|---|
| `index.html`, `writing.html`, etc. | Structuur van elke pagina — niet bewerken |
| `style.css` | Kleuren en opmaak — alleen aanpassen als je een kleur wilt veranderen |
| `script.js` | De logica die alles op de pagina zet — niet bewerken |
| `content/site.json` | Alle teksten — bewerk je via de admin |
| `content/articles.json` | Alle essays — bewerk je via de admin |
| `admin/index.html` | De admin-pagina — niet bewerken |
| `admin/config.yml` | Definitie van wat je kunt bewerken in de admin |
| `media/` | Waar je foto's terechtkomen als je ze uploadt via de admin |

---

## Hulp nodig?

Loop je vast bij Stap 1, 2 of 3 — stuur me een berichtje, vertel waar je staat (en stuur een screenshot als dat helpt). Ik leg het rustig uit.

Vragen later, zoals "kun je deze tekst op de homepage even mooier maken" of "voeg een nieuwe pagina toe", blijf je gewoon aan mij stellen. De admin is voor jouw kleine dagelijkse aanpassingen — voor het grotere werk ben ik er.
