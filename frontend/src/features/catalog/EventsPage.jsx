import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Plus } from 'lucide-react'
import { api, body } from '../../services/api'
import { Empty, ErrorState, Loading, PageHeading } from '../../components/common/ui'
import { Input } from '../../components/common/primitives/input'
import { Button } from '../../components/common/primitives/button'
import './content.css'

const langs = ['en', 'so', 'ar']
const blank = () => ({
  kind: 'event',
  title: { en: '', so: '', ar: '' },
  body: { en: '', so: '', ar: '' },
  eventDate: '',
  featured: false,
  published: true,
  order: 0,
})
const toForm = (item) => ({
  ...blank(),
  ...item,
  title: { ...blank().title, ...item.title },
  body: { ...blank().body, ...item.body },
  eventDate: item.eventDate ? String(item.eventDate).slice(0, 10) : '',
})

function EventForm({ initial, onDone, onCancel }) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const [event, setEvent] = useState(initial)
  const set = (patch) => setEvent({ ...event, ...patch })
  const save = useMutation({
    mutationFn: ({ _id, kind, title, body: text, eventDate, featured, published, order }) =>
      api(_id ? `/staff/content/${_id}` : '/staff/content', {
        method: _id ? 'PUT' : 'POST',
        body: body({
          kind,
          title,
          body: text,
          eventDate: eventDate || null,
          featured,
          published,
          order,
        }),
      }),
    onError: (error) => toast.error(error.message, { id: error.message, duration: 7000 }),
    onSuccess: () => {
      toast.success(t('events.saved', 'Event saved.'))
      void client.invalidateQueries({ queryKey: ['staff-content'] })
      void client.invalidateQueries({ queryKey: ['public-content'] })
      onDone()
    },
  })
  return (
    <form
      className="panel form-stack"
      onSubmit={(e) => {
        e.preventDefault()
        if (!langs.some((lng) => event.title[lng].trim())) {
          toast.error(t('events.titleRequired', 'Add a title in at least one language.'))
          return
        }
        save.mutate(event)
      }}
    >
      <div className="form-grid">
        <label>
          {t('staffContent.date')}
          <Input
            type="date"
            required
            value={event.eventDate}
            onChange={(e) => set({ eventDate: e.target.value })}
          />
        </label>
      </div>
      {langs.map((lng) => (
        <fieldset key={lng} lang={lng} dir={lng === 'ar' ? 'rtl' : 'ltr'}>
          <legend>{t(`language.${lng}`)}</legend>
          <label>
            {t('staffContent.titleField')}
            <Input
              value={event.title[lng]}
              maxLength={200}
              onChange={(e) => set({ title: { ...event.title, [lng]: e.target.value } })}
            />
          </label>
          <label>
            {t('events.description', 'Description')}
            <textarea
              rows={4}
              value={event.body[lng]}
              maxLength={8000}
              onChange={(e) => set({ body: { ...event.body, [lng]: e.target.value } })}
            />
          </label>
        </fieldset>
      ))}
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={event.featured}
          onChange={(e) => set({ featured: e.target.checked })}
        />
        {t('staffContent.featured')}
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={event.published}
          onChange={(e) => set({ published: e.target.checked })}
        />
        {t('staffContent.published')}
      </label>
      <div className="button-row">
        <Button disabled={save.isPending}>
          {save.isPending ? t('staffContent.saving') : t('staffContent.save')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('staffContent.cancel')}
        </Button>
      </div>
    </form>
  )
}

// "Create event" opens the form straight away; "Manage events" lists, edits and archives them.
export default function EventsPage({ create = false }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const client = useQueryClient()
  const [editing, setEditing] = useState(create ? blank() : null)
  const list = useQuery({
    queryKey: ['staff-content', 'event'],
    queryFn: () => api('/staff/content?kind=event'),
    enabled: !create,
  })
  const archive = useMutation({
    mutationFn: (id) => api(`/staff/content/${id}`, { method: 'DELETE' }),
    onError: (error) => toast.error(error.message),
    onSuccess: () => {
      toast.success(t('staffContent.archived'))
      void client.invalidateQueries({ queryKey: ['staff-content'] })
      void client.invalidateQueries({ queryKey: ['public-content'] })
    },
  })
  const date = (value) =>
    value
      ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeZone: 'UTC' }).format(
          new Date(value),
        )
      : '—'

  if (create)
    return (
      <>
        <PageHeading
          title={t('nav.createEvent', 'Create event')}
          description={t('events.createIntro', 'Add an event to the public Events page.')}
        />
        <EventForm
          initial={editing}
          onDone={() => navigate('/staff/events')}
          onCancel={() => navigate('/staff/events')}
        />
      </>
    )

  return (
    <>
      <PageHeading
        title={t('nav.manageEvents', 'Manage events')}
        description={t('events.manageIntro', 'Edit, publish or archive library events.')}
      >
        <Button onClick={() => navigate('/staff/events/new')}>
          <Plus size={18} aria-hidden="true" />
          {t('nav.createEvent', 'Create event')}
        </Button>
      </PageHeading>
      {editing && (
        <EventForm
          key={editing._id}
          initial={editing}
          onDone={() => setEditing(null)}
          onCancel={() => setEditing(null)}
        />
      )}
      <section className="panel staff-content-list">
        {list.isPending ? (
          <Loading />
        ) : list.error ? (
          <ErrorState error={list.error} retry={() => void list.refetch()} />
        ) : list.data.length ? (
          list.data.map((item) => (
            <article key={item._id}>
              <div>
                <strong>{item.title[i18n.language] || item.title.en || item.title.so || item.title.ar}</strong>
                <div className="muted">
                  <CalendarDays size={14} aria-hidden="true" /> {date(item.eventDate)}
                  {' · '}
                  {item.published
                    ? t('staffContent.published')
                    : t('events.draft', 'Draft')}
                  {item.missing.length > 0 && (
                    <span className="missing-badge">
                      {' '}
                      {t('staffContent.missing')}:{' '}
                      {item.missing.map((l) => l.toUpperCase()).join(', ')}
                    </span>
                  )}
                </div>
              </div>
              <div className="button-row">
                <Button variant="outline" onClick={() => setEditing(toForm(item))}>
                  {t('staffContent.edit')}
                </Button>
                <Button
                  variant="outline"
                  disabled={archive.isPending}
                  onClick={() => {
                    if (window.confirm(t('staffContent.confirmArchive'))) archive.mutate(item._id)
                  }}
                >
                  {t('staffContent.archive')}
                </Button>
              </div>
            </article>
          ))
        ) : (
          <Empty title={t('events.none', 'No events yet.')} />
        )}
      </section>
    </>
  )
}
