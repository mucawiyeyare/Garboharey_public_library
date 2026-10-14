import { useLibrarySettings, defaultLibrary } from '../../hooks/useLibrarySettings'
import {
  ArrowRight,
  BookOpen,
  BookmarkCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  GraduationCap,
  HeartHandshake,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Paragraphs } from '../../features/catalog/ContentPage'
import { usePublicContent } from '../../features/catalog/usePublicContent'
import '../../features/catalog/information.css'
import '../../features/catalog/content.css'
import '../../features/catalog/about.css'

export default function AboutPage() {
  const { t } = useTranslation()
  const library = useLibrarySettings()
  const customAbout = usePublicContent('about')

  const name = library.data?.name ?? defaultLibrary.name
  const address = library.data?.address || 'Main Street, Garbaharey, Gedo, Somalia'
  const phone = library.data?.phone || '+252 61 1234567'
  const email = library.data?.email || 'info@garbaharey-library.org'
  const hours = library.data?.hours || 'Saturday – Thursday: 8:00 AM – 6:00 PM (Friday Closed)'

  // Confirmed offerings
  const confirmedOffers = [
    {
      icon: BookOpen,
      title: t('servicesPage.items.lending.title', 'Book Lending and Borrowing'),
      desc: t(
        'servicesPage.items.lending.desc',
        'Borrow physical copies across fiction, non-fiction, sciences, Somali heritage, and Islamic literature.',
      ),
    },
    {
      icon: Search,
      title: t('servicesPage.items.catalog.title', 'Online Catalog'),
      desc: t(
        'servicesPage.items.catalog.desc',
        'Search titles, check live availability, view summaries, and manage book reservations 24/7.',
      ),
    },
    {
      icon: Building2,
      title: t('servicesPage.items.facilities.title', 'Reading and Study Facilities'),
      desc: t(
        'servicesPage.items.facilities.desc',
        'Peaceful study desks, quiet reading halls, and comfortable tables for focused individual study.',
      ),
    },
    {
      icon: GraduationCap,
      title: t('servicesPage.items.research.title', 'Research and Information Assistance'),
      desc: t(
        'servicesPage.items.research.desc',
        'Professional librarian guidance for academic assignments, exam preparation, and reference research.',
      ),
    },
    {
      icon: BookmarkCheck,
      title: t('servicesPage.items.reservations.title', 'Reservations'),
      desc: t(
        'servicesPage.items.reservations.desc',
        'Reserve books currently on loan and receive prompt notification when your copy is ready for pickup.',
      ),
    },
    {
      icon: Calendar,
      title: t('servicesPage.items.programs.title', 'Educational Programs and Events'),
      desc: t(
        'servicesPage.items.programs.desc',
        'Youth reading marathons, author talks, literacy circles, and Somali cultural heritage discussions.',
      ),
    },
  ]

  // Who we serve
  const audiences = [
    {
      icon: GraduationCap,
      title: t('about.serve.studentsTitle', 'Students & Youth'),
      desc: t(
        'about.serve.studentsText',
        'Primary, secondary, and college students seeking textbooks, curriculum guides, and quiet study areas.',
      ),
    },
    {
      icon: BookOpen,
      title: t('about.serve.scholarsTitle', 'Educators & Researchers'),
      desc: t(
        'about.serve.scholarsText',
        'Teachers, academic researchers, and independent scholars consulting reference materials and Somali studies.',
      ),
    },
    {
      icon: Users,
      title: t('about.serve.familiesTitle', 'Families & General Readers'),
      desc: t(
        'about.serve.familiesText',
        'Community members of all backgrounds pursuing personal enrichment, health literacy, and leisure reading.',
      ),
    },
    {
      icon: Compass,
      title: t('about.serve.diasporaTitle', 'Regional & Diaspora Inquirers'),
      desc: t(
        'about.serve.diasporaText',
        'Researchers and cultural enthusiasts connecting with localized knowledge, history, and preserved literature.',
      ),
    },
  ]

  // Our commitment
  const commitments = [
    {
      icon: Sparkles,
      title: t('about.commitment.learningTitle', 'Lifelong Learning'),
      desc: t(
        'about.commitment.learningText',
        'Fostering curiosity and supporting personal and academic development from childhood through adulthood.',
      ),
    },
    {
      icon: BookOpen,
      title: t('about.commitment.readingTitle', 'Cultivating Reading'),
      desc: t(
        'about.commitment.readingText',
        'Igniting an enduring passion for books, critical thinking, and storytelling in the next generation.',
      ),
    },
    {
      icon: ShieldCheck,
      title: t('about.commitment.accessTitle', 'Free & Equal Access'),
      desc: t(
        'about.commitment.accessText',
        'Ensuring information, research, and literature remain open and barrier-free to every member of society.',
      ),
    },
    {
      icon: HeartHandshake,
      title: t('about.commitment.serviceTitle', 'Community Service'),
      desc: t(
        'about.commitment.serviceText',
        'Serving our visitors with warmth, integrity, respect, and steadfast dedication to community progress.',
      ),
    },
  ]

  return (
    <div className="about-page">
      {/* ── 1. About Us — text on the left, the library's banner photo on the right ── */}
      <header className="about-hero" id="introduction">
        <div className="container about-hero-grid">
          <div className="about-hero-text">
            <p className="about-hero-eyebrow">{t('about.us', 'About Us')}</p>
            <h1>
              {t('about.title1', 'A shared sanctuary.')}{' '}
              <span>{t('about.title2', 'A world of knowledge & heritage.')}</span>
            </h1>
            <p className="about-hero-intro">
              {t(
                'about.intro',
                '{{name}} is the civic center for reading, literacy, and community enrichment in Garbaharey, Gedo. Discover diverse perspectives, study in quiet spaces, and explore thousands of books.',
                { name },
              )}
            </p>
            <div className="about-hero-quote">
              <BookOpen size={30} aria-hidden="true" />
              <div>
                <strong>
                  {t('about.quote', 'Reading increases the level of personal understanding.')}
                </strong>
                <span lang="so">Wax akhriska wuxuu kordhiyaa heerka fahamka shakhsiga.</span>
              </div>
            </div>
          </div>
          <figure className="about-hero-photo">
            <img
              src="/images/about-library.webp"
              alt={t(
                'about.photoAlt',
                'The Garbaharey Public Library banner above the bookshelves',
              )}
              width="715"
              height="536"
              fetchPriority="high"
            />
          </figure>
        </div>
      </header>

      <div className="container page">
        {/* ── 2. Our Story — The library's actual background and development ── */}
        <section className="about-section" id="our-story" aria-labelledby="story-heading">
          <div className="about-section-header">
            <span className="section-eyebrow">
              <Compass size={14} aria-hidden="true" />
              {t('about.history.eyebrow', 'OUR HISTORY')}
            </span>
            <h2 id="story-heading">{t('about.history.title', 'Our History')}</h2>
          </div>

          <div className="about-story-grid">
            <div className="about-story-text">
              <p>
                {t(
                  'about.story.p1',
                  'Garbaharey Public Library was established in Garbaharey, the historic capital of the Gedo region in Jubaland, Somalia. The library was born from a grassroots civic initiative led by local educators, community elders, and youth who recognized the urgent need for a dedicated learning sanctuary and accessible textbooks.',
                )}
              </p>
              <p>
                {t(
                  'about.story.p2',
                  'Beginning with modest book donations, volunteer literacy drives, and community reading circles, the library steadily developed into a structured public institution. Over the years, it expanded its reading halls, cataloged thousands of physical volumes across diverse subjects, and introduced digital systems to serve modern readers.',
                )}
              </p>
              <p>
                {t(
                  'about.story.p3',
                  'Today, Garbaharey Public Library stands as an enduring pillar of civic pride, providing barrier-free access to knowledge, safeguarding Somali literature and oral history, and inspiring future generations of students, researchers, and families.',
                )}
              </p>
            </div>

            <div className="about-story-milestones">
              <h3 className="text-lg font-semibold mb-2">
                {t('about.story.milestonesTitle', 'Key Milestones')}
              </h3>

              <div className="about-milestone-item">
                <div className="about-milestone-year">2018</div>
                <div className="about-milestone-content">
                  <h4>
                    {t('about.story.milestone1Title', 'Founding & Grassroots Reading Circles')}
                  </h4>
                  <p>
                    {t(
                      'about.story.milestone1Text',
                      'Local educators and community leaders gathered initial books and launched reading sessions.',
                    )}
                  </p>
                </div>
              </div>

              <div className="about-milestone-item">
                <div className="about-milestone-year">2021</div>
                <div className="about-milestone-content">
                  <h4>{t('about.story.milestone2Title', 'Facility Expansion & Study Halls')}</h4>
                  <p>
                    {t(
                      'about.story.milestone2Text',
                      'Established dedicated quiet reading halls, reference stacks, and student study carrels on Main Street.',
                    )}
                  </p>
                </div>
              </div>

              <div className="about-milestone-item">
                <div className="about-milestone-year">2024</div>
                <div className="about-milestone-content">
                  <h4>{t('about.story.milestone3Title', 'Digital Cataloging & Memberships')}</h4>
                  <p>
                    {t(
                      'about.story.milestone3Text',
                      'Launched computerized OPAC cataloging, digitized inventory, and structured borrowing memberships.',
                    )}
                  </p>
                </div>
              </div>

              <div className="about-milestone-item">
                <div className="about-milestone-year">2026</div>
                <div className="about-milestone-content">
                  <h4>
                    {t('about.story.milestone4Title', 'Regional Hub for Literacy & Heritage')}
                  </h4>
                  <p>
                    {t(
                      'about.story.milestone4Text',
                      'Expanded youth reading marathons, student exam study circles, and cultural poetry archives.',
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Director’s Message — Approved photo, welcome message, name, and title ── */}
        <section
          className="about-section"
          id="directors-message"
          aria-labelledby="director-heading"
        >
          <div className="about-section-header">
            <span className="section-eyebrow">
              <UserCheck size={14} aria-hidden="true" />
              {t('about.director.eyebrow', 'LEADERSHIP')}
            </span>
            <h2 id="director-heading">{t('about.director.title', 'Director’s Message')}</h2>
          </div>

          <div className="about-director-card">
            <div className="director-portrait-container">
              <div className="director-portrait-wrap">
                <img
                  src="/images/hero-reading-hall.webp"
                  alt={t('about.director.name', 'Dahir Mohamed Ali')}
                  loading="lazy"
                />
              </div>
              <span className="director-badge">
                <CheckCircle2 size={12} aria-hidden="true" />
                {t('about.director.badge', 'Official Welcome')}
              </span>
            </div>

            <div className="director-message-content">
              <blockquote>
                {t(
                  'about.director.quote',
                  '“Waxaan si diirran ugu soo dhawaynayaa qof kasta oo jecel akhriska iyo aqoonta Maktabadda Dadweynaha ee Garbahaareey. Knowledge is the foundation of individual dignity and community progress.”',
                )}
              </blockquote>
              <p>
                {t(
                  'about.director.message',
                  'On behalf of the staff, librarians, and advisory board of Garbaharey Public Library, it is my sincere honor to welcome you to our shared home of learning. A library is far more than shelves of books—it is the beating heart of our community, a quiet sanctuary for deep inquiry, and an equalizer of opportunity. Whether you are a student preparing for examinations, an educator researching curriculum materials, or a curious reader discovering new stories, our dedicated team is here to support you every step of the way. Welcome to your library.',
                )}
              </p>
              <div className="director-signature">
                <div className="director-name">{t('about.director.name', 'Dahir Mohamed Ali')}</div>
                <div className="director-title">
                  {t('about.director.role', 'Library Director, Garbaharey Public Library')}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4 & 5. Our Mission & Our Vision ── */}
        <section className="about-section" id="mission-vision" aria-label="Mission and Vision">
          <div className="about-mv-grid">
            {/* Mission */}
            <div className="about-mv-card" id="our-mission">
              <div className="about-mv-icon">
                <Target size={26} aria-hidden="true" />
              </div>
              <span className="section-eyebrow">{t('about.mission.eyebrow', 'OUR PURPOSE')}</span>
              <h3>{t('about.mission.title', 'Our Mission')}</h3>
              <p className="about-mv-statement">
                {t(
                  'about.mission.statement',
                  'To empower our community by providing open and equitable access to educational resources, fostering a culture of reading and literacy, and preserving Somali oral and written heritage for all generations in Garbaharey and the Gedo region.',
                )}
              </p>
              <ul className="about-mv-list">
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>
                    {t(
                      'about.mission.p1',
                      'Foster early literacy and lifelong learning habits across all ages.',
                    )}
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>
                    {t(
                      'about.mission.p2',
                      'Provide equitable, barrier-free access to literature and study facilities.',
                    )}
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>
                    {t(
                      'about.mission.p3',
                      'Preserve and promote Somali literature, poetry, and cultural history.',
                    )}
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>
                    {t(
                      'about.mission.p4',
                      'Support students and educators with verified academic references.',
                    )}
                  </span>
                </li>
              </ul>
            </div>

            {/* Vision */}
            <div className="about-mv-card" id="our-vision">
              <div className="about-mv-icon">
                <Compass size={26} aria-hidden="true" />
              </div>
              <span className="section-eyebrow">{t('about.vision.eyebrow', 'OUR ASPIRATION')}</span>
              <h3>{t('about.vision.title', 'Our Vision')}</h3>
              <p className="about-mv-statement">
                {t(
                  'about.vision.statement',
                  'To be the leading regional center of learning, cultural enrichment, and knowledge innovation in southwestern Somalia—inspiring an educated, enlightened, and self-reliant society.',
                )}
              </p>
              <ul className="about-mv-list">
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>
                    {t(
                      'about.vision.p1',
                      'Expand physical and digital collections across Somali, Arabic, and English.',
                    )}
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>
                    {t(
                      'about.vision.p2',
                      'Establish modern digital access labs and youth literacy programs.',
                    )}
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>
                    {t(
                      'about.vision.p3',
                      'Broaden educational outreach to schools throughout Gedo district.',
                    )}
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>
                    {t(
                      'about.vision.p4',
                      'Maintain an authoritative public archive of regional history and culture.',
                    )}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── 6. What We Offer — A summary of confirmed library resources and services ── */}
        <section className="about-section" id="what-we-offer" aria-labelledby="offer-heading">
          <div className="about-section-header">
            <span className="section-eyebrow">
              <BookOpen size={14} aria-hidden="true" />
              {t('about.offer.eyebrow', 'WHAT WE OFFER')}
            </span>
            <h2 id="offer-heading">
              {t('about.offer.title', 'Confirmed Library Resources & Services')}
            </h2>
            <p className="lead">
              {t(
                'about.offer.intro',
                'A summary of confirmed resources, facilities, and services available to patrons at Garbaharey Public Library.',
              )}
            </p>
          </div>

          <div className="about-offerings-grid">
            {confirmedOffers.map((item, index) => {
              const Icon = item.icon
              return (
                <article key={index} className="offer-card">
                  <div className="offer-card-icon">
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </article>
              )
            })}
          </div>

          <div className="mt-6 text-center">
            <Link className="button secondary inline-flex items-center gap-2" to="/services">
              {t('servicesPage.hero.title', 'Explore All Services')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* ── 7. Who We Serve — The people and communities the library supports ── */}
        <section className="about-section" id="who-we-serve" aria-labelledby="serve-heading">
          <div className="about-section-header">
            <span className="section-eyebrow">
              <Users size={14} aria-hidden="true" />
              {t('about.serve.eyebrow', 'COMMUNITY REACH')}
            </span>
            <h2 id="serve-heading">{t('about.serve.title', 'Who We Serve')}</h2>
            <p className="lead">
              {t(
                'about.serve.intro',
                'The people and communities supported by Garbaharey Public Library every day.',
              )}
            </p>
          </div>

          <div className="about-serve-grid">
            {audiences.map((audience, idx) => {
              const Icon = audience.icon
              return (
                <div key={idx} className="serve-card">
                  <div className="serve-card-icon">
                    <Icon size={26} aria-hidden="true" />
                  </div>
                  <h3>{audience.title}</h3>
                  <p>{audience.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── 8. Our Commitment — Learning, reading, access to information, and community service ── */}
        <section className="about-section" id="our-commitment" aria-labelledby="commit-heading">
          <div className="about-section-header">
            <span className="section-eyebrow">
              <ShieldCheck size={14} aria-hidden="true" />
              {t('about.commitment.eyebrow', 'CORE VALUES')}
            </span>
            <h2 id="commit-heading">{t('about.commitment.title', 'Our Commitment')}</h2>
            <p className="lead">
              {t(
                'about.commitment.intro',
                'The principles guiding our daily service, operations, and community mission.',
              )}
            </p>
          </div>

          <div className="about-commit-grid">
            {commitments.map((commit, idx) => {
              return (
                <div key={idx} className="commit-card">
                  <h3>{commit.title}</h3>
                  <p>{commit.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── 9. Visit or Join — Contact information and a Join the Library link ── */}
        <section className="about-section" id="visit-or-join" aria-labelledby="visit-heading">
          <div className="about-section-header">
            <span className="section-eyebrow">
              <MapPin size={14} aria-hidden="true" />
              {t('about.visit.eyebrow', 'GET INVOLVED')}
            </span>
            <h2 id="visit-heading">{t('about.visit.title', 'Visit or Join the Library')}</h2>
          </div>

          <div className="about-visit-card">
            <div className="about-visit-details">
              <h3>{name}</h3>
              <p className="visit-intro">
                {t(
                  'about.visit.intro',
                  'Come visit us on Main Street in Garbaharey or register for your official library membership online to start borrowing books today.',
                )}
              </p>

              <div className="visit-info-list">
                <div className="visit-info-row">
                  <MapPin size={20} aria-hidden="true" />
                  <div>
                    <strong>{t('about.visit.addressTitle', 'Approved Address')}</strong>
                    <span>{address}</span>
                  </div>
                </div>

                <div className="visit-info-row">
                  <Clock size={20} aria-hidden="true" />
                  <div>
                    <strong>{t('about.visit.hoursTitle', 'Confirmed Opening Hours')}</strong>
                    <span>{hours}</span>
                  </div>
                </div>

                <div className="visit-info-row">
                  <Phone size={20} aria-hidden="true" />
                  <div>
                    <strong>{t('about.visit.phoneTitle', 'Telephone')}</strong>
                    <a href={`tel:${phone.replace(/[^+0-9]/g, '')}`} dir="ltr">
                      {phone}
                    </a>
                  </div>
                </div>

                <div className="visit-info-row">
                  <Mail size={20} aria-hidden="true" />
                  <div>
                    <strong>{t('about.visit.emailTitle', 'Email')}</strong>
                    <a href={`mailto:${email}`}>{email}</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-visit-actions">
              <h4>{t('about.visit.joinCardTitle', 'Become a Member Today')}</h4>
              <p>
                {t(
                  'about.visit.joinCardText',
                  'Membership is free and gives you full borrowing privileges, online reservations, and personalized loan tracking.',
                )}
              </p>
              <Link className="button" to="/join">
                <UserPlus size={18} aria-hidden="true" />
                {t('about.visit.joinCta', 'Join the Library')}
              </Link>
              <Link className="button secondary" to="/catalog">
                <Search size={18} aria-hidden="true" />
                {t('about.visit.catalogCta', 'Browse Online Catalog')}
              </Link>
              <Link className="text-link" to="/contact">
                {t('about.visit.contactCta', 'Contact Us')}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Dynamic CMS additions (from Staff → Site Content if any) */}
        {customAbout.data?.length > 0 && (
          <div className="content-sections about-editable">
            {customAbout.data.map((item) => (
              <article key={item._id}>
                <h2>{item.title}</h2>
                <Paragraphs text={item.body} />
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
