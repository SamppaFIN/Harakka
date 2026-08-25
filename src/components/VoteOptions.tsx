import { totalVotes, type Vote } from '../types'
import { tapFeedback } from '../lib/haptics'

/**
 * Äänestysvaihtoehdot. Kun `showResults` on tosi, jokainen vaihtoehto toimii
 * samalla tulospalkkina — täyttö kertoo osuuden, oikea reuna prosentin.
 */
export function VoteOptions({
  vote,
  myVote,
  onVote,
}: {
  vote: Vote
  myVote?: string
  /** Jätä pois kun äänestys on suljettu — tällöin vaihtoehdot eivät ole klikattavia. */
  onVote?: (optionId: string) => void
}) {
  const total = totalVotes(vote)
  const closed = !onVote
  // Tulokset paljastuvat heti kun käyttäjä on valinnut — tai jos äänestys on ohi.
  const showResults = closed || myVote !== undefined

  return (
    <div className="space-y-2" role="radiogroup" aria-label="Äänestysvaihtoehdot">
      {vote.options.map((opt) => {
        const selected = myVote === opt.id
        const percent = total > 0 ? Math.round((opt.votes / total) * 100) : 0
        const fill = opt.color ?? (selected ? 'var(--color-accent)' : 'var(--color-muted)')

        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={closed}
            onClick={() => {
              tapFeedback()
              onVote?.(opt.id)
            }}
            className={`tappable relative w-full min-h-11 overflow-hidden text-left px-3.5 py-2.5
              rounded-control border transition-all duration-200 disabled:cursor-default
              ${
                selected
                  ? 'border-accent bg-accent-soft/40'
                  : `border-line bg-surface/50 ${closed ? '' : 'hover:border-accent/60 hover:-translate-y-0.5'}`
              }`}
          >
            {showResults && (
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 transition-[width] duration-500 ease-out"
                style={{
                  width: `${percent}%`,
                  backgroundColor: fill,
                  opacity: selected ? 0.42 : 0.2,
                }}
              />
            )}

            <span className="relative flex items-center gap-2.5">
              <span
                aria-hidden
                className={`shrink-0 h-4.5 w-4.5 rounded-full border-2 flex items-center justify-center
                  ${selected ? 'border-accent' : 'border-line'}`}
              >
                {selected && <span className="h-2 w-2 rounded-full bg-accent" />}
              </span>

              {opt.color && (
                <span
                  aria-hidden
                  className="shrink-0 h-6 w-6 rounded-md border border-line"
                  style={{ backgroundColor: opt.color }}
                />
              )}

              <span className={`min-w-0 flex-1 break-words text-sm ${selected ? 'font-semibold' : ''}`}>
                {opt.text}
              </span>

              {showResults && (
                <span className="shrink-0 text-sm tabular-nums text-muted">
                  <span className={selected ? 'text-ink font-semibold' : ''}>{percent}%</span>
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
