// localStorage-avaimet dokumentoituna yhdessä paikassa.
export const STORAGE_KEYS = {
  votes: 'aanestys_votes',
  myVotes: 'aanestys_my_votes', // { [voteId]: optionId }
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
