import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BellRing, CheckCheck } from 'lucide-react'
import { usePagedList } from '../../hooks/usePagination'
import { useAction } from '../../hooks/useAction'
import Pagination from '../../components/common/Pagination'
import { Button } from '../../components/common/primitives/button'
import { Empty, ErrorState, Loading, PageHeading } from '../../components/common/ui'

function NoticeRow({ item }) {
  const { t, i18n } = useTranslation()
  const markRead = useAction(`/staff/notifications/${item._id}`, 'PATCH')
  const date = (value) =>
    value
      ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(value))
      : '—'
  const loan = item.loan
  const returned = !!loan?.returnedAt
  return (
    <article className={`staff-notice${item.read ? '' : ' unread'}`}>
      <BellRing size={18} aria-hidden="true" className="staff-notice-icon" />
      <div className="staff-notice-body">
        <strong>
          {item.key === 'staffLoanOverdue'
            ? t('staffNotices.overdueTitle', 'Borrowing time ended')
            : t('staffNotices.notice', 'Notice')}
        </strong>
        {loan ? (
          <p>
            <b>{loan.book?.title ?? item.params?.title}</b> — {loan.borrowerName || item.params?.borrower}
            {(loan.phone || item.params?.phone) && <> · {loan.phone || item.params?.phone}</>}
            <br />
            <span className="muted">
              {t('staffNotices.due', 'Due')}: {date(loan.dueAt)}
              {returned && <> · {t('staffNotices.returned', 'Returned')} {date(loan.returnedAt)}</>}
            </span>
          </p>
        ) : (
          <p>{item.message}</p>
        )}
        <small className="muted">{date(item.createdAt)}</small>
      </div>
      <div className="staff-notice-actions">
        {loan && !returned && (
          <Link className="button secondary small" to="/staff/circulation">
            {t('staffNotices.open', 'Open loans')}
          </Link>
        )}
        {!item.read && (
          <Button
            size="sm"
            variant="outline"
            disabled={markRead.isPending}
            onClick={() => markRead.mutate(undefined)}
          >
            {t('notice.markRead', 'Mark read')}
          </Button>
        )}
      </div>
    </article>
  )
}

// Staff notifications: loans whose borrowing time has ended, newest first.
export default function StaffNotificationsPage() {
  const { t } = useTranslation()
  const [status, setStatus] = useState('all')
  const list = usePagedList('staff-notifications', '/staff/notifications', `status=${status}`)
  const readAll = useAction('/staff/notifications/read-all', 'POST')
  return (
    <>
      <PageHeading
        title={t('nav.notifications', 'Notifications')}
        description={t(
          'staffNotices.intro',
          'You are notified here when a borrowed book reaches the end of its borrowing time.',
        )}
      >
        <Button variant="outline" disabled={readAll.isPending} onClick={() => readAll.mutate(undefined)}>
          <CheckCheck size={17} aria-hidden="true" />
          {t('staffNotices.readAll', 'Mark all read')}
        </Button>
      </PageHeading>
      <div className="segmented content-tabs" role="group" aria-label={t('nav.notifications', 'Notifications')}>
        {['all', 'unread'].map((value) => (
          <button key={value} type="button" aria-pressed={status === value} onClick={() => setStatus(value)}>
            {value === 'all' ? t('staffNotices.all', 'All') : t('staffNotices.unread', 'Unread')}
          </button>
        ))}
      </div>
      <section className="panel staff-notice-list">
        {list.isPending ? (
          <Loading />
        ) : list.error ? (
          <ErrorState error={list.error} retry={() => void list.refetch()} />
        ) : list.data.length ? (
          list.data.map((item) => <NoticeRow key={item._id} item={item} />)
        ) : (
          <Empty title={t('staffNotices.none', 'No notifications. Everything is on time.')} />
        )}
        <Pagination {...list} />
      </section>
    </>
  )
}
