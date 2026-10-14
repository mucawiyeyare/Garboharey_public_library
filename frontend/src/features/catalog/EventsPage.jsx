import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Plus, Image as ImageIcon, Upload, Edit, Trash2 } from 'lucide-react'
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
  eventDate: new Date().toISOString().slice(0, 10),
  time: '4:00 PM – 6:00 PM',
  location: 'Garbaharey Public Library',
  category: 'Reading Programs',
  image: '',
  featured: false,
  published: true,
  order: 0,
})
const toForm = (item) => ({
  ...blank(),
  ...item,
  title: { ...blank().title, ...item.title },
  body: { ...blank().body, ...item.body },
  time: item.time || '',
  location: item.location || '',
  category: item.category || 'Reading Programs',
  image: item.image || '',
  eventDate: item.eventDate ? String(item.eventDate).slice(0, 10) : '',
})

function EventForm({ initial, onDone, onCancel }) {
  const { t } = useTranslation()
  const client = useQueryClient()
  const [event, setEvent] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const set = (patch) => setEvent({ ...event, ...patch })

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type || !file.type.startsWith('image/')) {
      toast.error(t('events.invalidImage', 'Please choose a valid image file (JPG, PNG, WEBP, etc.)'))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('events.imageTooLarge', 'Image is too large. Please select a photo under 10 MB.'))
      return
    }

    setUploading(true)
    try {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(new Error('Failed to read image file'))
        reader.readAsDataURL(file)
      })

      let res
      try {
        res = await api('/staff/covers', {
          method: 'POST',
          body: body({ data: base64Data, contentType: file.type }),
        })
      } catch (firstErr) {
        try {
          res = await api('/staff/governance/upload-photo', {
            method: 'POST',
            body: body({ data: base64Data, contentType: file.type }),
          })
        } catch {
          throw firstErr
        }
      }

      if (res?.coverId) {
        set({ image: `/api/covers/${res.coverId}` })
        toast.success(t('events.imageUploaded', 'Event image uploaded.'))
      } else {
        throw new Error('Upload succeeded but server did not return image ID')
      }
    } catch (err) {
      toast.error(err.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const save = useMutation({
    mutationFn: ({ _id, kind, title, body: text, eventDate, time, location, category, image, featured, published, order }) =>
      api(_id ? `/staff/content/${_id}` : '/staff/content', {
        method: _id ? 'PUT' : 'POST',
        body: body({
          kind,
          title,
          body: text,
          eventDate: eventDate || null,
          time: time || '',
          location: location || '',
          category: category || 'Reading Programs',
          image: image || '',
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
      void client.invalidateQueries({ queryKey: ['public-content-item'] })
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
          {t('staffContent.date', 'Event Date')}
          <Input
            type="date"
            required
            value={event.eventDate}
            onChange={(e) => set({ eventDate: e.target.value })}
          />
        </label>

        <label>
          {t('events.time', 'Time')}
          <Input
            type="text"
            placeholder="e.g. 4:00 PM – 6:00 PM"
            value={event.time}
            onChange={(e) => set({ time: e.target.value })}
          />
        </label>

        <label>
          {t('events.location', 'Location')}
          <Input
            type="text"
            placeholder="e.g. Garbaharey Public Library"
            value={event.location}
            onChange={(e) => set({ location: e.target.value })}
          />
        </label>

        <label>
          {t('events.category', 'Category')}
          <select
            className="input"
            value={event.category}
            onChange={(e) => set({ category: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--panel)',
              color: 'var(--text)',
              fontSize: '14px',
            }}
          >
            <option value="Reading Programs">Reading Programs</option>
            <option value="Workshops">Workshops</option>
            <option value="Community & Culture">Community & Culture</option>
            <option value="Book Clubs & Discussion">Book Clubs & Discussion</option>
            <option value="Announcements">Announcements</option>
          </select>
        </label>

        {/* Event Image Upload & URL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
          <label>
            <strong>{t('events.image', 'Event Image')}</strong>
            <Input
              type="text"
              placeholder="Image URL or upload file below..."
              value={event.image}
              onChange={(e) => set({ image: e.target.value })}
            />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <label
              className="button secondary small"
              style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', margin: 0 }}
            >
              <Upload size={14} />
              {uploading ? 'Uploading...' : 'Upload Image File'}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onClick={(e) => {
                  e.currentTarget.value = ''
                }}
                onChange={handleImageFile}
                disabled={uploading}
              />
            </label>
            {event.image && (
              <Button
                type="button"
                variant="outline"
                className="small"
                onClick={() => set({ image: '' })}
              >
                Clear Image
              </Button>
            )}
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Supports JPG, PNG, WEBP up to 10 MB. High-resolution photos are preserved clearly.
            </span>
          </div>
          {event.image && (
            <div style={{ marginTop: '10px' }}>
              <div
                style={{
                  width: '100%',
                  maxWidth: '460px',
                  maxHeight: '380px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                  background: 'var(--soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                }}
              >
                <img
                  src={event.image}
                  alt="Event preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '360px',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                    margin: '0 auto',
                  }}
                  onError={(e) => {
                    e.currentTarget.src = '/images/hero-reading-hall.webp'
                  }}
                />
              </div>
            </div>
          )}
        </div>
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
  const deleteEvent = useMutation({
    mutationFn: (id) => api(`/staff/content/${id}`, { method: 'DELETE' }),
    onError: (error) => toast.error(error.message),
    onSuccess: () => {
      toast.success(t('events.deleted', 'Event deleted.'))
      void client.invalidateQueries({ queryKey: ['staff-content'] })
      void client.invalidateQueries({ queryKey: ['public-content'] })
      void client.invalidateQueries({ queryKey: ['public-content-item'] })
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
        <Button onClick={() => setEditing((prev) => (prev && !prev._id ? null : blank()))}>
          <Plus size={18} aria-hidden="true" />
          {editing && !editing._id ? t('common.close', 'Close Form') : t('nav.createEvent', 'Create event')}
        </Button>
      </PageHeading>
      {editing && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>
              {editing._id ? t('events.editTitle', 'Edit Event') : t('events.createNewTitle', 'Create New Event')}
            </h2>
          </div>
          <EventForm
            key={editing._id || 'new-event'}
            initial={editing}
            onDone={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}
      <section className="panel staff-content-list">
        {list.isPending ? (
          <Loading />
        ) : list.error ? (
          <ErrorState error={list.error} retry={() => void list.refetch()} />
        ) : list.data.length ? (
          list.data.map((item) => (
            <article key={item._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {item.image ? (
                  <div
                    style={{
                      width: '84px',
                      height: '60px',
                      background: 'var(--soft)',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={item.image}
                      alt=""
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: '72px',
                      height: '50px',
                      background: 'var(--soft)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: 'var(--muted)',
                    }}
                  >
                    <ImageIcon size={20} />
                  </div>
                )}
                <div>
                  <strong>{item.title[i18n.language] || item.title.en || item.title.so || item.title.ar}</strong>
                  <div className="muted" style={{ fontSize: '13px' }}>
                    <CalendarDays size={14} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    {date(item.eventDate)}
                    {item.time && ` · ${item.time}`}
                    {item.location && ` · ${item.location}`}
                    {' · '}
                    {item.published
                      ? t('staffContent.published', 'Published')
                      : t('events.draft', 'Draft')}
                    {item.missing.length > 0 && (
                      <span className="missing-badge" style={{ marginLeft: '6px' }}>
                        {t('staffContent.missing')}:{' '}
                        {item.missing.map((l) => l.toUpperCase()).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="button-row">
                <Button
                  className="button secondary small"
                  onClick={() => setEditing(toForm(item))}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Edit size={14} />
                  {t('staffContent.edit', 'Edit')}
                </Button>
                <Button
                  variant="outline"
                  className="small"
                  style={{
                    color: 'var(--danger, #dc2626)',
                    borderColor: 'var(--danger, #dc2626)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  disabled={deleteEvent.isPending}
                  onClick={() => {
                    const eventTitle = item.title[i18n.language] || item.title.en || 'this event'
                    if (window.confirm(`Are you sure you want to permanently delete "${eventTitle}"?`)) {
                      deleteEvent.mutate(item._id)
                    }
                  }}
                >
                  <Trash2 size={13} />
                  {t('common.delete', 'Delete')}
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
