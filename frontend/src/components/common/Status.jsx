import { useTranslation } from 'react-i18next'
const good = ['active', 'available', 'returned', 'fulfilled', 'ready', 'paid', 'approved']
const bad = ['overdue', 'suspended', 'retired', 'damaged', 'lost', 'expired', 'outstanding', 'rejected', 'cancelled']
const warn = ['pending', 'waiting']
export function Status({ value }) {
  const { t } = useTranslation()
  const cls = good.includes(value) ? 'good' : bad.includes(value) ? 'bad' : warn.includes(value) ? 'warn' : ''
  return (
    <span className={`status ${cls}`}>
      {t(`status.${value}`, { defaultValue: value?.replaceAll('_', ' ') ?? '' })}
    </span>
  )
}
