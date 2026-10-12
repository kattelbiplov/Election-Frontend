import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'
import type { Pagination as PaginationType } from '../../lib/types'

export function Pagination({
  pagination,
  onPageChange,
}: {
  pagination: PaginationType
  onPageChange: (page: number) => void
}) {
  const { page, totalPages, totalItems, pageSize } = pagination
  if (totalItems === 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
      <p className="text-[13px] text-text-secondary">
        Showing <span className="font-medium text-text">{start}–{end}</span> of{' '}
        <span className="font-medium text-text">{totalItems}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<ChevronLeft className="size-4" />}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </Button>
        <span className="min-w-[70px] text-center text-[13px] text-text-secondary">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
