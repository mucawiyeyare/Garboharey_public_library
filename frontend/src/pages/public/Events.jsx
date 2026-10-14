import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  ArrowRight,
  Sparkles,
  Archive,
  BookOpen,
  Edit,
} from 'lucide-react'
import { useAuth } from '../../context/AuthProvider'
import { usePublicContent } from './hooks/usePublicContent'
import '../../features/catalog/content.css'
import '../../features/catalog/events.css'

function useFormatDate() {
  const { i18n } = useTranslation()
  return (value) => {
    if (!value) return ''
    try {
      return new Intl.DateTimeFormat(i18n.language, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(value))
    } catch {
      return String(value).slice(0, 10)
    }
  }
}

export default function EventsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const formatDate = useFormatDate()
  const canEdit = user?.role && ['admin', 'librarian', 'director'].includes(user.role)

  // Live content from API /library/content/event (entered by staff)
  const apiEvents = usePublicContent('event')

  const [activeTab, setActiveTab] = useState('upcoming') // 'upcoming' | 'past'
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Live content from API /library/content/event (entered by staff)
  const allEvents = useMemo(() => {
    return (apiEvents.data || []).map((item) => ({
      _id: item._id,
      title: item.title,
      category: item.category || 'Reading Programs',
      eventDate: item.eventDate || item.createdAt,
      time: item.time || '4:00 PM – 6:00 PM',
      location: item.location || 'Garbaharey Public Library',
      image: item.image || '/images/hero-reading-hall.webp',
      shortDesc: item.body?.slice(0, 180) + (item.body?.length > 180 ? '…' : ''),
      status:
        item.eventDate && new Date(item.eventDate).getTime() < new Date().setHours(0, 0, 0, 0)
          ? 'past'
          : 'upcoming',
      isLiveApi: true,
    }))
  }, [apiEvents.data])

  const categories = [
    { key: 'all', label: t('eventsPage.categories.all', 'All Events') },
    { key: 'Reading Programs', label: t('eventsPage.categories.reading', 'Reading Programs') },
    { key: 'Workshops', label: t('eventsPage.categories.workshops', 'Workshops') },
    { key: 'Community & Culture', label: t('eventsPage.categories.community', 'Community & Culture') },
    { key: 'Announcements', label: t('eventsPage.categories.announcements', 'Announcements') },
  ]

  // Filter events based on active tab, category, and search query
  const filteredEvents = useMemo(() => {
    return allEvents.filter((item) => {
      // Tab filter
      const matchesTab = item.status === activeTab

      // Category filter
      const matchesCategory =
        selectedCategory === 'all' ||
        item.category?.toLowerCase() === selectedCategory.toLowerCase()

      // Search query
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.shortDesc?.toLowerCase().includes(query) ||
        item.location?.toLowerCase().includes(query)

      return matchesTab && matchesCategory && matchesSearch
    })
  }, [allEvents, activeTab, selectedCategory, searchQuery])

  return (
    <div className="events-page">
      {/* ── Events Hero: “What's happening at the library?” ── */}
      <header className="events-heading">
        <div className="container">
          <p className="eyebrow">
            {t('eventsPage.hero.eyebrow', 'LIBRARY ACTIVITIES & PROGRAMS')}
          </p>
          <h1>
            {t('eventsPage.hero.title', "What's happening at the library?")}
          </h1>
          <p>
            {t(
              'eventsPage.hero.intro',
              'Stay connected with Garbaharey Public Library activities, reading programs, announcements, and upcoming events. Everyone is welcome to participate.',
            )}
          </p>
        </div>
      </header>

      <div className="container page">
        {/* Navigation Tabs & Search Controls */}
        <section className="events-controls" aria-label="Events controls">
          <div className="events-tabs-row">
            {/* Tab Segmented Control */}
            <div className="events-nav-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-pressed={activeTab === 'upcoming'}
                onClick={() => setActiveTab('upcoming')}
              >
                <Sparkles size={15} className="inline mr-1.5" aria-hidden="true" />
                {t('eventsPage.tabs.upcoming', 'Upcoming Events')}
              </button>
              <button
                type="button"
                role="tab"
                aria-pressed={activeTab === 'past'}
                onClick={() => setActiveTab('past')}
              >
                <Archive size={15} className="inline mr-1.5" aria-hidden="true" />
                {t('eventsPage.tabs.past', 'Past Events Archive')}
              </button>
            </div>

            {/* Search Input */}
            <div className="events-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(
                  'eventsPage.searchPlaceholder',
                  'Search events by title or keyword...',
                )}
                aria-label="Search events"
              />
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="events-categories" role="group" aria-label="Category filters">
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                className={`category-chip ${selectedCategory === cat.key ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Upcoming Events Section / Past Events Archive ── */}
        <section aria-labelledby="events-section-title">
          <div className="flex justify-between items-baseline mb-4">
            <h2 id="events-section-title" className="text-xl font-editorial font-medium">
              {activeTab === 'upcoming'
                ? t('eventsPage.tabs.upcoming', 'Upcoming Events')
                : t('eventsPage.tabs.past', 'Past Events Archive')}
            </h2>
            <span className="text-sm text-muted">
              {filteredEvents.length}{' '}
              {filteredEvents.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          {filteredEvents.length > 0 ? (
            <div className="events-grid">
              {filteredEvents.map((event) => (
                <article key={event._id} className="event-card">
                  {/* Event Card Media Image */}
                  <div className="event-card-media">
                    <img
                      src={event.image || '/images/hero-reading-hall.webp'}
                      alt={event.title}
                      loading="lazy"
                    />
                    <span
                      className={`event-card-badge ${
                        event.status === 'past' ? 'archived' : ''
                      }`}
                    >
                      {event.status === 'past'
                        ? t('eventsPage.card.archived', 'Archived Event')
                        : event.category}
                    </span>
                  </div>

                  {/* Event Card Content */}
                  <div className="event-card-content">
                    <div className="event-card-meta">
                      <div className="event-meta-item">
                        <Calendar size={14} aria-hidden="true" />
                        <span>{formatDate(event.eventDate)}</span>
                      </div>
                      <div className="event-meta-item">
                        <Clock size={14} aria-hidden="true" />
                        <span>{event.time}</span>
                      </div>
                      <div className="event-meta-item">
                        <MapPin size={14} aria-hidden="true" />
                        <span>{event.location}</span>
                      </div>
                    </div>

                    <h3 className="event-card-title">
                      <Link to={`/events/${event._id}`}>{event.title}</Link>
                    </h3>

                    <p className="event-card-desc">{event.shortDesc}</p>

                    <div className="event-card-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <Link className="event-card-link" to={`/events/${event._id}`}>
                        {t('eventsPage.card.viewDetails', 'View Details')}
                        <ArrowRight size={15} aria-hidden="true" />
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {canEdit && (
                          <Link
                            className="button secondary small"
                            to="/staff/events"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '12px' }}
                          >
                            <Edit size={13} />
                            {t('staffContent.edit', 'Edit')}
                          </Link>
                        )}
                        <span className="text-xs text-muted font-medium">
                          {event.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="panel p-12 text-center my-8">
              <BookOpen size={36} className="mx-auto text-muted mb-3 opacity-60" />
              <h3 className="font-editorial text-xl mb-2">
                {activeTab === 'upcoming'
                  ? t(
                      'eventsPage.empty.upcomingTitle',
                      'No upcoming events scheduled right now',
                    )
                  : t('eventsPage.empty.pastTitle', 'No past events in archive')}
              </h3>
              <p className="text-muted max-w-md mx-auto text-sm">
                {activeTab === 'upcoming'
                  ? t(
                      'eventsPage.empty.upcomingText',
                      'Check back soon or speak with library staff to inquire about upcoming reading circles and literacy sessions.',
                    )
                  : t(
                      'eventsPage.empty.pastText',
                      'Completed library events and program highlights will appear in this archive.',
                    )}
              </p>
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  className="button secondary mt-4 inline-flex items-center"
                  onClick={() => setSelectedCategory('all')}
                >
                  {t('eventsPage.categories.all', 'View all events')}
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
