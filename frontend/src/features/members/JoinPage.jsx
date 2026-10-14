import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { api, body } from '../../services/api'
import { Input } from '../../components/common/primitives/input'
import { Button } from '../../components/common/primitives/button'
import { ContentHeading, Paragraphs } from '../catalog/ContentPage'
import { usePublicContent } from '../catalog/usePublicContent'
import MembershipRequirements, { RequirementsAgreement } from './MembershipRequirements'
import '../catalog/content.css'

export default function JoinPage() {
  const { t, i18n } = useTranslation()
  const [reference, setReference] = useState('')
  const info = usePublicContent('joininfo')
  const apply = useMutation({
    mutationFn: (values) => api('/library/applications', { method: 'POST', body: body(values) }),
    onError: (error) => toast.error(error.message, { id: error.message, duration: 7000 }),
  })
  const lookup = useMutation({
    mutationFn: (value) => api(`/library/applications/${value.trim()}`),
    onError: (error) => toast.error(error.message, { id: error.message, duration: 7000 }),
  })
  return (
    <div className="content-page">
      <ContentHeading
        eyebrow={t('nav.join').toUpperCase()}
        title={t('join.title')}
        intro={t('join.intro')}
      />
      <div className="container page">
        {/* Shuruudaha Xubinnimada Maktabadda - Professional Cards Above Form */}
        <MembershipRequirements />

        <div className="join-layout" style={{ marginTop: '28px' }}>
          {info.data?.length > 0 && (
            <section className="content-sections" aria-label={t('join.requirements')}>
              {info.data.map((item) => (
                <article key={item._id}>
                  <h2>{item.title}</h2>
                  <Paragraphs text={item.body} />
                </article>
              ))}
            </section>
          )}
          {apply.isSuccess ? (
            <section className="join-status" role="status">
              <h2>
                {t('join.statusLabel')}: <strong>{t('join.pending')}</strong>
              </h2>
              <p>{t('join.confirmation')}</p>
              <p className="muted">
                {t('join.reference')}: {apply.data.reference}
              </p>
            </section>
          ) : (
            <form
              className="form-stack join-form"
              onSubmit={(event) => {
                event.preventDefault()
                apply.mutate({
                  ...Object.fromEntries(new FormData(event.currentTarget)),
                  lang: i18n.language,
                })
              }}
            >
              <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px' }}>
                  {t('join.formTitle', 'Foomka Codsiga Xubinnimada')}
                </h3>
                <p className="muted" style={{ fontSize: '13px', margin: 0 }}>
                  {t('join.formSubtitle', 'Buuxi xogtaada hoose si aad u codsato xubinnimada maktabadda.')}
                </p>
              </div>
              <label>
                {t('join.fullName')}
                <Input name="fullName" autoComplete="name" required minLength={2} maxLength={100} />
              </label>
            <div className="form-grid">
              <label>
                {t('join.phone')}
                <Input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  minLength={5}
                  maxLength={30}
                />
              </label>
              <label>
                {t('join.email')}
                <Input name="email" type="email" autoComplete="email" maxLength={254} />
              </label>
            </div>
            <label>
              {t('join.address')}
              <Input name="address" autoComplete="street-address" maxLength={200} />
            </label>
            <div className="form-grid">
              <label>
                {t('join.dob')}
                <Input name="dateOfBirth" type="date" />
              </label>
              <label>
                {t('join.contact')}
                <select name="preferredContact" defaultValue="phone">
                  <option value="phone">{t('join.byPhone')}</option>
                  <option value="email">{t('join.byEmail')}</option>
                </select>
              </label>
            </div>
            <small className="muted">{t('join.privacy')}</small>
            <RequirementsAgreement />
            <Button disabled={apply.isPending}>
              {apply.isPending ? t('join.sending') : t('join.submit')}
            </Button>
            <p className="auth-switch">
              {t('join.haveAccount')}{' '}
              <Link className="text-link" to="/login">
                {t('nav.signIn')}
              </Link>
            </p>
          </form>
        )}
        <form
          className="form-stack join-form"
          onSubmit={(event) => {
            event.preventDefault()
            lookup.mutate(reference)
          }}
        >
          <h2>{t('join.lookupTitle')}</h2>
          <label>
            {t('join.lookupLabel')}
            <Input
              value={reference}
              required
              pattern="[0-9a-fA-F]{24}"
              onChange={(event) => setReference(event.target.value)}
            />
          </label>
          <Button disabled={lookup.isPending}>{t('join.lookupButton')}</Button>
          {lookup.isSuccess && (
            <p role="status">
              {t('join.statusLabel')}: <strong>{t(`join.${lookup.data.status}`)}</strong>
            </p>
          )}
        </form>
        </div>
      </div>
    </div>
  )
}
