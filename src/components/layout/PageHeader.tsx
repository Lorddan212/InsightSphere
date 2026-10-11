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
    <div className="mb-8 flex flex-wrap items-start justify-between gap-x-8 gap-y-4 pb-2">
      <div>
        <h1 className="text-[1.75rem] font-semibold leading-[1.12] tracking-[-0.04em] sm:text-[2.25rem] 2xl:text-[2.5rem]">
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
