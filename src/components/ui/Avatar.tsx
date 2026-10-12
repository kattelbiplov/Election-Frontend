import { initials } from '../../lib/utils'
import { cn } from '../../lib/utils'

export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = { sm: 'size-7 text-[11px]', md: 'size-9 text-[13px]', lg: 'size-12 text-[15px]' }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-brand-light font-semibold text-brand-dark',
        sizeClasses[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
