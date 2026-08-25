// Kuvan pienennys ennen localStorageen tallennusta.
// localStoragessa on ~5 MB katto, joten alkuperäistä tiedostoa ei koskaan tallenneta.

const MAX_EDGE = 1200
const QUALITY = 0.8

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MB raakatiedosto

export function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Tiedosto ei ole kuva.'))
      return
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error('Kuva on liian suuri (max 10 MB).'))
      return
    }

    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Kuvan käsittely epäonnistui.'))
        return
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', QUALITY))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Kuvaa ei voitu lukea.'))
    }

    img.src = url
  })
}
