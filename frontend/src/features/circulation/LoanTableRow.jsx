import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { formatDate } from '../../utils/formatDate'
import { Button } from '../../components/common/primitives/button'
import { Input } from '../../components/common/primitives/input'
import { Modal, Status } from '../../components/common/ui'
import { api } from '../../services/api'
import { toast } from 'sonner'
import { Calendar, RotateCcw, Check } from 'lucide-react'

export default function LoanTableRow({ loan }) {
  const queryClient = useQueryClient()
  const [returnOpen, setReturnOpen] = useState(false)
  const [renewOpen, setRenewOpen] = useState(false)
  const [updatedDueDate, setUpdatedDueDate] = useState('')
  const [condition, setCondition] = useState('good')
  const [returnNotes, setReturnNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const isReturned = !!loan.returnedAt
  const isOverdue = !isReturned && new Date(loan.dueAt) < new Date()
  const borrowerDisplay = loan.borrowerName || loan.member?.name || 'Borrower'
  const phoneDisplay = loan.phone || loan.member?.phone || '—'
  const copiesCount = loan.numberOfCopies || loan.copies?.length || 1

  const handleOpenRenew = () => {
    // Default new due date to 14 days after current due date
    const current = new Date(loan.dueAt)
    const next = new Date(current.getTime() + 14 * 86400000)
    setUpdatedDueDate(next.toISOString().slice(0, 10))
    setRenewOpen(true)
  }

  const handleRenewSave = async (e) => {
    e.preventDefault()
    if (!updatedDueDate) {
      toast.error('Please select an updated due date.')
      return
    }
    setLoading(true)
    try {
      await api(`/loans/${loan._id}/renew`, {
        method: 'POST',
        body: JSON.stringify({ updatedDueDate }),
      })
      toast.success(`Circulation renewed! Updated Due Date: ${updatedDueDate}`)
      setRenewOpen(false)
      queryClient.invalidateQueries({ queryKey: ['loans'] })
    } catch (err) {
      toast.error(err.message || 'Failed to renew circulation')
    } finally {
      setLoading(false)
    }
  }

  const handleReturnSubmit = async () => {
    setLoading(true)
    try {
      await api(`/loans/${loan._id}/return`, {
        method: 'POST',
        body: JSON.stringify({ condition, notes: returnNotes }),
      })
      toast.success(`Book returned! ${copiesCount} copy/copies added back to Available Copies.`)
      setReturnOpen(false)
      queryClient.invalidateQueries({ queryKey: ['loans'] })
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['staff-copies'] })
    } catch (err) {
      toast.error(err.message || 'Failed to record return')
    } finally {
      setLoading(false)
    }
  }

  const sourceLabel =
    loan.source === 'reservation'
      ? 'Reservation'
      : loan.source === 'admin'
        ? 'Admin'
        : loan.source === 'librarian'
          ? 'Librarian'
          : 'Staff'

  return (
    <tr>
      {/* 1. Borrower Name */}
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <strong>{borrowerDisplay}</strong>
          <span
            className="status"
            style={{
              fontSize: '11px',
              padding: '1px 5px',
              textTransform: 'capitalize',
            }}
          >
            {loan.borrowerType || (loan.member ? 'member' : 'regular')}
          </span>
        </div>
      </td>

      {/* 2. Telephone Number */}
      <td>
        <span>{phoneDisplay}</span>
      </td>

      {/* 3. Book */}
      <td>
        <strong>{loan.book?.title || 'Unknown Title'}</strong>
        <small className="muted" style={{ display: 'block' }}>
          {loan.book?.author || ''}
        </small>
      </td>

      {/* 4. Number of Copies */}
      <td style={{ textAlign: 'center' }}>
        <strong>{copiesCount}</strong>
      </td>

      {/* 5. Borrowing Date */}
      <td>
        <span>{formatDate(loan.borrowingDate || loan.createdAt)}</span>
      </td>

      {/* 6. Due Date */}
      <td>
        <span style={{ color: isOverdue ? 'var(--danger)' : 'inherit', fontWeight: isOverdue ? 600 : 400 }}>
          {formatDate(loan.dueAt)}
        </span>
        {isOverdue && (
          <small className="danger-text" style={{ display: 'block', fontSize: '11px' }}>
            Overdue
          </small>
        )}
      </td>

      {/* 7. Status */}
      <td>
        <Status value={isReturned ? 'returned' : isOverdue ? 'overdue' : 'active'} />
      </td>

      {/* 8. Return Date */}
      <td>
        <span>{loan.returnedAt ? formatDate(loan.returnedAt) : '—'}</span>
      </td>

      {/* 9. Source */}
      <td>
        <span
          className="status"
          style={{
            fontSize: '11px',
            background: loan.source === 'reservation' ? '#e0e7ff' : '#f1f5f9',
            color: loan.source === 'reservation' ? '#3730a3' : '#475569',
          }}
        >
          {sourceLabel}
        </span>
      </td>

      {/* 10. Actions */}
      <td>
        <div className="button-row" style={{ gap: '6px' }}>
          {!isReturned ? (
            <>
              <Button
                className="button secondary small"
                disabled={loading}
                onClick={handleOpenRenew}
                title="Renew Due Date"
              >
                <Calendar size={13} style={{ marginRight: '3px' }} />
                Renew
              </Button>
              <Button
                className="button secondary small"
                disabled={loading}
                onClick={() => setReturnOpen(true)}
                title="Return Book"
              >
                <Check size={13} style={{ marginRight: '3px' }} />
                Return
              </Button>
            </>
          ) : (
            <span className="muted" style={{ fontSize: '12px' }}>
              Returned
            </span>
          )}
        </div>

        {/* Renew Modal */}
        <Modal
          title="Renew Borrowed Book"
          description={`Update the circulation due date for "${loan.book?.title}".`}
          open={renewOpen}
          onOpenChange={setRenewOpen}
        >
          <form className="form-stack" onSubmit={handleRenewSave} style={{ paddingTop: '10px' }}>
            <p style={{ margin: '0 0 10px', fontSize: '14px' }}>
              Borrower: <strong>{borrowerDisplay}</strong> ({phoneDisplay})
            </p>
            <div style={{ background: 'var(--soft)', padding: '10px 14px', borderRadius: '6px', marginBottom: '12px' }}>
              <span className="muted" style={{ fontSize: '13px' }}>Current Due Date:</span>
              <strong style={{ display: 'block', fontSize: '15px' }}>{formatDate(loan.dueAt)}</strong>
            </div>

            <label>
              <strong>Updated Due Date *</strong>
              <Input
                type="date"
                required
                value={updatedDueDate}
                onChange={(e) => setUpdatedDueDate(e.target.value)}
                style={{ marginTop: '4px' }}
              />
              <small className="muted" style={{ display: 'block', marginTop: '4px' }}>
                Select the new due date for this active circulation.
              </small>
            </label>

            <div className="button-row" style={{ marginTop: '16px' }}>
              <Button type="submit" className="button" disabled={loading || !updatedDueDate}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
              <Button type="button" className="button secondary" onClick={() => setRenewOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Modal>

        {/* Return Modal */}
        <Modal
          title="Return Book"
          description={`Record the return of "${loan.book?.title}" and return ${copiesCount} copy/copies to available inventory.`}
          open={returnOpen}
          onOpenChange={setReturnOpen}
        >
          <div style={{ paddingTop: '10px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '14px' }}>
              Borrower: <strong>{borrowerDisplay}</strong> ({phoneDisplay}) · <strong>{copiesCount} copies</strong>
            </p>
            <label style={{ display: 'block', marginBottom: '12px' }}>
              <span className="muted" style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                Return Condition
              </span>
              <select value={condition} onChange={(e) => setCondition(e.target.value)} style={{ width: '100%' }}>
                <option value="good">Good condition</option>
                <option value="damaged">Damaged</option>
                <option value="lost">Lost</option>
              </select>
            </label>
            <label style={{ display: 'block', marginBottom: '16px' }}>
              <span className="muted" style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>
                Return Notes (optional)
              </span>
              <Input
                value={returnNotes}
                placeholder="Optional notes regarding the return"
                onChange={(e) => setReturnNotes(e.target.value)}
              />
            </label>

            <div className="button-row">
              <Button className="button" disabled={loading} onClick={handleReturnSubmit}>
                {loading ? 'Processing...' : 'Confirm Return'}
              </Button>
              <Button className="button secondary" onClick={() => setReturnOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </td>
    </tr>
  )
}
