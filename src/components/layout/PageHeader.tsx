import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-x-8 gap-y-5 border-b border-line pb-7">
      <div>
        <h1 className="text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-[2rem]">
          {title}
        </h1>
        <p className="mt-3 max-w-[65ch] text-sm leading-6 text-muted">
          {description}
        </p>
      </div>
      {action}
    </div>
  )
}
