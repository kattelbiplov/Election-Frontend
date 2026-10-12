import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface MenuProps {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  children: ReactNode
  align?: 'left' | 'right'
}

export function Menu({ trigger, children, align = 'right' }: MenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          className={cn(
            'absolute z-40 mt-2 min-w-[200px] rounded-lg border border-border bg-card py-1.5 shadow-popover animate-in',
            align === 'right' ? 'right-0' : 'left-0',
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function MenuItem({
  children,
  onClick,
  danger,
  icon,
}: {
  children: ReactNode
  onClick?: () => void
  danger?: boolean
  icon?: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors',
        danger ? 'text-danger hover:bg-danger-bg' : 'text-text hover:bg-bg',
      )}
    >
      {icon}
      {children}
    </button>
  )
}
