import { createPortal } from 'react-dom'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useToastStore, type ToastVariant } from '../../store/toastStore'
import { cn } from '../../lib/utils'

const variantConfig: Record<ToastVariant, { icon: typeof CheckCircle2; classes: string }> = {
  success: { icon: CheckCircle2, classes: 'text-success' },
  error: { icon: AlertCircle, classes: 'text-danger' },
  info: { icon: Info, classes: 'text-info' },
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return createPortal(
    <div className="safe-bottom safe-top pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end">
      {toasts.map((t) => {
        const { icon: Icon, classes } = variantConfig[t.variant]
        return (
          <div
            key={t.id}
            role="alert"
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-popover animate-in"
          >
            <Icon className={cn('mt-0.5 size-5 shrink-0', classes)} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-text">{t.title}</p>
              {t.description && <p className="mt-0.5 text-[13px] text-text-secondary">{t.description}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="focus-ring -m-1 rounded p-1 text-text-muted hover:text-text"
            >
              <X className="size-4" />
            </button>
          </div>
        )
      })}
    </div>,
    document.body,
  )
}
