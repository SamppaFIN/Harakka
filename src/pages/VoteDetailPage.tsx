import { Link, useNavigate, useParams } from 'react-router-dom'
import { useVotes } from '../lib/useVotes'
import { getVoteStatus, totalVotes } from '../types'
import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { VoteOptions } from '../components/VoteOptions'
import { renderMarkdown } from '../lib/markdown'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function VoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getVote, myVoteFor, castVote } = useVotes()
  const vote = id ? getVote(id) : undefined

  if (!vote) {
    return (
      <div className="text-center py-16">
        <p className="text-muted mb-4">Äänestystä ei löytynyt.</p>
        <Link to="/">
          <Button variant="secondary">Takaisin listaan</Button>
        </Link>
      </div>
    )
  }

  const status = getVoteStatus(vote)
  const myVote = myVoteFor(vote.id)
  const total = totalVotes(vote)
  const open = status === 'open'

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate('/')}
        className="text-sm text-muted hover:text-ink min-h-11 -ml-1 px-1 flex items-center gap-1"
      >
        ← Takaisin
      </button>

      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-xl font-semibold leading-snug break-words">{vote.title}</h1>
          <StatusBadge status={status} />
        </div>
        {vote.description.trim() && (
          <div
            className="text-muted break-words leading-relaxed space-y-2"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(vote.description) }}
          />
        )}
      </div>

      {vote.media && (
        <img src={vote.media.dataUrl} alt={vote.media.alt} className="w-full rounded-card border border-line" />
      )}

      <Card>
        <h2 className="text-sm font-semibold mb-3 text-muted uppercase tracking-wide">
          {!open ? 'Lopulliset tulokset' : myVote ? 'Tulokset' : 'Valitse vaihtoehto'}
        </h2>

        <VoteOptions
          vote={vote}
          myVote={myVote}
          onVote={open ? (optionId) => castVote(vote.id, optionId) : undefined}
        />

        {open && myVote && (
          <p className="text-xs text-muted pt-3">
            Äänesi on tallennettu. Voit vaihtaa valintaasi milloin tahansa.
          </p>
        )}
      </Card>

      <p className="text-xs text-muted text-center">
        {open ? 'Sulkeutuu ' : 'Sulkeutui '}
        {formatDate(vote.closesAt)} · {total} ääntä yhteensä
      </p>
    </div>
  )
}
