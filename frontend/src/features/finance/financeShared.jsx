import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Ban, Search } from 'lucide-react'
import { api, body } from '../../services/api'
import { usePagedList } from '../../hooks/usePagination'
import Pagination from '../../components/common/Pagination'
import { Input } from '../../components/common/primitives/input'
import { Button } from '../../components/common/primitives/button'
import { Empty, ErrorState, Loading } from '../../components/common/ui'
import './finance.css'

export const methods = ['cash', 'bank', 'mobile', 'other']
export const fundingKinds = ['donation', 'grant', 'sponsorship']
export const today = () => new Date().toISOString().slice(0, 10)

export function useFinanceSettings() {
  return useQuery({ queryKey: ['finance-settings'], queryFn: () => api('/staff/finance/settings') })
}

// 1234.5 -> "1,234.50 USD"
export function useMoney() {
  const { i18n } = useTranslation()
  const settings = useFinanceSettings()
  const currency = settings.data?.currency ?? ''
  return (value) =>
    `${new Intl.NumberFormat(i18n.language, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value ?? 0)}${currency ? ` ${currency}` : ''}`
}

export function useFinanceDate() {
  const { i18n } = useTranslation()
  return (value) =>
    value
      ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeZone: 'UTC' }).format(
          new Date(value),
        )
      : '—'
}

// Refreshes every finance view after a change.
export function useFinanceRefresh() {
  const client = useQueryClient()
  return () => {
    for (const key of [
      'finance-transactions',
      'finance-summary',
      'finance-budgets',
      'finance-cashbook',
      'finance-report',
    ])
      void client.invalidateQueries({ queryKey: [key] })
  }
}

// Add income, an expense, or a donation / funding entry.
export function TransactionForm({ type, funding = false, onDone }) {
  const { t } = useTranslation()
  const settings = useFinanceSettings()
  const refresh = useFinanceRefresh()
  const categories =
    (type === 'income' ? settings.data?.incomeCategories : settings.data?.expenseCategories) ?? []
  const blank = () => ({
    stream: funding ? 'donation' : 'general',
    category: funding ? 'Donations' : '',
    amount: '',
    date: today(),
    method: 'cash',
    party: '',
    reference: '',
    description: '',
  })
  const [form, setForm] = useState(blank)
  const set = (patch) => setForm({ ...form, ...patch })
  const save = useMutation({
    mutationFn: () =>
      api('/staff/finance/transactions', {
        method: 'POST',
        body: body({ ...form, type, amount: Number(form.amount) }),
      }),
    onError: (error) => toast.error(error.message, { id: error.message, duration: 7000 }),
    onSuccess: (data) => {
      toast.success(data.message)
      setForm(blank())
      refresh()
      onDone?.()
    },
  })
  const partyLabel = funding
    ? t('finance.funder', 'Donor / funder')
    : type === 'income'
      ? t('finance.payer', 'Received from')
      : t('finance.payee', 'Paid to')
  return (
    <form
      className="panel finance-form"
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate()
      }}
    >
      <div className="form-grid">
        {funding && (
          <label>
            {t('finance.fundingKind', 'Type of funding')}
            <select value={form.stream} onChange={(e) => set({ stream: e.target.value })}>
              {fundingKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {t(`finance.streams.${kind}`, kind[0].toUpperCase() + kind.slice(1))}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          {t('finance.category', 'Category')} *
          <Input
            required
            list={`finance-categories-${type}`}
            autoComplete="off"
            maxLength={60}
            value={form.category}
            placeholder={t('finance.categoryHint', 'Choose or type a category')}
            onChange={(e) => set({ category: e.target.value })}
          />
          <datalist id={`finance-categories-${type}`}>
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </label>
        <label>
          {t('finance.amount', 'Amount')} ({settings.data?.currency ?? ''}) *
          <Input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(e) => set({ amount: e.target.value })}
          />
        </label>
        <label>
          {t('finance.date', 'Date')} *
          <Input
            required
            type="date"
            value={form.date}
            onChange={(e) => set({ date: e.target.value })}
          />
        </label>
        <label>
          {t('finance.method', 'Payment method')}
          <select value={form.method} onChange={(e) => set({ method: e.target.value })}>
            {methods.map((method) => (
              <option key={method} value={method}>
                {t(`finance.methods.${method}`, method[0].toUpperCase() + method.slice(1))}
              </option>
            ))}
          </select>
        </label>
        <label>
          {partyLabel}
          <Input
            maxLength={150}
            value={form.party}
            onChange={(e) => set({ party: e.target.value })}
          />
        </label>
        <label>
          {t('finance.reference', 'Reference / invoice no.')}
          <Input
            maxLength={100}
            value={form.reference}
            onChange={(e) => set({ reference: e.target.value })}
          />
        </label>
      </div>
      <label>
        {t('finance.description', 'Description')}
        <textarea
          rows={2}
          maxLength={1000}
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
        />
      </label>
      <div className="button-row">
        <Button disabled={save.isPending}>
          {save.isPending ? t('staffContent.saving', 'Saving…') : t('finance.save', 'Save entry')}
        </Button>
        {onDone && (
          <Button type="button" variant="outline" onClick={onDone}>
            {t('staffContent.cancel', 'Cancel')}
          </Button>
        )}
      </div>
    </form>
  )
}

function VoidButton({ item }) {
  const { t } = useTranslation()
  const refresh = useFinanceRefresh()
  const voidEntry = useMutation({
    mutationFn: (reason) =>
      api(`/staff/finance/transactions/${item._id}/void`, {
        method: 'PATCH',
        body: body({ reason }),
      }),
    onError: (error) => toast.error(error.message),
    onSuccess: (data) => {
      toast.success(data.message)
      refresh()
    },
  })
  if (item.status === 'void') return null
  return (
    <button
      type="button"
      className="inventory-action delete"
      title={t('finance.void', 'Void entry')}
      aria-label={t('finance.void', 'Void entry')}
      disabled={voidEntry.isPending}
      onClick={() => {
        const reason = window.prompt(
          t('finance.voidReason', 'Why is this entry being voided? (e.g. entered twice)'),
        )
        if (reason && reason.trim().length >= 3) voidEntry.mutate(reason.trim())
      }}
    >
      <Ban size={15} aria-hidden="true" />
    </button>
  )
}

// A filterable, paged list of entries with totals for the current filter.
export function TransactionTable({ filters = '', showType = true, partyLabel }) {
  const { t } = useTranslation()
  const money = useMoney()
  const date = useFinanceDate()
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const list = usePagedList(
    'finance-transactions',
    '/staff/finance/transactions',
    `${filters}&q=${encodeURIComponent(search)}&from=${from}&to=${to}`,
  )
  const sums = list.raw?.sums
  return (
    <section className="panel">
      <div className="table-toolbar finance-toolbar">
        <div className="search-input">
          <Search size={18} />
          <Input
            aria-label={t('finance.search', 'Search')}
            placeholder={t('finance.searchHint', 'Search name, receipt, reference…')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <label className="finance-date-filter">
          {t('finance.from', 'From')}
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="finance-date-filter">
          {t('finance.to', 'To')}
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>
      {sums && (sums.income > 0 || sums.expense > 0) && (
        <p className="finance-sums muted">
          {t('finance.shownTotal', 'Total shown')}:{' '}
          {sums.income > 0 && <span className="finance-in">+{money(sums.income)}</span>}{' '}
          {sums.expense > 0 && <span className="finance-out">−{money(sums.expense)}</span>}
        </p>
      )}
      {list.isPending ? (
        <Loading />
      ) : list.error ? (
        <ErrorState error={list.error} retry={() => void list.refetch()} />
      ) : list.data.length ? (
        <div className="table-scroll">
          <table className="finance-table">
            <thead>
              <tr>
                <th>{t('finance.date', 'Date')}</th>
                {showType && <th>{t('finance.type', 'Type')}</th>}
                <th>{t('finance.category', 'Category')}</th>
                <th>{partyLabel ?? t('finance.party', 'Party')}</th>
                <th>{t('finance.receipt', 'Receipt / ref.')}</th>
                <th className="num">{t('finance.amount', 'Amount')}</th>
                <th className="actions" aria-label={t('finance.void', 'Void entry')} />
              </tr>
            </thead>
            <tbody>
              {list.data.map((item) => (
                <tr key={item._id} className={item.status === 'void' ? 'void' : ''}>
                  <td>{date(item.date)}</td>
                  {showType && (
                    <td>
                      <span className={`fin-badge ${item.type}`}>
                        {item.type === 'income'
                          ? t('finance.income', 'Income')
                          : t('finance.expense', 'Expense')}
                      </span>
                    </td>
                  )}
                  <td>
                    {item.category}
                    {item.stream !== 'general' && (
                      <small className="muted">
                        {t(`finance.streams.${item.stream}`, item.stream)}
                      </small>
                    )}
                  </td>
                  <td>
                    {item.party || '—'}
                    {item.description && <small className="muted">{item.description}</small>}
                  </td>
                  <td>
                    {item.receiptNo || item.reference || '—'}
                    {item.receiptNo && item.reference && (
                      <small className="muted">{item.reference}</small>
                    )}
                  </td>
                  <td className={`num ${item.type === 'income' ? 'finance-in' : 'finance-out'}`}>
                    {item.type === 'income' ? '+' : '−'}
                    {money(item.amount)}
                    {item.status === 'void' && (
                      <small className="muted">
                        {t('finance.voided', 'Void')}: {item.voidReason}
                      </small>
                    )}
                  </td>
                  <td className="actions">
                    <VoidButton item={item} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty title={t('finance.empty', 'No entries yet.')} />
      )}
      <Pagination {...list} />
    </section>
  )
}

// Figure tile used on finance pages.
export function FinanceTile({ label, value, tone = '', note }) {
  return (
    <div className={`metric finance-tile ${tone}`}>
      <div>
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  )
}
