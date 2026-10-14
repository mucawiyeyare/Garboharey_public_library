import { useTranslation } from 'react-i18next'
import { usePagedList } from '../../hooks/usePagination'
import Pagination from '../../components/common/Pagination'
import { Button } from '../../components/common/primitives/button'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Empty, ErrorState, Loading, Modal, PageHeading } from '../../components/common/ui'
import IssueLoanForm from './components/IssueLoanForm'
import LoanTableRow from './components/LoanTableRow'

export default function CirculationPage() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('active')
  const loans = usePagedList('loans', '/loans', `status=${filter}`)
  const filtered = loans.data

  return (
    <>
      <PageHeading
        eyebrow="Circulation Management"
        title="Circulation & Loans"
        description="View and manage active, overdue, and returned book loans. Renew due dates or process returns."
      >
        <Button className="button" onClick={() => setOpen(true)}>
          <Plus size={18} />
          Issue Book
        </Button>
      </PageHeading>

      <section className="panel">
        <div className="table-toolbar">
          <nav className="tabs inline" aria-label="Circulation filters">
            {[
              { id: 'active', label: 'Active' },
              { id: 'overdue', label: 'Overdue' },
              { id: 'returned', label: 'Returned' },
              { id: 'all', label: 'All' },
            ].map((item) => (
              <button
                type="button"
                className={item.id === filter ? 'active' : ''}
                key={item.id}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <span className="muted">Total: {loans.total}</span>
        </div>

        {loans.isPending ? (
          <Loading />
        ) : loans.error ? (
          <ErrorState error={loans.error} />
        ) : filtered.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Borrower Name</th>
                  <th>Telephone Number</th>
                  <th>Book</th>
                  <th>Shelf</th>
                  <th style={{ textAlign: 'center' }}>Copies</th>
                  <th>Borrowing Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Return Date</th>
                  <th>Source</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((loan) => (
                  <LoanTableRow key={loan._id} loan={loan} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={
              filter === 'active'
                ? 'No active circulations'
                : filter === 'overdue'
                  ? 'No overdue loans'
                  : filter === 'returned'
                    ? 'No returned loans'
                    : 'No circulation records found'
            }
          />
        )}

        <Pagination
          page={loans.page}
          pages={loans.pages}
          total={loans.total}
          setPage={loans.setPage}
        />
      </section>

      <Modal
        title="Issue Book Loan"
        description="Select borrower and book copies to create a new circulation transaction."
        open={open}
        onOpenChange={setOpen}
      >
        {open && <IssueLoanForm onIssued={() => setOpen(false)} />}
      </Modal>
    </>
  )
}
