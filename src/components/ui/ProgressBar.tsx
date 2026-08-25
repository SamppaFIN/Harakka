export function ProgressBar({
  label,
  percent,
  votes,
  highlighted = false,
  color,
}: {
  label: string
  percent: number
  votes: number
  highlighted?: boolean
  color?: string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className={`text-sm ${highlighted ? 'font-semibold' : 'font-medium'} text-ink break-words`}>
          {color && (
            <span
              aria-hidden
              className="inline-block h-3 w-3 rounded-full border border-line align-middle mr-1.5"
              style={{ backgroundColor: color }}
            />
          )}
          {label}
          {highlighted && <span className="ml-2 text-xs font-medium text-accent">Sinun äänesi</span>}
        </span>
        <span className="text-sm text-muted shrink-0">
          {percent}% · {votes} ääntä
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-line/50 overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            color ? '' : highlighted ? 'bg-accent' : 'bg-muted/60'
          }`}
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
