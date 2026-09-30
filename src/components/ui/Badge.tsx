import type { ReactNode } from 'react'

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-md bg-soft px-2.5 py-1 text-xs font-medium text-accent">
      {children}
    </span>
  )
}
