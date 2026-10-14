import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Share2,
  UserPlus,
  Mail,
  Users,
  ShieldCheck,
  Building,
} from 'lucide-react'
import { api } from '../../services/api'
import { Paragraphs } from '../../features/catalog/ContentPage'
import { CONFIRMED_EVENTS } from './eventsData'
import '../../features/catalog/content.css'
import '../../features/catalog/events.css'

function useFormatDate() {
  const { i18n } = useTranslation()
  return (value) => {
    if (!value) return ''
    try {
      return new Intl.DateTimeFormat(i18n.language, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(value))
    } catch {
      return String(value).slice(0, 10)
    }
  }
}

export default function EventDetailsPage() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const formatDate = useFormatDate()
  const [copied, setCopied] = useState(false)

  // 1. Try to find in confirmed local events
  const localEvent = useMemo(
    () => CONFIRMED_EVENTS.find((e) => String(e._id) === String(id)),
    [id],
  )

  // 2. If not found locally or if mongo ID, query API
  const apiItem = useQuery({
    queryKey: ['public-content-item', id, i18n.language],
    queryFn: () => api(`/library/content/item/${id}?lang=${i18n.language}`),
    enabled: !localEvent && Boolean(id?.match(/^[0-9a-fA-F]{24}$/)),
    retry: false,
  })

  // Determine current active event data
  const event = useMemo(() => {
    if (localEvent) return localEvent

    if (apiItem.data) {
      return {
        _id: apiItem.data._id,
        title: apiItem.data.title,
        category: apiItem.data.category || 'Reading Programs',
        eventDate: apiItem.data.eventDate || apiItem.data.createdAt,
        time: apiItem.data.time || '10:00 AM – 1:00 PM',
        location: apiItem.data.location || 'Main Reading Hall, Garbaharey',
        image: apiItem.data.image || '/images/hero-reading-hall.webp',
        fullBody: apiItem.data.body || '',
        shortDesc: apiItem.data.body?.slice(0, 160) || '',
        agenda: [
          'Registration & Welcoming Remarks',
          'Interactive Guided Program Sessions',
          'Group Discussion & Q&A with Facilitators',
          'Next Activities Preview & Book Checkouts',
        ],
        audience: 'Open to all community members, students, and educators.',
        admission: 'Free admission. Official library card recommended.',
        status:
          apiItem.data.eventDate &&
          new Date(apiItem.data.eventDate) < new Date('2026-09-01')
            ? 'past'
            : 'upcoming',
      }
    }

    return null
  }, [localEvent, apiItem.data])

  // Other events for recommendations
  const otherEvents = useMemo(() => {
    return CONFIRMED_EVENTS.filter(
      (e) => String(e._id) !== String(id) && e.status === 'upcoming',
    ).slice(0, 2)
  }, [id])

  const handleShare = () => {
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast.success(t('eventsPage.details.copied', 'Event link copied to clipboard!'))
      setTimeout(() => setCopied(false), 3000)
    }
  }

  if (apiItem.isPending && !localEvent) {
    return (
      <div className="container page py-16 text-center">
        <p className="text-muted">{t('auth.wait', 'Please wait...')}</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container page py-16 text-center">
        <h2 className="font-editorial text-2xl mb-4">Event not found</h2>
        <p className="text-muted mb-6">
          The requested event could not be found or has been removed.
        </p>
        <Link className="button" to="/events">
          <ArrowLeft size={16} aria-hidden="true" />
          {t('eventsPage.details.back', 'Back to Events')}
        </Link>
      </div>
    )
  }

  return (
    <div className="event-detail-page">
      <div className="container page">
        {/* Back Link Bar */}
        <div className="event-back-bar">
          <Link className="event-back-link" to="/events">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>{t('eventsPage.details.back', 'Back to Events')}</span>
          </Link>
        </div>

        <div className="event-detail-grid">
          {/* Main Article Column */}
          <article className="event-detail-article">
            <div className="event-detail-badge-row">
              <span className="event-detail-badge">{event.category}</span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  event.status === 'past'
                    ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {event.status === 'past'
                  ? t('eventsPage.card.archived', 'Archived Event')
                  : t('eventsPage.card.upcoming', 'Upcoming Event')}
              </span>
            </div>

            <h1>{event.title}</h1>

            {/* Featured Image */}
            <div className="event-detail-hero">
              <img
                src={event.image || '/images/hero-reading-hall.webp'}
                alt={event.title}
              />
            </div>

            {/* Event Description Body */}
            <section className="event-detail-body">
              <h2 className="text-xl font-editorial font-medium mb-3">
                {t('eventsPage.details.overview', 'Event Overview')}
              </h2>
              {event.fullBody ? (
                <Paragraphs text={event.fullBody} />
              ) : (
                <p>{event.shortDesc}</p>
              )}
            </section>

            {/* Program Highlights & Agenda */}
            {event.agenda && event.agenda.length > 0 && (
              <section className="event-detail-highlights">
                <h3>{t('eventsPage.details.agenda', 'Program Highlights & Agenda')}</h3>
                <ul>
                  {event.agenda.map((item, idx) => (
                    <li key={idx}>
                      <CheckCircle2 size={18} aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Target Audience */}
            <section className="panel p-6 mt-6">
              <h3 className="font-editorial text-lg mb-2 flex items-center gap-2">
                <Users size={18} className="text-accent" aria-hidden="true" />
                {t('eventsPage.details.audience', 'Target Audience')}
              </h3>
              <p className="text-muted text-sm m-0">
                {event.audience ||
                  t(
                    'eventsPage.details.audienceText',
                    'Open to all students, educators, and community members. Free admission.',
                  )}
              </p>
            </section>

            {/* Recommendations / Other Events */}
            {otherEvents.length > 0 && (
              <section className="mt-12 pt-8 border-t border-line">
                <h3 className="font-editorial text-xl mb-4">
                  {t('eventsPage.tabs.upcoming', 'Other Upcoming Events')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {otherEvents.map((oe) => (
                    <div
                      key={oe._id}
                      className="border border-line rounded-lg p-4 bg-surface flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-xs font-semibold text-accent mb-1 block">
                          {oe.category}
                        </span>
                        <h4 className="font-medium text-base mb-2">
                          <Link to={`/events/${oe._id}`}>{oe.title}</Link>
                        </h4>
                        <p className="text-xs text-muted mb-3 line-clamp-2">
                          {oe.shortDesc}
                        </p>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted pt-2 border-t border-line">
                        <span>{formatDate(oe.eventDate)}</span>
                        <Link
                          to={`/events/${oe._id}`}
                          className="text-accent font-medium hover:underline"
                        >
                          {t('eventsPage.card.viewDetails', 'Details')} →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Sidebar Info Card */}
          <aside className="event-detail-sidebar">
            <div className="event-sidebar-card">
              <h2>{t('eventsPage.details.info', 'Event Information')}</h2>

              <div className="event-info-list">
                <div className="event-info-item">
                  <Calendar size={20} aria-hidden="true" />
                  <div>
                    <strong>{t('eventsPage.details.date', 'Date')}</strong>
                    <span>{formatDate(event.eventDate)}</span>
                  </div>
                </div>

                <div className="event-info-item">
                  <Clock size={20} aria-hidden="true" />
                  <div>
                    <strong>{t('eventsPage.details.time', 'Time')}</strong>
                    <span>{event.time}</span>
                  </div>
                </div>

                <div className="event-info-item">
                  <MapPin size={20} aria-hidden="true" />
                  <div>
                    <strong>{t('eventsPage.details.location', 'Location')}</strong>
                    <span>{event.location}</span>
                  </div>
                </div>

                <div className="event-info-item">
                  <ShieldCheck size={20} aria-hidden="true" />
                  <div>
                    <strong>{t('eventsPage.details.admission', 'Admission')}</strong>
                    <span>{event.admission || t('eventsPage.details.free', 'Free & Open to the Public')}</span>
                  </div>
                </div>

                <div className="event-info-item">
                  <Building size={20} aria-hidden="true" />
                  <div>
                    <strong>{t('eventsPage.details.organizer', 'Organizer')}</strong>
                    <span>
                      {t(
                        'eventsPage.details.organizerName',
                        'Garbaharey Library Programs Committee',
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="event-sidebar-actions">
                <Link className="button" to="/join">
                  <UserPlus size={16} aria-hidden="true" />
                  {t('eventsPage.details.joinLibrary', 'Join the Library')}
                </Link>

                <Link className="button secondary" to="/contact">
                  <Mail size={16} aria-hidden="true" />
                  {t('eventsPage.details.contactLibrarian', 'Inquire About This Event')}
                </Link>

                <button
                  type="button"
                  className="button outline"
                  onClick={handleShare}
                >
                  <Share2 size={16} aria-hidden="true" />
                  {copied ? t('eventsPage.details.copied', 'Copied!') : t('eventsPage.details.share', 'Share Event')}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
