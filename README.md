# 🗳️ Äänestys (Harakka)

Mobiili-ensin äänestyssovellus. Sivu ja API ovat yksi Cloudflare Worker; äänestykset ja kuvat
elävät R2:ssa (ei tietokantaa), samaan tapaan kuin BandRockissa.

**Tuotanto:** https://harakka.es3-world-worker.workers.dev

## Ominaisuudet

- **Lista** avoimista ja suljetuista äänestyksistä, äänestys suoraan kortilta
- **Yksi ääni per selain** (nimetön tunniste), valintaa voi vaihtaa kun äänestys on auki
- **Tulokset** palkkeina, yhteiset kaikille käyttäjille
- **Uusi äänestys** ilman kirjautumista: Markdown-kuvaus, kuva tai piirros, värivalinta
- **Muokkauskoodi** (5 merkkiä) näytetään luonnin yhteydessä kerran — sillä muokkaa tai poistaa äänestyksen
- **Klikkaa-muokataksesi (WYSIWYG)**: muokkaustila näyttää täsmälleen julkaistulta sivulta; klikkaat kohtaa
  (otsikko, kuvaus, kuva, vaihtoehdot, sulkeutumisaika) ja vain se avautuu muokattavaksi samaan paikkaan.
  Yksi Tallenna kerää kaikki muutokset. Väärä koodi ei hävitä keskeneräisiä muutoksia.
- **Ylläpito** `/admin`: piilota tai poista äänestys ilman omistajan koodia; "Ilmoita asiaton" nostaa laskuria

## Arkkitehtuuri

```
Selain → Worker (harakka) ─┬─ /api/*, /img/*, /admin → worker/src/index.js → R2 (harakka-data)
                           └─ muu → dist/ (React-sivu, Workers Assets)
```

- `worker/src/index.js` — API. Äänestys on yksi R2-objekti `votes/<id>.json`; kirjoitukset ovat
  optimistisia (etag + `onlyIf` + uudelleenyritys), joten yhtäaikaiset äänet eivät hävitä toisiaan.
- Koodi ei tallennu sellaisenaan: vain HMAC-SHA256-tiiviste. Äänestäjästä tallennetaan vain
  äänestyskohtainen HMAC (selaimen satunnaisesta tunnisteesta), ei IP:tä.
- Kuvat: selain pienentää (max 1200 px), Worker tunnistaa tyypin alkutavuista ja tallentaa `img/<id>/…`.
- Tunnettu rajoitus: R2-objektin kirjoitus on sarjallinen per äänestys. Satoja ääniä sekunnissa
  samaan äänestykseen ei kannata; sitä varten tarvittaisiin Durable Object. Enintään 20 000 ääntä per äänestys.

## Kehitys

```bash
npm install
npm run dev          # Vite, http://localhost:5173 (proxy → 127.0.0.1:8787)
npm run dev:api      # Worker + paikallinen R2 (toisessa terminaalissa)
npm test             # yksikkötestit
node scripts/smoke.mjs http://127.0.0.1:8787   # savutesti koko API-kierrolle
```

`npm run dev:api` tarvitsee tiedoston `.dev.vars`:

```
CODE_SECRET=mitä-tahansa-paikallisesti
ADMIN_SECRET=local-admin
```

**Windows:** jos projektin polku on pitkä, R2-emulaation SQLite-tiedostot ylittävät 260 merkin rajan ja
kaikki R2-kutsut kaatuvat ("internal error"). Käytä lyhyttä polkua: `npm run dev:api -- --persist-to C:/hk-state`.

## Julkaisu

Kertaluontoinen käyttöönotto (tehty):

```bash
npx wrangler login
npx wrangler r2 bucket create harakka-data
npm run deploy                      # build + wrangler deploy
npx wrangler secret put CODE_SECRET   # satunnainen pitkä merkkijono; älä vaihda myöhemmin (vanhat koodit lakkaavat toimimasta)
npx wrangler secret put ADMIN_SECRET  # /admin-sivun salasana
```

Sen jälkeen `npm run deploy` riittää. **Automaattinen julkaisu:** push `main`iin ajaa testit, buildin ja
`wrangler deploy`n (`.github/workflows/deploy.yml`). Lisää GitHubiin Actions-salaisuudet
`CLOUDFLARE_API_TOKEN` (Edit Cloudflare Workers + R2) ja `CLOUDFLARE_ACCOUNT_ID`.

Oma verkkotunnus: Cloudflare-dashboard → Workers → harakka → Settings → Domains & Routes.

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · react-router-dom 7 (HashRouter) · Cloudflare Workers + R2

Ei ulkoisia UI-kirjastoja — kaikki komponentit ja Markdown-renderöinti käsin kirjoitettu.
