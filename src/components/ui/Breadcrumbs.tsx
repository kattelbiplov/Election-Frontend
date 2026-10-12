import { ChevronRight } from 'lucide-react'
import { Fragment } from 'react'

export interface Crumb {
  label: string
  onClick?: () => void
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-[13px]">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <Fragment key={i}>
            {i > 0 && <ChevronRight className="size-3.5 text-text-muted" />}
            {item.onClick && !isLast ? (
              <button
                onClick={item.onClick}
                className="rounded px-1 -mx-1 text-text-secondary hover:text-brand focus-ring"
              >
                {item.label}
              </button>
            ) : (
              <span className={isLast ? 'font-medium text-text' : 'text-text-secondary'}>{item.label}</span>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
