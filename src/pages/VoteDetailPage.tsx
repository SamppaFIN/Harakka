import { Link, useNavigate, useParams } from 'react-router-dom'
import { useVotes } from '../lib/useVotes'
import { getVoteStatus, totalVotes } from '../types'
import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
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
  const canVote = status === 'open'

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
        <img
          src={vote.media.dataUrl}
          alt={vote.media.alt}
          className="w-full rounded-card border border-line"
        />
      )}

      <Card>
        <h2 className="text-sm font-semibold mb-3 text-muted uppercase tracking-wide">
          {canVote ? 'Valitse vaihtoehto' : 'Lopulliset tulokset'}
        </h2>

        {canVote ? (
          <div className="space-y-2.5" role="radiogroup" aria-label="Äänestysvaihtoehdot">
            {vote.options.map((opt) => {
              const selected = myVote === opt.id
              return (
                <button
                  key={opt.id}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => castVote(vote.id, opt.id)}
                  className={`w-full min-h-11 text-left px-4 py-3 rounded-control border transition-colors break-words
                    ${
                      selected
                        ? 'border-accent bg-accent-soft font-medium'
                        : 'border-line bg-surface/60 hover:bg-surface-hover'
                    }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`shrink-0 h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center
                        ${selected ? 'border-accent' : 'border-line'}`}
                    >
                      {selected && <span className="h-2 w-2 rounded-full bg-accent" />}
                    </span>
                    {opt.color && (
                      <span
                        aria-hidden
                        className="shrink-0 h-7 w-7 rounded-md border border-line"
                        style={{ backgroundColor: opt.color }}
                      />
                    )}
                    {opt.text}
                  </span>
                </button>
              )
            })}
            {myVote && (
              <p className="text-xs text-muted pt-1">
                Äänesi on tallennettu. Voit vaihtaa valintaasi milloin tahansa.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {vote.options
              .slice()
              .sort((a, b) => b.votes - a.votes)
              .map((opt) => (
                <ProgressBar
                  key={opt.id}
                  label={opt.text}
                  votes={opt.votes}
                  percent={total > 0 ? Math.round((opt.votes / total) * 100) : 0}
                  highlighted={myVote === opt.id}
                  color={opt.color}
                />
              ))}
          </div>
        )}
      </Card>

      {canVote && myVote && (
        <Card>
          <h2 className="text-sm font-semibold mb-3 text-muted uppercase tracking-wide">
            Tulokset tähän mennessä
          </h2>
          <div className="space-y-4">
            {vote.options.map((opt) => (
              <ProgressBar
                key={opt.id}
                label={opt.text}
                votes={opt.votes}
                percent={total > 0 ? Math.round((opt.votes / total) * 100) : 0}
                highlighted={myVote === opt.id}
                color={opt.color}
              />
            ))}
          </div>
        </Card>
      )}

      <p className="text-xs text-muted text-center">
        {status === 'open' ? 'Sulkeutuu ' : 'Sulkeutui '}
        {formatDate(vote.closesAt)} · {total} ääntä yhteensä
      </p>
    </div>
  )
}
