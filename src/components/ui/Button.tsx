import type { ComponentProps } from 'react'

export function Button({
  className = '',
  type = 'button',
  variant = 'secondary',
  ...props
}: ComponentProps<'button'> & { variant?: 'secondary' | 'danger' }) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:border-accent aria-pressed:bg-soft aria-pressed:text-accent ${variant === 'danger' ? 'border-danger text-danger hover:bg-danger/10' : 'border-control bg-panel text-ink hover:border-accent hover:bg-soft'} ${className}`}
      {...props}
    />
  )
}
