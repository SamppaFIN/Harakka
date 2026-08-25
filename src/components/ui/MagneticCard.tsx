import { useEffect, useRef, type ReactNode } from 'react'

/** Kuinka monta pikseliä kortti seuraa kursoria enimmillään. */
const PULL = 5

/**
 * Kortti, joka nojaa kevyesti kohti kursoria ja saa kursoria seuraavan hehkun.
 * Efekti on vain tarkalle osoittimelle (hiiri) — kosketuslaitteilla ja
 * prefers-reduced-motion -tilassa kortti pysyy paikallaan.
 */
export function MagneticCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const enabled = useRef(false)

  useEffect(() => {
    enabled.current =
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el || !enabled.current) return

    const rect = el.getBoundingClientRect()
    const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
    const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)

    el.style.transform = `translate3d(${(dx * PULL).toFixed(2)}px, ${(dy * PULL).toFixed(2)}px, 0)`
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--my', `${e.clientY - rect.top}px`)
    el.style.setProperty('--glow', '1')
  }

  function handlePointerLeave() {
    const el = ref.current
    if (!el) return
    el.style.transform = ''
    el.style.setProperty('--glow', '0')
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`magnetic-card relative bg-surface/65 backdrop-blur-sm border border-line
        rounded-card p-4 sm:p-5 ${className}`}
    >
      {children}
    </div>
  )
}
