export interface VoteOption {
  id: string
  text: string
  votes: number
  /** Valinnainen värivalinta — kun asetettu, vaihtoehto näytetään värinäytteenä. */
  color?: string
}

export interface VoteMedia {
  kind: 'image' | 'drawing'
  /** Palvelimen tarjoilema kuva (/img/…). */
  src: string
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
  /** Tämän selaimen ääni (palvelin päättelee x-voter-otsikosta). */
  myVote?: string
}

export type VoteStatus = 'open' | 'closed'

export function getVoteStatus(vote: Vote, now: number = Date.now()): VoteStatus {
  return new Date(vote.closesAt).getTime() > now ? 'open' : 'closed'
}

export function totalVotes(vote: Vote): number {
  return vote.options.reduce((sum, o) => sum + o.votes, 0)
}

/** Sama laskenta kuin palvelimella — käytetään optimistiseen päivitykseen ennen vastausta. */
export function withVote(vote: Vote, optionId: string): Vote {
  const previous = vote.myVote
  if (previous === optionId) return vote
  return {
    ...vote,
    myVote: optionId,
    options: vote.options.map((o) => {
      if (o.id === previous) return { ...o, votes: Math.max(0, o.votes - 1) }
      if (o.id === optionId) return { ...o, votes: o.votes + 1 }
      return o
    }),
  }
}

/** Luonti- ja muokkauslomakkeen vaihtoehto. `id` on olemassa vain jo tallennetuilla. */
export interface DraftOption {
  id?: string
  text: string
  color?: string
}

/** Kuva lomakkeella: `dataUrl` on asetettu vain juuri valitulle (vielä lähettämättömälle) kuvalle. */
export interface DraftMedia {
  kind: 'image' | 'drawing'
  src: string
  alt: string
  dataUrl?: string
}
