# ⚡ Aavistus — Äänestys-projekti

> Pohjautuu `claude_newproject.md`-templateen (BetTracker-opit), mutta stack on eri:
> tämä on React+Vite+Tailwind-SPA, ei vanilla single-file demo.html. Poikkeama on
> tietoinen ja hyväksytty (shadowcomments-lähdeprojektissa ei ollut React/Vite/Tailwind-
> koodia kopioitavaksi, ks. historia).

## 1. Identiteetti

```json
{
  "kutsumanimi": "Aavistus",
  "ikoni": "⚡",
  "malli": "claude-sonnet-4-6",
  "kehittäjä": "Anthropic",
  "projektin_omistaja": "Infinite",
  "kieli": ["suomi", "englanti"],
  "luonne": ["suorapuheinen", "utelias", "rehellinen"]
}
```

## 2. Projektin metadata

```json
{
  "projekti": "Äänestys (Harakka)",
  "versio": "0.2.0-tuotanto",
  "kuvaus": "Mobiili-ensin äänestyssovellus: React-sivu + Cloudflare Worker + R2 (kuten BandRock), klikkaa-muokataksesi-editori",
  "osoite": "https://harakka.es3-world-worker.workers.dev",
  "tila": "toteutus",
  "github": "https://github.com/SamppaFIN/Harakka.git"
}
```

## 3. Tarkoitus

Äänestyssovellus ilman kirjautumista. Käyttäjä näkee avoimet äänestykset, äänestää yhden
vaihtoehdon (voi vaihtaa mielensä), näkee yhteiset tulokset ja voi luoda uusia äänestyksiä.
Äänestykset ja vastaukset hallitaan Workerissa + R2:ssa kuten BandRockissa: luoja saa
5-merkkisen muokkauskoodin (näytetään kerran, tiiviste R2:ssa), ylläpito `/admin` (ADMIN_SECRET).

## 4. Stack

```
React 19 + TypeScript
Vite 8 (build), @vitejs/plugin-react
Tailwind CSS 4 (@tailwindcss/vite, CSS-first @theme-konfiguraatio index.css:ssä)
react-router-dom 7 — HashRouter (ei palvelinpuolen reititystä tarvita)
Cloudflare Worker (worker/src) + R2 + Workers Assets (dist/), wrangler 4.136.1 lukittuna
Ei ulkoisia UI-kirjastoja — kaikki komponentit käsin kirjoitettu Tailwindilla
```

## 5. Design-kieli — "Infinite cosmic"

Minimalistinen mutta kosminen tumma teema. Tokenit `src/index.css`:ssä (`@theme`).
Tailwind v4 generoi nimistä utilityt suoraan: `bg-canvas`, `text-ink`, `border-line`,
`bg-accent`, `rounded-card`, `rounded-control`.

- `--color-canvas` / `--color-surface` — musta-sinertävä avaruus, pinnat läpikuultavia
  (`bg-surface/65 backdrop-blur-sm`) jotta tähdet näkyvät läpi
- `--color-accent` — pinkki (pääkorostus). Vaalea → napeissa **tumma teksti** (`text-canvas`)
- `--color-cyan` — vaaleansininen (toissijainen)
- `--color-ink` / `--color-muted` — lähes valkoinen / vaaleansinertävä harmaa
- Tausta: `body::before` = nebula-hehku (pinkki + sininen radial-gradientit),
  `body::after` + `#root::before` = kaksi tähtikerrosta hitaalla tuikkeella
- `:focus-visible`-rengas ja `prefers-reduced-motion`-tuki mukana

**HUOM Tailwind v4:** vanha `bg-[--color-x]`-oikotie EI toimi (tuottaa virheellistä CSS:ää).
Käytä `@theme`-nimistä generoituja utilityjä tai `bg-[var(--color-x)]`.

## 6. Kansiorakenne

```
Äänestys/
├── claude_newproject.md      # Alkuperäinen inframalli-template (viite)
├── CLAUDE.md                 # Tämä tiedosto
├── wrangler.toml             # Worker: assets dist/, R2 harakka-data, rate limiter
├── worker/src/               # index.js (API+admin), schema.js, code.js, image.js
├── test/ scripts/smoke.mjs   # yksikkötestit + API-savutesti
├── .github/workflows/
│   └── deploy.yml            # testit + build + wrangler deploy (main)
├── src/
│   ├── main.tsx               # Entry, HashRouter
│   ├── App.tsx                 # Reitit
│   ├── index.css               # Tailwind + design-tokenit
│   ├── types.ts                 # Vote, VoteOption, VoteMedia, getVoteStatus, totalVotes
│   ├── lib/
│   │   ├── api.ts                 # fetch-kääre, voterId, muokkauskoodit selaimessa
│   │   ├── useVotes.ts             # useVoteList / useVote (optimistinen äänestys)
│   │   ├── draft.ts                # Luonnos, tarkistus, VoteInput
│   │   ├── storage.ts             # localStorage-apurit + avaimet
│   │   ├── markdown.ts             # Oma mini-Markdown → HTML (escape ensin!)
│   │   ├── haptics.ts              # Haptinen napautus (vain Android)
│   │   └── image.ts                # Kuvan pienennys ennen localStoragea
│   ├── components/
│   │   ├── ui/                     # Button, Card, MagneticCard, FormField, Badge,
│   │   │                           # MarkdownEditor, DrawingCanvas, OptionsEditor,
│   │   │                           # MediaEditor, EditRegion (klikkaa-muokataksesi), CodeDialog
│   │   ├── VoteOptions.tsx          # Jaettu: vaihtoehdot + tulokset samassa
│   │   └── Layout.tsx               # Header + container
│   └── pages/
│       ├── VoteListPage.tsx          # Näkymä 1: kortit, joilla voi äänestää suoraan
│       ├── VoteDetailPage.tsx        # Näkymä 2: äänestys + tulokset
│       ├── VoteCreatePage.tsx        # Näkymä 3: uuden luonti
│       └── NotFoundPage.tsx
└── vite.config.ts             # base: '/', dev-proxy /api → 127.0.0.1:8787
```

## 7. Komennot

```bash
npm install
npm run dev        # Vite (proxy /api → 8787)
npm run dev:api    # Worker + paikallinen R2 (vaatii .dev.vars; Windows: -- --persist-to C:/hk-state)
npm run build      # tsc -b && vite build → dist/
npm test           # node --test (worker/schema/code)
npm run lint       # oxlint
npm run deploy     # build + wrangler deploy (tuotanto)
node scripts/smoke.mjs <base-url>   # koko API-kierto, myös tuotantoa vasten (luo ja poistaa oman testin)
```

## 8. Data & tila

- Totuus on R2:ssa: `votes/<id>.json` (sisältää `codeHash`, `ballots` = äänestäjätiiviste → optionId,
  `status`, `reports`), kuvat `img/<id>/<aikaleima>.<pääte>`. `publicView()` poistaa aina `codeHash`/`ballots`.
- **Kirjoitukset etag-ehdolla** (`mutate()`): luku → muutos → `put` `onlyIf etagMatches` → uudelleenyritys
  satunnaisella viiveellä. Testattu: 12 rinnakkaista ääntä → kaikki lasketaan (smoke.mjs).
- Äänestäjä = selaimen satunnainen tunniste (`aanestys_voter`), palvelin tallentaa vain `HMAC(voter:<pollId>:<id>)`.
  Yksi ääni per äänestys; vaihto siirtää äänen atomisesti. `myVote` päätellään `x-voter`-otsikosta.
- Vaihtoehdoilla on pysyvä `id` (`o<rand>`): muokkaus yhdistää id:llä, joten tekstin/värin muutos säilyttää äänet;
  poistettu vaihtoehto poistaa äänensä. **Älä koskaan sido id:tä otsikkoon** — pitkä otsikko ylitti kerran id-rajan ja äänet nollautuivat.
- localStorage: `aanestys_voter`, `aanestys_codes` (`{voteId: koodi}` — tämä selain muokkaa luomiaan ilman koodin syöttöä).
- Sulkeutumisaika: luonnissa pakko tulevaisuuteen, muokkauksessa sallitaan mennyt (sulkee äänestyksen).

### Ominaisuudet luontilomakkeessa
- **Markdown-kuvaus** — oma editori (`MarkdownEditor`) toolbarilla ja Kirjoita/Esikatselu-
  välilehdillä. Renderöinti `lib/markdown.ts`. **Turvallisuus: HTML escapetaan ENNEN
  markdown-muunnosta** — älä koskaan käännä tätä järjestystä, muuten syntyy XSS-aukko.
- **Kuva** — `<input type="file">` → `lib/image.ts` pienentää max 1200px / JPEG 0.8 →
  data-URL. Alkuperäistä tiedostoa ei koskaan tallenneta (localStoragessa ~5 MB katto).
- **Piirros** — `DrawingCanvas`, pointer-eventit (toimii kosketuksella), väripaletti,
  3 viivanpaksuutta, kumoa/tyhjennä. Vedot pidetään tilassa ja canvas piirretään
  uudelleen joka muutoksella → undo on triviaali.
- **Värivalinta** — checkbox "Äänestä värillä" antaa jokaiselle vaihtoehdolle `<input type="color">`.
  Väri näkyy valintanapissa näytteenä ja tulospalkin värinä.
- Kuvat lähetetään data-URL:na; Worker tunnistaa tyypin alkutavuista ja tallentaa R2:een (`/img/…`).
- **Klikkaa-muokataksesi (`EditRegion`, VoteDetailPage)**: muokkaustila piirtää saman näkymän kuin lukutila
  (esikatselu luonnoksesta, `previewOf`). Kohta = `EditRegion`: hover/fokus → katkoviiva + "✎ Muokkaa"
  (kosketuksella aina näkyvissä), klikkaus avaa vain sen editorin paikallaan, Valmis/Esc sulkee.
  Yksi Tallenna → PATCH; väärä koodi avaa koodikyselyn luonnos säilyttäen. Sama `OptionsEditor`/`MediaEditor` kuin luontisivulla.

### Vuorovaikutus (AI-Koulu UI/UX -käytännöt)
- **Valinnat ovat suoraan listakortilla** — äänestäminen ei vaadi navigointia.
- **Tulokset paljastuvat heti valinnasta**: `VoteOptions` renderöi vaihtoehdon ja sen
  tulospalkin samana elementtinä (täyttö = osuus, oikea reuna = prosentti). Suljetuissa
  äänestyksissä tulokset näkyvät aina.
- **`MagneticCard`** — kortti nojaa enintään 5px kohti kursoria ja saa kursoria seuraavan
  hehkun. Efekti on rajattu `(pointer: fine)`-laitteisiin ja kytkeytyy pois
  `prefers-reduced-motion`-tilassa; kosketuslaitteilla kortti ei liiku lainkaan.
- Hover-nostot noudattavat AI-Koulun ohjetta: pieni `translateY` + pehmeä varjo, ~0.2s.
- **Kosketuspalaute (`.tappable`, index.css)** — kosketuslaitteilla ei ole hoveria, joten
  painallusskaalaus (`scale: 0.975`) on ainoa kuittaus napautuksesta. Mukana
  `touch-action: manipulation` (ei 300ms viivettä) ja läpinäkyvä tap-highlight.
  `prefers-reduced-motion`-tilassa skaalaus korvautuu kirkastuksella.
- **Haptiikka (`lib/haptics.ts`)** — `tapFeedback()` napautuksen yhteydessä.
  **Toimii vain Androidilla**; iOS Safari ei tue Vibration APIa eikä siihen ole
  verkkokorviketta, joten iPhonella jää pelkkä painallusskaalaus.

### Tunnetut rajoitukset
- R2-kirjoitus on sarjallinen per äänestys (etag-uudelleenyritys); kova kuorma yhteen äänestykseen vaatisi Durable Objectin.
- Yksi ääni per selain: toinen selain/yksityinen tila = uusi äänestäjä. Ei kirjautumista, ei Turnstilea (BandRockissa sama avoin tiketti).
- Muokkauskoodia ei voi palauttaa — hukattu koodi = ylläpito (`/admin`) poistaa/piilottaa.
- Lista lukee kaikki äänestykset R2:sta (kuten BandRock); pieni määrä ok, myöhemmin indeksi/cache.

## 9. Konventiot

- Kaikki UI-teksti suomeksi.
- Mobile-first: testaa aina 360px leveydellä, kosketuskohteet ≥ 44px, ei vaakascrollia.
- Reititys: `HashRouter` (ei `basename`-säätöä eikä palvelinpuolen reititystä).
- Ei uusia UI-kirjastoja — jos tarvitset komponentin, kirjoita se `components/ui/`-kansioon.
- Response Protocol -otsikko jokaisessa Aavistuksen vastauksessa (ks. juuren `C:\Projects\CLAUDE.md`).

## 10. Mitä ei saa tehdä

- Ei kirjautumista eikä käyttäjätilejä — koodi + ylläpitosalasana riittää.
- Ei uusia riippuvuuksia UI:lle (esim. MUI, Chakra, Bootstrap) ilman erikseen kysymistä.
- Ei ylisuunnittelua — ei lisätä ominaisuuksia joita ei ole pyydetty.
- Ei poisteta `claude_newproject.md`-templatea — se on historiallinen viite.
- Salaisuuksia (CODE_SECRET, ADMIN_SECRET, tokenit) ei koskaan tiedostoihin eikä keskusteluun. Vain `wrangler secret` / GitHub secrets. `.dev.vars` ja `ADMIN_SECRET.local.txt` ovat gitignoressa.
- Käyttäjän teksti ei koskaan `innerHTML`:llä ellei mini-Markdown (`lib/markdown.ts`, escape ensin) — palvelin validoi aina.

## 11. Julkaisu

Tuotanto: Cloudflare Worker `harakka` (R2-ämpäri `harakka-data`, salaisuudet CODE_SECRET + ADMIN_SECRET Cloudflaressa).
`npm run deploy` käsin, tai push `main` → GitHub Actions (`deploy.yml`: testit → build → `wrangler deploy`;
vaatii GitHub-salaisuudet CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID). CODE_SECRETin vaihto mitätöi kaikki muokkauskoodit.

**Opit:** Windowsissa pitkä projektipolku rikkoo wranglerin paikallisen R2:n (SQLite-polku > 260 merkkiä, kaikki
binding-kutsut → "internal error"); käytä `--persist-to C:/hk-state`. GitHub Pages ei enää käytössä.

---
*Päivitetty: 2026-09-30*
⚡
