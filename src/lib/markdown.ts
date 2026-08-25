// Minimaalinen Markdown → HTML. Ei ulkoisia riippuvuuksia.
// Turvallisuus: HTML escapetaan ENSIN, joten syöte ei voi injektoida tageja.

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return '&#39;'
    }
  })
}

/** Sallitaan vain turvalliset linkkiprotokollat. */
function safeHref(url: string): string | null {
  const trimmed = url.trim()
  return /^(https?:\/\/|mailto:)/i.test(trimmed) ? trimmed : null
}

function inline(text: string): string {
  let out = escapeHtml(text)

  // `koodi`
  out = out.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-line/50 text-[0.9em]">$1</code>')
  // **lihavointi**
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  // *kursiivi*
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  // [teksti](url) — huom. sulut on jo escapetettu, joten & on &amp;
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label: string, rawUrl: string) => {
    const href = safeHref(rawUrl.replace(/&amp;/g, '&'))
    if (!href) return match
    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2">${label}</a>`
  })

  return out
}

export function renderMarkdown(src: string): string {
  const lines = src.replace(/\r\n/g, '\n').split('\n')
  const html: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let paragraph: string[] = []

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`)
      listType = null
    }
  }

  const closeParagraph = () => {
    if (paragraph.length > 0) {
      html.push(`<p>${inline(paragraph.join(' '))}</p>`)
      paragraph = []
    }
  }

  const flush = () => {
    closeParagraph()
    closeList()
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed === '') {
      flush()
      continue
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(trimmed)
    if (heading) {
      flush()
      const level = heading[1].length
      const size = level === 1 ? 'text-lg' : level === 2 ? 'text-base' : 'text-sm'
      html.push(`<h${level + 2} class="${size} font-semibold mt-3 mb-1">${inline(heading[2])}</h${level + 2}>`)
      continue
    }

    const quote = /^>\s?(.*)$/.exec(trimmed)
    if (quote) {
      flush()
      html.push(
        `<blockquote class="border-l-2 border-line pl-3 my-2 text-muted">${inline(quote[1])}</blockquote>`,
      )
      continue
    }

    const bullet = /^[-*]\s+(.*)$/.exec(trimmed)
    if (bullet) {
      closeParagraph()
      if (listType !== 'ul') {
        closeList()
        html.push('<ul class="list-disc pl-5 my-2 space-y-1">')
        listType = 'ul'
      }
      html.push(`<li>${inline(bullet[1])}</li>`)
      continue
    }

    const numbered = /^\d+\.\s+(.*)$/.exec(trimmed)
    if (numbered) {
      closeParagraph()
      if (listType !== 'ol') {
        closeList()
        html.push('<ol class="list-decimal pl-5 my-2 space-y-1">')
        listType = 'ol'
      }
      html.push(`<li>${inline(numbered[1])}</li>`)
      continue
    }

    closeList()
    paragraph.push(trimmed)
  }

  flush()
  return html.join('')
}

/** Markdownista pelkkä teksti — listanäkymän esikatselua varten. */
export function stripMarkdown(src: string): string {
  return src
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*`_]/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}
