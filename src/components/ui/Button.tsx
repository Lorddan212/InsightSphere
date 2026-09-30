import type { ComponentProps } from 'react'

export function Button({
  className = '',
  type = 'button',
  ...props
}: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-panel px-4 py-2 text-sm font-semibold text-ink hover:bg-soft disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  )
}
