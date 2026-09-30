import { readJSON, writeJSON, STORAGE_KEYS } from './storage'
import type { DraftOption, Vote } from '../types'

// Tuotannossa API on Workerissa (VITE_API_URL, ks. deploy.yml); paikallisesti Vite-proxy ohjaa /api:n.
const API_ORIGIN = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

/** Palvelin palauttaa kuvat polkuna (/img/…); sivu on eri originissa, joten polku täydennetään. */
function absolutize(vote: Vote): Vote {
  return vote.media && vote.media.src.startsWith('/')
    ? { ...vote, media: { ...vote.media, src: API_ORIGIN + vote.media.src } }
    : vote
}

export class ApiError extends Error {
  status: number
  code: string
  fields?: Record<string, string>
  constructor(status: number, code: string, fields?: Record<string, string>) {
    super(code)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

// Jos localStorage ei ole käytössä, tunniste elää vain tämän sivulatauksen ajan.
let memoryVoterId: string | undefined

export function getVoterId(): string {
  const stored = readJSON<string>(STORAGE_KEYS.voter, '')
  if (/^[A-Za-z0-9_-]{16,64}$/.test(stored)) return stored
  const fresh = memoryVoterId ?? crypto.randomUUID().replace(/-/g, '')
  memoryVoterId = fresh
  writeJSON(STORAGE_KEYS.voter, fresh)
  return fresh
}

type Codes = Record<string, string>
export const getStoredCode = (voteId: string): string | undefined => readJSON<Codes>(STORAGE_KEYS.codes, {})[voteId]
export function storeCode(voteId: string, code: string) {
  writeJSON(STORAGE_KEYS.codes, { ...readJSON<Codes>(STORAGE_KEYS.codes, {}), [voteId]: code })
}
export function forgetCode(voteId: string) {
  const rest = { ...readJSON<Codes>(STORAGE_KEYS.codes, {}) }
  delete rest[voteId]
  writeJSON(STORAGE_KEYS.codes, rest)
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_ORIGIN}/api${path}`, {
      ...init,
      headers: { 'x-voter': getVoterId(), ...(init.body ? { 'content-type': 'application/json' } : {}) },
    })
  } catch {
    throw new ApiError(0, 'network')
  }
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, body.error ?? 'error', body.fields)
  return body as T
}

export interface VoteInput {
  title: string
  description: string
  options: DraftOption[]
  closesAt: string
  /** undefined = ei muutosta (vain muokkaus), null = poista kuva. */
  media?: { kind: 'image' | 'drawing'; dataUrl: string; alt: string } | null
}

const json = (body: unknown) => JSON.stringify(body)
const enc = encodeURIComponent

export const api = {
  listVotes: () => request<{ votes: Vote[] }>('/votes').then((r) => r.votes.map(absolutize)),
  getVote: (id: string) => request<Vote>(`/votes/${enc(id)}`).then(absolutize),
  createVote: (input: VoteInput) => request<{ id: string; code: string }>('/votes', { method: 'POST', body: json(input) }),
  patchVote: (id: string, code: string, input: VoteInput) =>
    request<{ ok: true }>(`/votes/${enc(id)}`, { method: 'PATCH', body: json({ ...input, code }) }),
  deleteVote: (id: string, code: string) => request<{ ok: true }>(`/votes/${enc(id)}`, { method: 'DELETE', body: json({ code }) }),
  castVote: (id: string, optionId: string) =>
    request<Vote>(`/votes/${enc(id)}/vote`, { method: 'POST', body: json({ voterId: getVoterId(), optionId }) }).then(absolutize),
  reportVote: (id: string) => request<{ ok: true }>(`/votes/${enc(id)}/report`, { method: 'POST' }),
}

/** Käyttäjälle näytettävä virheteksti. */
export function describeError(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Jokin meni pieleen.'
  switch (err.code) {
    case 'network':
      return 'Yhteys palvelimeen ei onnistunut. Tarkista verkko ja yritä uudelleen.'
    case 'not_found':
      return 'Äänestystä ei löytynyt.'
    case 'forbidden':
      return 'Väärä muokkauskoodi.'
    case 'closed':
      return 'Äänestys on jo sulkeutunut.'
    case 'busy':
      return 'Liikaa pyyntöjä — odota hetki ja yritä uudelleen.'
    case 'too_large':
      return 'Kuva on liian suuri.'
    case 'full':
      return 'Äänestys on täynnä.'
    default:
      return 'Tallennus epäonnistui.'
  }
}
