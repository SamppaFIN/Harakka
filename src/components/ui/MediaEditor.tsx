import { useRef, useState } from 'react'
import { Button } from './Button'
import { DrawingCanvas } from './DrawingCanvas'
import { fileToCompressedDataUrl } from '../../lib/image'
import type { DraftMedia } from '../../types'

/** Kuvan / piirroksen valinta — jaettu luontilomakkeen ja sivulla muokkauksen kesken. */
export function MediaEditor({
  media,
  onChange,
  error,
}: {
  media: DraftMedia | undefined
  onChange: (next: DraftMedia | undefined) => void
  error?: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [drawingOpen, setDrawingOpen] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      onChange({ kind: 'image', src: dataUrl, dataUrl, alt: file.name })
      setFileError(null)
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Kuvan lisäys epäonnistui.')
    } finally {
      e.target.value = '' // sama tiedosto voidaan valita uudelleen
    }
  }

  const shownError = fileError ?? error

  return (
    <div className="space-y-2">
      {media ? (
        <>
          <img src={media.src} alt={media.alt} className="w-full rounded-control border border-line" />
          <Button type="button" variant="secondary" onClick={() => onChange(undefined)} className="w-full">
            ✕ Poista {media.kind === 'drawing' ? 'piirros' : 'kuva'}
          </Button>
        </>
      ) : drawingOpen ? (
        <DrawingCanvas
          onSave={(dataUrl) => {
            onChange({ kind: 'drawing', src: dataUrl, dataUrl, alt: 'Piirros' })
            setDrawingOpen(false)
          }}
          onCancel={() => setDrawingOpen(false)}
        />
      ) : (
        <div className="flex flex-col sm:flex-row gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} className="flex-1">
            🖼️ Lisää kuva
          </Button>
          <Button type="button" variant="secondary" onClick={() => setDrawingOpen(true)} className="flex-1">
            ✏️ Piirrä
          </Button>
        </div>
      )}

      {shownError && <p className="text-sm text-danger">⚠ {shownError}</p>}
    </div>
  )
}
