import { forwardRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  leftIcon?: ReactNode
  rightSlot?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, leftIcon, rightSlot, ...props }, ref) => {
    return (
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'h-10 w-full rounded-md border bg-card px-3 text-sm text-text placeholder:text-text-muted transition-colors focus-ring',
            error ? 'border-danger' : 'border-border hover:border-border-strong focus:border-brand',
            !!leftIcon && 'pl-9',
            !!rightSlot && 'pr-9',
            props.disabled && 'cursor-not-allowed bg-bg text-text-muted',
            className,
          )}
          {...props}
        />
        {rightSlot && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">{rightSlot}</span>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
