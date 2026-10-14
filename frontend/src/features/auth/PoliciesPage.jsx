import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { ErrorState, Loading, PageHeading } from '../../components/common/ui'
import PolicyForm from './PolicyForm'
export default function PoliciesPage() {
  const { t } = useTranslation()
  const policy = useQuery({
    queryKey: ['policies'],
    queryFn: () => api('/staff/policies'),
  })
  return (
    <>
      <PageHeading
        eyebrow={t('ui.policy.eyebrow')}
        title={t('nav.policies')}
        description={t('ui.policy.intro')}
      />
      <section className="panel policy-panel">
        <h2>{t('ui.policy.rules')}</h2>
        {policy.isPending ? (
          <Loading />
        ) : policy.error ? (
          <ErrorState error={policy.error} />
        ) : (
          <PolicyForm policy={policy.data} />
        )}
      </section>
    </>
  )
}
