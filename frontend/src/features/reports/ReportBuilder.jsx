import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Download, Filter, Printer, RefreshCw } from 'lucide-react'
import { api } from '../../services/api'
import { csvDownload } from '../../utils/csv'
import { Input } from '../../components/common/primitives/input'
import { Button } from '../../components/common/primitives/button'
import Pagination from '../../components/common/Pagination'
import { Empty, ErrorState, Loading } from '../../components/common/ui'

// 5 recommended categories from specifications:
// 1. Collection & Inventory: Book titles, physical copies, availability, damaged/lost copies, acquisition history
// 2. Members: Registered members, active members, pending applications, membership growth
// 3. Circulation: Loans issued, returns, current loans, borrowing history, renewals
// 4. Overdue & Reservations: Overdue loans, days overdue, reservation outcomes, waiting reservations
// 5. Popular Books: Most borrowed books, popular categories, borrowing trends
const CATEGORIES = {
  'Collection & Inventory': {
    label: 'Collection & Inventory',
    reports: {
      'books-by-category': { label: 'Book Titles by Category', dates: false },
      'books-by-author': { label: 'Book Titles by Author', dates: false },
      'books-by-publisher': { label: 'Book Titles by Publisher', dates: false },
      inventory: { label: 'Physical Copies & Availability', dates: false },
      'lost-damaged': { label: 'Damaged / Lost Copies', dates: true },
    },
  },
  Members: {
    label: 'Members',
    reports: {
      'members-summary': { label: 'Registered Members & Application Status', dates: false },
      'membership-growth': {
        label: 'Membership Growth',
        dates: true,
        groupBy: ['year', 'month', 'day'],
      },
      'member-history': { label: 'Member Borrowing History', dates: true, search: true },
    },
  },
  Circulation: {
    label: 'Circulation',
    reports: {
      'borrowing-by-period': {
        label: 'Loans Issued & Returns',
        dates: true,
        groupBy: ['year', 'month', 'week', 'day'],
      },
      'member-history': { label: 'Current Loans & Borrowing History', dates: true, search: true },
      'most-borrowed': { label: 'Borrowing Volume by Book', dates: true },
    },
  },
  'Overdue & Reservations': {
    label: 'Overdue & Reservations',
    reports: {
      overdue: { label: 'Overdue Loans & Days Overdue', dates: true },
      'reservations-summary': { label: 'Reservation Outcomes & Waiting Reservations', dates: true },
      fines: { label: 'Fines & Collections', dates: true, search: true },
    },
  },
  'Popular Books': {
    label: 'Popular Books',
    reports: {
      'most-borrowed': { label: 'Most Borrowed Books', dates: true },
      'popular-categories': { label: 'Popular Categories', dates: true },
      'borrowing-by-period': {
        label: 'Borrowing Trends',
        dates: true,
        groupBy: ['year', 'month', 'week', 'day'],
      },
    },
  },
}

const dateColumns = ['date', 'issued', 'due', 'returned']
const moneyColumns = ['amount', 'paid', 'fineSoFar']

export default function ReportBuilder() {
  const { t, i18n } = useTranslation()

  // Form input state
  const [category, setCategory] = useState('Collection & Inventory')
  const [type, setType] = useState('inventory')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [q, setQ] = useState('')
  const [groupBy, setGroupBy] = useState('month')
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState(false)

  // Applied filter state (triggers query)
  const [appliedFilters, setAppliedFilters] = useState({
    type: 'inventory',
    from: '',
    to: '',
    q: '',
    groupBy: 'month',
  })

  const categoryDef = CATEGORIES[category]
  const options = categoryDef?.reports[type] ?? {}
  const invalidRange = from && to && from > to

  const activeOptions = CATEGORIES[category]?.reports[appliedFilters.type] ?? {}

  const params = new URLSearchParams({
    lang: i18n.language,
    groupBy: activeOptions.groupBy?.includes(appliedFilters.groupBy)
      ? appliedFilters.groupBy
      : (activeOptions.groupBy?.[0] ?? 'month'),
    ...(activeOptions.dates && appliedFilters.from ? { from: appliedFilters.from } : {}),
    ...(activeOptions.dates && appliedFilters.to ? { to: appliedFilters.to } : {}),
    ...(activeOptions.search && appliedFilters.q ? { q: appliedFilters.q } : {}),
  })

  const report = useQuery({
    queryKey: ['report-run', appliedFilters.type, params.toString(), page],
    queryFn: () => api(`/staff/reports/run/${appliedFilters.type}?${params}&page=${page}&limit=25`),
    enabled: !invalidRange,
  })

  const date = (value) =>
    value
      ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeZone: 'UTC' }).format(
          new Date(value),
        )
      : '—'

  const cell = (column, value) => {
    if (value === null || value === undefined || value === '')
      return column === 'returned' ? '—' : t('reports.none', '—')
    if (dateColumns.includes(column)) return date(value)
    if (column === 'status')
      return t(`status.${value}`, { defaultValue: String(value).replaceAll('_', ' ') })
    if (column === 'metric') return t(`reports.metrics.${value}`, { defaultValue: value })
    if (moneyColumns.includes(column)) return Number(value).toFixed(2)
    if (typeof value === 'number') return value.toLocaleString(i18n.language)
    return value
  }

  const plain = (column, value) => {
    if (dateColumns.includes(column)) return value ? new Date(value).toISOString().slice(0, 10) : ''
    if (column === 'status') return t(`status.${value}`, { defaultValue: String(value ?? '') })
    if (column === 'metric') return t(`reports.metrics.${value}`, { defaultValue: value ?? '' })
    return value ?? ''
  }

  const handleApplyFilters = () => {
    setPage(1)
    setAppliedFilters({
      type,
      from,
      to,
      q,
      groupBy,
    })
  }

  const exportCsv = async () => {
    setBusy(true)
    try {
      const all = await api(`/staff/reports/run/${appliedFilters.type}?${params}&all=true`)
      csvDownload(
        `${appliedFilters.type}-report.csv`,
        all.columns.map((column) => t(`reports.cols.${column}`, { defaultValue: column })),
        all.rows.map((row) => all.columns.map((column) => plain(column, row[column]))),
      )
      toast.success(t('reports.exported', 'Exported successfully'))
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusy(false)
    }
  }

  const rangeText = [
    appliedFilters.from && `${t('reports.from', 'From')} ${appliedFilters.from}`,
    appliedFilters.to && `${t('reports.to', 'To')} ${appliedFilters.to}`,
  ]
    .filter(Boolean)
    .join(' · ')

  // When changing category, auto-select the first report in that category
  const handleCategoryChange = (next) => {
    setCategory(next)
    const firstReport = Object.keys(CATEGORIES[next]?.reports ?? {})[0]
    if (firstReport) {
      setType(firstReport)
      setAppliedFilters((prev) => ({ ...prev, type: firstReport }))
    }
    setPage(1)
  }

  return (
    <section className="panel report-builder">
      <div className="section-heading compact no-print">
        <div>
          <h2>{t('reports.builder', 'Report Builder')}</h2>
          <p className="muted">
            {t(
              'reports.builderIntro',
              'Put report selection and filters in one clear section: select category, specific report, date range, and grouping.',
            )}
          </p>
        </div>
      </div>

      {/* ── Unified Report Selection & Filters Section ── */}
      <div
        className="report-selection-filters-panel no-print"
        style={{
          background: 'var(--soft)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleApplyFilters()
          }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1rem',
            alignItems: 'end',
          }}
        >
          {/* 1. Report category */}
          <label>
            <strong style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
              <Filter size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              {t('reports.category', 'Report Category')}
            </strong>
            <select
              value={category}
              onChange={(event) => handleCategoryChange(event.target.value)}
            >
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <option key={key} value={key}>
                  {cat.label}
                </option>
              ))}
            </select>
          </label>

          {/* 2. Specific report */}
          <label>
            <strong style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
              {t('reports.report', 'Specific Report')}
            </strong>
            <select
              value={type}
              onChange={(event) => {
                const nextType = event.target.value
                setType(nextType)
                setAppliedFilters((prev) => ({ ...prev, type: nextType }))
                setPage(1)
              }}
            >
              {Object.entries(categoryDef?.reports ?? {}).map(([key, rep]) => (
                <option key={key} value={key}>
                  {rep.label}
                </option>
              ))}
            </select>
          </label>

          {/* 3. Start date and end date */}
          {options.dates && (
            <>
              <label>
                <strong style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                  {t('reports.from', 'Start Date')}
                </strong>
                <Input
                  type="date"
                  value={from}
                  max={to || undefined}
                  onChange={(event) => setFrom(event.target.value)}
                />
              </label>
              <label>
                <strong style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                  {t('reports.to', 'End Date')}
                </strong>
                <Input
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(event) => setTo(event.target.value)}
                />
              </label>
            </>
          )}

          {/* 4. Group results by day, week, month, or year */}
          {options.groupBy && (
            <label>
              <strong style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                {t('reports.groupBy', 'Group Results By')}
              </strong>
              <select
                value={options.groupBy.includes(groupBy) ? groupBy : options.groupBy[0]}
                onChange={(event) => setGroupBy(event.target.value)}
              >
                {options.groupBy.map((key) => (
                  <option key={key} value={key}>
                    {t(`reports.by.${key}`, key.charAt(0).toUpperCase() + key.slice(1))}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* 5. Filter by Member / Search */}
          {options.search && (
            <label>
              <strong style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                {t('reports.search', 'Filter by Member')}
              </strong>
              <Input
                value={q}
                maxLength={100}
                placeholder={t('reports.searchPlaceholder', 'Name or email…')}
                onChange={(event) => setQ(event.target.value)}
              />
            </label>
          )}

          {/* 6. Action buttons: Apply filters + Export CSV / Print or save as PDF */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <strong style={{ fontSize: '13px' }}>{t('reports.actions', 'Actions')}</strong>
            <div className="button-row" style={{ flexWrap: 'wrap', gap: '6px' }}>
              <Button type="submit" className="button" disabled={busy || !!invalidRange}>
                <RefreshCw size={15} style={{ marginRight: '4px' }} />
                {t('reports.apply', 'Apply Filters')}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy || !!invalidRange}
                onClick={() => void exportCsv()}
              >
                <Download size={15} style={{ marginRight: '4px' }} />
                {t('reports.exportCsv', 'Export CSV')}
              </Button>
              <Button type="button" variant="outline" onClick={() => window.print()}>
                <Printer size={15} style={{ marginRight: '4px' }} />
                {t('reports.print', 'Print / PDF')}
              </Button>
            </div>
            {invalidRange && (
              <span className="form-error">
                {t('reports.badRange', 'Start date must be before end date')}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Print header */}
      <div className="print-only">
        <h2>{activeOptions.label ?? appliedFilters.type}</h2>
        <p>{category}</p>
        {rangeText && <p>{rangeText}</p>}
        <p>{new Date().toLocaleString(i18n.language)}</p>
      </div>

      {/* ── Results Table & Metrics ── */}
      {report.isPending && !invalidRange ? (
        <Loading />
      ) : report.error ? (
        <ErrorState error={report.error} retry={() => void report.refetch()} />
      ) : report.data ? (
        <>
          {report.data.summary.length > 0 && (
            <div className="metrics-grid">
              {report.data.summary.map((item) => (
                <div className="metric" key={item.key}>
                  <div>
                    <span>{t(`reports.summary.${item.key}`, item.key)}</span>
                  </div>
                  <strong>{item.value.toFixed(2)}</strong>
                </div>
              ))}
            </div>
          )}
          {report.data.rows.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {report.data.columns.map((column) => (
                      <th key={column}>{t(`reports.cols.${column}`, { defaultValue: column })}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.data.rows.map((row, index) => (
                    <tr key={index}>
                      {report.data.columns.map((column) => (
                        <td key={column}>{cell(column, row[column])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title={t('reports.empty', 'No data for this report')} />
          )}
          <div className="no-print">
            <Pagination
              page={report.data.page}
              pages={report.data.pages}
              total={report.data.total}
              setPage={setPage}
            />
          </div>
        </>
      ) : null}
    </section>
  )
}
