import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: {
  title: string
  description?: string
  breadcrumb?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
        <h1 className="truncate text-[20px] font-semibold tracking-tight text-text sm:text-[22px]">{title}</h1>
        {description && <p className="mt-1 text-[13.5px] text-text-secondary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
