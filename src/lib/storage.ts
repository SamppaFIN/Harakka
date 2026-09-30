// localStorage-avaimet dokumentoituna yhdessä paikassa. Data elää palvelimella —
// selaimeen jää vain äänestäjän nimetön tunniste ja luomiesi äänestysten muokkauskoodit.
export const STORAGE_KEYS = {
  voter: 'aanestys_voter', // satunnainen tunniste, josta palvelin tallentaa vain äänestyskohtaisen tiivisteen
  codes: 'aanestys_codes', // { [voteId]: muokkauskoodi } — vain tässä selaimessa luoduille
} as const

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** Palauttaa false jos tallennus epäonnistui (kiintiö täynnä / yksityinen selaus). */
export function writeJSON<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
