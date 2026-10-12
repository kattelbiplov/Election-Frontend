import { useRef } from 'react'
import { UploadCloud, X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface FileInputProps {
  id?: string
  value: File | null
  onChange: (file: File | null) => void
  accept?: string
  error?: boolean
  hint?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FileInput({ id, value, onChange, accept, error, hint }: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {value ? (
        <div
          className={cn(
            'flex items-center gap-3 rounded-md border bg-card px-3 py-2.5 text-sm',
            error ? 'border-danger' : 'border-border',
          )}
        >
          <UploadCloud className="size-4 shrink-0 text-text-muted" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-text">{value.name}</p>
            <p className="text-[12px] text-text-secondary">{formatBytes(value.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null)
              if (inputRef.current) inputRef.current.value = ''
            }}
            aria-label="Remove file"
            className="focus-ring -m-1 shrink-0 rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg hover:text-text"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex w-full flex-col items-center gap-1.5 rounded-md border border-dashed px-4 py-6 text-center transition-colors focus-ring',
            error ? 'border-danger' : 'border-border hover:border-brand hover:bg-brand-light/40',
          )}
        >
          <UploadCloud className="size-5 text-text-muted" />
          <p className="text-[13px] font-medium text-text">Click to choose a file</p>
          {hint && <p className="text-[12px] text-text-secondary">{hint}</p>}
        </button>
      )}
    </div>
  )
}
