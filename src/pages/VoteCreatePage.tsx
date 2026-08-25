import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVotes } from '../lib/useVotes'
import { fileToCompressedDataUrl } from '../lib/image'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/FormField'
import { MarkdownEditor } from '../components/ui/MarkdownEditor'
import { DrawingCanvas } from '../components/ui/DrawingCanvas'
import type { VoteMedia } from '../types'

const MIN_OPTIONS = 2
const MAX_OPTIONS = 6
const DEFAULT_COLORS = ['#c9683f', '#2f6b4f', '#2b3f6b', '#d3a03c', '#a8503c', '#3d7ea6']

/** Oletus: viikko eteenpäin, muotoiltuna datetime-local-kentälle. */
function defaultClosesAt() {
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface Errors {
  title?: string
  closesAt?: string
  options?: string
  media?: string
  save?: string
}

export function VoteCreatePage() {
  const navigate = useNavigate()
  const { createVote, storageFull } = useVotes()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [useColors, setUseColors] = useState(false)
  const [colors, setColors] = useState<string[]>([DEFAULT_COLORS[0], DEFAULT_COLORS[1]])
  const [closesAt, setClosesAt] = useState(defaultClosesAt)
  const [media, setMedia] = useState<VoteMedia | undefined>()
  const [drawingOpen, setDrawingOpen] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)))
  }

  function updateColor(index: number, value: string) {
    setColors((prev) => prev.map((c, i) => (i === index ? value : c)))
  }

  function addOption() {
    if (options.length >= MAX_OPTIONS) return
    setOptions((prev) => [...prev, ''])
    setColors((prev) => [...prev, DEFAULT_COLORS[prev.length % DEFAULT_COLORS.length]])
  }

  function removeOption(index: number) {
    if (options.length <= MIN_OPTIONS) return
    setOptions((prev) => prev.filter((_, i) => i !== index))
    setColors((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      setMedia({ kind: 'image', dataUrl, alt: file.name })
      setErrors((prev) => ({ ...prev, media: undefined }))
    } catch (err) {
      setErrors((prev) => ({ ...prev, media: err instanceof Error ? err.message : 'Kuvan lisäys epäonnistui.' }))
    } finally {
      e.target.value = '' // sama tiedosto voidaan valita uudelleen
    }
  }

  function validate(): Errors {
    const next: Errors = {}
    if (!title.trim()) next.title = 'Otsikko on pakollinen.'

    const filled = options.map((o) => o.trim()).filter(Boolean)
    if (filled.length < MIN_OPTIONS) {
      next.options = `Tarvitaan vähintään ${MIN_OPTIONS} vaihtoehtoa.`
    } else if (new Set(filled).size !== filled.length) {
      next.options = 'Vaihtoehdot eivät saa olla samoja.'
    }

    if (!closesAt) {
      next.closesAt = 'Sulkeutumisaika on pakollinen.'
    } else if (new Date(closesAt).getTime() <= Date.now()) {
      next.closesAt = 'Sulkeutumisajan pitää olla tulevaisuudessa.'
    }
    return next
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const payload = options
      .map((text, i) => ({ text: text.trim(), color: useColors ? colors[i] : undefined }))
      .filter((o) => o.text)

    const id = createVote({
      title,
      description,
      options: payload,
      closesAt: new Date(closesAt).toISOString(),
      media,
    })
    navigate(`/aanestys/${id}`)
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

      {storageFull && (
        <p className="text-sm text-danger border border-danger rounded-control px-3 py-2">
          Selaimen tallennustila on täynnä. Poista kuvia tai vanhoja äänestyksiä.
        </p>
      )}

      <Card className="space-y-4">
        <TextField
          id="title"
          label="Otsikko"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Mistä äänestetään?"
          error={errors.title}
          maxLength={120}
        />

        <MarkdownEditor
          id="description"
          label="Kuvaus"
          value={description}
          onChange={setDescription}
          placeholder="Kerro taustaa. Voit käyttää Markdownia."
        />
      </Card>

      <Card className="space-y-3">
        <span className="text-sm font-medium block">Kuva tai piirros</span>

        {media ? (
          <div className="space-y-2">
            <img
              src={media.dataUrl}
              alt={media.alt}
              className="w-full rounded-control border border-line"
            />
            <Button type="button" variant="secondary" onClick={() => setMedia(undefined)} className="w-full">
              Poista {media.kind === 'drawing' ? 'piirros' : 'kuva'}
            </Button>
          </div>
        ) : drawingOpen ? (
          <DrawingCanvas
            onSave={(dataUrl) => {
              setMedia({ kind: 'drawing', dataUrl, alt: 'Piirros' })
              setDrawingOpen(false)
            }}
            onCancel={() => setDrawingOpen(false)}
          />
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              🖼️ Lisää kuva
            </Button>
            <Button type="button" variant="secondary" onClick={() => setDrawingOpen(true)} className="flex-1">
              ✏️ Piirrä
            </Button>
          </div>
        )}

        {errors.media && <p className="text-sm text-danger">{errors.media}</p>}
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Vaihtoehdot</span>
          <span className="text-xs text-muted">
            {options.length}/{MAX_OPTIONS}
          </span>
        </div>

        <label className="flex items-center gap-2.5 min-h-11 cursor-pointer">
          <input
            type="checkbox"
            checked={useColors}
            onChange={(e) => setUseColors(e.target.checked)}
            className="h-6 w-6 shrink-0 accent-[#e58fb8]"
          />
          <span className="text-sm">Äänestä värillä — jokaiselle vaihtoehdolle oma väri</span>
        </label>

        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            {useColors && (
              <input
                type="color"
                value={colors[i]}
                onChange={(e) => updateColor(i, e.target.value)}
                aria-label={`Vaihtoehdon ${i + 1} väri`}
                className="shrink-0 h-11 w-11 rounded-control border border-line bg-surface/60 cursor-pointer p-1"
              />
            )}
            <input
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`Vaihtoehto ${i + 1}`}
              maxLength={100}
              aria-label={`Vaihtoehto ${i + 1}`}
              className={`flex-1 min-w-0 min-h-11 px-3.5 rounded-control border bg-surface/60
                placeholder:text-muted focus:border-accent outline-none
                ${errors.options ? 'border-danger' : 'border-line'}`}
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() => removeOption(i)}
              disabled={options.length <= MIN_OPTIONS}
              aria-label={`Poista vaihtoehto ${i + 1}`}
              className="shrink-0 px-0 text-muted"
            >
              ✕
            </Button>
          </div>
        ))}

        {errors.options && <p className="text-sm text-danger">{errors.options}</p>}

        <Button
          type="button"
          variant="secondary"
          onClick={addOption}
          disabled={options.length >= MAX_OPTIONS}
          className="w-full"
        >
          + Lisää vaihtoehto
        </Button>
      </Card>

      <Card>
        <TextField
          id="closesAt"
          label="Sulkeutumisaika"
          type="datetime-local"
          value={closesAt}
          onChange={(e) => setClosesAt(e.target.value)}
          error={errors.closesAt}
        />
      </Card>

      <Button type="submit" className="w-full">
        Julkaise äänestys
      </Button>
    </form>
  )
}
