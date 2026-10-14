import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../../services/api'
import { useAction } from '../../hooks/useAction'
import { Input } from '../../components/common/primitives/input'
import { Button } from '../../components/common/primitives/button'
import { ErrorState, MutationFeedback } from '../../components/common/ui'

// A calendar date (YYYY-MM-DD) in the library's time zone (East Africa Time, UTC+3).
const localDate = (offsetDays = 0) =>
  new Date(Date.now() + offsetDays * 86400000 + 3 * 3600000).toISOString().slice(0, 10)

const BORROWER_TYPES = [
  { id: 'regular', label: 'Regular Borrower', desc: 'No system account required' },
  { id: 'member', label: 'Member', desc: 'Registered system user' },
  { id: 'librarian', label: 'Librarian', desc: 'Staff system user' },
  { id: 'admin', label: 'Admin', desc: 'Administrator system user' },
]

export default function IssueLoanForm({ onIssued }) {
  const { t, i18n } = useTranslation()

  // Borrower state
  const [borrowerType, setBorrowerType] = useState('regular')
  const [borrowerName, setBorrowerName] = useState('')
  const [phone, setPhone] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [memberId, setMemberId] = useState('')

  // Book & copy state
  const [bookSearch, setBookSearch] = useState('')
  const [bookId, setBookId] = useState('')
  const [copyId, setCopyId] = useState('')
  // How many copies of the chosen book the borrower takes
  const [quantity, setQuantity] = useState(1)
  const [returnDate, setReturnDate] = useState('')

  // Query registered users when type is member, librarian, or admin
  const isRegisteredType = borrowerType !== 'regular'
  const registeredUsers = useQuery({
    queryKey: ['staff-borrowers', borrowerType, userSearch],
    queryFn: () =>
      api(
        `/staff/members?role=${borrowerType}&status=active&page=1&limit=50&q=${encodeURIComponent(
          userSearch,
        )}`,
      ),
    enabled: isRegisteredType,
  })

  // Query books
  const books = useQuery({
    queryKey: ['borrow-books', bookSearch],
    queryFn: () => api(`/books?available=true&limit=25&q=${encodeURIComponent(bookSearch)}`),
  })

  // Query available copies for the selected book
  const copies = useQuery({
    queryKey: ['borrow-copies', bookId],
    queryFn: () => api(`/staff/copies?book=${bookId}&status=available&page=1&limit=50`),
    enabled: !!bookId,
  })

  const policy = useQuery({
    queryKey: ['public-policies'],
    queryFn: () => api('/library/policies'),
  })

  const issue = useAction('/loans', 'POST', onIssued)

  const userList = registeredUsers.data?.items ?? []
  const bookList = books.data?.items ?? []
  const copyList = copies.data?.items ?? []

  // Auto-select single book match
  useEffect(() => {
    if (bookList.length === 1 && !bookId) {
      setBookId(bookList[0]._id)
    }
  }, [bookList, bookId])

  // Auto-select first available copy
  useEffect(() => {
    if (copyList.length && !copyList.some((copy) => copy._id === copyId)) {
      setCopyId(copyList[0]._id)
    }
  }, [copyList, copyId])

  // Default return date based on policy
  useEffect(() => {
    if (!returnDate && policy.data) {
      setReturnDate(localDate(policy.data.loanDays || 14))
    }
  }, [policy.data, returnDate])

  // Handle selecting a registered user
  const handleUserSelect = (selectedId) => {
    setMemberId(selectedId)
    const selectedUser = userList.find((u) => u._id === selectedId)
    if (selectedUser) {
      setBorrowerName(selectedUser.name || '')
      setPhone(selectedUser.phone || '')
    }
  }

  // Handle changing borrower type
  const handleTypeChange = (newType) => {
    setBorrowerType(newType)
    setMemberId('')
    setUserSearch('')
    if (newType === 'regular') {
      // Keep manual inputs
    } else {
      setBorrowerName('')
      setPhone('')
    }
  }

  const now = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date())

  const maxCopies = Math.max(1, copyList.length)
  const count = Math.min(Math.max(1, Number(quantity) || 1), maxCopies)

  const handleSubmit = (event) => {
    event.preventDefault()
    // The chosen copy first, then other available copies of the same book.
    const copyIds = [copyId, ...copyList.map((copy) => copy._id).filter((id) => id !== copyId)].slice(
      0,
      count,
    )
    issue.mutate({
      borrowerType,
      borrowerName: borrowerName.trim(),
      phone: phone.trim(),
      memberId: isRegisteredType && memberId ? memberId : null,
      copyId: count > 1 ? copyIds : copyId,
      returnDate,
    })
  }

  const isFormValid =
    copyId &&
    borrowerName.trim().length > 0 &&
    phone.trim().length > 0 &&
    (!isRegisteredType || memberId)

  return (
    <form className="form-stack" onSubmit={handleSubmit}>
      {/* 1. Borrower Type Selection */}
      <fieldset>
        <legend>Borrower Type</legend>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '8px',
            marginBottom: '10px',
          }}
        >
          {BORROWER_TYPES.map((type) => {
            const isSelected = borrowerType === type.id
            return (
              <button
                type="button"
                key={type.id}
                onClick={() => handleTypeChange(type.id)}
                className={`button ${isSelected ? '' : 'secondary'}`}
                style={{
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                }}
              >
                <strong style={{ fontSize: '13px' }}>{type.label}</strong>
                <small className="muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                  {type.desc}
                </small>
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* 2. Registered Account Picker (if Member, Librarian, or Admin) */}
      {isRegisteredType && (
        <fieldset>
          <legend>{`Select Registered ${borrowerType.charAt(0).toUpperCase() + borrowerType.slice(1)} Account`}</legend>
          <Input
            aria-label={`Search ${borrowerType}s`}
            placeholder={`Search ${borrowerType} by name or email...`}
            value={userSearch}
            onChange={(e) => {
              setUserSearch(e.target.value)
              setMemberId('')
            }}
          />
          <select
            aria-label={`Select ${borrowerType}`}
            required
            value={memberId}
            onChange={(e) => handleUserSelect(e.target.value)}
            style={{ marginTop: '8px' }}
          >
            <option value="">{`-- Choose ${borrowerType} account --`}</option>
            {userList.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name} ({user.email}) {user.phone ? `· ${user.phone}` : ''}
              </option>
            ))}
          </select>
          {registeredUsers.isPending && (
            <small className="muted" style={{ display: 'block', marginTop: '4px' }}>
              Loading registered accounts...
            </small>
          )}
        </fieldset>
      )}

      {/* 3. Borrower Contact Information */}
      <fieldset>
        <legend>Borrower Contact Details</legend>
        <div className="form-grid">
          <label>
            <strong>Name of Borrower *</strong>
            <Input
              required
              placeholder="Full name of the borrower"
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
            />
          </label>
          <label>
            <strong>Telephone Number *</strong>
            <Input
              required
              type="tel"
              placeholder="e.g. +252 61 234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
        </div>
      </fieldset>

      {/* 4. Book & Copy Selection */}
      <fieldset>
        <legend>{t('member.book', 'Book Selection')}</legend>
        <Input
          aria-label={t('ui.issue.searchBooks', 'Search books')}
          placeholder="Search by title, author, or ISBN..."
          value={bookSearch}
          onChange={(event) => {
            setBookSearch(event.target.value)
            setBookId('')
            setCopyId('')
          }}
        />
        <select
          aria-label={t('member.book', 'Book')}
          required
          value={bookId}
          onChange={(event) => {
            setBookId(event.target.value)
            setCopyId('')
            setQuantity(1)
          }}
          style={{ marginTop: '8px' }}
        >
          <option value="">{t('ui.issue.selectBook', '-- Select a book --')}</option>
          {bookList.map((book) => (
            <option key={book._id} value={book._id}>
              {book.title} · {book.author} ({book.copies?.available ?? 0} available)
            </option>
          ))}
        </select>

        {bookId && (
          <label style={{ marginTop: '10px', display: 'block' }}>
            <strong>{t('ui.issue.copy', 'Available Copy')}</strong>
            <select
              required
              value={copyId}
              onChange={(event) => setCopyId(event.target.value)}
              style={{ marginTop: '4px' }}
            >
              {copyList.length ? (
                copyList.map((copy) => (
                  <option key={copy._id} value={copy._id}>
                    Barcode: {copy.barcode} · Shelf: {copy.shelf}
                  </option>
                ))
              ) : (
                <option value="">No available copies</option>
              )}
            </select>
          </label>
        )}

        {bookId && copyList.length > 0 && (
          <label style={{ marginTop: '10px', display: 'block' }}>
            <strong>{t('ui.issue.quantity', 'Number of copies borrowed')}</strong>
            <Input
              type="number"
              min={1}
              max={maxCopies}
              required
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              style={{ marginTop: '4px' }}
            />
            <small className="muted">
              {t('ui.issue.quantityHint', {
                count: copyList.length,
                defaultValue: '{{count}} copies of this book are available to lend.',
              })}
            </small>
          </label>
        )}
      </fieldset>

      {/* 5. Borrow Time & Return Date */}
      <div className="form-grid">
        <label>
          {t('ui.issue.borrowTime', 'Borrow Time')}
          <Input value={now} readOnly aria-readonly="true" />
          <small className="muted">{t('ui.issue.borrowTimeHint', 'Recorded automatically by the system')}</small>
        </label>
        <label>
          {t('ui.issue.returnDate', 'Return Date')}
          <Input
            type="date"
            required
            min={localDate(1)}
            max={localDate(365)}
            value={returnDate}
            onChange={(event) => setReturnDate(event.target.value)}
          />
          <small className="muted">
            {t('ui.issue.returnDateHint', { days: policy.data?.loanDays ?? 14 })}
          </small>
        </label>
      </div>

      <MutationFeedback error={issue.error} />

      <Button className="button" disabled={issue.isPending || !isFormValid} style={{ marginTop: '12px' }}>
        {issue.isPending ? 'Confirming Transaction...' : 'Confirm Borrowing Transaction'}
      </Button>
    </form>
  )
}
