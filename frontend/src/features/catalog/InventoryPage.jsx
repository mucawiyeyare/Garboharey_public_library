import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { api } from '../../services/api'
import { Input } from '../../components/common/primitives/input'
import { Empty, ErrorState, Loading, PageHeading } from '../../components/common/ui'

// Stock status of a title, from its copy counts.
const stockStatus = ({ total = 0, available = 0, borrowed = 0 }) =>
  total === 0 ? 'none' : available > 0 ? 'available' : borrowed > 0 ? 'borrowed' : 'reserved'
const statusClass = { available: 'good', borrowed: 'warn', reserved: 'warn', none: 'bad' }
const filters = ['all', 'available', 'borrowed', 'unavailable']
const matches = (filter, counts) =>
  filter === 'all' ||
  (filter === 'available' && counts.available > 0) ||
  (filter === 'borrowed' && counts.borrowed > 0) ||
  (filter === 'unavailable' && !(counts.available > 0))

// Inventory: every title with its type, copy counts and whether it can be borrowed now.
export default function InventoryPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const books = useQuery({ queryKey: ['inventory-all'], queryFn: () => api('/staff/books') })
  const list = useMemo(() => (Array.isArray(books.data) ? books.data : (books.data?.items ?? [])), [books.data])
  const totals = list.reduce(
    (sum, book) => ({
      titles: sum.titles + 1,
      copies: sum.copies + (book.copies?.total ?? 0),
      available: sum.available + (book.copies?.available ?? 0),
      borrowed: sum.borrowed + (book.copies?.borrowed ?? 0),
    }),
    { titles: 0, copies: 0, available: 0, borrowed: 0 },
  )
  const query = search.trim().toLowerCase()
  const rows = list.filter(
    (book) =>
      matches(filter, book.copies ?? {}) &&
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
      <div className="metrics-grid inventory-metrics">
        {[
          ['titles', 'Books', totals.titles],
          ['copies', 'Copies', totals.copies],
          ['available', 'Available', totals.available],
          ['borrowed', 'Borrowed', totals.borrowed],
        ].map(([key, fallback, value]) => (
          <div className="metric" key={key}>
            <div>
              <span>{label(key, fallback)}</span>
            </div>
            <strong>{books.isPending ? '—' : value}</strong>
          </div>
        ))}
      </div>
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
            {filters.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {label(`filters.${value}`, value[0].toUpperCase() + value.slice(1))}
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
