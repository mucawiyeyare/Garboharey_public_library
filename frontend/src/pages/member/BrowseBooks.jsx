import { useState, useEffect } from 'react'
import { BookCover } from './components/BookCover'
import { Button } from '../../components/common/primitives/button'
import { Input } from '../../components/common/primitives/input'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft, Bookmark, CheckCircle2, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthProvider'
import { useAction } from '../../hooks/useAction'
import { browsePath, useArea } from '../../hooks/useArea'
import { ErrorState, Loading, MutationFeedback, Status, Modal } from '../../components/common/ui'

// Local calendar date `days` from today, formatted for <input type="date">.
const dateInput = (days) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}
export function BookDetails() {
  const area = useArea()
  const backTo = browsePath(area)
  const { t, i18n } = useTranslation()
  const { bookId } = useParams()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [reserveModalOpen, setReserveModalOpen] = useState(false)
  const [borrowerName, setBorrowerName] = useState('')
  const [phone, setPhone] = useState('')
  const [numberOfCopies, setNumberOfCopies] = useState(1)
  const [notes, setNotes] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [reservationSuccess, setReservationSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [reserveError, setReserveError] = useState(null)
  const [hasPendingReservation, setHasPendingReservation] = useState(false)

  if (!bookId) {
    return <Navigate to={backTo} replace />
  }

  // Check locally saved pending reservations for guest borrowers
  useEffect(() => {
    try {
      const savedPending = JSON.parse(localStorage.getItem('pending_reservations') || '{}')
      if (savedPending[bookId]) {
        setHasPendingReservation(true)
      }
    } catch {
      // ignore JSON errors
    }
  }, [bookId])

  const book = useQuery({
    queryKey: ['book', bookId, i18n.language],
    queryFn: () => api(`/books/${bookId}?lang=${i18n.language}`),
  })

  const saved = useQuery({
    queryKey: ['saved'],
    queryFn: () => api('/me/saved'),
    enabled: !!user,
  })

  const holds = useQuery({
    queryKey: ['reservations', 'mine'],
    queryFn: () => api('/reservations?scope=mine'),
    enabled: !!user,
  })

  const isSaved = saved.data?.some((item) => item._id === bookId)
  const existingHold = holds.data?.find(
    (item) => item.book?._id === bookId && ['pending', 'waiting', 'accepted', 'approved'].includes(item.status),
  )

  const isPendingApproval = hasPendingReservation || existingHold?.status === 'pending'
  const isAvailableToReserve = (book.data?.copies?.available ?? 0) > 0

  const save = useAction(`/me/saved/${bookId}`, isSaved ? 'DELETE' : 'PUT')

  if (book.isPending) return <Loading />
  if (book.error)
    return (
      <div className="container page">
        <ErrorState error={book.error} />
        <Link to={backTo}>{t('book.back')}</Link>
      </div>
    )

  const handleOpenReserve = () => {
    if (user) {
      if (!borrowerName) setBorrowerName(user.name || '')
      if (!phone) setPhone(user.phone || '')
    }
    setReservationSuccess(false)
    setReserveError(null)
    setNumberOfCopies(1)
    setReserveModalOpen(true)
  }

  const handleReserveSubmit = async (e) => {
    e.preventDefault()
    if (!borrowerName.trim()) {
      setReserveError('Borrower Name is required.')
      return
    }
    if (!phone.trim()) {
      setReserveError('Telephone Number is required.')
      return
    }
    const copiesNum = parseInt(numberOfCopies, 10)
    if (isNaN(copiesNum) || copiesNum < 1) {
      setReserveError('Number of copies must be at least 1.')
      return
    }
    if (copiesNum > (book.data?.copies?.available ?? 0)) {
      setReserveError(`Only ${book.data?.copies?.available ?? 0} copy/copies currently available.`)
      return
    }

    if (!returnDate) {
      setReserveError('Return date is required.')
      return
    }

    setSubmitting(true)
    setReserveError(null)
    try {
      await api('/reservations', {
        method: 'POST',
        body: JSON.stringify({
          bookId,
          name: borrowerName.trim(),
          phone: phone.trim(),
          numberOfCopies: copiesNum,
          returnDate,
          notes: notes.trim(),
        }),
      })

      // Record pending reservation so borrower cannot submit another while pending
      setHasPendingReservation(true)
      try {
        const savedPending = JSON.parse(localStorage.getItem('pending_reservations') || '{}')
        savedPending[bookId] = {
          name: borrowerName.trim(),
          phone: phone.trim(),
          copies: copiesNum,
          at: new Date().toISOString(),
        }
        localStorage.setItem('pending_reservations', JSON.stringify(savedPending))
      } catch {
        // ignore storage errors
      }

      setReservationSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['book', bookId] })
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    } catch (err) {
      setReserveError(err.message || 'Failed to submit reservation')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={area ? '' : 'container page'}>
      <Link className="text-link back-link" to={backTo}>
        <ArrowLeft size={17} />
        {t('book.back')}
      </Link>
      <div className="book-details">
        <BookCover book={book.data} large />
        <div>
          <p className="eyebrow">{book.data.categoryName ?? book.data.genre}</p>
          <h1>{book.data.title}</h1>
          <p className="book-author">{t('book.by', { author: book.data.author })}</p>
          <Status value={book.data.copies?.available ? 'available' : 'on_loan'} />
          <p className="book-description">{book.data.description || t('book.ask')}</p>

          <dl className="book-facts">
            <div>
              <dt>Total Copies</dt>
              <dd>{book.data.copies?.total ?? 0}</dd>
            </div>
            <div>
              <dt>Available Copies</dt>
              <dd>
                <strong style={{ color: book.data.copies?.available ? 'var(--accent)' : 'var(--danger)' }}>
                  {book.data.copies?.available ?? 0}
                </strong>
              </dd>
            </div>
            <div>
              <dt>Pending Reservation</dt>
              <dd>
                <span style={{ color: book.data.copies?.reserved ? '#b45309' : 'var(--muted)' }}>
                  {book.data.copies?.reserved ?? 0}
                </span>
              </dd>
            </div>
            <div>
              <dt>{t('book.isbn')}</dt>
              <dd>{book.data.isbn}</dd>
            </div>
            <div>
              <dt>{t('book.published')}</dt>
              <dd>{book.data.year}</dd>
            </div>
            {book.data.publisherName && (
              <div>
                <dt>{t('book.publisher')}</dt>
                <dd>{book.data.publisherName}</dd>
              </div>
            )}
            <div>
              <dt>{t('book.language')}</dt>
              <dd>{t(`catalog.languages.${book.data.language ?? 'en'}`)}</dd>
            </div>
            {book.data.edition && (
              <div>
                <dt>{t('book.edition')}</dt>
                <dd>{book.data.edition}</dd>
              </div>
            )}
          </dl>

          {isPendingApproval && (
            <div
              style={{
                background: '#fef3c7',
                border: '1px solid #fde68a',
                color: '#92400e',
                borderRadius: '8px',
                padding: '12px 16px',
                margin: '16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Clock size={20} color="#b45309" />
              <div>
                <strong>Reservation Pending Approval</strong>
                <p style={{ margin: '2px 0 0', fontSize: '13px' }}>
                  Your reservation has been sent to the Admin and Librarian. Please wait for approval.
                </p>
              </div>
            </div>
          )}

          <div className="button-row">
            <Button
              className="button"
              disabled={isPendingApproval || !isAvailableToReserve}
              onClick={handleOpenReserve}
            >
              {isPendingApproval
                ? 'Reservation Pending'
                : !isAvailableToReserve
                  ? 'No Copies Available'
                  : 'Reserve Now'}
            </Button>
            {user && (
              <Button
                className="button secondary"
                disabled={save.isPending}
                onClick={() => save.mutate(undefined)}
              >
                <Bookmark size={17} fill={isSaved ? 'currentColor' : 'none'} />
                {isSaved ? t('book.unsave') : t('book.save')}
              </Button>
            )}
          </div>

          <MutationFeedback error={save.error} />

        </div>
      </div>

      <Modal
        title={`Reserve Book: ${book.data.title}`}
        description="Enter your reservation details to request copies."
        open={reserveModalOpen}
        onOpenChange={setReserveModalOpen}
      >
        {reservationSuccess ? (
          <div style={{ textAlign: 'center', padding: '24px 8px' }}>
            <CheckCircle2 size={48} color="var(--accent)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 8px' }}>Reservation Sent</h3>
            <p style={{ margin: '0 0 16px', fontSize: '15px', color: 'var(--text)' }}>
              <strong>Your reservation has been sent to the Admin and Librarian. Please wait for approval.</strong>
            </p>
            <p className="muted" style={{ fontSize: '13px', margin: '0 0 20px' }}>
              The requested {numberOfCopies} copy/copies have been set aside as Pending/Reserved.
            </p>
            <Button
              className="button"
              onClick={() => {
                setReserveModalOpen(false)
                setReservationSuccess(false)
              }}
            >
              Close
            </Button>
          </div>
        ) : (
          <form className="form-stack" onSubmit={handleReserveSubmit} style={{ marginTop: '16px' }}>
            <label>
              <strong>1. Borrower Name *</strong>
              <Input
                required
                type="text"
                placeholder="Enter borrower's name"
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
              />
            </label>
            <label>
              <strong>2. Telephone Number *</strong>
              <Input
                required
                type="tel"
                placeholder="Enter telephone number (e.g. +252 61 234 5678)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>
            <label>
              <strong>3. Number of Copies Needed *</strong>
              <Input
                required
                type="number"
                min="1"
                max={book.data.copies?.available ?? 1}
                value={numberOfCopies}
                onChange={(e) => setNumberOfCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
              <small className="muted" style={{ display: 'block', marginTop: '4px' }}>
                Maximum available to reserve: {book.data.copies?.available ?? 0} copies.
              </small>
            </label>
            <label>
              <strong>4. Return Date *</strong>
              <Input
                required
                type="date"
                min={dateInput(1)}
                max={dateInput(365)}
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
              <small className="muted" style={{ display: 'block', marginTop: '4px' }}>
                The date you will bring the book(s) back to the library.
              </small>
            </label>
            <label>
              <span className="muted">Notes (optional)</span>
              <Input
                type="text"
                placeholder="Any special notes for the librarian"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>

            {reserveError && (
              <p className="danger-text" style={{ fontSize: '13px', margin: '4px 0' }}>
                {reserveError}
              </p>
            )}

            <div className="button-row" style={{ marginTop: '16px' }}>
              <Button
                type="submit"
                className="button"
                disabled={submitting || !borrowerName.trim() || !phone.trim() || (book.data.copies?.available ?? 0) < 1}
              >
                {submitting ? 'Sending Request...' : 'Reserve Now'}
              </Button>
              <Button
                type="button"
                className="button secondary"
                onClick={() => setReserveModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default BookDetails
