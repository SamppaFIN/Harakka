import type { Vote } from '../types'

// Mock-data demoa varten. Ei backendia — tämä on lähtötila,
// joka kopioidaan localStorageen ensimmäisellä latauksella.
export const MOCK_VOTES: Vote[] = [
  {
    id: 'v1',
    title: 'Kuinka monta reikää on pillissä?',
    description: `Kysymys on jakanut työpaikan kahtia. Kahvihuoneessa ei enää puhuta muusta.

## Ennen kuin äänestät
- Topologia ei ole mielipide, mutta *reikä* on määritelmäkysymys
- "Se on ilmiselvää" ei ole perustelu
- Kolme ihmistä on jo lähtenyt ovet paukkuen

> Yksi vastaajista: "Jos vastaus on kaksi, mikä on donitsin luku?"`,
    options: [
      { id: 'v1-a', text: 'Yksi — se on yksi putki', votes: 1847 },
      { id: 'v1-b', text: 'Kaksi — molemmissa päissä on reikä', votes: 1622 },
      { id: 'v1-c', text: 'Nolla — se on taivutettu taso', votes: 431 },
      { id: 'v1-d', text: 'En halua enää puhua tästä', votes: 908 },
    ],
    closesAt: '2026-09-14T18:00:00.000Z',
    createdAt: '2026-08-22T09:00:00.000Z',
  },
  {
    id: 'v2',
    title: 'Teseuksen laiva: onko se yhä sama laiva?',
    description:
      'Laivan jokainen lankku on vaihdettu uuteen. Vieressä on toinen laiva, joka on rakennettu kokonaan vanhoista lankuista. Satamamestari haluaa tietää, kumpaan kirjoitetaan sama nimi, koska lomake ei salli kahta.',
    options: [
      { id: 'v2-a', text: 'Sama laiva — jatkuvuus ratkaisee', votes: 934 },
      { id: 'v2-b', text: 'Eri laiva — materiaali ratkaisee', votes: 712 },
      { id: 'v2-c', text: 'Molemmat ovat se laiva', votes: 588 },
      { id: 'v2-d', text: 'Kumpikaan ei ole, ja se on ihan ok', votes: 401 },
      { id: 'v2-e', text: 'Laiva on siellä missä nimikin', votes: 276 },
    ],
    closesAt: '2026-09-25T20:00:00.000Z',
    createdAt: '2026-08-20T11:00:00.000Z',
  },
  {
    id: 'v3',
    title: 'Mikä väri on tiistai?',
    description:
      'Ei ole väärää vastausta. On kuitenkin vastauksia, jotka saavat muut katsomaan sinua eri tavalla. Äänestä värillä.',
    options: [
      { id: 'v3-a', text: 'Vaalean harmaansininen', votes: 612, color: '#8fa9c4' },
      { id: 'v3-b', text: 'Sinapinkeltainen', votes: 488, color: '#d3a03c' },
      { id: 'v3-c', text: 'Väsynyt beige', votes: 731, color: '#c9bda6' },
      { id: 'v3-d', text: 'Kirkas turkoosi', votes: 355, color: '#3fb3ad' },
      { id: 'v3-e', text: 'Tumman punainen', votes: 289, color: '#8e3a3a' },
      { id: 'v3-f', text: 'Tiistailla ei ole väriä', votes: 566, color: '#4a4a52' },
    ],
    closesAt: '2026-09-19T16:00:00.000Z',
    createdAt: '2026-08-23T14:00:00.000Z',
  },
  {
    id: 'v4',
    title: 'Onko vapaa tahto olemassa?',
    description:
      'Huomaathan, että et välttämättä valitse vastaustasi. Tulokset olivat joka tapauksessa väistämättömiä.',
    options: [
      { id: 'v4-a', text: 'Kyllä, ja valitsin tämän itse', votes: 1204 },
      { id: 'v4-b', text: 'Ei, ja tämäkin oli ennalta määrätty', votes: 987 },
      { id: 'v4-c', text: 'Kyllä ja ei — kompatibilismi', votes: 843 },
      { id: 'v4-d', text: 'Yritin valita jotain muuta, mutta en pystynyt', votes: 662 },
    ],
    closesAt: '2026-09-30T12:00:00.000Z',
    createdAt: '2026-08-21T10:00:00.000Z',
  },
  {
    id: 'v5',
    title: 'Jos puu kaatuu metsässä eikä kukaan ole kuulemassa, syntyykö ääntä?',
    description:
      'Metsänhoitoyhdistys pyysi meitä lopettamaan tämän äänestyksen, koska heille on soitettu jo neljä kertaa. Jatkamme silti.',
    options: [
      { id: 'v5-a', text: 'Kyllä — paineaallot eivät tarvitse yleisöä', votes: 1533 },
      { id: 'v5-b', text: 'Ei — ääni on kokemus, ei ilmiö', votes: 704 },
      { id: 'v5-c', text: 'Syntyy, mutta se ei ole yhtä hyvä', votes: 892 },
      { id: 'v5-d', text: 'Orava kuuli. Orava kuulee aina.', votes: 1119 },
    ],
    closesAt: '2026-09-07T18:00:00.000Z',
    createdAt: '2026-08-24T08:00:00.000Z',
  },
  {
    id: 'v6',
    title: 'Eläisitkö ikuisesti, jos saisit valita?',
    description:
      'Oletetaan hyvä terveys ja kohtuullinen taloudellinen tilanne. Kaikki muut vanhenevat normaalisti. Kyllä, joudut opettelemaan uudet käyttöjärjestelmät joka kerta.',
    options: [
      { id: 'v6-a', text: 'Kyllä, ehdottomasti', votes: 623 },
      { id: 'v6-b', text: 'Kyllä, mutta haluan peruutusnapin', votes: 1408 },
      { id: 'v6-c', text: 'En — loppu antaa asioille merkityksen', votes: 1015 },
      { id: 'v6-d', text: 'Muutaman vuosisadan, sitten katsotaan', votes: 877 },
    ],
    closesAt: '2026-10-02T20:00:00.000Z',
    createdAt: '2026-08-19T13:00:00.000Z',
  },
  {
    id: 'v7',
    title: 'Onko hot dog voileipä?',
    description:
      'Kysymys esitettiin alun perin vitsinä. Sen jälkeen on käyty kolme väittelyä, yksi ystävyys on päättynyt, ja eräs osallistuja on kirjoittanut aiheesta 14-sivuisen muistion.',
    options: [
      { id: 'v7-a', text: 'On — kaksi leipäpalaa, täyte välissä', votes: 1102 },
      { id: 'v7-b', text: 'Ei — sämpylä on yhtenäinen', votes: 1456 },
      { id: 'v7-c', text: 'Se on oma kategoriansa', votes: 1287 },
      { id: 'v7-d', text: 'Kaikki on voileipä, jos olet tarpeeksi rohkea', votes: 743 },
    ],
    closesAt: '2026-09-11T15:00:00.000Z',
    createdAt: '2026-08-18T09:00:00.000Z',
  },
  {
    id: 'v8',
    title: 'Minkä värinen on tyhjyys?',
    description:
      'Äänestys on sulkeutunut. Tulokset eivät valitettavasti ratkaisseet asiaa, mutta ne ovat alla.',
    options: [
      { id: 'v8-a', text: 'Musta', votes: 1341, color: '#0f0f14' },
      { id: 'v8-b', text: 'Valkoinen', votes: 806, color: '#f2f0ea' },
      { id: 'v8-c', text: 'Läpinäkyvä (ei siis mitään)', votes: 1198, color: '#6b6b78' },
      { id: 'v8-d', text: 'Syvä violetti', votes: 542, color: '#3b2a55' },
    ],
    closesAt: '2026-08-12T12:00:00.000Z',
    createdAt: '2026-07-26T09:00:00.000Z',
  },
]
