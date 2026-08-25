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
  "versio": "0.1.0-MVP",
  "kuvaus": "Mobiili-ensin äänestyssovellus, pelkkä frontend, mock-data + localStorage, julkaistu GitHub Pagesiin",
  "tila": "toteutus",
  "github": "https://github.com/SamppaFIN/Harakka.git"
}
```

## 3. Tarkoitus

Mock-demo äänestyssovelluksesta ilman backendia. Käyttäjä näkee avoimet äänestykset,
äänestää yhden vaihtoehdon (voi vaihtaa mielensä), näkee tulokset palkkeina, ja voi
luoda uusia äänestyksiä. Kaikki data elää selaimen localStoragessa — ei palvelinta,
ei tietokantaa, ei autentikointia.

## 4. Stack

```
React 19 + TypeScript
Vite 8 (build), @vitejs/plugin-react
Tailwind CSS 4 (@tailwindcss/vite, CSS-first @theme-konfiguraatio index.css:ssä)
react-router-dom 7 — HashRouter (toimii GitHub Pagesissa ilman palvelinkonfigurointia)
gh-pages (devDependency, deploy-työkalu — varsinainen julkaisu GitHub Actionsilla)
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
├── .github/workflows/
│   └── deploy.yml            # Build + julkaisu Pages-artifaktina
├── src/
│   ├── main.tsx               # Entry, HashRouter
│   ├── App.tsx                 # Reitit
│   ├── index.css               # Tailwind + design-tokenit
│   ├── types.ts                 # Vote, VoteOption, VoteMedia, getVoteStatus, totalVotes
│   ├── mocks/votes.ts            # Mock-äänestykset (filosofisia kysymyksiä)
│   ├── lib/
│   │   ├── storage.ts             # localStorage-apurit + avaimet
│   │   ├── useVotes.ts             # Keskitetty hook: lista, äänestys, luonti
│   │   ├── markdown.ts             # Oma mini-Markdown → HTML (escape ensin!)
│   │   └── image.ts                # Kuvan pienennys ennen localStoragea
│   ├── components/
│   │   ├── ui/                     # Button, Card, ProgressBar, FormField, Badge,
│   │   │                           # MarkdownEditor, DrawingCanvas
│   │   └── Layout.tsx               # Header + container
│   └── pages/
│       ├── VoteListPage.tsx          # Näkymä 1: avoimet äänestykset
│       ├── VoteDetailPage.tsx        # Näkymä 2: äänestys + tulokset
│       ├── VoteCreatePage.tsx        # Näkymä 3: uuden luonti
│       └── NotFoundPage.tsx
└── vite.config.ts             # base: '/Harakka/'
```

## 7. Komennot

```bash
npm install       # riippuvuudet
npm run dev       # kehityspalvelin
npm run build     # tsc -b && vite build → dist/
npm run preview   # esikatselu buildatusta versiosta
npm run lint      # oxlint
```

## 8. Data & tila

- Yksi lähde: `src/mocks/votes.ts` — kopioidaan localStorageen ensimmäisellä latauksella.
  8 mock-äänestystä: filosofisia ja absurdeja kysymyksiä (Teseuksen laiva, vapaa tahto,
  pillin reiät, hot dog...). Kaksi niistä on värivalinta-äänestyksiä, yksi on suljettu.
  **Kun muutat `mocks/votes.ts`:ää, kasvata `DATA_VERSION`:ia `lib/storage.ts`:ssä** —
  muuten vanha localStorage-data jää voimaan eikä kukaan näe muutosta.
- localStorage-avaimet: `aanestys_votes` (äänestykset + äänimäärät), `aanestys_my_votes`
  (`{ [voteId]: optionId }` — mihin tämä selain on äänestänyt), `aanestys_data_version`
  (mock-datan versio; eri arvo → tallennettu data korvataan lähtötilalla).
- Äänestäminen: yksi ääni per äänestys per selain. Vaihto sallittu — vanha ääni
  vähennetään ja uusi lisätään atomisesti samassa päivityksessä.
- Uuden äänestyksen luonti lisää tietueen listan alkuun, `createdAt` = nykyhetki.

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
- `useVotes` palauttaa `storageFull`-lipun jos localStorage-kiintiö täyttyy (kuvat!) —
  luontisivu näyttää siitä varoituksen.

### Tunnettu rajoitus
`useVotes` instantioidaan erikseen jokaisessa sivukomponentissa; jaettu totuus on
localStorage ja sivut lukevat sen uudelleen mountissa. Toimii koska navigointi
remounttaa sivut. Jos joskus tarvitaan kahta yhtäaikaista näkymää samasta datasta,
tämä pitää nostaa Contextiin.

## 9. Konventiot

- Kaikki UI-teksti suomeksi.
- Mobile-first: testaa aina 360px leveydellä, kosketuskohteet ≥ 44px, ei vaakascrollia.
- Reititys: `HashRouter` (ei `basename`-säätöä, toimii suoraan GitHub Pagesissa).
- Ei uusia UI-kirjastoja — jos tarvitset komponentin, kirjoita se `components/ui/`-kansioon.
- Response Protocol -otsikko jokaisessa Aavistuksen vastauksessa (ks. juuren `C:\Projects\CLAUDE.md`).

## 10. Mitä ei saa tehdä

- Ei backendia, ei tietokantaa, ei autentikointia — pysytään mock+localStorage-mallissa.
- Ei uusia riippuvuuksia UI:lle (esim. MUI, Chakra, Bootstrap) ilman erikseen kysymistä.
- Ei ylisuunnittelua — 3 näkymää riittää MVP:lle, ei lisätä ominaisuuksia joita ei ole pyydetty.
- Ei poisteta `claude_newproject.md`-templatea — se on historiallinen viite.

## 11. Julkaisu

GitHub Actions (`.github/workflows/deploy.yml`) buildaa ja julkaisee Pages-artifaktina
jokaisella pushilla `main`-haaraan. **GitHub-asetus: Settings → Pages → Source = "GitHub Actions"**
(ei "Deploy from a branch" — gh-pages-haaraa ei käytetä).

`vite.config.ts`:n `base` on `/Harakka/` — jos repon nimi muuttuu, tämä pitää päivittää
vastaavasti, muuten CSS/JS ei lataudu.

Varakeino ilman Actionsia: `npm run deploy` (gh-pages-paketti pushaa `dist/`:n gh-pages-haaraan).
Silloin Pages-lähteeksi valitaan "Deploy from a branch" → `gh-pages` / `(root)`.

---
*Päivitetty: 2026-08-25*
⚡
