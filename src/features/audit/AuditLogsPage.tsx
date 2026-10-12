import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ScrollText } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Table, THead, TH, TBody, TR, TD } from '../../components/ui/Table'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/ui/Pagination'
import { Input } from '../../components/ui/Input'
import { FormField } from '../../components/ui/FormField'
import { Badge } from '../../components/ui/Badge'
import { AuditLogDetailModal } from './AuditLogDetailModal'
import { listAuditLogs } from '../../lib/api/auditLogs'
import { queryKeys } from '../../lib/queryKeys'
import { useDebounce } from '../../hooks/useDebounce'
import { formatDateTime } from '../../lib/utils'
import type { AuditLog } from '../../lib/types'

export function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const [entityType, setEntityType] = useState('')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selected, setSelected] = useState<AuditLog | null>(null)

  const debouncedEntityType = useDebounce(entityType)
  const debouncedAction = useDebounce(action)

  const params = {
    page,
    pageSize: 25,
    entityType: debouncedEntityType || undefined,
    action: debouncedAction || undefined,
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(to).toISOString() : undefined,
  }

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: queryKeys.auditLogs(params),
    queryFn: () => listAuditLogs(params),
    placeholderData: (prev) => prev,
  })

  return (
    <div>
      <PageHeader title="Audit Logs" description="Every mutating action across users and geo data, in order." />

      <Card>
        <div className="grid grid-cols-2 gap-3 border-b border-border p-4 sm:grid-cols-4">
          <FormField label="Entity type" htmlFor="al-entity">
            <Input id="al-entity" placeholder="User, Tole..." value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1) }} />
          </FormField>
          <FormField label="Action" htmlFor="al-action">
            <Input id="al-action" placeholder="user.update" value={action} onChange={(e) => { setAction(e.target.value); setPage(1) }} />
          </FormField>
          <FormField label="From" htmlFor="al-from">
            <Input id="al-from" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} />
          </FormField>
          <FormField label="To" htmlFor="al-to">
            <Input id="al-to" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} />
          </FormField>
        </div>

        {isLoading ? (
          <TableSkeleton cols={4} />
        ) : !data?.items.length ? (
          <EmptyState icon={<ScrollText className="size-6" />} title="No audit log entries" description="Try adjusting your filters." />
        ) : (
          <div className={isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
            <Table>
              <THead>
                <TH>Action</TH>
                <TH>Entity</TH>
                <TH>Actor</TH>
                <TH>When</TH>
              </THead>
              <TBody>
                {data.items.map((log) => (
                  <TR key={log.id} onClick={() => setSelected(log)}>
                    <TD className="font-medium">
                      <Badge tone="neutral" className="font-mono">
                        {log.action}
                      </Badge>
                    </TD>
                    <TD className="text-text-secondary">{log.entityType}</TD>
                    <TD className="text-text-secondary">{log.actorName ?? '—'}</TD>
                    <TD className="whitespace-nowrap text-text-secondary">{formatDateTime(log.createdAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination pagination={data.pagination} onPageChange={setPage} />
          </div>
        )}
      </Card>

      <AuditLogDetailModal log={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
