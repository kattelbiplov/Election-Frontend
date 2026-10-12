import { useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Copy } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Table, THead, TH, TBody, TR, TD } from '../../components/ui/Table'
import { TableSkeleton, Skeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/ui/Pagination'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { Breadcrumbs } from '../../components/ui/Breadcrumbs'
import { WardLabel, ToleLabel } from '../../components/geo/GeoLabel'
import { getImportJob, listImportIssues } from '../../lib/api/voters'
import { queryKeys } from '../../lib/queryKeys'
import { formatDateTime } from '../../lib/utils'
import type { ImportIssueType, ImportJobStatus } from '../../lib/types'

const JOB_STATUS_TONE: Record<ImportJobStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  COMPLETED: 'success',
  COMPLETED_WITH_ERRORS: 'warning',
  FAILED: 'danger',
  PROCESSING: 'info',
}

const JOB_STATUS_LABELS: Record<ImportJobStatus, string> = {
  COMPLETED: 'Completed',
  COMPLETED_WITH_ERRORS: 'Completed with errors',
  FAILED: 'Failed',
  PROCESSING: 'Processing',
}

const ISSUE_TYPE_LABELS: Record<ImportIssueType, string> = {
  VALIDATION_ERROR: 'Validation error',
  DUPLICATE: 'Duplicate',
}

export function VoterImportJobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [page, setPage] = useState(1)
  const [issueType, setIssueType] = useState<ImportIssueType | ''>('')

  const job = useQuery({
    queryKey: queryKeys.voterImportJob(id!),
    queryFn: () => getImportJob(id!),
  })

  const issuesParams = { page, pageSize: 25, issueType: issueType || undefined }
  const issues = useQuery({
    queryKey: queryKeys.voterImportIssues(id!, issuesParams),
    queryFn: () => listImportIssues(id!, issuesParams),
    placeholderData: (prev) => prev,
  })

  return (
    <div>
      <PageHeader
        title={job.data?.fileName ?? 'Import job'}
        breadcrumb={
          <Breadcrumbs
            items={[
              { label: 'Voters', onClick: () => navigate('/voters') },
              { label: 'Import', onClick: () => navigate('/voters/import') },
              { label: job.data?.fileName ?? '…' },
            ]}
          />
        }
        description="Every skipped row, with the reason it wasn't imported."
      />

      <div className="flex flex-col gap-5">
        <Card>
          <CardHeader
            title="Summary"
            action={job.data && <Badge tone={JOB_STATUS_TONE[job.data.status]}>{JOB_STATUS_LABELS[job.data.status]}</Badge>}
          />
          <CardBody>
            {job.isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : !job.data ? (
              <EmptyState icon={<AlertTriangle className="size-6" />} title="Import job not found" />
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
                <Field label="Ward">
                  <WardLabel wardId={job.data.wardId} />
                </Field>
                <Field label="Default tole">{job.data.toleId ? <ToleLabel toleId={job.data.toleId} /> : '—'}</Field>
                <Field label="File size">{(job.data.fileSizeBytes / 1024).toFixed(1)} KB</Field>
                <Field label="Total rows">{job.data.totalRows}</Field>
                <Field label="Imported">
                  <span className="text-success">{job.data.importedRows}</span>
                </Field>
                <Field label="Duplicates">
                  <span className="text-warning">{job.data.duplicateRows}</span>
                </Field>
                <Field label="Errors">
                  <span className="text-danger">{job.data.errorRows}</span>
                </Field>
                <Field label="Started">{formatDateTime(job.data.startedAt)}</Field>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-[13.5px] font-semibold text-text">Skipped rows</h2>
            <Select
              value={issueType}
              onChange={(e) => {
                setIssueType(e.target.value as ImportIssueType | '')
                setPage(1)
              }}
              className="sm:w-52"
            >
              <option value="">All issues</option>
              <option value="VALIDATION_ERROR">Validation errors</option>
              <option value="DUPLICATE">Duplicates</option>
            </Select>
          </div>

          {issues.isLoading ? (
            <TableSkeleton cols={4} />
          ) : !issues.data?.items.length ? (
            <EmptyState title="No issues" description="Every row in this file imported cleanly." />
          ) : (
            <>
              <Table>
                <THead>
                  <TH>Row</TH>
                  <TH>Type</TH>
                  <TH>Message</TH>
                  <TH>Raw data</TH>
                </THead>
                <TBody>
                  {issues.data.items.map((issue) => (
                    <TR key={issue.id}>
                      <TD className="font-mono text-[12.5px] text-text-secondary">{issue.rowNumber}</TD>
                      <TD>
                        <Badge tone={issue.issueType === 'DUPLICATE' ? 'warning' : 'danger'}>
                          {ISSUE_TYPE_LABELS[issue.issueType]}
                        </Badge>
                      </TD>
                      <TD className="max-w-xs">{issue.message}</TD>
                      <TD>
                        <RawDataPreview data={issue.rawData} />
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              <Pagination pagination={issues.data.pagination} onPageChange={setPage} />
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[12px] text-text-secondary">{label}</p>
      <p className="mt-0.5 text-[13.5px] font-medium text-text">{children}</p>
    </div>
  )
}

function RawDataPreview({ data }: { data: Record<string, unknown> }) {
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(data)
  const preview = json.length > 60 ? `${json.slice(0, 60)}…` : json

  return (
    <button
      type="button"
      title="Copy full row"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          // Clipboard access denied — nothing to recover, the preview text is still visible.
        }
      }}
      className="focus-ring flex max-w-xs items-center gap-1.5 rounded px-1 -mx-1 font-mono text-[11.5px] text-text-muted hover:bg-bg hover:text-text"
    >
      <Copy className="size-3 shrink-0" />
      <span className="truncate">{copied ? 'Copied!' : preview}</span>
    </button>
  )
}
