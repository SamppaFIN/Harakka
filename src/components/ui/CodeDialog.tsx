import { useEffect, useRef, useState } from 'react'
import { Button } from './Button'

/** Muokkauskoodin kysely. Koodia ei tarkisteta täällä — palvelin tarkistaa sen tallennettaessa. */
export function CodeDialog({
  error,
  onSubmit,
  onCancel,
}: {
  error?: string
  onSubmit: (code: string) => void
  onCancel: () => void
}) {
  const [code, setCode] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => inputRef.current?.focus(), [])

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-canvas/80 backdrop-blur-sm p-4"
      onKeyDown={(e) => e.key === 'Escape' && onCancel()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="code-title"
        onSubmit={(e) => {
          e.preventDefault()
          if (code.trim()) onSubmit(code.trim())
        }}
        className="w-full max-w-sm bg-surface border border-line rounded-card p-5 space-y-4"
      >
        <h2 id="code-title" className="font-semibold">
          Muokkauskoodi
        </h2>
        <p className="text-sm text-muted">
          Syötä 5-merkkinen koodi, jonka sait äänestystä luodessasi.
        </p>
        <input
          ref={inputRef}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={8}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-label="Muokkauskoodi"
          className={`w-full min-h-11 px-3.5 rounded-control border bg-surface/60 tracking-[0.3em] text-center text-lg
            focus:border-accent outline-none ${error ? 'border-danger' : 'border-line'}`}
        />
        {error && <p className="text-sm text-danger">⚠ {error}</p>}
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Peruuta
          </Button>
          <Button type="submit" className="flex-1" disabled={!code.trim()}>
            Jatka
          </Button>
        </div>
      </form>
    </div>
  )
}
