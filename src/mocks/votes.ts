import type { Vote } from '../types'

// Mock-data demoa varten. Ei backendia — tämä on lähtötila,
// joka kopioidaan localStorageen ensimmäisellä latauksella.
export const MOCK_VOTES: Vote[] = [
  // ── Politiikka ──────────────────────────────────────────────
  {
    id: 'v1',
    title: 'Mihin kunnan budjettiylijäämä käytetään?',
    description: `Kassassa on **1,2 miljoonaa** ylimääräistä. Valtuusto ei päässyt sopuun kolmen kokouksen jälkeen, joten kysytään suoraan asukkailta.

## Reunaehdot
- Raha on käytettävä *tämän* vuoden aikana
- Ei saa sitoa pysyviä käyttömenoja
- Yksi kohde, ei pilkkomista

> Valtuuston puheenjohtaja: "Kunhan se ei ole taas se suihkulähde."`,
    options: [
      { id: 'v1-a', text: 'Uimahallin remontti', votes: 412 },
      { id: 'v1-b', text: 'Pyöräteiden talvikunnossapito', votes: 388 },
      { id: 'v1-c', text: 'Kirjaston aukioloajat takaisin', votes: 356 },
      { id: 'v1-d', text: 'Torille suihkulähde, jossa on patsas kunnanjohtajasta', votes: 67 },
    ],
    closesAt: '2026-09-12T18:00:00.000Z',
    createdAt: '2026-08-21T09:00:00.000Z',
  },
  {
    id: 'v2',
    title: 'Pitäisikö valtuuston kokoukset striimata suorana?',
    description:
      'Avoimuus lisääntyisi. Toisaalta jotkut pelkäävät, että kolmituntinen keskustelu pysäköintinormista ei kerää yleisöä.',
    options: [
      { id: 'v2-a', text: 'Kyllä, kaikki suorana', votes: 524 },
      { id: 'v2-b', text: 'Kyllä, mutta vain tallenteena jälkikäteen', votes: 311 },
      { id: 'v2-c', text: 'Ei — pöytäkirja riittää', votes: 143 },
      { id: 'v2-d', text: 'Kyllä, ja kommenttiraita mukaan', votes: 279 },
    ],
    closesAt: '2026-09-05T12:00:00.000Z',
    createdAt: '2026-08-19T10:00:00.000Z',
  },

  // ── Urheilu ─────────────────────────────────────────────────
  {
    id: 'v3',
    title: 'Mikä on Suomen todellinen kansallislaji?',
    description:
      'Ikuinen kiista ratkaistaan nyt lopullisesti. Tulos ei sido ketään mihinkään, mutta siitä voi huutaa saunassa.',
    options: [
      { id: 'v3-a', text: 'Pesäpallo', votes: 634 },
      { id: 'v3-b', text: 'Jääkiekko', votes: 821 },
      { id: 'v3-c', text: 'Hiihto', votes: 402 },
      { id: 'v3-d', text: 'Saunominen kilpailumielessä', votes: 588 },
      { id: 'v3-e', text: 'Naapurin auton katsominen ikkunasta', votes: 297 },
    ],
    closesAt: '2026-09-28T20:00:00.000Z',
    createdAt: '2026-08-22T11:00:00.000Z',
  },
  {
    id: 'v4',
    title: 'Uusi laji olympialaisiin 2032 — mikä ansaitsee paikan?',
    description: 'Kansainvälinen olympiakomitea ei kysynyt, mutta me kysymme.',
    options: [
      { id: 'v4-a', text: 'Eukonkanto', votes: 445 },
      { id: 'v4-b', text: 'Saappaanheitto', votes: 298 },
      { id: 'v4-c', text: 'Ilmakitaransoitto', votes: 512 },
      { id: 'v4-d', text: 'Suopotkupallo', votes: 367 },
      { id: 'v4-e', text: 'Kännykänheitto', votes: 389 },
    ],
    closesAt: '2026-08-30T18:00:00.000Z',
    createdAt: '2026-08-16T08:00:00.000Z',
  },

  // ── Taide ───────────────────────────────────────────────────
  {
    id: 'v5',
    title: 'Minkä värinen uusi kulttuuritalo on?',
    description:
      'Arkkitehti antoi meille kuusi vaihtoehtoa ja sanoi "kaikki ovat hyviä". Kiitos, arkkitehti. Äänestä värillä.',
    options: [
      { id: 'v5-a', text: 'Terrakotta', votes: 318, color: '#c9683f' },
      { id: 'v5-b', text: 'Metsänvihreä', votes: 402, color: '#2f6b4f' },
      { id: 'v5-c', text: 'Yösininen', votes: 356, color: '#2b3f6b' },
      { id: 'v5-d', text: 'Okrankeltainen', votes: 189, color: '#d3a03c' },
      { id: 'v5-e', text: 'Luonnonvalkoinen', votes: 274, color: '#efe8dc' },
      { id: 'v5-f', text: 'Musta (arkkitehdin oma suosikki)', votes: 141, color: '#232323' },
    ],
    closesAt: '2026-09-18T16:00:00.000Z',
    createdAt: '2026-08-23T14:00:00.000Z',
  },
  {
    id: 'v6',
    title: 'Mikä teos ripustetaan kirjaston aulaan?',
    description:
      'Lahjoituksena saatiin neljä teosta. Aulassa on tilaa yhdelle. Loput menevät varastoon odottamaan parempia aikoja.',
    options: [
      { id: 'v6-a', text: 'Abstrakti öljyvärityö "Hiljaisuus nro 7"', votes: 156 },
      { id: 'v6-b', text: 'Valokuvasarja paikallisesta linja-autoasemasta', votes: 243 },
      { id: 'v6-c', text: 'Kolmimetrinen kudottu hirvi', votes: 421 },
      { id: 'v6-d', text: 'Neonteksti, jossa lukee "LUE"', votes: 198 },
    ],
    closesAt: '2026-09-08T17:00:00.000Z',
    createdAt: '2026-08-20T13:00:00.000Z',
  },
  {
    id: 'v7',
    title: 'Kaupungin uuden logon värimaailma',
    description:
      'Edellinen logo oli käytössä 34 vuotta. Tämä äänestys on jo sulkeutunut — tulokset alla.',
    options: [
      { id: 'v7-a', text: 'Lämmin punaruskea', votes: 289, color: '#a8503c' },
      { id: 'v7-b', text: 'Järvensininen', votes: 447, color: '#3d7ea6' },
      { id: 'v7-c', text: 'Sammaleenvihreä', votes: 331, color: '#4f7a43' },
      { id: 'v7-d', text: 'Harmaa (turvallinen valinta)', votes: 122, color: '#8a8a86' },
    ],
    closesAt: '2026-08-10T12:00:00.000Z',
    createdAt: '2026-07-25T09:00:00.000Z',
  },
]
