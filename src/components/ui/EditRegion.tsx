import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from './Button'

/**
 * Klikkaa-muokataksesi: muokkaustilassa sivu näyttää täsmälleen julkaistulta. Jokainen kohta on
 * tällainen alue — hover/fokus = katkoviiva + "✎ Muokkaa", klikkaus avaa vain sen kohdan editorin
 * samaan paikkaan. Valmis / Esc sulkee editorin ja näyttää kohdan uusilla tiedoilla.
 *
 * Alue itse ei ole role=button: sen sisällä voi olla linkkejä ja nappeja, ja sisäkkäinen
 * interaktiivisuus rikkoisi saavutettavuuden. Siksi erillinen oikea nappi + hiiriklikkaus alueeseen.
 */
export function EditRegion({
  label,
  editing,
  open,
  onOpen,
  onClose,
  editor,
  empty,
  emptyLabel,
  children,
  className = '',
}: {
  /** Kohdan nimi napin tekstiä varten, esim. "otsikko". */
  label: string
  /** Sivu on muokkaustilassa. Muuten lapset renderöityvät sellaisenaan. */
  editing: boolean
  open: boolean
  onOpen: () => void
  onClose: () => void
  editor: ReactNode
  /** Kohta on tyhjä → muokkaustilassa himmeä paikkamerkki, julkaistulla sivulla ei mitään. */
  empty?: boolean
  emptyLabel?: string
  children: ReactNode
  className?: string
}) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const first = editorRef.current?.querySelector<HTMLElement>('input, textarea, button, select')
    first?.focus({ preventScroll: false })
  }, [open])

  if (!editing) return empty ? null : <div className={className}>{children}</div>

  if (open) {
    return (
      <div
        ref={editorRef}
        className={`rounded-card border-2 border-accent bg-surface/80 p-3 sm:p-4 space-y-3 ${className}`}
        onKeyDown={(e) => {
          // Esc sulkee vain tämän kohdan, ei koko muokkaustilaa. Värivalitsin ja muut sisäiset dialogit eivät välitä.
          if (e.key === 'Escape') {
            e.stopPropagation()
            onClose()
          }
        }}
      >
        {editor}
        <Button type="button" onClick={onClose} className="w-full">
          Valmis
        </Button>
      </div>
    )
  }

  return (
    <div
      className={`group relative rounded-card border border-dashed border-transparent hover:border-accent/70
        focus-within:border-accent/70 transition-colors cursor-pointer -m-2 p-2 ${className}`}
      onClick={(e) => {
        // Linkit ja napit alueen sisällä toimivat omana itsenään.
        if ((e.target as HTMLElement).closest('a, button, input, select, textarea')) return
        onOpen()
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Muokkaa: ${label}`}
        className="region-edit-btn absolute -top-3 right-2 z-[1] min-h-8 px-2.5 rounded-full border border-accent bg-canvas
          text-xs text-accent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100"
      >
        ✎ Muokkaa
      </button>
      {empty ? (
        <p className="text-sm text-muted italic py-3 text-center">+ {emptyLabel ?? `Lisää ${label}`}</p>
      ) : (
        children
      )}
    </div>
  )
}
