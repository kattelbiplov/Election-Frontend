import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Info, UploadCloud } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '../../components/ui/Card'
import { Table, THead, TH, TBody, TR, TD } from '../../components/ui/Table'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import { FormField } from '../../components/ui/FormField'
import { FileInput } from '../../components/ui/FileInput'
import { Breadcrumbs } from '../../components/ui/Breadcrumbs'
import { importGeoDataset } from '../../lib/api/geo'
import { toast } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/api/client'
import type { GeoImportSummary } from '../../lib/types'

const RECOGNIZED_COLUMNS = [
  { name: 'province_code', aliases: 'province_number', required: true, notes: 'Positive integer' },
  { name: 'province_name', aliases: '', required: true, notes: '' },
  { name: 'province_name_nepali', aliases: '', required: false, notes: '' },
  { name: 'district_code', aliases: '', required: true, notes: '' },
  { name: 'district_name', aliases: '', required: true, notes: '' },
  { name: 'district_name_nepali', aliases: '', required: false, notes: '' },
  { name: 'municipality_code', aliases: 'local_level_code', required: true, notes: '' },
  { name: 'municipality_name', aliases: 'local_level_name', required: true, notes: '' },
  { name: 'municipality_name_nepali', aliases: 'local_level_name_nepali', required: false, notes: '' },
  { name: 'municipality_type', aliases: 'local_level_type, type', required: true, notes: 'METROPOLITAN_CITY / SUB_METROPOLITAN_CITY / MUNICIPALITY / RURAL_MUNICIPALITY, or common variants like "Gaunpalika"' },
  { name: 'total_wards', aliases: 'ward_count, number_of_wards', required: true, notes: 'Integer, 1–35 — creates Ward rows 1..N automatically' },
]

function StatTile({ label, value, tone }: { label: string; value: number; tone?: 'success' | 'warning' | 'danger' }) {
  const toneClass = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : tone === 'danger' ? 'text-danger' : 'text-text'
  return (
    <div>
      <p className="text-[12px] text-text-secondary">{label}</p>
      <p className={`mt-0.5 text-[20px] font-semibold leading-none ${toneClass}`}>{value}</p>
    </div>
  )
}

function EntityRow({ label, created, updated }: { label: string; created: number; updated: number }) {
  return (
    <TR>
      <TD className="font-medium">{label}</TD>
      <TD className="text-success">{created}</TD>
      <TD className="text-info">{updated}</TD>
    </TR>
  )
}

export function GeoImportPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | undefined>()
  const [result, setResult] = useState<GeoImportSummary | null>(null)

  const mutation = useMutation({
    mutationFn: (f: File) => importGeoDataset(f),
    onSuccess: (summary) => {
      setResult(summary)
      // Written straight to the DB by the bulk upsert, not through any mutation this app already
      // invalidates for — every cached list/detail for these four entities could now be stale.
      queryClient.invalidateQueries({ queryKey: ['provinces'] })
      queryClient.invalidateQueries({ queryKey: ['districts'] })
      queryClient.invalidateQueries({ queryKey: ['municipalities'] })
      queryClient.invalidateQueries({ queryKey: ['wards'] })
      if (summary.errorRows > 0 && summary.errorRows === summary.totalRows) {
        toast.error('Import failed', 'No rows could be imported — see the issues below.')
      } else if (summary.errorRows > 0) {
        toast.info('Import completed with some issues', `${summary.totalRows - summary.errorRows} of ${summary.totalRows} rows imported.`)
      } else {
        toast.success('Dataset imported', `${summary.totalRows} municipality rows processed.`)
      }
    },
    onError: (err) => toast.error('Could not import dataset', getApiErrorMessage(err)),
  })

  const handleSubmit = () => {
    if (!file) {
      setFileError('Choose a .csv or .xlsx file')
      return
    }
    setFileError(undefined)
    mutation.mutate(file)
  }

  return (
    <div>
      <PageHeader
        title="Import Nepal geo dataset"
        breadcrumb={<Breadcrumbs items={[{ label: 'Geo Structure', onClick: () => navigate('/geo') }, { label: 'Import' }]} />}
        description="Bulk-load the official province/district/municipality/ward hierarchy from an Election Commission Nepal or NSO file. Safe to re-run — existing rows are only updated if something changed, and wards are never deleted."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Card>
            <CardHeader title="Upload a file" description="Max 5MB, 2,000 rows (one row per municipality). .csv or .xlsx." />
            <CardBody className="flex flex-col gap-4">
              <FormField label="File" htmlFor="geo-imp-file" error={fileError} required>
                <FileInput
                  id="geo-imp-file"
                  value={file}
                  onChange={(f) => {
                    setFile(f)
                    setFileError(undefined)
                  }}
                  accept=".csv,.xlsx"
                  error={!!fileError}
                  hint="One row per municipality, with its parent province and district repeated alongside it"
                />
              </FormField>
              <div className="flex justify-end">
                <Button icon={<UploadCloud className="size-4" />} loading={mutation.isPending} onClick={handleSubmit}>
                  Import
                </Button>
              </div>
            </CardBody>
          </Card>

          {result && (
            <Card>
              <CardHeader
                title="Import result"
                action={
                  result.errorRows === 0 ? (
                    <span className="flex items-center gap-1.5 text-[13px] font-medium text-success">
                      <CheckCircle2 className="size-4" />
                      All rows processed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[13px] font-medium text-warning">
                      <AlertTriangle className="size-4" />
                      {result.errorRows} row{result.errorRows === 1 ? '' : 's'} skipped
                    </span>
                  )
                }
              />
              <CardBody className="flex flex-col gap-5">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatTile label="Total rows" value={result.totalRows} />
                  <StatTile label="Wards created" value={result.wardsCreated} tone="success" />
                  <StatTile label="Error rows" value={result.errorRows} tone={result.errorRows > 0 ? 'danger' : undefined} />
                </div>

                <Table>
                  <THead>
                    <TH>Entity</TH>
                    <TH>Created</TH>
                    <TH>Updated</TH>
                  </THead>
                  <TBody>
                    <EntityRow label="Provinces" created={result.provincesCreated} updated={result.provincesUpdated} />
                    <EntityRow label="Districts" created={result.districtsCreated} updated={result.districtsUpdated} />
                    <EntityRow label="Municipalities" created={result.municipalitiesCreated} updated={result.municipalitiesUpdated} />
                  </TBody>
                </Table>

                {result.issues.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-[13px] font-semibold text-text">Skipped rows</h3>
                    <Table>
                      <THead>
                        <TH>Row</TH>
                        <TH>Message</TH>
                      </THead>
                      <TBody>
                        {result.issues.map((issue) => (
                          <TR key={issue.rowNumber}>
                            <TD className="font-mono text-[12.5px] text-text-secondary">{issue.rowNumber}</TD>
                            <TD>{issue.message}</TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {!result && !mutation.isPending && (
            <EmptyState
              icon={<UploadCloud className="size-6" />}
              title="No import run yet"
              description="Results aren't saved — this page only shows the outcome of the most recent upload in this session."
            />
          )}
        </div>

        <div>
          <Card>
            <CardHeader title="Accepted columns" description="Headers are matched case-insensitively. One row = one municipality." />
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
                <p>
                  There's no per-ward row — <code className="font-mono">total_wards</code> alone creates Ward rows 1..N for
                  that municipality. Unrecognized columns are ignored rather than rejected.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
