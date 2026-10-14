import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BookOpen,
  Search,
  Building2,
  GraduationCap,
  BookmarkCheck,
  Calendar,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  Mail,
  HelpCircle,
  Sparkles,
} from 'lucide-react'
import { usePublicContent } from './hooks/usePublicContent'
import '../../features/catalog/content.css'
import '../../features/catalog/services.css'

export default function ServicesPage() {
  const { t } = useTranslation()

  // Dynamic services entered by staff in CMS
  const dynamicServices = usePublicContent('service')

  // The 6 confirmed offerings
  const confirmedServices = [
    {
      key: 'lending',
      icon: BookOpen,
      title: t('servicesPage.items.lending.title', 'Book Lending and Borrowing'),
      desc: t(
        'servicesPage.items.lending.desc',
        'Borrow from thousands of physical books across fiction, sciences, history, Islamic studies, and school curriculums with convenient renewals and personal loan tracking.',
      ),
      features: [
        t(
          'servicesPage.items.lending.features.0',
          'Borrow multiple titles with your official library card',
        ),
        t(
          'servicesPage.items.lending.features.1',
          'Standard 14-day loan period with renewal options',
        ),
        t(
          'servicesPage.items.lending.features.2',
          'Multilingual collection in Somali, Arabic, and English',
        ),
      ],
      actionLabel: t(
        'servicesPage.items.lending.action',
        'View Borrowing Rules',
      ),
      actionTo: '/rules',
    },
    {
      key: 'catalog',
      icon: Search,
      title: t('servicesPage.items.catalog.title', 'Online Catalog'),
      desc: t(
        'servicesPage.items.catalog.desc',
        'Search our complete library collection 24/7. Check book availability in real-time, view summaries, shelf locations, and manage reservations from any device.',
      ),
      features: [
        t(
          'servicesPage.items.catalog.features.0',
          'Instant keyword, author, and category search',
        ),
        t(
          'servicesPage.items.catalog.features.1',
          'Real-time physical copy availability and shelf location',
        ),
        t(
          'servicesPage.items.catalog.features.2',
          'Accessible from mobile phones, tablets, and computers',
        ),
      ],
      actionLabel: t(
        'servicesPage.items.catalog.action',
        'Explore Online Catalog',
      ),
      actionTo: '/catalog',
    },
    {
      key: 'facilities',
      icon: Building2,
      title: t(
        'servicesPage.items.facilities.title',
        'Reading and Study Facilities',
      ),
      desc: t(
        'servicesPage.items.facilities.desc',
        'A calm, well-ventilated, and naturally lit environment dedicated to private reading, deep study, and academic revision away from distractions.',
      ),
      features: [
        t(
          'servicesPage.items.facilities.features.0',
          'Individual quiet study carrels and group reading tables',
        ),
        t(
          'servicesPage.items.facilities.features.1',
          'Dedicated children’s reading room and story corner',
        ),
        t(
          'servicesPage.items.facilities.features.2',
          'Clean, safe, and respectful community environment',
        ),
      ],
      actionLabel: t(
        'servicesPage.items.facilities.action',
        'View Hours & Location',
      ),
      actionTo: '/contact',
    },
    {
      key: 'research',
      icon: GraduationCap,
      title: t(
        'servicesPage.items.research.title',
        'Research and Information Assistance',
      ),
      desc: t(
        'servicesPage.items.research.desc',
        'Get expert assistance from our professional librarians for school assignments, academic research, source verification, and locating rare reference texts.',
      ),
      features: [
        t(
          'servicesPage.items.research.features.0',
          'One-on-one reference desk guidance from librarians',
        ),
        t(
          'servicesPage.items.research.features.1',
          'Support for secondary school exam revision resources',
        ),
        t(
          'servicesPage.items.research.features.2',
          'Assistance with regional Somali history and cultural literature',
        ),
      ],
      actionLabel: t(
        'servicesPage.items.research.action',
        'Ask a Librarian',
      ),
      actionTo: '/contact',
    },
    {
      key: 'reservations',
      icon: BookmarkCheck,
      title: t('servicesPage.items.reservations.title', 'Reservations'),
      desc: t(
        'servicesPage.items.reservations.desc',
        'Never miss a popular title. Place a reservation on borrowed books and receive instant notice when your copy is ready for pick-up at the circulation desk.',
      ),
      features: [
        t(
          'servicesPage.items.reservations.features.0',
          'One-click hold placement through your member portal',
        ),
        t(
          'servicesPage.items.reservations.features.1',
          'Automated queue management and waitlist tracking',
        ),
        t(
          'servicesPage.items.reservations.features.2',
          '48-hour pickup window at the circulation desk',
        ),
      ],
      actionLabel: t(
        'servicesPage.items.reservations.action',
        'Reserve in Catalog',
      ),
      actionTo: '/catalog',
    },
    {
      key: 'programs',
      icon: Calendar,
      title: t(
        'servicesPage.items.programs.title',
        'Educational Programs and Events',
      ),
      desc: t(
        'servicesPage.items.programs.desc',
        'Engaging community programs including youth reading marathons, cultural storytelling, literacy workshops, and author discussions hosted throughout the year.',
      ),
      features: [
        t(
          'servicesPage.items.programs.features.0',
          'Weekend children’s story sessions and literacy games',
        ),
        t(
          'servicesPage.items.programs.features.1',
          'High school exam revision circles and peer mentorship',
        ),
        t(
          'servicesPage.items.programs.features.2',
          'Somali cultural evenings, poetry recitals, and guest lectures',
        ),
      ],
      actionLabel: t(
        'servicesPage.items.programs.action',
        'View Upcoming Events',
      ),
      actionTo: '/events',
    },
  ]

  // Any custom additional services from CMS that are not already in the confirmed list
  const extraServices = useMemo(() => {
    if (!dynamicServices.data?.length) return []
    const confirmedTitles = new Set(
      confirmedServices.map((s) => s.title.toLowerCase()),
    )
    return dynamicServices.data.filter(
      (item) => !confirmedTitles.has(item.title.toLowerCase()),
    )
  }, [dynamicServices.data])

  return (
    <div className="services-page">
      {/* ── Services Hero ── */}
      <header className="services-heading">
        <div className="container">
          <p className="eyebrow">
            {t('servicesPage.hero.eyebrow', 'CONFIRMED OFFERINGS')}
          </p>
          <h1>
            {t(
              'servicesPage.hero.title',
              'Library Services for Readers & Learners',
            )}
          </h1>
          <p>
            {t(
              'servicesPage.hero.intro',
              'Garbaharey Public Library offers confirmed educational resources, quiet study spaces, and modern information services to support literacy, academic research, and lifelong discovery.',
            )}
          </p>
        </div>
      </header>

      <div className="container page">
        {/* ── 6 Consistent Service Cards Grid ── */}
        <div className="services-grid">
          {confirmedServices.map((service) => {
            const Icon = service.icon
            return (
              <article key={service.key} className="service-card">
                <div className="service-card-icon-wrap">
                  <Icon size={26} aria-hidden="true" />
                </div>

                <h2 className="service-card-title">{service.title}</h2>
                <p className="service-card-text">{service.desc}</p>

                <ul className="service-features-list">
                  {service.features.map((feat, idx) => (
                    <li key={idx}>
                      <CheckCircle2 size={16} aria-hidden="true" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className="service-card-footer">
                  <Link className="service-card-action" to={service.actionTo}>
                    {service.actionLabel}
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            )
          })}
        </div>

        {/* Dynamic CMS services added by staff if any */}
        {extraServices.length > 0 && (
          <section className="mt-12 pt-8 border-t border-line">
            <h2 className="font-editorial text-2xl mb-6">
              {t('servicesPage.extraTitle', 'Additional Community Offerings')}
            </h2>
            <div className="services-grid">
              {extraServices.map((item) => (
                <article key={item._id} className="service-card">
                  <div className="service-card-icon-wrap">
                    <Sparkles size={26} aria-hidden="true" />
                  </div>
                  <h3 className="service-card-title">{item.title}</h3>
                  <p className="service-card-text">{item.body}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ── How to Access Services (Process Workflow) ── */}
        <section className="services-process" aria-labelledby="process-heading">
          <h2 id="process-heading">
            {t('servicesPage.process.title', 'How to Access Our Services')}
          </h2>
          <p className="lead">
            {t(
              'servicesPage.process.lead',
              'Three straightforward steps to make the most of Garbaharey Public Library.',
            )}
          </p>

          <div className="services-steps-grid">
            <div className="service-step-card">
              <span className="service-step-number">1</span>
              <h3>
                {t(
                  'servicesPage.process.step1Title',
                  '1. Register for Membership',
                )}
              </h3>
              <p>
                {t(
                  'servicesPage.process.step1Text',
                  'Sign up online or visit our circulation desk on Main Street with identification to receive your official library card.',
                )}
              </p>
            </div>

            <div className="service-step-card">
              <span className="service-step-number">2</span>
              <h3>
                {t(
                  'servicesPage.process.step2Title',
                  '2. Search & Select Books',
                )}
              </h3>
              <p>
                {t(
                  'servicesPage.process.step2Text',
                  'Use our online catalog or browse our open shelves to explore titles, read summaries, and check copy availability.',
                )}
              </p>
            </div>

            <div className="service-step-card">
              <span className="service-step-number">3</span>
              <h3>
                {t(
                  'servicesPage.process.step3Title',
                  '3. Borrow, Study & Participate',
                )}
              </h3>
              <p>
                {t(
                  'servicesPage.process.step3Text',
                  'Take books home, read in our quiet reading halls, or join community literacy programs and workshops.',
                )}
              </p>
            </div>
          </div>
        </section>

        {/* ── Call to Action Banner ── */}
        <section className="services-cta-banner">
          <div className="services-cta-text">
            <h2>
              {t(
                'servicesPage.cta.title',
                'Ready to make the most of your library?',
              )}
            </h2>
            <p>
              {t(
                'servicesPage.cta.text',
                'Membership is free and open to all Garbaharey residents, students, and educators. Begin your journey today.',
              )}
            </p>
          </div>

          <div className="services-cta-buttons">
            <Link className="button primary-white" to="/join">
              <UserPlus size={16} aria-hidden="true" />
              {t('servicesPage.cta.join', 'Apply for Membership')}
            </Link>
            <Link className="button secondary" to="/contact">
              <Mail size={16} aria-hidden="true" />
              {t('servicesPage.cta.contact', 'Contact Staff')}
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
