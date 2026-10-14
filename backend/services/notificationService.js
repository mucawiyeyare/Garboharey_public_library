const templates = {
  borrowed: ({ title, due }) => `You borrowed ${title}. Due ${due}.`,
  fineRecorded: ({ amount, currency, days }) =>
    `A late-return fine of ${amount}${currency ? ' ' + currency : ''} was recorded for a book returned ${days} day(s) late.`,
  fineWaived: () => 'A library fine on your account was waived.',
  reservationReady: ({ title }) =>
    `${title || 'A title you reserved'} is ready for you. Contact the library to collect it.`,
  reservationExpired: () => 'Your reservation expired because it was not collected in time.',
  membershipApproved: () => 'Your membership was approved. Welcome to the library!',
  loanOverdue: ({ title, due }) =>
    `The borrowing time for ${title} ended on ${due}. Please return it to the library.`,
  staffLoanOverdue: ({ title, borrower, phone, due }) =>
    `Borrowing time ended: ${title} — ${borrower}${phone ? ` (${phone})` : ''} was due back on ${due}.`,
}

export const noticeKeys = Object.keys(templates)

export function notice(key, params = {}) {
  const template = templates[key] || (() => 'Library notice')
  return { key, params, message: template(params) }
}

export async function queueEmail(to, subject, text, options = {}) {
  if (!to) return
  console.log(`[EMAIL QUEUED] To: ${to} | Subject: ${subject}`)
  return { success: true }
}

export async function deliverEmails() {
  return true
}
