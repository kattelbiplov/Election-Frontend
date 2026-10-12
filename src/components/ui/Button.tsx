import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand text-white shadow-sm hover:bg-brand-hover active:bg-brand-dark disabled:opacity-50',
  secondary: 'bg-card text-text border border-border hover:bg-bg active:bg-border/40 shadow-sm',
  outline: 'bg-transparent text-brand border border-brand hover:bg-brand-light',
  ghost: 'bg-transparent text-text hover:bg-black/5 active:bg-black/10',
  danger: 'bg-danger text-white hover:bg-brand-hover shadow-sm',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-sm',
  md: 'h-10 px-4 text-sm gap-2 rounded-md',
  lg: 'h-11 px-5 text-[15px] gap-2 rounded-md',
  icon: 'h-10 w-10 rounded-md',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'primary', size = 'md', loading, icon, disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium whitespace-nowrap transition-colors duration-150 focus-ring disabled:cursor-not-allowed disabled:opacity-60',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
