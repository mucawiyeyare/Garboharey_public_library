import { Loan } from '../models/Borrowing.js'
import { Notification } from '../models/Notification.js'
import { notice } from '../services/notificationService.js'

const EVERY_MINUTES = 10

// Finds loans whose borrowing time has ended and notifies staff (and the member, if registered).
// Each loan is notified once; `overdueNotifiedAt` records that it was done.
export async function notifyOverdueLoans(now = new Date()) {
  const loans = await Loan.find({ returnedAt: null, dueAt: { $lt: now }, overdueNotifiedAt: null })
    .populate('book', 'title')
    .limit(500)
  for (const loan of loans) {
    // Claim the loan first so two runs never notify twice.
    const claimed = await Loan.updateOne(
      { _id: loan._id, overdueNotifiedAt: null },
      { $set: { overdueNotifiedAt: now, status: 'overdue' } },
    )
    if (!claimed.modifiedCount) continue
    const params = {
      title: loan.book?.title ?? 'a book',
      borrower: loan.borrowerName || 'Borrower',
      phone: loan.phone || '',
      due: loan.dueAt.toISOString().slice(0, 10),
    }
    await Notification.create({
      audience: 'staff',
      loan: loan._id,
      ...notice('staffLoanOverdue', params),
    })
    if (loan.member)
      await Notification.create({
        audience: 'member',
        member: loan.member,
        loan: loan._id,
        ...notice('loanOverdue', params),
      })
  }
  return loans.length
}

export function startOverdueJob() {
  const run = () =>
    notifyOverdueLoans().catch((error) => console.error('Overdue check failed:', error.message))
  void run()
  return setInterval(run, EVERY_MINUTES * 60 * 1000)
}
