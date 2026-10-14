import { useLibrarySettings, defaultLibrary } from '../../hooks/useLibrarySettings'
import ContactForm from './components/ContactForm'
import {
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Clock,
  BookOpen,
  HelpCircle,
  Navigation,
  ShieldCheck,
  FileText,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import '../../features/catalog/information.css'
import '../../features/catalog/contact.css'

export default function ContactPage() {
  const { t } = useTranslation()
  const details = useLibrarySettings()

  const name = details.data?.name ?? defaultLibrary.name
  const email = details.data?.email || 'info@garbaharey-library.org'
  const phone = details.data?.phone || '+252 61 1234567'
  const address = details.data?.address || 'Main Street, Garbaharey, Gedo, Somalia'
  const hours =
    details.data?.hours ||
    'Saturday – Thursday: 8:00 AM – 6:00 PM (Friday Closed)'

  const faqs = [
    {
      q: t(
        'contact.faq1Q',
        'Who can get a library card at Garbaharey Public Library?',
      ),
      a: t(
        'contact.faq1A',
        'Library cards are free and open to all residents, students, teachers, and community members in Garbaharey and surrounding Gedo districts.',
      ),
    },
    {
      q: t(
        'contact.faq2Q',
        'How long can I borrow books for, and can I renew them?',
      ),
      a: t(
        'contact.faq2A',
        'Standard loans are for 14 days. You can easily renew your books online via your member account or in person at the circulation desk if no other member has placed a hold.',
      ),
    },
    {
      q: t('contact.faq3Q', 'Are reading and study rooms free to use?'),
      a: t(
        'contact.faq3A',
        'Yes, our reading halls and study desks are completely free and open to all visitors during regular operating hours without any reservation fee.',
      ),
    },
    {
      q: t('contact.faq4Q', 'Can school groups arrange private study visits?'),
      a: t(
        'contact.faq4A',
        'Yes! Teachers and school groups can contact us in advance using the contact form or phone to arrange guided library visits and reserved group study areas.',
      ),
    },
  ]

  return (
    <div className="contact-page">
      {/* ── 1. Page Heading and Brief Welcome ── */}
      <header className="contact-heading">
        <div className="container">
          <p className="eyebrow">{t('contact.eyebrow', 'HERE TO HELP')}</p>
          <h1>{t('contact.title', 'Contact Garbaharey Public Library')}</h1>
          <p>
            {t(
              'contact.intro',
              'Have a question about library membership, borrowing books, quiet study facilities, or our activities? We are here to help.',
            )}
          </p>
        </div>
      </header>

      <div className="container page contact-content">
        {/* ── 5. Contact Form with name, email, subject, message ── */}
        <ContactForm />

        {/* ── Sidebar with Address, Phone, Email & Opening Hours ── */}
        <div className="contact-sidebar">
          <section className="contact-details" aria-labelledby="contact-title">
            <h2 id="contact-title">
              {t('contact.speakTitle', 'Speak with the library team')}
            </h2>
            <p className="muted">
              {t(
                'contact.speakText',
                'Library staff can help with collecting and returning books, reservations, study room use, and account access.',
              )}
            </p>

            <dl className="contact-list">
              {/* ── 2. Approved Address and Directions ── */}
              <div>
                <MapPin aria-hidden="true" size={20} />
                <dt>{t('contact.directionsTitle', 'Approved Address')}</dt>
                <dd>{address}</dd>
                <div className="contact-directions">
                  <strong>
                    <Navigation size={14} aria-hidden="true" />
                    {t('contact.directionsTitle', 'Directions & Location')}
                  </strong>
                  <p>
                    {t(
                      'contact.directionsText',
                      'Located along Main Street in central Garbaharey, adjacent to the administrative municipal offices and central marketplace. Accessible on foot and by local transit with parking on-site.',
                    )}
                  </p>
                </div>
              </div>

              {/* ── 3. Telephone and Email ── */}
              <div>
                <Phone aria-hidden="true" size={20} />
                <dt>{t('contact.phoneLabel', 'Telephone')}</dt>
                <dd>
                  <a href={`tel:${phone.replace(/[^+0-9]/g, '')}`} dir="ltr">
                    {phone}
                  </a>
                  <p className="text-xs text-muted mt-1">
                    {t(
                      'contact.phoneHelp',
                      'Staff assistance available Saturday – Thursday: 8:00 AM – 6:00 PM',
                    )}
                  </p>
                </dd>
              </div>

              <div>
                <Mail aria-hidden="true" size={20} />
                <dt>{t('contact.emailLabel', 'Email')}</dt>
                <dd>
                  <a href={`mailto:${email}`}>{email}</a>
                  <p className="text-xs text-muted mt-1">
                    {t(
                      'contact.emailHelp',
                      'General inquiries answered within 24–48 hours',
                    )}
                  </p>
                </dd>
              </div>

              {/* ── 4. Confirmed Opening Hours ── */}
              <div>
                <Clock aria-hidden="true" size={20} />
                <dt>{t('contact.hoursTitle', 'Confirmed Opening Hours')}</dt>
                <dd>
                  <div className="font-medium text-text">{hours}</div>
                  <p className="text-xs text-muted mt-1">
                    {t(
                      'contact.bookDropNote',
                      'Book drop box available outside main entrance for after-hours returns.',
                    )}
                  </p>
                </dd>
              </div>
            </dl>
          </section>

          {/* Quick Access Card */}
          <aside className="contact-self-service">
            <BookOpen size={26} aria-hidden="true" />
            <h2>{t('contact.quickTitle', 'A quick answer may be here.')}</h2>
            <p>
              {t(
                'contact.quickText',
                'Find answers about membership, reservations, renewals, and the library’s current borrowing rules.',
              )}
            </p>
            <Link className="button" to="/faq">
              {t('contact.faq', 'Read the FAQs')} <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link className="text-link" to="/rules">
              <ShieldCheck size={16} aria-hidden="true" />
              <span>{t('nav.rules', 'Library Rules')}</span>
            </Link>
          </aside>
        </div>
      </div>

      {/* ── 6. Frequently Asked Questions & Link to Borrowing Guide ── */}
      <div className="container">
        <section className="contact-faqs-section" aria-labelledby="faqs-heading">
          <div className="contact-faqs-header">
            <h2 id="faqs-heading">
              {t('contact.faqsTitle', 'Frequently Asked Questions')}
            </h2>
            <p>
              {t(
                'contact.faqsIntro',
                'Quick answers to common questions about contacting and visiting the library.',
              )}
            </p>
          </div>

          <div className="contact-faqs-grid">
            {faqs.map((faq, index) => (
              <article key={index} className="contact-faq-item">
                <h3>{faq.q}</h3>
                <p>{faq.a}</p>
              </article>
            ))}
          </div>

          {/* Banner linking to Borrowing Guide and Rules */}
          <div className="contact-guide-banner">
            <div>
              <h3>
                {t(
                  'contact.guideBannerTitle',
                  'Looking for our Borrowing Guide or Library Rules?',
                )}
              </h3>
              <p>
                {t(
                  'contact.guideBannerText',
                  'Explore our detailed borrowing policies, loan limits, renewals guide, and member code of conduct.',
                )}
              </p>
            </div>
            <div className="contact-guide-actions">
              <Link className="button" to="/faq">
                <HelpCircle size={16} aria-hidden="true" />
                {t('contact.guideBtn', 'Borrowing Guide & FAQ')}
              </Link>
              <Link className="button secondary" to="/rules">
                <FileText size={16} aria-hidden="true" />
                {t('contact.rulesBtn', 'Library Rules')}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
