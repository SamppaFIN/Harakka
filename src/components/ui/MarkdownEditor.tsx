import { useRef, useState } from 'react'
import { renderMarkdown } from '../../lib/markdown'

interface ToolbarAction {
  label: string
  title: string
  before: string
  after: string
  /** Rivin alkuun lisättävä merkintä (otsikot, listat) */
  linePrefix?: boolean
}

const ACTIONS: ToolbarAction[] = [
  { label: 'B', title: 'Lihavointi', before: '**', after: '**' },
  { label: 'I', title: 'Kursiivi', before: '*', after: '*' },
  { label: 'H', title: 'Otsikko', before: '## ', after: '', linePrefix: true },
  { label: '•', title: 'Luettelo', before: '- ', after: '', linePrefix: true },
  { label: '1.', title: 'Numeroitu lista', before: '1. ', after: '', linePrefix: true },
  { label: '❝', title: 'Lainaus', before: '> ', after: '', linePrefix: true },
  { label: '🔗', title: 'Linkki', before: '[', after: '](https://)' },
]

export function MarkdownEditor({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 6,
}: {
  id: string
  label: string
  value: string
  onChange: (next: string) => void
  placeholder?: string
  rows?: number
}) {
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function applyAction(action: ToolbarAction) {
    const el = textareaRef.current
    if (!el) return

    const start = el.selectionStart
    const end = el.selectionEnd

    if (action.linePrefix) {
      // Lisää merkintä valinnan alkurivin alkuun
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const next = value.slice(0, lineStart) + action.before + value.slice(lineStart)
      onChange(next)
      queueMicrotask(() => {
        el.focus()
        el.setSelectionRange(start + action.before.length, end + action.before.length)
      })
      return
    }

    const selected = value.slice(start, end)

    // Linkki: maalattu osoite → [osoite](osoite). Muuten maalattu teksti on linkin teksti ja osoitepohja
    // "https://" jää valituksi, jotta osoitteen voi kirjoittaa suoraan sen päälle.
    if (action.title === 'Linkki') {
      const isUrl = /^https?:\/\/\S+$/i.test(selected.trim())
      const label = selected || 'teksti'
      const url = isUrl ? selected.trim() : 'https://'
      const next = value.slice(0, start) + `[${label}](${url})` + value.slice(end)
      onChange(next)
      queueMicrotask(() => {
        el.focus()
        if (isUrl) {
          const caret = start + label.length + url.length + 4
          el.setSelectionRange(caret, caret)
        } else {
          const urlStart = start + label.length + 3
          el.setSelectionRange(urlStart, urlStart + url.length)
        }
      })
      return
    }
    const next = value.slice(0, start) + action.before + selected + action.after + value.slice(end)
    onChange(next)
    queueMicrotask(() => {
      el.focus()
      el.setSelectionRange(start + action.before.length, start + action.before.length + selected.length)
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
        <div className="flex rounded-control border border-line overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={`px-3 min-h-11 ${tab === 'write' ? 'bg-accent-soft font-medium' : 'bg-surface/60 text-muted'}`}
          >
            Kirjoita
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`px-3 min-h-11 border-l border-line ${tab === 'preview' ? 'bg-accent-soft font-medium' : 'bg-surface/60 text-muted'}`}
          >
            Esikatselu
          </button>
        </div>
      </div>

      {tab === 'write' ? (
        <>
          <div className="flex flex-wrap gap-1 mb-1.5">
            {ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                title={action.title}
                aria-label={action.title}
                onClick={() => applyAction(action)}
                className="min-h-11 min-w-11 px-2 rounded-control border border-line bg-surface/60
                  hover:bg-surface-hover text-sm text-muted"
              >
                {action.label}
              </button>
            ))}
          </div>
          <textarea
            id={id}
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full px-3.5 py-2.5 rounded-control border border-line bg-surface/60 text-ink
              placeholder:text-muted focus:border-accent outline-none resize-y font-mono text-sm"
          />
          <p className="mt-1 text-xs text-muted">
            Markdown tuettu: **lihavointi**, *kursiivi*, ## otsikko, - lista, &gt; lainaus, [linkki](url)
          </p>
        </>
      ) : (
        <div className="min-h-32 px-3.5 py-2.5 rounded-control border border-line bg-surface">
          {value.trim() ? (
            <div
              className="text-sm leading-relaxed break-words"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
            />
          ) : (
            <p className="text-sm text-muted">Ei sisältöä esikatseltavaksi.</p>
          )}
        </div>
      )}
    </div>
  )
}
