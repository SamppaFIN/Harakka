import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError, describeError, storeCode } from '../lib/api'
import { defaultClosesAt, draftToInput, validateDraft, type Draft, type DraftErrors } from '../lib/draft'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/FormField'
import { MarkdownEditor } from '../components/ui/MarkdownEditor'
import { MediaEditor } from '../components/ui/MediaEditor'
import { OptionsEditor } from '../components/ui/OptionsEditor'

export function VoteCreatePage() {
  const navigate = useNavigate()
  const [draft, setDraft] = useState<Draft>({
    title: '',
    description: '',
    options: [{ text: '' }, { text: '' }],
    closesAt: defaultClosesAt(),
    media: undefined,
    mediaChanged: false,
  })
  const [errors, setErrors] = useState<DraftErrors>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const found = validateDraft(draft, { requireFuture: true })
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    setSaveError(null)
    try {
      const { id, code } = await api.createVote(draftToInput(draft))
      storeCode(id, code) // tämä selain pääsee muokkaamaan ilman koodin syöttöä
      navigate(`/aanestys/${id}`, { state: { newCode: code } })
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields)
      setSaveError(describeError(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="text-sm text-muted hover:text-ink min-h-11 -ml-1 px-1 flex items-center gap-1"
      >
        ← Takaisin
      </button>

      <h1 className="text-xl font-semibold">Uusi äänestys</h1>

      <Card className="space-y-4">
        <TextField
          id="title"
          label="Otsikko"
          value={draft.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="Mistä äänestetään?"
          error={errors.title}
          maxLength={120}
        />

        <MarkdownEditor
          id="description"
          label="Kuvaus"
          value={draft.description}
          onChange={(description) => set({ description })}
          placeholder="Kerro taustaa. Voit käyttää Markdownia."
        />
      </Card>

      <Card className="space-y-3">
        <span className="text-sm font-medium block">Kuva tai piirros</span>
        <MediaEditor
          media={draft.media}
          onChange={(media) => set({ media, mediaChanged: true })}
          error={errors.media}
        />
      </Card>

      <Card>
        <OptionsEditor options={draft.options} onChange={(options) => set({ options })} error={errors.options} />
      </Card>

      <Card>
        <TextField
          id="closesAt"
          label="Sulkeutumisaika"
          type="datetime-local"
          value={draft.closesAt}
          onChange={(e) => set({ closesAt: e.target.value })}
          error={errors.closesAt}
        />
      </Card>

      {saveError && <p className="text-sm text-danger border border-danger rounded-control px-3 py-2">⚠ {saveError}</p>}

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? 'Julkaistaan…' : 'Julkaise äänestys'}
      </Button>
    </form>
  )
}
