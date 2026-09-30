import { Button } from './Button'
import type { DraftOption } from '../../types'

export const MIN_OPTIONS = 2
export const MAX_OPTIONS = 6
const DEFAULT_COLORS = ['#c9683f', '#2f6b4f', '#2b3f6b', '#d3a03c', '#a8503c', '#3d7ea6']

/** Vaihtoehtojen muokkain — jaettu luontilomakkeen ja sivulla muokkauksen kesken. */
export function OptionsEditor({
  options,
  onChange,
  error,
  warnRemoveVotes = false,
  votesById,
}: {
  options: DraftOption[]
  onChange: (next: DraftOption[]) => void
  error?: string
  /** Muokkauksessa: varoita kun poistettavalla vaihtoehdolla on ääniä. */
  warnRemoveVotes?: boolean
  votesById?: Record<string, number>
}) {
  const useColors = options.some((o) => o.color)

  function update(index: number, patch: Partial<DraftOption>) {
    onChange(options.map((o, i) => (i === index ? { ...o, ...patch } : o)))
  }

  function toggleColors(on: boolean) {
    onChange(options.map((o, i) => ({ ...o, color: on ? (o.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]) : undefined })))
  }

  function add() {
    if (options.length >= MAX_OPTIONS) return
    onChange([...options, { text: '', color: useColors ? DEFAULT_COLORS[options.length % DEFAULT_COLORS.length] : undefined }])
  }

  function remove(index: number) {
    if (options.length <= MIN_OPTIONS) return
    const target = options[index]
    const votes = target.id ? (votesById?.[target.id] ?? 0) : 0
    if (warnRemoveVotes && votes > 0 && !window.confirm(`Vaihtoehdolla on ${votes} ääntä. Poistetaanko se äänineen?`)) return
    onChange(options.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
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
          onChange={(e) => toggleColors(e.target.checked)}
          className="h-6 w-6 shrink-0 accent-[#e58fb8]"
        />
        <span className="text-sm">Äänestä värillä — jokaiselle vaihtoehdolle oma väri</span>
      </label>

      {options.map((opt, i) => (
        <div key={opt.id ?? `new-${i}`} className="flex items-center gap-2">
          {useColors && (
            <input
              type="color"
              value={opt.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              onChange={(e) => update(i, { color: e.target.value })}
              aria-label={`Vaihtoehdon ${i + 1} väri`}
              className="shrink-0 h-11 w-11 rounded-control border border-line bg-surface/60 cursor-pointer p-1"
            />
          )}
          <input
            value={opt.text}
            onChange={(e) => update(i, { text: e.target.value })}
            placeholder={`Vaihtoehto ${i + 1}`}
            maxLength={100}
            aria-label={`Vaihtoehto ${i + 1}`}
            className={`flex-1 min-w-0 min-h-11 px-3.5 rounded-control border bg-surface/60
              placeholder:text-muted focus:border-accent outline-none ${error ? 'border-danger' : 'border-line'}`}
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => remove(i)}
            disabled={options.length <= MIN_OPTIONS}
            aria-label={`Poista vaihtoehto ${i + 1}`}
            className="shrink-0 px-0 text-muted"
          >
            ✕
          </Button>
        </div>
      ))}

      {error && <p className="text-sm text-danger">⚠ {error}</p>}

      <Button type="button" variant="secondary" onClick={add} disabled={options.length >= MAX_OPTIONS} className="w-full">
        + Lisää vaihtoehto
      </Button>
    </div>
  )
}
