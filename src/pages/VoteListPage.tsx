import { Link } from 'react-router-dom'
import { useVotes } from '../lib/useVotes'
import { getVoteStatus, totalVotes } from '../types'
import { MagneticCard } from '../components/ui/MagneticCard'
import { StatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { VoteOptions } from '../components/VoteOptions'
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
  const { votes, myVoteFor, castVote } = useVotes()

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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold mb-1">Äänestykset</h1>

      {sorted.map((vote) => {
        const status = getVoteStatus(vote)
        const open = status === 'open'
        const myVote = myVoteFor(vote.id)

        return (
          <MagneticCard key={vote.id}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <Link
                to={`/aanestys/${vote.id}`}
                className="font-semibold leading-snug break-words hover:text-accent transition-colors
                  min-h-11 flex items-center"
              >
                {vote.title}
              </Link>
              <StatusBadge status={status} />
            </div>

            <div className="flex gap-3 mb-3">
              {vote.media && (
                <img
                  src={vote.media.dataUrl}
                  alt=""
                  className="shrink-0 h-14 w-14 rounded-control border border-line object-cover"
                />
              )}
              <p className="text-sm text-muted line-clamp-2 break-words min-w-0">
                {stripMarkdown(vote.description)}
              </p>
            </div>

            <VoteOptions
              vote={vote}
              myVote={myVote}
              onVote={open ? (optionId) => castVote(vote.id, optionId) : undefined}
            />

            <div className="flex items-center justify-between gap-3 mt-2 text-xs text-muted">
              <span className="min-w-0">
                {totalVotes(vote)} ääntä ·{' '}
                {open && !myVote
                  ? 'valitse nähdäksesi tulokset'
                  : `${open ? 'sulkeutuu' : 'sulkeutui'} ${formatDate(vote.closesAt)}`}
              </span>
              <Link
                to={`/aanestys/${vote.id}`}
                className="shrink-0 min-h-11 px-2 -mr-2 flex items-center hover:text-accent transition-colors"
              >
                Avaa →
              </Link>
            </div>
          </MagneticCard>
        )
      })}
    </div>
  )
}
