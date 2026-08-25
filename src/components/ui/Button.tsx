import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  // Aksentit ovat vaaleita kosmisessa teemassa → tumma teksti niiden päälle
  primary: 'bg-accent text-canvas hover:bg-accent-hover active:opacity-90',
  secondary: 'bg-surface/70 text-ink border border-line hover:bg-surface-hover backdrop-blur-sm',
  ghost: 'bg-transparent text-ink hover:bg-surface-hover',
  danger: 'bg-danger text-canvas hover:opacity-90',
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`min-h-11 min-w-11 px-4 rounded-control font-medium text-sm transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    />
  )
}
