import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand'

const toneClasses: Record<Tone, string> = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
  neutral: 'bg-neutral-bg text-neutral',
  brand: 'bg-brand-light text-brand-dark',
}

export function Badge({
  tone = 'neutral',
  children,
  dot,
  className,
}: {
  tone?: Tone
  children: ReactNode
  dot?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium leading-none',
        toneClasses[tone],
        className,
      )}
    >
      {dot && <span className={cn('size-1.5 rounded-full', `bg-current`)} />}
      {children}
    </span>
  )
}

const statusTone: Record<string, Tone> = {
  ACTIVE: 'success',
  SUSPENDED: 'danger',
  INVITED: 'warning',
  DECEASED: 'neutral',
  MOVED: 'warning',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={statusTone[status] ?? 'neutral'} dot>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  )
}

const roleTone: Record<string, Tone> = {
  SUPER_ADMIN: 'brand',
  CAMPAIGN_ADMIN: 'brand',
  WARD_MANAGER: 'info',
  TOLE_COORDINATOR: 'info',
  FIELD_WORKER: 'neutral',
  VOLUNTEER: 'neutral',
  ANALYST: 'warning',
  VIEW_ONLY: 'neutral',
}

export function RoleBadge({ role, label }: { role: string; label: string }) {
  return (
    <Badge tone={roleTone[role] ?? 'neutral'} className="font-semibold">
      {label}
    </Badge>
  )
}
