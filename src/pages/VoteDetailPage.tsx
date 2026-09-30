import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useVote } from '../lib/useVotes'
import { api, ApiError, describeError, forgetCode, getStoredCode, storeCode } from '../lib/api'
import { draftToInput, formatDate, toLocalInput, validateDraft, type Draft, type DraftErrors } from '../lib/draft'
import { getVoteStatus, totalVotes, type Vote } from '../types'
import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/FormField'
import { MarkdownEditor } from '../components/ui/MarkdownEditor'
import { MediaEditor } from '../components/ui/MediaEditor'
import { OptionsEditor } from '../components/ui/OptionsEditor'
import { EditRegion } from '../components/ui/EditRegion'
import { CodeDialog } from '../components/ui/CodeDialog'
import { VoteOptions } from '../components/VoteOptions'
import { renderMarkdown } from '../lib/markdown'

type Region = 'title' | 'description' | 'media' | 'options' | 'closes'

function draftFrom(vote: Vote): Draft {
  return {
    title: vote.title,
    description: vote.description,
    options: vote.options.map((o) => ({ id: o.id, text: o.text, color: o.color })),
    closesAt: toLocalInput(new Date(vote.closesAt)),
    media: vote.media ? { ...vote.media } : undefined,
    mediaChanged: false,
  }
}

/** Julkaistun sivun näköinen esikatselu luonnoksesta — muokkaustila piirtää saman kuin lukutila. */
function previewOf(vote: Vote, draft: Draft): Vote {
  const votes = Object.fromEntries(vote.options.map((o) => [o.id, o.votes]))
  const closes = new Date(draft.closesAt)
  return {
    ...vote,
    title: draft.title,
    description: draft.description,
    media: draft.media ? { kind: draft.media.kind, src: draft.media.src, alt: draft.media.alt } : undefined,
    options: draft.options
      .filter((o) => o.text.trim())
      .map((o, i) => ({ id: o.id ?? `new-${i}`, text: o.text, color: o.color, votes: (o.id && votes[o.id]) || 0 })),
    closesAt: Number.isNaN(closes.getTime()) ? vote.closesAt : closes.toISOString(),
  }
}

export function VoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { vote, setVote, state, reload, castVote, voteError } = useVote(id)

  const [newCode, setNewCode] = useState<string | null>(
    (location.state as { newCode?: string } | null)?.newCode ?? null,
  )
  const [draft, setDraft] = useState<Draft | null>(null) // ei null = muokkaustilassa
  const [code, setCode] = useState<string | undefined>()
  const [codeDialog, setCodeDialog] = useState<{ error?: string; then: 'edit' | 'save' } | null>(null)
  const [openRegion, setOpenRegion] = useState<Region | null>(null)
  const [errors, setErrors] = useState<DraftErrors>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (state === 'loading' && !vote) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Ladataan">
        <div className="h-8 w-2/3 rounded-control bg-surface/60 animate-pulse" />
        <div className="h-24 rounded-card bg-surface/60 animate-pulse" />
        <div className="h-48 rounded-card bg-surface/60 animate-pulse" />
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="text-center py-16">
        <p className="text-danger mb-4">⚠ Äänestyksen lataus epäonnistui.</p>
        <Button variant="secondary" onClick={reload}>
          Yritä uudelleen
        </Button>
      </div>
    )
  }

  if (!vote) {
    return (
      <div className="text-center py-16">
        <p className="text-muted mb-4">Äänestystä ei löytynyt.</p>
        <Link to="/">
          <Button variant="secondary">Takaisin listaan</Button>
        </Link>
      </div>
    )
  }

  const editing = draft !== null
  const shown = editing ? previewOf(vote, draft) : vote
  const status = getVoteStatus(shown)
  const open = status === 'open'
  const myVote = vote.myVote
  const total = totalVotes(shown)
  const votesById = Object.fromEntries(vote.options.map((o) => [o.id, o.votes]))

  const patch = (p: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...p } : d))

  function startEdit(withCode: string) {
    setCode(withCode)
    setDraft(draftFrom(vote!))
    setErrors({})
    setSaveError(null)
    setOpenRegion(null)
  }

  function requestEdit() {
    const stored = id ? getStoredCode(id) : undefined
    if (stored) startEdit(stored)
    else setCodeDialog({ then: 'edit' })
  }

  function cancelEdit() {
    setDraft(null)
    setOpenRegion(null)
    setErrors({})
    setSaveError(null)
  }

  async function save(withCode: string | undefined = code) {
    if (!draft || !vote || !withCode) return
    const found = validateDraft(draft, { requireFuture: false })
    setErrors(found)
    const firstBad = (['title', 'options', 'closesAt'] as const).find((k) => found[k])
    if (firstBad) {
      setOpenRegion(firstBad === 'closesAt' ? 'closes' : firstBad)
      return
    }

    setSaving(true)
    setSaveError(null)
    try {
      await api.patchVote(vote.id, withCode, draftToInput(draft))
      storeCode(vote.id, withCode)
      setCode(withCode)
      const fresh = await api.getVote(vote.id)
      setVote(fresh)
      cancelEdit()
    } catch (err) {
      if (err instanceof ApiError && err.code === 'forbidden') {
        // Väärä koodi: luonnos säilyy taustalla, koodikysely avautuu uudelleen.
        forgetCode(vote.id)
        setCodeDialog({ error: describeError(err), then: 'save' })
      } else if (err instanceof ApiError && err.fields) {
        setErrors(err.fields)
        setSaveError('Tarkista merkityt kentät.')
      } else {
        setSaveError(describeError(err))
      }
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!vote || !code) return
    if (!window.confirm(`Poistetaanko "${vote.title}" pysyvästi? Äänet menetetään, eikä tätä voi perua.`)) return
    setSaving(true)
    try {
      await api.deleteVote(vote.id, code)
      forgetCode(vote.id)
      navigate('/')
    } catch (err) {
      if (err instanceof ApiError && err.code === 'forbidden') {
        forgetCode(vote.id)
        setCodeDialog({ error: describeError(err), then: 'edit' })
      } else {
        setSaveError(describeError(err))
      }
      setSaving(false)
    }
  }

  async function report() {
    if (!vote || !window.confirm('Ilmoitetaanko tämä äänestys asiattomaksi ylläpidolle?')) return
    try {
      await api.reportVote(vote.id)
      window.alert('Kiitos, ilmoitus on lähetetty.')
    } catch (err) {
      window.alert(describeError(err))
    }
  }

  const region = (name: Region) => ({
    editing,
    open: openRegion === name,
    onOpen: () => setOpenRegion(name),
    onClose: () => setOpenRegion(null),
  })

  return (
    <div className={`space-y-5 ${editing ? 'pb-28' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => navigate('/')}
          className="text-sm text-muted hover:text-ink min-h-11 -ml-1 px-1 flex items-center gap-1"
        >
          ← Takaisin
        </button>
        {!editing && (
          <Button variant="secondary" onClick={requestEdit} className="text-sm">
            ✎ Muokkaa
          </Button>
        )}
      </div>

      {newCode && (
        <div role="status" className="rounded-card border border-accent bg-accent-soft/40 p-4 space-y-2">
          <p className="text-sm">Äänestys on julkaistu. Muokkauskoodisi:</p>
          <p className="text-2xl font-semibold tracking-[0.3em] text-accent">{newCode}</p>
          <p className="text-xs text-muted">
            Tallenna koodi — sitä ei näytetä uudelleen, ja sillä muokkaat tai poistat äänestyksen myös toisella laitteella.
            Tässä selaimessa muokkaus onnistuu ilman koodia.
          </p>
          <Button variant="secondary" onClick={() => setNewCode(null)} className="text-sm">
            Tallensin koodin
          </Button>
        </div>
      )}

      {editing && (
        <p className="text-sm text-muted border border-line rounded-control px-3 py-2 bg-surface/50">
          Muokkaustila: klikkaa mitä tahansa kohtaa muokataksesi sitä. Muutokset tallentuvat vasta kun painat Tallenna.
        </p>
      )}

      <EditRegion
        label="otsikko"
        {...region('title')}
        editor={
          <TextField
            id="edit-title"
            label="Otsikko"
            value={draft?.title ?? ''}
            onChange={(e) => patch({ title: e.target.value })}
            error={errors.title}
            maxLength={120}
          />
        }
      >
        <div className={`flex items-start justify-between gap-3 ${editing ? 'pt-3' : ''}`}>
          <h1 className="text-xl font-semibold leading-snug break-words">{shown.title || 'Otsikko puuttuu'}</h1>
          <StatusBadge status={status} />
        </div>
      </EditRegion>

      <EditRegion
        label="kuvaus"
        emptyLabel="Lisää kuvaus"
        empty={!shown.description.trim()}
        {...region('description')}
        editor={
          <MarkdownEditor
            id="edit-description"
            label="Kuvaus"
            value={draft?.description ?? ''}
            onChange={(description) => patch({ description })}
            placeholder="Kerro taustaa. Voit käyttää Markdownia."
          />
        }
      >
        <div
          className="text-muted break-words leading-relaxed space-y-2"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(shown.description) }}
        />
      </EditRegion>

      <EditRegion
        label="kuva"
        emptyLabel="Lisää kuva tai piirros"
        empty={!shown.media}
        {...region('media')}
        editor={
          <MediaEditor
            media={draft?.media}
            onChange={(media) => patch({ media, mediaChanged: true })}
            error={errors.media}
          />
        }
      >
        {shown.media && <img src={shown.media.src} alt={shown.media.alt} className="w-full rounded-card border border-line" />}
      </EditRegion>

      <EditRegion
        label="vaihtoehdot"
        {...region('options')}
        editor={
          <OptionsEditor
            options={draft?.options ?? []}
            onChange={(options) => patch({ options })}
            error={errors.options}
            warnRemoveVotes
            votesById={votesById}
          />
        }
      >
        <Card>
          <h2 className="text-sm font-semibold mb-3 text-muted uppercase tracking-wide">
            {!open ? 'Lopulliset tulokset' : myVote ? 'Tulokset' : 'Valitse vaihtoehto'}
          </h2>

          <VoteOptions
            vote={shown}
            myVote={myVote}
            onVote={open && !editing ? (optionId) => castVote(optionId) : undefined}
          />

          {open && myVote && !editing && (
            <p className="text-xs text-muted pt-3">Äänesi on tallennettu. Voit vaihtaa valintaasi milloin tahansa.</p>
          )}
          {voteError && <p className="text-sm text-danger pt-3">⚠ {voteError}</p>}
        </Card>
      </EditRegion>

      <EditRegion
        label="sulkeutumisaika"
        {...region('closes')}
        editor={
          <TextField
            id="edit-closes"
            label="Sulkeutumisaika"
            type="datetime-local"
            value={draft?.closesAt ?? ''}
            onChange={(e) => patch({ closesAt: e.target.value })}
            error={errors.closesAt}
          />
        }
      >
        <p className="text-xs text-muted text-center">
          {open ? 'Sulkeutuu ' : 'Sulkeutui '}
          {formatDate(shown.closesAt)} · {total} ääntä yhteensä
        </p>
      </EditRegion>

      {!editing && (
        <p className="text-center">
          <button onClick={report} className="text-xs text-muted hover:text-ink min-h-11 px-3 underline-offset-2 hover:underline">
            Ilmoita asiaton
          </button>
        </p>
      )}

      {editing && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-canvas/90 backdrop-blur-md border-t border-line">
          <div className="max-w-2xl mx-auto px-4 py-3 space-y-2">
            {saveError && <p className="text-sm text-danger">⚠ {saveError}</p>}
            <div className="flex gap-2">
              <Button variant="danger" onClick={remove} disabled={saving} className="shrink-0">
                Poista
              </Button>
              <Button variant="secondary" onClick={cancelEdit} disabled={saving} className="flex-1">
                Peruuta
              </Button>
              <Button onClick={() => save()} disabled={saving} className="flex-1">
                {saving ? 'Tallennetaan…' : 'Tallenna'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {codeDialog && (
        <CodeDialog
          error={codeDialog.error}
          onCancel={() => setCodeDialog(null)}
          onSubmit={(entered) => {
            const then = codeDialog.then
            setCodeDialog(null)
            if (then === 'edit') startEdit(entered)
            else void save(entered)
          }}
        />
      )}
    </div>
  )
}
