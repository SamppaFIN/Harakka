export interface VoteOption {
  id: string
  text: string
  votes: number
  /** Valinnainen värivalinta — kun asetettu, vaihtoehto näytetään värinäytteenä. */
  color?: string
}

export interface VoteMedia {
  kind: 'image' | 'drawing'
  /** data:-URL — tallennetaan localStorageen, ei palvelinta. */
  dataUrl: string
  alt: string
}

export interface Vote {
  id: string
  title: string
  /** Markdown-muotoinen kuvaus. */
  description: string
  media?: VoteMedia
  options: VoteOption[]
  closesAt: string // ISO-aikaleima
  createdAt: string // ISO-aikaleima
}

export type VoteStatus = 'open' | 'closed'

export function getVoteStatus(vote: Vote, now: number = Date.now()): VoteStatus {
  return new Date(vote.closesAt).getTime() > now ? 'open' : 'closed'
}

export function totalVotes(vote: Vote): number {
  return vote.options.reduce((sum, o) => sum + o.votes, 0)
}
