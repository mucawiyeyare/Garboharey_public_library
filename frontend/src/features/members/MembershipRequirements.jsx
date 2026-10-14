import { useTranslation } from 'react-i18next'
import { CalendarCheck, Wallet } from 'lucide-react'

// Conditions every applicant must accept; shown above the membership form.
export default function MembershipRequirements({ sticky = false }) {
  const { t } = useTranslation()
  const items = [
    [Wallet, 'fee', 'Pay the required membership fee', 'The member must pay the required library membership fee.'],
    [CalendarCheck, 'events', 'Participate in library events', 'The member is expected to participate in library events and activities.'],
  ]
  return (
    <section
      className={`membership-requirements${sticky ? ' sticky' : ''}`}
      aria-labelledby="membership-requirements-title"
    >
      <h3 id="membership-requirements-title">
        {t('join.requirementsTitle', 'Membership requirements')}
      </h3>
      <p className="muted">
        {t('join.requirementsIntro', 'Before you apply, please note that every member must:')}
      </p>
      <ol>
        {items.map(([Icon, key, title, text]) => (
          <li key={key}>
            <Icon size={18} aria-hidden="true" />
            <div>
              <strong>{t(`join.req.${key}Title`, title)}</strong>
              <span>{t(`join.req.${key}Text`, text)}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

// Required tick box confirming the applicant accepts the requirements (not sent to the API).
export function RequirementsAgreement() {
  const { t } = useTranslation()
  return (
    <label className="checkbox-row membership-agree">
      <input type="checkbox" required />
      {t('join.agree', 'I understand and accept the membership requirements above.')}
    </label>
  )
}
