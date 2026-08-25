import { useEffect, useRef, useState } from 'react'
import { Button } from './Button'

const WIDTH = 800
const HEIGHT = 500

const PALETTE = ['#232323', '#c9683f', '#2f6b4f', '#2b3f6b', '#d3a03c', '#a8503c', '#3d7ea6']
const SIZES = [3, 8, 18]

interface Stroke {
  color: string
  size: number
  points: { x: number; y: number }[]
}

export function DrawingCanvas({ onSave, onCancel }: { onSave: (dataUrl: string) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [color, setColor] = useState(PALETTE[0])
  const [size, setSize] = useState(SIZES[1])
  const drawing = useRef(false)

  // Piirretään koko historia uudelleen aina kun se muuttuu — yksinkertaista ja tekee undo:sta triviaalin.
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, WIDTH, HEIGHT)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    for (const stroke of strokes) {
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.size
      ctx.beginPath()
      stroke.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
      // Yksittäinen napautus: piirrä piste
      if (stroke.points.length === 1) {
        ctx.lineTo(stroke.points[0].x + 0.1, stroke.points[0].y)
      }
      ctx.stroke()
    }
  }, [strokes])

  /** Ruutukoordinaatit → canvas-koordinaatit (canvas skaalautuu CSS:llä). */
  function toCanvasPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * WIDTH,
      y: ((e.clientY - rect.top) / rect.height) * HEIGHT,
    }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    const point = toCanvasPoint(e)
    setStrokes((prev) => [...prev, { color, size, points: [point] }])
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return
    const point = toCanvasPoint(e)
    setStrokes((prev) => {
      const last = prev[prev.length - 1]
      if (!last) return prev
      return [...prev.slice(0, -1), { ...last, points: [...last.points, point] }]
    })
  }

  function handlePointerUp() {
    drawing.current = false
  }

  function handleSave() {
    const canvas = canvasRef.current
    if (!canvas) return
    onSave(canvas.toDataURL('image/jpeg', 0.85))
  }

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        aria-label="Piirustusalue"
        className="w-full rounded-control border border-line bg-white touch-none cursor-crosshair"
      />

      <div className="flex flex-wrap items-center gap-2">
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={`Väri ${c}`}
            aria-pressed={color === c}
            className={`h-11 w-11 rounded-full border-2 ${color === c ? 'border-accent' : 'border-line'}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {SIZES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSize(s)}
            aria-label={`Viivan paksuus ${s}`}
            aria-pressed={size === s}
            className={`min-h-11 min-w-11 rounded-control border flex items-center justify-center
              ${size === s ? 'border-accent bg-accent-soft' : 'border-line bg-surface'}`}
          >
            <span className="rounded-full bg-ink block" style={{ width: s, height: s }} />
          </button>
        ))}

        <Button
          type="button"
          variant="secondary"
          onClick={() => setStrokes((prev) => prev.slice(0, -1))}
          disabled={strokes.length === 0}
        >
          Kumoa
        </Button>
        <Button type="button" variant="secondary" onClick={() => setStrokes([])} disabled={strokes.length === 0}>
          Tyhjennä
        </Button>
      </div>

      <div className="flex gap-2">
        <Button type="button" onClick={handleSave} disabled={strokes.length === 0} className="flex-1">
          Käytä piirrosta
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Peruuta
        </Button>
      </div>
    </div>
  )
}
