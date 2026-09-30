import type { VoteInput } from './api'
import type { DraftMedia, DraftOption } from '../types'

const pad = (n: number) => String(n).padStart(2, '0')

/** Date → datetime-local-kentän arvo (paikallinen aika). */
export function toLocalInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Oletus: viikko eteenpäin. */
export function defaultClosesAt(): string {
  return toLocalInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export interface Draft {
  title: string
  description: string
  options: DraftOption[]
  closesAt: string // datetime-local
  media: DraftMedia | undefined
  mediaChanged: boolean
}

export type DraftErrors = Partial<Record<'title' | 'description' | 'options' | 'closesAt' | 'media', string>>

/** Selainpuolen tarkistus — vain käyttömukavuutta, palvelin tarkistaa aina uudelleen. */
export function validateDraft(d: Draft, { requireFuture }: { requireFuture: boolean }): DraftErrors {
  const errors: DraftErrors = {}
  if (!d.title.trim()) errors.title = 'Otsikko on pakollinen.'

  const filled = d.options.map((o) => o.text.trim()).filter(Boolean)
  if (filled.length < 2) errors.options = 'Tarvitaan vähintään 2 vaihtoehtoa.'
  else if (new Set(filled.map((t) => t.toLowerCase())).size !== filled.length) errors.options = 'Vaihtoehdot eivät saa olla samoja.'

  const closes = new Date(d.closesAt).getTime()
  if (!d.closesAt || Number.isNaN(closes)) errors.closesAt = 'Sulkeutumisaika on pakollinen.'
  else if (requireFuture && closes <= Date.now()) errors.closesAt = 'Sulkeutumisajan pitää olla tulevaisuudessa.'
  return errors
}

export function draftToInput(d: Draft): VoteInput {
  const input: VoteInput = {
    title: d.title,
    description: d.description,
    options: d.options.filter((o) => o.text.trim()).map((o) => ({ id: o.id, text: o.text, color: o.color })),
    closesAt: new Date(d.closesAt).toISOString(),
  }
  if (d.mediaChanged) {
    input.media = d.media?.dataUrl ? { kind: d.media.kind, dataUrl: d.media.dataUrl, alt: d.media.alt } : null
  }
  return input
}
