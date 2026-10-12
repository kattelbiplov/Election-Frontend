import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-danger-bg text-danger">
        <ShieldAlert className="size-7" />
      </span>
      <div>
        <h1 className="text-[20px] font-semibold text-text">You don&apos;t have access to this page</h1>
        <p className="mt-1.5 max-w-sm text-[13.5px] text-text-secondary">
          Your role doesn&apos;t include this permission. If you think this is a mistake, contact
          your campaign admin.
        </p>
      </div>
      <Link
        to="/dashboard"
        className="focus-ring mt-2 inline-flex h-10 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-medium text-text transition-colors hover:bg-bg"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
