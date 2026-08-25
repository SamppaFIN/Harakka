import { Link } from 'react-router-dom'
import { useVotes } from '../lib/useVotes'
import { getVoteStatus, totalVotes } from '../types'
import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { stripMarkdown } from '../lib/markdown'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fi-FI', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function VoteListPage() {
  const { votes } = useVotes()

  if (votes.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted mb-4">Ei vielä yhtään äänestystä.</p>
        <Link to="/uusi">
          <Button>Luo ensimmäinen äänestys</Button>
        </Link>
      </div>
    )
  }

  const sorted = [...votes].sort((a, b) => {
    const aOpen = getVoteStatus(a) === 'open'
    const bOpen = getVoteStatus(b) === 'open'
    if (aOpen !== bOpen) return aOpen ? -1 : 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold mb-1">Äänestykset</h1>
      {sorted.map((vote) => {
        const status = getVoteStatus(vote)
        return (
          <Link key={vote.id} to={`/aanestys/${vote.id}`}>
            <Card className="hover:bg-surface-hover transition-colors active:opacity-90">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="font-semibold leading-snug break-words">{vote.title}</h2>
                <StatusBadge status={status} />
              </div>
              <div className="flex gap-3 mb-3">
                {vote.media && (
                  <img
                    src={vote.media.dataUrl}
                    alt=""
                    className="shrink-0 h-16 w-16 rounded-control border border-line object-cover"
                  />
                )}
                <p className="text-sm text-muted line-clamp-2 break-words min-w-0">
                  {stripMarkdown(vote.description)}
                </p>
              </div>

              {vote.options.some((o) => o.color) && (
                <div className="flex gap-1 mb-3" aria-hidden>
                  {vote.options.map((o) => (
                    <span
                      key={o.id}
                      className="h-2 flex-1 rounded-full border border-line"
                      style={{ backgroundColor: o.color }}
                    />
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-muted">
                <span>{totalVotes(vote)} ääntä yhteensä</span>
                <span>
                  {status === 'open' ? 'Sulkeutuu ' : 'Sulkeutui '}
                  {formatDate(vote.closesAt)}
                </span>
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
