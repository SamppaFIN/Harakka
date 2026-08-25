import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-surface/65 backdrop-blur-sm border border-line rounded-card p-4 sm:p-5 ${className}`}
      {...props}
    />
  )
}
