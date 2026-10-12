import { Search, X } from 'lucide-react'
import { Input } from './Input'

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      leftIcon={<Search className="size-4" />}
      rightSlot={
        value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="focus-ring rounded p-0.5 hover:text-text"
          >
            <X className="size-3.5" />
          </button>
        ) : undefined
      }
      className="sm:w-64"
    />
  )
}
