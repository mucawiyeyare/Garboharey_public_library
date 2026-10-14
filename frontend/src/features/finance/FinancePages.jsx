import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { api, body } from '../../services/api'
import { csvDownload } from '../../utils/csv'
import { Input } from '../../components/common/primitives/input'
import { Button } from '../../components/common/primitives/button'
import { Empty, ErrorState, Loading, PageHeading } from '../../components/common/ui'
import {
  FinanceTile,
  TransactionForm,
  TransactionTable,
  methods,
  today,
  useFinanceDate,
  useFinanceRefresh,
  useFinanceSettings,
  useMoney,
} from './financeShared'

const monthName = (key, lang) =>
  new Intl.DateTimeFormat(lang, { month: 'short', timeZone: 'UTC' }).format(new Date(`${key}-01`))

// Simple two-bar chart per month (income vs expense), drawn with CSS.
function MonthBars({ months }) {
  const { t, i18n } = useTranslation()
  const max = Math.max(1, ...months.flatMap((m) => [m.income, m.expense]))
  return (
    <div
      className="finance-bars"
      role="img"
      aria-label={t('finance.chart', 'Income and expenses by month')}
    >
      {months.map((m) => (
        <div key={m.month} className="finance-bar-group">
          <div className="finance-bar-pair">
            <span
              className="bar in"
              style={{ height: `${(m.income / max) * 100}%` }}
              title={`${m.income}`}
            />
            <span
              className="bar out"
              style={{ height: `${(m.expense / max) * 100}%` }}
              title={`${m.expense}`}
            />
          </div>
          <small>{monthName(m.month, i18n.language)}</small>
        </div>
      ))}
    </div>
  )
}

function BudgetBar({ budget }) {
  const money = useMoney()
  const tone = budget.percent >= 100 ? 'over' : budget.percent >= 80 ? 'warn' : 'ok'
  return (
    <div className="budget-bar">
      <div className="budget-bar-head">
        <strong>{budget.name}</strong>
        <span className="muted">
          {money(budget.spent)} / {money(budget.amount)}
        </span>
      </div>
      <div className={`budget-track ${tone}`}>
        <span style={{ width: `${Math.min(100, budget.percent)}%` }} />
      </div>
      <small className="muted">
        {budget.category} · {budget.percent}%
      </small>
    </div>
  )
}

// ── 1. Finance Dashboard ──────────────────────────────────────────────────────
export function FinanceDashboard() {
  const { t } = useTranslation()
  const money = useMoney()
  const date = useFinanceDate()
  const summary = useQuery({
    queryKey: ['finance-summary'],
    queryFn: () => api('/staff/finance/summary'),
  })
  if (summary.isPending) return <Loading />
  if (summary.error)
    return <ErrorState error={summary.error} retry={() => void summary.refetch()} />
  const data = summary.data
  return (
    <>
      <PageHeading
        eyebrow={t('finance.eyebrow', 'FINANCE')}
        title={t('nav.financeDashboard', 'Finance Dashboard')}
        description={t(
          'finance.dashboardIntro',
          'Money in, money out and what the library holds today.',
        )}
      >
        <div className="button-row">
          <Link className="button" to="/staff/finance/income">
            <Plus size={17} aria-hidden="true" /> {t('finance.addIncome', 'Record income')}
          </Link>
          <Link className="button secondary" to="/staff/finance/expenses">
            <Plus size={17} aria-hidden="true" /> {t('finance.addExpense', 'Record expense')}
          </Link>
        </div>
      </PageHeading>
      <div className="metrics-grid finance-metrics">
        <FinanceTile
          label={t('finance.balance', 'Current balance')}
          value={money(data.balance)}
          tone="balance"
        />
        <FinanceTile
          label={t('finance.incomeMonth', 'Income this month')}
          value={money(data.month.income)}
          tone="in"
        />
        <FinanceTile
          label={t('finance.expenseMonth', 'Expenses this month')}
          value={money(data.month.expense)}
          tone="out"
        />
        <FinanceTile
          label={t('finance.fundingYear', 'Donations & funding this year')}
          value={money(data.fundingThisYear)}
          tone="fund"
        />
      </div>
      <div className="finance-two-col">
        <section className="panel">
          <h2>{t('finance.last12', 'Last 12 months')}</h2>
          <p className="finance-legend muted">
            <span className="dot in" /> {t('finance.income', 'Income')} <span className="dot out" />{' '}
            {t('finance.expense', 'Expense')}
          </p>
          <MonthBars months={data.months} />
          <p className="muted finance-year-line">
            {t('finance.thisYear', 'This year')}: +{money(data.year.income)} / −
            {money(data.year.expense)} = <strong>{money(data.year.net)}</strong>
          </p>
        </section>
        <section className="panel">
          <h2>{t('nav.budgets', 'Budgets')}</h2>
          {data.budgets.length ? (
            data.budgets.slice(0, 5).map((budget) => <BudgetBar key={budget._id} budget={budget} />)
          ) : (
            <Empty title={t('finance.noBudgets', 'No active budgets.')}>
              <Link className="text-link" to="/staff/finance/budgets">
                {t('finance.addBudget', 'Add a budget')}
              </Link>
            </Empty>
          )}
        </section>
      </div>
      <section className="panel">
        <h2>{t('finance.recent', 'Recent entries')}</h2>
        {data.recent.length ? (
          <div className="table-scroll">
            <table className="finance-table">
              <tbody>
                {data.recent.map((item) => (
                  <tr key={item._id}>
                    <td>{date(item.date)}</td>
                    <td>{item.category}</td>
                    <td>{item.party || '—'}</td>
                    <td className={`num ${item.type === 'income' ? 'finance-in' : 'finance-out'}`}>
                      {item.type === 'income' ? '+' : '−'}
                      {money(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title={t('finance.empty', 'No entries yet.')} />
        )}
      </section>
    </>
  )
}

// ── 2-4. Income, Expenses, Donations & Funding ────────────────────────────────
function EntriesPage({ type, funding = false, title, intro, filters, partyLabel }) {
  const { t } = useTranslation()
  const [adding, setAdding] = useState(false)
  return (
    <>
      <PageHeading eyebrow={t('finance.eyebrow', 'FINANCE')} title={title} description={intro}>
        {!adding && (
          <Button onClick={() => setAdding(true)}>
            <Plus size={17} aria-hidden="true" /> {t('finance.add', 'Add entry')}
          </Button>
        )}
      </PageHeading>
      {adding && <TransactionForm type={type} funding={funding} onDone={() => setAdding(false)} />}
      <TransactionTable filters={filters} showType={false} partyLabel={partyLabel} />
    </>
  )
}

export function IncomePage() {
  const { t } = useTranslation()
  return (
    <EntriesPage
      type="income"
      title={t('nav.income', 'Income / Receipts')}
      intro={t(
        'finance.incomeIntro',
        'Every payment the library receives. Each one gets a receipt number.',
      )}
      filters="type=income"
      partyLabel={t('finance.payer', 'Received from')}
    />
  )
}

export function ExpensesPage() {
  const { t } = useTranslation()
  return (
    <EntriesPage
      type="expense"
      title={t('nav.expenses', 'Expenses')}
      intro={t('finance.expensesIntro', 'Everything the library spends, by category.')}
      filters="type=expense"
      partyLabel={t('finance.payee', 'Paid to')}
    />
  )
}

export function DonationsPage() {
  const { t } = useTranslation()
  return (
    <EntriesPage
      type="income"
      funding
      title={t('nav.donations', 'Donations & Funding')}
      intro={t(
        'finance.donationsIntro',
        'Donations, grants and sponsorships received by the library.',
      )}
      filters="type=income&stream=funding"
      partyLabel={t('finance.funder', 'Donor / funder')}
    />
  )
}

// ── 5. Budgets ────────────────────────────────────────────────────────────────
function BudgetForm({ budget, onDone }) {
  const { t } = useTranslation()
  const settings = useFinanceSettings()
  const refresh = useFinanceRefresh()
  const year = new Date().getFullYear()
  const [form, setForm] = useState(
    budget
      ? {
          ...budget,
          periodStart: budget.periodStart.slice(0, 10),
          periodEnd: budget.periodEnd.slice(0, 10),
        }
      : {
          name: '',
          category: '',
          amount: '',
          periodStart: `${year}-01-01`,
          periodEnd: `${year}-12-31`,
          notes: '',
        },
  )
  const set = (patch) => setForm({ ...form, ...patch })
  const save = useMutation({
    mutationFn: () =>
      api(budget ? `/staff/finance/budgets/${budget._id}` : '/staff/finance/budgets', {
        method: budget ? 'PUT' : 'POST',
        body: body({
          name: form.name,
          category: form.category,
          amount: Number(form.amount),
          periodStart: form.periodStart,
          periodEnd: form.periodEnd,
          notes: form.notes,
        }),
      }),
    onError: (error) => toast.error(error.message, { id: error.message }),
    onSuccess: (data) => {
      toast.success(data.message)
      refresh()
      onDone()
    },
  })
  return (
    <form
      className="panel finance-form"
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate()
      }}
    >
      <div className="form-grid">
        <label>
          {t('finance.budgetName', 'Budget name')} *
          <Input
            required
            minLength={2}
            maxLength={100}
            value={form.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </label>
        <label>
          {t('finance.expenseCategory', 'Expense category')} *
          <select
            required
            value={form.category}
            onChange={(e) => set({ category: e.target.value })}
          >
            <option value="">{t('finance.choose', 'Choose…')}</option>
            {(settings.data?.expenseCategories ?? []).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('finance.amount', 'Amount')} ({settings.data?.currency ?? ''}) *
          <Input
            required
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => set({ amount: e.target.value })}
          />
        </label>
        <label>
          {t('finance.periodStart', 'From')} *
          <Input
            required
            type="date"
            value={form.periodStart}
            onChange={(e) => set({ periodStart: e.target.value })}
          />
        </label>
        <label>
          {t('finance.periodEnd', 'To')} *
          <Input
            required
            type="date"
            value={form.periodEnd}
            onChange={(e) => set({ periodEnd: e.target.value })}
          />
        </label>
      </div>
      <label>
        {t('finance.notes', 'Notes')}
        <textarea
          rows={2}
          maxLength={500}
          value={form.notes}
          onChange={(e) => set({ notes: e.target.value })}
        />
      </label>
      <div className="button-row">
        <Button disabled={save.isPending}>{t('finance.saveBudget', 'Save budget')}</Button>
        <Button type="button" variant="outline" onClick={onDone}>
          {t('staffContent.cancel', 'Cancel')}
        </Button>
      </div>
    </form>
  )
}

export function BudgetsPage() {
  const { t } = useTranslation()
  const money = useMoney()
  const date = useFinanceDate()
  const refresh = useFinanceRefresh()
  const [editing, setEditing] = useState(null)
  const budgets = useQuery({
    queryKey: ['finance-budgets'],
    queryFn: () => api('/staff/finance/budgets'),
  })
  const remove = useMutation({
    mutationFn: (id) => api(`/staff/finance/budgets/${id}`, { method: 'DELETE' }),
    onError: (error) => toast.error(error.message),
    onSuccess: (data) => {
      toast.success(data.message)
      refresh()
    },
  })
  return (
    <>
      <PageHeading
        eyebrow={t('finance.eyebrow', 'FINANCE')}
        title={t('nav.budgets', 'Budgets')}
        description={t(
          'finance.budgetsIntro',
          'Set a spending limit per expense category and see how much is used.',
        )}
      >
        {!editing && (
          <Button onClick={() => setEditing('new')}>
            <Plus size={17} aria-hidden="true" /> {t('finance.addBudget', 'Add a budget')}
          </Button>
        )}
      </PageHeading>
      {editing && (
        <BudgetForm
          key={editing === 'new' ? 'new' : editing._id}
          budget={editing === 'new' ? null : editing}
          onDone={() => setEditing(null)}
        />
      )}
      <section className="panel">
        {budgets.isPending ? (
          <Loading />
        ) : budgets.error ? (
          <ErrorState error={budgets.error} />
        ) : budgets.data.length ? (
          <div className="table-scroll">
            <table className="finance-table">
              <thead>
                <tr>
                  <th>{t('finance.budgetName', 'Budget name')}</th>
                  <th>{t('finance.period', 'Period')}</th>
                  <th className="num">{t('finance.budgeted', 'Budget')}</th>
                  <th className="num">{t('finance.spent', 'Spent')}</th>
                  <th className="num">{t('finance.remaining', 'Remaining')}</th>
                  <th>{t('finance.used', 'Used')}</th>
                  <th className="actions" />
                </tr>
              </thead>
              <tbody>
                {budgets.data.map((budget) => (
                  <tr key={budget._id}>
                    <td className="title">
                      <strong>{budget.name}</strong>
                      <small className="muted">{budget.category}</small>
                    </td>
                    <td>
                      {date(budget.periodStart)} – {date(budget.periodEnd)}
                    </td>
                    <td className="num">{money(budget.amount)}</td>
                    <td className="num">{money(budget.spent)}</td>
                    <td className={`num ${budget.remaining < 0 ? 'finance-out' : ''}`}>
                      {money(budget.remaining)}
                    </td>
                    <td style={{ minWidth: 120 }}>
                      <div
                        className={`budget-track ${budget.percent >= 100 ? 'over' : budget.percent >= 80 ? 'warn' : 'ok'}`}
                      >
                        <span style={{ width: `${Math.min(100, budget.percent)}%` }} />
                      </div>
                      <small className="muted">{budget.percent}%</small>
                    </td>
                    <td className="actions">
                      <div className="inventory-actions">
                        <button
                          type="button"
                          className="inventory-action edit"
                          aria-label={t('staffContent.edit', 'Edit')}
                          onClick={() => setEditing(budget)}
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="inventory-action delete"
                          aria-label={t('finance.delete', 'Delete')}
                          onClick={() => {
                            if (
                              window.confirm(
                                t('finance.confirmDeleteBudget', 'Delete this budget?'),
                              )
                            )
                              remove.mutate(budget._id)
                          }}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title={t('finance.noBudgets', 'No active budgets.')} />
        )}
      </section>
    </>
  )
}

// ── 6. Financial Transactions (everything) ────────────────────────────────────
export function TransactionsPage() {
  const { t } = useTranslation()
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  return (
    <>
      <PageHeading
        eyebrow={t('finance.eyebrow', 'FINANCE')}
        title={t('nav.transactions', 'Financial Transactions')}
        description={t(
          'finance.transactionsIntro',
          'Every income and expense entry. Wrong entries are voided, never deleted.',
        )}
      >
        <div className="button-row">
          <select
            aria-label={t('finance.type', 'Type')}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">{t('finance.allTypes', 'Income & expenses')}</option>
            <option value="income">{t('finance.income', 'Income')}</option>
            <option value="expense">{t('finance.expense', 'Expense')}</option>
          </select>
          <select
            aria-label={t('finance.status', 'Status')}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">{t('finance.allEntries', 'All entries')}</option>
            <option value="posted">{t('finance.posted', 'Posted')}</option>
            <option value="void">{t('finance.voided', 'Void')}</option>
          </select>
        </div>
      </PageHeading>
      <TransactionTable filters={`type=${type}&status=${status}`} />
    </>
  )
}

// ── 7. Cashbook ───────────────────────────────────────────────────────────────
export function CashbookPage() {
  const { t } = useTranslation()
  const money = useMoney()
  const date = useFinanceDate()
  const monthStart = today().slice(0, 8) + '01'
  const [from, setFrom] = useState(monthStart)
  const [to, setTo] = useState(today())
  const [method, setMethod] = useState('')
  const book = useQuery({
    queryKey: ['finance-cashbook', from, to, method],
    queryFn: () => api(`/staff/finance/cashbook?from=${from}&to=${to}&method=${method}`),
  })
  return (
    <>
      <PageHeading
        eyebrow={t('finance.eyebrow', 'FINANCE')}
        title={t('nav.cashbook', 'Cashbook')}
        description={t(
          'finance.cashbookIntro',
          'Day-by-day record of money in and out with a running balance.',
        )}
      />
      <section className="panel">
        <div className="table-toolbar finance-toolbar">
          <label className="finance-date-filter">
            {t('finance.from', 'From')}
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="finance-date-filter">
            {t('finance.to', 'To')}
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <label className="finance-date-filter">
            {t('finance.method', 'Payment method')}
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="">{t('finance.allMethods', 'All methods')}</option>
              {methods.map((m) => (
                <option key={m} value={m}>
                  {t(`finance.methods.${m}`, m[0].toUpperCase() + m.slice(1))}
                </option>
              ))}
            </select>
          </label>
        </div>
        {book.isPending ? (
          <Loading />
        ) : book.error ? (
          <ErrorState error={book.error} />
        ) : (
          <>
            <div className="metrics-grid finance-metrics">
              <FinanceTile
                label={t('finance.opening', 'Opening balance')}
                value={money(book.data.opening)}
              />
              <FinanceTile
                label={t('finance.moneyIn', 'Money in')}
                value={money(book.data.income)}
                tone="in"
              />
              <FinanceTile
                label={t('finance.moneyOut', 'Money out')}
                value={money(book.data.expense)}
                tone="out"
              />
              <FinanceTile
                label={t('finance.closing', 'Closing balance')}
                value={money(book.data.closing)}
                tone="balance"
              />
            </div>
            {book.data.rows.length ? (
              <div className="table-scroll">
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>{t('finance.date', 'Date')}</th>
                      <th>{t('finance.details', 'Details')}</th>
                      <th>{t('finance.receipt', 'Receipt / ref.')}</th>
                      <th className="num">{t('finance.moneyIn', 'Money in')}</th>
                      <th className="num">{t('finance.moneyOut', 'Money out')}</th>
                      <th className="num">{t('finance.balanceShort', 'Balance')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {book.data.rows.map((row) => (
                      <tr key={row._id}>
                        <td>{date(row.date)}</td>
                        <td>
                          {row.category}
                          {row.party && <small className="muted">{row.party}</small>}
                        </td>
                        <td>{row.receiptNo || row.reference || '—'}</td>
                        <td className="num finance-in">
                          {row.type === 'income' ? money(row.amount) : ''}
                        </td>
                        <td className="num finance-out">
                          {row.type === 'expense' ? money(row.amount) : ''}
                        </td>
                        <td className="num">
                          <strong>{money(row.balance)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty title={t('finance.noCash', 'No entries in this period.')} />
            )}
          </>
        )}
      </section>
    </>
  )
}

// ── 8. Financial Reports ──────────────────────────────────────────────────────
export function ReportsPage() {
  const { t, i18n } = useTranslation()
  const money = useMoney()
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(thisYear)
  const report = useQuery({
    queryKey: ['finance-report', year],
    queryFn: () => api(`/staff/finance/report?year=${year}`),
  })
  const month = (m) =>
    new Intl.DateTimeFormat(i18n.language, { month: 'long', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2000, m - 1, 1)),
    )
  const exportCsv = () => {
    const data = report.data
    csvDownload(
      `finance-report-${year}.csv`,
      ['Section', 'Item', 'Income', 'Expense', 'Net'],
      [
        ...data.months.map((m) => ['Month', month(m.month), m.income, m.expense, m.net]),
        ...data.byCategory.map((c) => [
          c.type === 'income' ? 'Income category' : 'Expense category',
          c.category,
          c.type === 'income' ? c.total : '',
          c.type === 'expense' ? c.total : '',
          '',
        ]),
        ['Total', String(year), data.income, data.expense, data.net],
      ],
    )
  }
  return (
    <>
      <PageHeading
        eyebrow={t('finance.eyebrow', 'FINANCE')}
        title={t('nav.financeReports', 'Financial Reports')}
        description={t(
          'finance.reportsIntro',
          'Yearly income and expenses, month by month and by category.',
        )}
      >
        <div className="button-row">
          <select
            aria-label={t('finance.year', 'Year')}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {Array.from({ length: 6 }, (_, i) => thisYear - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <Button variant="outline" disabled={!report.data} onClick={exportCsv}>
            <Download size={17} aria-hidden="true" /> {t('finance.exportCsv', 'Export CSV')}
          </Button>
        </div>
      </PageHeading>
      {report.isPending ? (
        <Loading />
      ) : report.error ? (
        <ErrorState error={report.error} />
      ) : (
        <>
          <div className="metrics-grid finance-metrics">
            <FinanceTile
              label={t('finance.totalIncome', 'Total income')}
              value={money(report.data.income)}
              tone="in"
            />
            <FinanceTile
              label={t('finance.totalExpense', 'Total expenses')}
              value={money(report.data.expense)}
              tone="out"
            />
            <FinanceTile
              label={t('finance.net', 'Surplus / deficit')}
              value={money(report.data.net)}
              tone="balance"
            />
            <FinanceTile
              label={t('finance.fundingTotal', 'Donations & funding')}
              value={money(
                (report.data.byStream.donation ?? 0) +
                  (report.data.byStream.grant ?? 0) +
                  (report.data.byStream.sponsorship ?? 0),
              )}
              tone="fund"
            />
          </div>
          <div className="finance-two-col">
            <section className="panel">
              <h2>{t('finance.byMonth', 'By month')}</h2>
              <div className="table-scroll">
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>{t('finance.month', 'Month')}</th>
                      <th className="num">{t('finance.income', 'Income')}</th>
                      <th className="num">{t('finance.expense', 'Expense')}</th>
                      <th className="num">{t('finance.net', 'Surplus / deficit')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.data.months.map((m) => (
                      <tr key={m.month}>
                        <td>{month(m.month)}</td>
                        <td className="num finance-in">{money(m.income)}</td>
                        <td className="num finance-out">{money(m.expense)}</td>
                        <td className={`num ${m.net < 0 ? 'finance-out' : ''}`}>{money(m.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="panel">
              <h2>{t('finance.byCategory', 'By category')}</h2>
              {report.data.byCategory.length ? (
                <div className="table-scroll">
                  <table className="finance-table">
                    <tbody>
                      {report.data.byCategory.map((c) => (
                        <tr key={`${c.type}-${c.category}`}>
                          <td>
                            <span className={`fin-badge ${c.type}`}>
                              {c.type === 'income'
                                ? t('finance.income', 'Income')
                                : t('finance.expense', 'Expense')}
                            </span>
                          </td>
                          <td>
                            {c.category}
                            <small className="muted">
                              {c.count} {t('finance.entries', 'entries')}
                            </small>
                          </td>
                          <td
                            className={`num ${c.type === 'income' ? 'finance-in' : 'finance-out'}`}
                          >
                            {money(c.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty title={t('finance.empty', 'No entries yet.')} />
              )}
            </section>
          </div>
        </>
      )}
    </>
  )
}

// ── 9. Finance Settings ───────────────────────────────────────────────────────
export function FinanceSettingsPage() {
  const { t } = useTranslation()
  const settings = useFinanceSettings()
  if (settings.isPending) return <Loading />
  if (settings.error) return <ErrorState error={settings.error} />
  return <SettingsForm key={settings.data.updatedAt ?? 'new'} initial={settings.data} t={t} />
}

function SettingsForm({ initial, t }) {
  const refresh = useFinanceRefresh()
  const settings = useFinanceSettings()
  const [form, setForm] = useState({
    currency: initial.currency,
    openingBalance: initial.openingBalance,
    openingDate: initial.openingDate ? initial.openingDate.slice(0, 10) : '',
    receiptPrefix: initial.receiptPrefix,
    incomeCategories: initial.incomeCategories.join('\n'),
    expenseCategories: initial.expenseCategories.join('\n'),
    recordFinePayments: initial.recordFinePayments,
  })
  const set = (patch) => setForm({ ...form, ...patch })
  const lines = (text) =>
    text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  const save = useMutation({
    mutationFn: () =>
      api('/staff/finance/settings', {
        method: 'PUT',
        body: body({
          ...form,
          openingBalance: Number(form.openingBalance) || 0,
          openingDate: form.openingDate || null,
          incomeCategories: lines(form.incomeCategories),
          expenseCategories: lines(form.expenseCategories),
        }),
      }),
    onError: (error) => toast.error(error.message, { id: error.message }),
    onSuccess: () => {
      toast.success(t('finance.settingsSaved', 'Finance settings saved.'))
      void settings.refetch()
      refresh()
    },
  })
  return (
    <>
      <PageHeading
        eyebrow={t('finance.eyebrow', 'FINANCE')}
        title={t('nav.financeSettings', 'Finance Settings')}
        description={t(
          'finance.settingsIntro',
          'Currency, opening balance, receipt numbers and categories.',
        )}
      />
      <form
        className="panel finance-form"
        onSubmit={(event) => {
          event.preventDefault()
          save.mutate()
        }}
      >
        <div className="form-grid">
          <label>
            {t('finance.currency', 'Currency')} *
            <Input
              required
              maxLength={10}
              value={form.currency}
              onChange={(e) => set({ currency: e.target.value })}
            />
          </label>
          <label>
            {t('finance.receiptPrefix', 'Receipt number prefix')} *
            <Input
              required
              maxLength={12}
              value={form.receiptPrefix}
              onChange={(e) => set({ receiptPrefix: e.target.value })}
            />
            <small className="muted">
              {t('finance.nextReceipt', 'Next receipt')}: {form.receiptPrefix}-
              {String(initial.nextReceipt).padStart(6, '0')}
            </small>
          </label>
          <label>
            {t('finance.openingBalance', 'Opening balance')}
            <Input
              type="number"
              step="0.01"
              value={form.openingBalance}
              onChange={(e) => set({ openingBalance: e.target.value })}
            />
            <small className="muted">
              {t('finance.openingHint', 'Money the library already held before using this system.')}
            </small>
          </label>
          <label>
            {t('finance.openingDate', 'Opening balance date')}
            <Input
              type="date"
              value={form.openingDate}
              onChange={(e) => set({ openingDate: e.target.value })}
            />
          </label>
          <label>
            {t('finance.incomeCategories', 'Income categories (one per line)')}
            <textarea
              rows={8}
              value={form.incomeCategories}
              onChange={(e) => set({ incomeCategories: e.target.value })}
            />
          </label>
          <label>
            {t('finance.expenseCategories', 'Expense categories (one per line)')}
            <textarea
              rows={8}
              value={form.expenseCategories}
              onChange={(e) => set({ expenseCategories: e.target.value })}
            />
          </label>
        </div>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.recordFinePayments}
            onChange={(e) => set({ recordFinePayments: e.target.checked })}
          />
          {t('finance.recordFines', 'Record fine payments as income automatically')}
        </label>
        <div className="button-row">
          <Button disabled={save.isPending}>
            {save.isPending
              ? t('staffContent.saving', 'Saving…')
              : t('finance.saveSettings', 'Save settings')}
          </Button>
        </div>
      </form>
    </>
  )
}
