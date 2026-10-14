import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { api } from '../../services/api'
import { Input } from '../../components/common/primitives/input'
import { Empty, ErrorState, Loading, PageHeading } from '../../components/common/ui'

// Copy status breakdown from the reports endpoint (Copy.aggregate by status)
const STATUS_BUCKETS = [
  { key: 'all',       label: 'All Copies',      filter: null,                    badge: '' },
  { key: 'available', label: 'Available',        filter: 'available',             badge: 'badge-available' },
  { key: 'on_loan',   label: 'Borrowed',         filter: 'on_loan',               badge: 'badge-borrowed' },
  { key: 'reserved',  label: 'Reserved',         filter: 'reserved',              badge: 'badge-reserved' },
  { key: 'damaged',   label: 'Damaged',          filter: 'damaged',               badge: 'badge-damaged' },
  { key: 'returned',  label: 'Returned',         filter: null,                    badge: '' },   // derived from loan data
  { key: 'lost',      label: 'Lost / Missing',   filter: 'lost',                  badge: 'badge-lost' },
]

const FILTER_TABS = [
  { key: 'all',       label: 'All copies' },
  { key: 'available', label: 'Available' },
  { key: 'borrowed',  label: 'Borrowed' },
  { key: 'reserved',  label: 'Reserved' },
  { key: 'damaged',   label: 'Damaged' },
  { key: 'returned',  label: 'Returned' },
  { key: 'lost',      label: 'Lost / Missing' },
]

const stockStatus = ({ total = 0, available = 0, borrowed = 0, reserved = 0, damaged = 0, lost = 0 }) =>
  total === 0
    ? 'none'
    : available > 0
    ? 'available'
    : borrowed > 0
    ? 'borrowed'
    : reserved > 0
    ? 'reserved'
    : damaged > 0
    ? 'damaged'
    : lost > 0
    ? 'lost'
    : 'none'

const statusClass = {
  available: 'good',
  borrowed: 'warn',
  reserved: 'warn',
  damaged: 'bad',
  lost: 'bad',
  returned: 'good',
  none: 'bad',
}

const matchesFilter = (filter, counts = {}) => {
  if (filter === 'all') return true
  if (filter === 'available') return (counts.available ?? 0) > 0
  if (filter === 'borrowed') return (counts.borrowed ?? 0) > 0
  if (filter === 'reserved') return (counts.reserved ?? 0) > 0
  if (filter === 'damaged') return (counts.damaged ?? 0) > 0
  if (filter === 'returned') return (counts.returned ?? 0) > 0
  if (filter === 'lost') return (counts.lost ?? 0) > 0
  return true
}

// Inventory: every title with its type, copy counts and status, PLUS
// a copy-level breakdown panel showing all 7 status buckets.
export default function InventoryPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const books = useQuery({ queryKey: ['inventory-all'], queryFn: () => api('/staff/books') })
  const report = useQuery({ queryKey: ['reports'], queryFn: () => api('/staff/reports') })

  const list = useMemo(() => (Array.isArray(books.data) ? books.data : (books.data?.items ?? [])), [books.data])

  // Title-level totals
  const totals = list.reduce(
    (sum, book) => ({
      titles: sum.titles + 1,
      copies: sum.copies + (book.copies?.total ?? 0),
      available: sum.available + (book.copies?.available ?? 0),
      borrowed: sum.borrowed + (book.copies?.borrowed ?? 0),
    }),
    { titles: 0, copies: 0, available: 0, borrowed: 0 },
  )

  // Copy-level status counts from the aggregate report
  const inventory = report.data?.inventory ?? []
  const copyCount = (status) => inventory.find((item) => item._id === status)?.count ?? 0
  const totalCopies = inventory.reduce((sum, item) => sum + item.count, 0)
  // "Returned" = copies that are back on loan (available) after being borrowed — we approximate
  // with returnedLoans count from the report
  const returnedLoans = report.data?.returnedLoans ?? 0

  const query = search.trim().toLowerCase()
  const rows = list.filter(
    (book) =>
      matchesFilter(filter, book.copies ?? {}) &&
      (!query ||
        [book.title, book.author, book.isbn, book.categoryName]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query))),
  )
  const label = (key, fallback) => t(`inventory.${key}`, fallback)

  return (
    <>
      <PageHeading
        eyebrow={label('eyebrow', 'COLLECTION')}
        title={t('nav.inventory', 'Inventory')}
        description={label('intro', 'Every book, its type, how many copies are available or borrowed, and its status.')}
      />

      {/* ── Copy Status Dashboard ── */}
      <div
        className="metrics-grid inventory-metrics"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}
      >
        {[
          { key: 'all',       label: 'All copies',     value: totalCopies },
          { key: 'available', label: 'Available',      value: copyCount('available') },
          { key: 'borrowed',  label: 'Borrowed',       value: copyCount('on_loan') },
          { key: 'reserved',  label: 'Reserved',       value: copyCount('reserved') },
          { key: 'damaged',   label: 'Damaged',        value: copyCount('damaged') },
          { key: 'returned',  label: 'Returned',       value: returnedLoans },
          { key: 'lost',      label: 'Lost / Missing', value: copyCount('lost') },
        ].map(({ key, label: lbl, value }) => (
          <div
            className={`metric ${filter === key ? 'active' : ''}`}
            key={key}
            onClick={() => setFilter(key)}
            style={{
              cursor: 'pointer',
              border: filter === key ? '2px solid var(--accent)' : undefined,
              background: filter === key ? 'var(--accent-soft, var(--soft))' : undefined,
            }}
            title={`Filter by ${lbl}`}
          >
            <div><span style={{ fontSize: '0.78em' }}>{lbl}</span></div>
            <strong>{report.isPending || books.isPending ? '—' : value}</strong>
          </div>
        ))}
      </div>

      {/* ── Title-level table ── */}
      <section className="panel">
        <div className="table-toolbar">
          <div className="search-input">
            <Search size={18} />
            <Input
              aria-label={label('search', 'Search books')}
              placeholder={label('searchHint', 'Search title, author, ISBN or type')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="segmented" role="group" aria-label={label('filter', 'Filter')}>
            {FILTER_TABS.map(({ key, label: fallbackLabel }) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
              >
                {label(`filters.${key}`, fallbackLabel)}
              </button>
            ))}
          </div>
        </div>
        {books.isPending ? (
          <Loading />
        ) : books.error ? (
          <ErrorState error={books.error} retry={() => void books.refetch()} />
        ) : rows.length ? (
          <div className="table-scroll inventory-scroll">
            <table className="inventory-table stock-table">
              <thead>
                <tr>
                  <th>{label('book', 'Book')}</th>
                  <th className="type">{label('type', 'Type')}</th>
                  <th className="num">{label('total', 'Total')}</th>
                  <th className="num">{label('availableShort', 'Avail.')}</th>
                  <th className="num">{label('borrowedShort', 'Borrowed')}</th>
                  <th className="status-col">{label('status', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((book) => {
                  const counts = book.copies ?? {}
                  const status = stockStatus(counts)
                  return (
                    <tr key={book._id}>
                      <td className="title">
                        <strong>{book.title}</strong>
                        {book.author && <small>{book.author}</small>}
                      </td>
                      <td className="type">{book.categoryName || '—'}</td>
                      <td className="num">{counts.total ?? 0}</td>
                      <td className="num">
                        <span className="copy-stat-badge badge-available">{counts.available ?? 0}</span>
                      </td>
                      <td className="num">
                        <span className="copy-stat-badge badge-borrowed">{counts.borrowed ?? 0}</span>
                      </td>
                      <td className="status-col">
                        <span className={`status ${statusClass[status]}`}>
                          {label(`states.${status}`, {
                            available: 'Available',
                            borrowed: 'All borrowed',
                            reserved: 'Reserved',
                            damaged: 'Damaged',
                            lost: 'Lost / Missing',
                            returned: 'Returned',
                            none: 'No copies',
                          }[status])}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title={label('empty', 'No books match.')} />
        )}
      </section>
    </>
  )
}
