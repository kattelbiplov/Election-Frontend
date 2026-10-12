import type { MouseEvent, ReactNode } from 'react'
import { cn } from '../../lib/utils'

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">{children}</table>
    </div>
  )
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-border bg-bg/60">{children}</tr>
    </thead>
  )
}

export function TH({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th className={cn('whitespace-nowrap px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-text-secondary', className)}>
      {children}
    </th>
  )
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border">{children}</tbody>
}

export function TR({
  children,
  onClick,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <tr
      onClick={onClick}
      className={cn('transition-colors', onClick && 'cursor-pointer hover:bg-bg', className)}
    >
      {children}
    </tr>
  )
}

export function TD({
  children,
  className,
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: (e: MouseEvent<HTMLTableCellElement>) => void
}) {
  return (
    <td className={cn('px-4 py-3.5 align-middle text-text', className)} onClick={onClick}>
      {children}
    </td>
  )
}
