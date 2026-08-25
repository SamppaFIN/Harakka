import type { VoteStatus } from '../../types'

export function StatusBadge({ status }: { status: VoteStatus }) {
  const isOpen = status === 'open'
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        ${isOpen ? 'bg-success-soft text-success' : 'bg-line/60 text-muted'}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? 'bg-success' : 'bg-muted'}`} />
      {isOpen ? 'Avoinna' : 'Suljettu'}
    </span>
  )
}
