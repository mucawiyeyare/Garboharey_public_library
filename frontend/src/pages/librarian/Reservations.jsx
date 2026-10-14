import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { usePagedList } from '../../hooks/usePagination'
import Pagination from '../../components/common/Pagination'
import { Button } from '../../components/common/primitives/button'
import { Input } from '../../components/common/primitives/input'
import { formatDate } from '../../utils/formatDate'
import { api } from '../../services/api'
import { toast } from 'sonner'
import { Check, X, Search, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Empty,
  ErrorState,
  Loading,
  PageHeading,
  Status,
  Modal,
} from '../../components/common/ui'

function ReservationRow({ reservation, onActionComplete }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    try {
      await api(`/staff/reservations/${reservation._id}/accept`, { method: 'POST' })
      toast.success(
        `Reservation for "${reservation.book?.title || 'Book'}" accepted! Record automatically added to Circulation List.`,
      )
      onActionComplete()
    } catch (err) {
      toast.error(err.message || 'Failed to accept reservation')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      await api(`/staff/reservations/${reservation._id}/reject`, { method: 'POST' })
      toast.info(`Reservation for "${reservation.book?.title || 'Book'}" rejected. Copies returned to available pool.`)
      setRejectModalOpen(false)
      onActionComplete()
    } catch (err) {
      toast.error(err.message || 'Failed to reject reservation')
    } finally {
      setLoading(false)
    }
  }

  const borrowerDisplay = reservation.borrowerName || reservation.member?.name || 'Unknown Borrower'
  const phoneDisplay = reservation.phone || reservation.member?.phone || 'No phone provided'
  const isMember = !!reservation.member
  const copiesCount = reservation.numberOfCopies || reservation.copies?.length || 1
  const isAccepted = reservation.status === 'accepted' || reservation.status === 'approved'

  return (
    <tr>
      <td>
        <strong>{reservation.book?.title || 'Untitled Book'}</strong>
        <small className="muted">{reservation.book?.author || ''}</small>
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{borrowerDisplay}</span>
          <span
            className="status"
            style={{
              fontSize: '11px',
              padding: '2px 6px',
              background: isMember ? 'var(--accent-soft)' : 'var(--soft)',
              color: isMember ? 'var(--accent)' : 'var(--muted)',
            }}
          >
            {isMember ? reservation.member?.role || 'Member' : 'Regular'}
          </span>
        </div>
      </td>
      <td>
        <span>{phoneDisplay}</span>
      </td>
      <td style={{ textAlign: 'center' }}>
        <strong>{copiesCount}</strong>
      </td>
      <td>
        <span>{formatDate(reservation.createdAt)}</span>
      </td>
      <td>
        <span>{reservation.returnDate ? formatDate(reservation.returnDate) : '—'}</span>
      </td>
      <td>
        <Status value={isAccepted ? 'accepted' : reservation.status} />
      </td>
      <td style={{ maxWidth: '160px' }}>
        <small className="muted">{reservation.notes || '—'}</small>
      </td>
      <td>
        <div className="button-row" style={{ gap: '6px' }}>
          {reservation.status === 'pending' && (
            <>
              <Button
                className="button small"
                disabled={loading}
                onClick={handleApprove}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <Check size={14} />
                Accept
              </Button>
              <Button
                className="button secondary small danger"
                disabled={loading}
                onClick={() => setRejectModalOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <X size={14} />
                Reject
              </Button>
            </>
          )}

          {isAccepted && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link to="/staff/circulation" className="button secondary small" style={{ fontSize: '12px' }}>
                View in Circulation
              </Link>
              <Button
                className="button secondary small danger"
                disabled={loading}
                onClick={() => setRejectModalOpen(true)}
              >
                Reject
              </Button>
            </div>
          )}

          {reservation.status === 'rejected' && (
            <Button
              className="button secondary small"
              disabled={loading}
              onClick={handleApprove}
            >
              Re-accept
            </Button>
          )}
        </div>

        <Modal
          title="Reject Reservation"
          description={`Are you sure you want to reject the reservation for "${reservation.book?.title}" by ${borrowerDisplay}? The ${copiesCount} reserved copies will be returned to the available copies.`}
          open={rejectModalOpen}
          onOpenChange={setRejectModalOpen}
        >
          <div style={{ paddingTop: '12px' }}>
            <p style={{ margin: '0 0 16px', fontSize: '14px' }}>
              Borrower: <strong>{borrowerDisplay}</strong> ({phoneDisplay}) · <strong>{copiesCount} copies</strong>
            </p>
            <div className="button-row">
              <Button
                className="button danger"
                disabled={loading}
                onClick={handleReject}
              >
                {loading ? 'Rejecting...' : 'Confirm Reject'}
              </Button>
              <Button
                className="button secondary"
                onClick={() => setRejectModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </td>
    </tr>
  )
}

export default function LibrarianReservations() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('pending')
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const filterString = `status=${tab}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`
  const reservations = usePagedList('staff-reservations', '/staff/reservations', filterString)

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['staff-reservations'] })
    queryClient.invalidateQueries({ queryKey: ['loans'] })
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearchQuery(search.trim())
  }

  return (
    <>
      <PageHeading
        eyebrow="Circulation Management"
        title="Book Reservations"
        description="Review incoming book reservation requests. When accepted, reservations are automatically added to the Circulation List."
      />

      <section className="panel">
        <div
          className="table-toolbar"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}
        >
          <nav className="tabs inline" aria-label="Reservation status filter">
            {[
              { id: 'pending', label: 'Pending', icon: Clock },
              { id: 'accepted', label: 'Accepted', icon: CheckCircle2 },
              { id: 'rejected', label: 'Rejected', icon: XCircle },
              { id: 'all', label: 'All' },
            ].map((item) => (
              <button
                type="button"
                className={item.id === tab ? 'active' : ''}
                key={item.id}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <form
            onSubmit={handleSearchSubmit}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Input
              placeholder="Search borrower or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '220px' }}
            />
            <Button className="button secondary small" type="submit">
              <Search size={15} />
            </Button>
            {searchQuery && (
              <Button
                className="button secondary small"
                type="button"
                onClick={() => {
                  setSearch('')
                  setSearchQuery('')
                }}
              >
                Clear
              </Button>
            )}
          </form>
        </div>

        {reservations.isPending ? (
          <Loading />
        ) : reservations.error ? (
          <ErrorState error={reservations.error} />
        ) : reservations.data.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Borrower</th>
                  <th>Telephone</th>
                  <th style={{ textAlign: 'center' }}>Number of Copies</th>
                  <th>Submitted</th>
                  <th>Return Date</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.data.map((item) => (
                  <ReservationRow
                    key={item._id}
                    reservation={item}
                    onActionComplete={handleRefresh}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={
              tab === 'pending'
                ? 'No pending reservations'
                : tab === 'accepted'
                  ? 'No accepted reservations'
                  : tab === 'rejected'
                    ? 'No rejected reservations'
                    : 'No reservations found'
            }
            description="When users request a reservation for books, they will appear here for staff review. Accepted requests automatically become active circulations."
          />
        )}

        <Pagination
          page={reservations.page}
          pages={reservations.pages}
          total={reservations.total}
          setPage={reservations.setPage}
        />
      </section>
    </>
  )
}
