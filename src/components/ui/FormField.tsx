import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface BaseProps {
  label: string
  error?: string
  id: string
}

export function TextField({
  label,
  error,
  id,
  className = '',
  ...props
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">
        {label}
      </label>
      <input
        id={id}
        className={`w-full min-h-11 px-3.5 rounded-control border bg-surface/60 text-ink
          placeholder:text-muted focus:border-accent outline-none
          ${error ? 'border-danger' : 'border-line'} ${className}`}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  )
}

export function TextAreaField({
  label,
  error,
  id,
  className = '',
  ...props
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5">
        {label}
      </label>
      <textarea
        id={id}
        className={`w-full px-3.5 py-2.5 rounded-control border bg-surface/60 text-ink
          placeholder:text-muted focus:border-accent outline-none resize-y
          ${error ? 'border-danger' : 'border-line'} ${className}`}
        aria-invalid={!!error}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  )
}
