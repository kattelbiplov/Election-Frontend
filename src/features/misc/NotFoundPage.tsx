import { Link } from 'react-router-dom'
import { CompassIcon } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-light text-brand">
        <CompassIcon className="size-7" />
      </span>
      <div>
        <h1 className="text-[22px] font-semibold text-text">Page not found</h1>
        <p className="mt-1.5 text-[13.5px] text-text-secondary">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
      </div>
      <Link
        to="/dashboard"
        className="focus-ring mt-2 inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
