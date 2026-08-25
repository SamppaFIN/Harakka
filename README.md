# 🗳️ Äänestys

Mobiili-ensin äänestyssovellus. Mock-demo — ei backendia, kaikki data elää selaimen
localStoragessa.

## Ominaisuudet

- **Lista** avoimista ja suljetuista äänestyksistä
- **Äänestäminen** — yksi ääni per äänestys per selain, valintaa voi vaihtaa
- **Tulokset** palkkeina prosentteineen, reaaliaikainen päivitys
- **Äänestäminen värillä** — vaihtoehdot voivat olla värinäytteitä
- **Uuden äänestyksen luonti** Markdown-editorilla, kuvalla tai piirroksella
- Infinite cosmic -teema: musta avaruus, tähtiä, pinkkiä ja vaaleansinistä

## Kehitys

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
npm run preview
```

## Julkaisu

Push `main`-haaraan käynnistää GitHub Actions -workflown, joka buildaa ja julkaisee
sovelluksen GitHub Pagesiin.

Vaadittu asetus: **Settings → Pages → Source = "GitHub Actions"**.

Jos repon nimi ei ole `Harakka`, päivitä `base` tiedostossa `vite.config.ts`.

## Stack

React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · react-router-dom 7 (HashRouter)

Ei ulkoisia UI-kirjastoja — kaikki komponentit ja Markdown-renderöinti käsin kirjoitettu.
