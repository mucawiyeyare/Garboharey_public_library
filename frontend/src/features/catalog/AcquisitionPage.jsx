import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ArrowLeftRight,
  Gift,
  Library,
  Plus,
  Search,
  ShoppingCart,
  Shuffle,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { api, body } from '../../services/api'
import { useAuth } from '../../context/AuthProvider'
import { usePagedList } from '../../hooks/usePagination'
import { isAdmin } from '../../utils/roles'
import Pagination from '../../components/common/Pagination'
import { Input } from '../../components/common/primitives/input'
import { Button } from '../../components/common/primitives/button'
import { Empty, ErrorState, Loading, PageHeading } from '../../components/common/ui'

// How books can come to the library; the "source" label changes with the type.
const types = [
  {
    value: 'purchased',
    icon: ShoppingCart,
    label: 'Purchased',
    source: 'Supplier / bookshop',
  },
  { value: 'donated', icon: Gift, label: 'Donated', source: 'Donor name' },
  {
    value: 'exchange',
    icon: ArrowLeftRight,
    label: 'Exchange',
    source: 'Partner library',
  },
  {
    value: 'transfer',
    icon: Shuffle,
    label: 'Transfer',
    source: 'Transferred from',
  },
  { value: 'other', icon: Sparkles, label: 'Other', source: 'Source' },
]
const today = () => new Date().toISOString().slice(0, 10)
const blank = () => ({
  type: 'purchased',
  quantity: 1,
  bookName: '',
  title: '',
  source: '',
  cost: '',
  currency: 'USD',
  acquiredAt: today(),
  reference: '',
  notes: '',
})

function RecordForm() {
  const { t } = useTranslation()
  const client = useQueryClient()
  const [form, setForm] = useState(blank)
  const set = (patch) => setForm({ ...form, ...patch })
  const books = useQuery({ queryKey: ['inventory-all'], queryFn: () => api('/staff/books') })
  const bookTitles = [
    ...new Set(
      (Array.isArray(books.data) ? books.data : (books.data?.items ?? [])).map((book) => book.title),
    ),
  ]
  const type = types.find((item) => item.value === form.type)
  const label = (key, fallback) => t(`acquisition.${key}`, fallback)
  const save = useMutation({
    mutationFn: () =>
      api('/staff/acquisitions', {
        method: 'POST',
        body: body({ ...form, cost: Number(form.cost) || 0 }),
      }),
    onError: (error) => toast.error(error.message, { id: error.message, duration: 7000 }),
    onSuccess: (data) => {
      toast.success(data.message)
      setForm(blank())
      void client.invalidateQueries({ queryKey: ['acquisitions'] })
      void client.invalidateQueries({ queryKey: ['acquisition-summary'] })
    },
  })
  return (
    <form
      className="panel acquisition-form"
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate()
      }}
    >
      <h2>{label('record', 'Record books received')}</h2>
      <fieldset className="acquisition-types">
        <legend>{label('howAcquired', 'How was it acquired?')}</legend>
        <div>
          {types.map(({ value, icon: Icon, label: name }) => (
            <label key={value} className={form.type === value ? 'selected' : ''}>
              <input
                type="radio"
                name="acquisitionType"
                value={value}
                checked={form.type === value}
                onChange={() => set({ type: value })}
              />
              <Icon size={20} aria-hidden="true" />
              <span>{label(`types.${value}`, name)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        {label('bookName', 'Name of book')}
        <Input
          list="acquisition-book-names"
          autoComplete="off"
          maxLength={200}
          placeholder={label('bookNameHint', 'Type the book title')}
          value={form.bookName}
          onChange={(e) => set({ bookName: e.target.value })}
        />
        {/* Catalogue titles as suggestions only; any name can be typed. */}
        <datalist id="acquisition-book-names">
          {bookTitles.map((title) => (
            <option key={title} value={title} />
          ))}
        </datalist>
      </label>
      <div className="form-grid">
        <label>
          {label('quantity', 'Number of books')} *
          <Input
            required
            type="number"
            min={1}
            max={100000}
            value={form.quantity}
            onChange={(e) => set({ quantity: e.target.value })}
          />
        </label>
        <label>
          {label('date', 'Date received')}
          <Input
            type="date"
            max={today()}
            value={form.acquiredAt}
            onChange={(e) => set({ acquiredAt: e.target.value })}
          />
        </label>
        <label>
          {label('what', 'What was received')}
          <Input
            maxLength={200}
            placeholder={label('whatHint', 'e.g. Science textbooks, Somali novels')}
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
          />
        </label>
        <label>
          {label(`sources.${form.type}`, type.source)}
          <Input
            maxLength={150}
            value={form.source}
            onChange={(e) => set({ source: e.target.value })}
          />
        </label>
        {form.type === 'purchased' && (
          <>
            <label>
              {label('cost', 'Total cost')}
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.cost}
                onChange={(e) => set({ cost: e.target.value })}
              />
            </label>
            <label>
              {label('currency', 'Currency')}
              <Input
                maxLength={10}
                value={form.currency}
                onChange={(e) => set({ currency: e.target.value })}
              />
            </label>
          </>
        )}
        <label>
          {label('reference', 'Receipt / invoice no.')}
          <Input
            maxLength={100}
            value={form.reference}
            onChange={(e) => set({ reference: e.target.value })}
          />
        </label>
      </div>
      <label>
        {label('notes', 'Notes')}
        <textarea
          rows={2}
          maxLength={1000}
          value={form.notes}
          onChange={(e) => set({ notes: e.target.value })}
        />
      </label>
      <div className="button-row">
        <Button disabled={save.isPending}>
          <Plus size={18} aria-hidden="true" />
          {save.isPending ? t('staffContent.saving', 'Saving…') : label('submit', 'Save record')}
        </Button>
      </div>
    </form>
  )
}

function DeleteButton({ item }) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const remove = useMutation({
    mutationFn: () => api(`/staff/acquisitions/${item._id}`, { method: 'DELETE' }),
    onError: (error) => toast.error(error.message),
    onSuccess: (data) => {
      toast.success(data.message)
      void client.invalidateQueries({ queryKey: ['acquisitions'] })
      void client.invalidateQueries({ queryKey: ['acquisition-summary'] })
    },
  })
  return (
    <button
      type="button"
      className="inventory-action delete"
      title={t('acquisition.delete', 'Delete record')}
      aria-label={t('acquisition.delete', 'Delete record')}
      disabled={remove.isPending}
      onClick={() => {
        if (window.confirm(t('acquisition.confirmDelete', 'Delete this record?'))) remove.mutate()
      }}
    >
      <Trash2 size={15} aria-hidden="true" />
    </button>
  )
}

// Totals: all books received and how many of each type.
function Summary() {
  const { t } = useTranslation()
  const summary = useQuery({
    queryKey: ['acquisition-summary'],
    queryFn: () => api('/staff/acquisitions/summary'),
  })
  const label = (key, fallback) => t(`acquisition.${key}`, fallback)
  return (
    <div className="metrics-grid acquisition-metrics">
      <div className="metric total">
        <div>
          <span>{label('total', 'All books received')}</span>
          <Library size={18} aria-hidden="true" />
        </div>
        <strong>{summary.data?.total ?? '—'}</strong>
      </div>
      {types.map(({ value, icon: Icon, label: name }) => (
        <div className="metric" key={value}>
          <div>
            <span>{label(`types.${value}`, name)}</span>
            <Icon size={18} aria-hidden="true" />
          </div>
          <strong>{summary.data?.[value]?.books ?? '—'}</strong>
        </div>
      ))}
    </div>
  )
}

function History() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [type, setType] = useState('')
  const [search, setSearch] = useState('')
  const list = usePagedList(
    'acquisitions',
    '/staff/acquisitions',
    `type=${type}&q=${encodeURIComponent(search)}`,
  )
  const label = (key, fallback) => t(`acquisition.${key}`, fallback)
  const date = (value) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(value))
  const canDelete = isAdmin(user)
  return (
    <>
      <h2 className="acquisition-history-title">{label('history', 'Acquisition history')}</h2>
      <section className="panel">
        <div className="table-toolbar">
          <div className="search-input">
            <Search size={18} />
            <Input
              aria-label={label('search', 'Search')}
              placeholder={label('searchHint', 'Search description, source or receipt')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            aria-label={label('filter', 'Type')}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">{label('allTypes', 'All types')}</option>
            {types.map(({ value, label: name }) => (
              <option key={value} value={value}>
                {label(`types.${value}`, name)}
              </option>
            ))}
          </select>
        </div>
        {list.isPending ? (
          <Loading />
        ) : list.error ? (
          <ErrorState error={list.error} retry={() => void list.refetch()} />
        ) : list.data.length ? (
          <div className="table-scroll">
            <table className="acquisition-table">
              <thead>
                <tr>
                  <th>{label('date', 'Date received')}</th>
                  <th>{label('type', 'Type')}</th>
                  <th className="num">{label('books', 'Books')}</th>
                  <th>{label('bookName', 'Name of book')}</th>
                  <th>{label('source', 'Source')}</th>
                  <th>{label('cost', 'Total cost')}</th>
                  {canDelete && <th aria-label={label('delete', 'Delete record')} />}
                </tr>
              </thead>
              <tbody>
                {list.data.map((item) => (
                  <tr key={item._id}>
                    <td>{date(item.acquiredAt)}</td>
                    <td>
                      <span className={`acq-badge ${item.type}`}>
                        {label(`types.${item.type}`, item.type)}
                      </span>
                    </td>
                    <td className="num">
                      <strong>{item.quantity}</strong>
                    </td>
                    <td className="title">
                      <strong>{item.bookName || item.book?.title || item.title || '—'}</strong>
                      {item.title && (item.bookName || item.book) && (
                        <small className="muted">{item.title}</small>
                      )}
                      {item.notes && <small className="muted">{item.notes}</small>}
                    </td>
                    <td>
                      {item.source || '—'}
                      {item.reference && <small className="muted">#{item.reference}</small>}
                    </td>
                    <td>{item.cost > 0 ? `${item.cost.toFixed(2)} ${item.currency}` : '—'}</td>
                    {canDelete && (
                      <td className="actions">
                        <DeleteButton item={item} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title={label('empty', 'No acquisitions recorded yet.')} />
        )}
        <Pagination {...list} />
      </section>
    </>
  )
}

// Collection › Acquisition: keep count of books purchased, donated, exchanged or transferred.
// Recording here does not add books to the catalogue.
export default function AcquisitionPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeading
        eyebrow={t('acquisition.eyebrow', 'COLLECTION')}
        title={t('nav.acquisition', 'Acquisition')}
        description={t(
          'acquisition.intro',
          'Keep count of the books the library receives: purchased, donated, exchanged or transferred.',
        )}
      />
      <Summary />
      <RecordForm />
      <History />
    </>
  )
}
