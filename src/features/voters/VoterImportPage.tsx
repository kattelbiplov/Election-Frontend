import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, FileSpreadsheet, Info, UploadCloud, XCircle } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Table, THead, TH, TBody, TR, TD } from '../../components/ui/Table'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'
import { Pagination } from '../../components/ui/Pagination'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { FormField } from '../../components/ui/FormField'
import { FileInput } from '../../components/ui/FileInput'
import { Badge } from '../../components/ui/Badge'
import { Breadcrumbs } from '../../components/ui/Breadcrumbs'
import { GeoCascadePicker } from '../../components/geo/GeoCascadePicker'
import { WardLabel } from '../../components/geo/GeoLabel'
import { importVoters, listImportJobs } from '../../lib/api/voters'
import { listToles } from '../../lib/api/geo'
import { queryKeys } from '../../lib/queryKeys'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import { formatDateTime } from '../../lib/utils'
import { usePermission } from '../../hooks/usePermission'
import type { ImportJobStatus, VoterImportJob } from '../../lib/types'

const emptyPicker = { provinceId: '', districtId: '', municipalityId: '', wardId: '' }

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

const RECOGNIZED_COLUMNS = [
  { name: 'full_name', aliases: 'name, voter_name', required: true, notes: '2–150 characters' },
  { name: 'date_of_birth', aliases: 'dob, birth_date', required: true, notes: 'YYYY-MM-DD, DD/MM/YYYY, or native Excel date' },
  { name: 'gender', aliases: 'sex', required: false, notes: 'M/F/O or MALE/FEMALE/OTHER' },
  { name: 'tole_name', aliases: 'tole', required: false, notes: 'Auto-created in this ward if not found' },
  { name: 'father_or_spouse_name', aliases: 'father_name, spouse_name', required: false, notes: '' },
  { name: 'citizenship_number', aliases: 'citizenship_no', required: false, notes: 'Informational only' },
  { name: 'voter_id_number', aliases: 'voter_id, voter_no', required: false, notes: 'EC serial number, informational only' },
  { name: 'phone', aliases: 'phone_number, mobile', required: false, notes: '' },
  { name: 'occupation', aliases: '', required: false, notes: '' },
  { name: 'address', aliases: '', required: false, notes: 'Free text — not linked to a household' },
]

export function VoterImportPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const canImport = usePermission('voter:import')

  const [picker, setPicker] = useState(emptyPicker)
  const [toleId, setToleId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [pickerError, setPickerError] = useState<string | undefined>()
  const [fileError, setFileError] = useState<string | undefined>()
  const [result, setResult] = useState<VoterImportJob | null>(null)

  const [jobsPage, setJobsPage] = useState(1)
  const jobs = useQuery({
    queryKey: queryKeys.voterImportJobs({ page: jobsPage, pageSize: 10 }),
    queryFn: () => listImportJobs({ page: jobsPage, pageSize: 10 }),
    placeholderData: (prev) => prev,
  })

  const toles = useQuery({
    queryKey: queryKeys.toles({ wardId: picker.wardId }),
    queryFn: () => listToles({ wardId: picker.wardId, pageSize: 200 }),
    enabled: !!picker.wardId,
  })

  const mutation = useMutation({
    mutationFn: () => importVoters({ wardId: picker.wardId, toleId: toleId || undefined, file: file! }),
    onSuccess: (job) => {
      setResult(job)
      queryClient.invalidateQueries({ queryKey: ['voterImportJobs'] })
      if (job.status === 'FAILED') {
        toast.error('Import failed', 'No rows could be imported — see the issues for details.')
      } else if (job.status === 'COMPLETED_WITH_ERRORS') {
        toast.info('Import completed with some issues', `${job.importedRows} imported, ${job.duplicateRows + job.errorRows} skipped.`)
      } else {
        toast.success('Import completed', `${job.importedRows} voters imported.`)
      }
    },
    onError: (err) => toast.error('Could not start import', getApiErrorMessage(err)),
  })

  const handleSubmit = () => {
    let ok = true
    if (!picker.wardId) {
      setPickerError('Select a ward')
      ok = false
    }
    if (!file) {
      setFileError('Choose a .csv or .xlsx file')
      ok = false
    }
    if (!ok) return
    setFileError(undefined)
    setPickerError(undefined)
    mutation.mutate()
  }

  return (
    <div>
      <PageHeader
        title="Import voters"
        breadcrumb={<Breadcrumbs items={[{ label: 'Voters', onClick: () => navigate('/voters') }, { label: 'Import' }]} />}
        description={
          canImport
            ? 'Bulk-add voters for one ward from a CSV or Excel file. Processed synchronously — larger files take longer.'
            : "Import history for your organization's wards — you don't have permission to start a new import."
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          {canImport && (
            <Card>
              <CardHeader title="Upload a file" description="Max 10MB, 10,000 data rows. .csv or .xlsx." />
              <CardBody className="flex flex-col gap-4">
                <GeoCascadePicker
                  provinceId={picker.provinceId}
                  districtId={picker.districtId}
                  municipalityId={picker.municipalityId}
                  wardId={picker.wardId}
                  onChange={(next) => {
                    setPicker(next)
                    setToleId('')
                    setPickerError(undefined)
                  }}
                  errors={{ wardId: pickerError }}
                />

                <FormField label="Default tole (optional)" htmlFor="imp-tole" hint="Used for rows without a tole_name column">
                  <Select
                    id="imp-tole"
                    value={toleId}
                    disabled={!picker.wardId || toles.isLoading}
                    onChange={(e) => setToleId(e.target.value)}
                  >
                    <option value="">No default tole</option>
                    {toles.data?.items.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="File" htmlFor="imp-file" error={fileError} required>
                  <FileInput
                    id="imp-file"
                    value={file}
                    onChange={(f) => {
                      setFile(f)
                      setFileError(undefined)
                    }}
                    accept=".csv,.xlsx"
                    error={!!fileError}
                    hint="Drop a ward roll exported from Excel or Google Sheets"
                  />
                </FormField>

                <div className="flex justify-end">
                  <Button icon={<UploadCloud className="size-4" />} loading={mutation.isPending} onClick={handleSubmit}>
                    Import
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {result && (
            <Card>
              <CardHeader
                title="Import result"
                description={result.fileName}
                action={<Badge tone={JOB_STATUS_TONE[result.status]}>{JOB_STATUS_LABELS[result.status]}</Badge>}
              />
              <CardBody>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <ResultStat label="Total rows" value={result.totalRows} />
                  <ResultStat label="Imported" value={result.importedRows} tone="success" />
                  <ResultStat label="Duplicates" value={result.duplicateRows} tone="warning" />
                  <ResultStat label="Errors" value={result.errorRows} tone="danger" />
                </div>
                {(result.duplicateRows > 0 || result.errorRows > 0) && (
                  <div className="mt-4">
                    <Link to={`/voters/import-jobs/${result.id}`}>
                      <Button variant="secondary" size="sm">
                        Review skipped rows
                      </Button>
                    </Link>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Recent imports" />
            {jobs.isLoading ? (
              <TableSkeleton cols={5} />
            ) : !jobs.data?.items.length ? (
              <EmptyState icon={<FileSpreadsheet className="size-6" />} title="No imports yet" />
            ) : (
              <>
                <Table>
                  <THead>
                    <TH>File</TH>
                    <TH>Ward</TH>
                    <TH>Status</TH>
                    <TH>Rows</TH>
                    <TH>Started</TH>
                  </THead>
                  <TBody>
                    {jobs.data.items.map((job) => (
                      <TR key={job.id} onClick={() => navigate(`/voters/import-jobs/${job.id}`)}>
                        <TD className="font-medium">{job.fileName}</TD>
                        <TD className="text-text-secondary">
                          <WardLabel wardId={job.wardId} />
                        </TD>
                        <TD>
                          <Badge tone={JOB_STATUS_TONE[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
                        </TD>
                        <TD className="text-text-secondary">
                          {job.importedRows}/{job.totalRows} imported
                        </TD>
                        <TD className="text-text-secondary">{formatDateTime(job.startedAt)}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
                <Pagination pagination={jobs.data.pagination} onPageChange={setJobsPage} />
              </>
            )}
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader title="Accepted columns" description="Headers are matched case-insensitively." />
            <CardBody className="flex flex-col gap-3 text-[12.5px]">
              {RECOGNIZED_COLUMNS.map((col) => (
                <div key={col.name} className="flex flex-col gap-0.5 border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-1.5">
                    <code className="rounded bg-bg px-1.5 py-0.5 font-mono text-[11.5px] text-text">{col.name}</code>
                    {col.required && (
                      <span className="text-[10.5px] font-semibold uppercase tracking-wide text-brand">Required</span>
                    )}
                  </div>
                  {col.aliases && <p className="text-text-muted">also: {col.aliases}</p>}
                  {col.notes && <p className="text-text-secondary">{col.notes}</p>}
                </div>
              ))}
              <div className="flex items-start gap-2 rounded-md bg-bg p-3 text-text-secondary">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                <p>Unrecognized columns are ignored rather than rejected. Duplicates are matched on name + date of birth within the ward.</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ResultStat({ label, value, tone }: { label: string; value: number; tone?: 'success' | 'warning' | 'danger' }) {
  const toneClass = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : tone === 'danger' ? 'text-danger' : 'text-text'
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'warning' ? AlertCircle : tone === 'danger' ? XCircle : undefined
  return (
    <div>
      <p className="text-[12px] text-text-secondary">{label}</p>
      <p className={`mt-0.5 flex items-center gap-1.5 text-[20px] font-semibold leading-none ${toneClass}`}>
        {Icon && <Icon className="size-4" />}
        {value}
      </p>
    </div>
  )
}
