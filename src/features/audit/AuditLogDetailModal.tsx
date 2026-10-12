import { Modal } from '../../components/ui/Modal'
import { formatDateTime } from '../../lib/utils'
import type { AuditLog } from '../../lib/types'

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
      <pre className="max-h-64 overflow-auto rounded-md bg-sidebar p-3 text-[12px] leading-relaxed text-white/90">
        {value ? JSON.stringify(value, null, 2) : '—'}
      </pre>
    </div>
  )
}

export function AuditLogDetailModal({ log, onClose }: { log: AuditLog | null; onClose: () => void }) {
  return (
    <Modal open={!!log} onClose={onClose} title={log?.action ?? ''} description={log ? formatDateTime(log.createdAt) : undefined} size="lg">
      {log && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
            <div>
              <p className="text-text-secondary">Entity type</p>
              <p className="font-medium text-text">{log.entityType}</p>
            </div>
            <div>
              <p className="text-text-secondary">Entity ID</p>
              <p className="truncate font-mono text-[12px] font-medium text-text">{log.entityId}</p>
            </div>
            <div>
              <p className="text-text-secondary">Actor</p>
              <p className="font-medium text-text">{log.actorName ?? '—'}</p>
            </div>
            <div>
              <p className="text-text-secondary">IP address</p>
              <p className="font-medium text-text">{log.ipAddress ?? '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <JsonBlock label="Before" value={log.before} />
            <JsonBlock label="After" value={log.after} />
          </div>

          {log.userAgent && (
            <div>
              <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-text-secondary">User agent</p>
              <p className="break-all text-[12px] text-text-secondary">{log.userAgent}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
