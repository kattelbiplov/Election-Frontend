import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      {icon && (
        <div className="flex size-12 items-center justify-center rounded-full bg-bg text-text-muted">{icon}</div>
      )}
      <div>
        <p className="text-[15px] font-medium text-text">{title}</p>
        {description && <p className="mt-1 max-w-sm text-[13px] text-text-secondary">{description}</p>}
      </div>
      {action}
    </div>
  )
}
