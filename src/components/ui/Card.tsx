import type { HTMLAttributes } from 'react'

export function Card({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`analytics-panel ${className}`} {...props} />
}
