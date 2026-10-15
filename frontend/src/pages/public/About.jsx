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
  Award,
  BookMarked,
  Sparkle,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { Paragraphs } from '../../features/catalog/ContentPage'
import { usePublicContent } from '../../features/catalog/usePublicContent'
import '../../features/catalog/information.css'
import '../../features/catalog/content.css'
import '../../features/catalog/about.css'

function PersonAvatar({ photo, name, icon: Icon = UserCheck }) {
  const [error, setError] = useState(false)
  if (!photo || error) {
    return (
      <div className="person-card-avatar" aria-hidden="true">
        <Icon size={42} />
      </div>
    )
  }
  return (
    <div className="person-card-avatar">
      <img
        src={photo}
        alt={name}
        loading="lazy"
        onError={() => setError(true)}
      />
    </div>
  )
}

export default function AboutPage() {
  const { t } = useTranslation()
  const customAbout = usePublicContent('about')

  // Public Governance queries
  const publicFounders = useQuery({
    queryKey: ['public-founders'],
    queryFn: () => api('/governance/founders'),
  })

  const publicBoard = useQuery({
    queryKey: ['public-board'],
    queryFn: () => api('/governance/board'),
  })

  const publicDirectorMsg = useQuery({
    queryKey: ['public-director-message'],
    queryFn: () => api('/governance/director-message'),
  })

  const displayFounders =
    publicFounders.data && publicFounders.data.length > 0
      ? publicFounders.data.map((f) => ({
          id: f._id,
          name: f.fullName,
          role: f.role,
          bio: f.biography,
          photo: f.photo,
        }))
      : []

  const displayBoard =
    publicBoard.data && publicBoard.data.length > 0
      ? publicBoard.data.map((b) => ({
          id: b._id,
          name: b.fullName,
          position: b.role,
          bio: b.biography,
          photo: b.photo,
          isCurrent: b.isCurrent !== false,
          term:
            b.termStartDate || b.termEndDate
              ? `${b.termStartDate ? String(b.termStartDate).slice(0, 4) : ''} – ${
                  b.termEndDate ? String(b.termEndDate).slice(0, 4) : 'Present'
                }`
              : null,
        }))
      : []

  const directorMessageData = publicDirectorMsg.data || {
    title: 'Official Welcome',
    quoteSomali:
      'Waxaan si diirran ugu soo dhoweynayaa dhammaan dadka jecel akhriska iyo aqoonta Maktabadda Dadweynaha Garbaharay. Akhrisku waa furaha fahamka, aqoontuna waa saldhigga horumarka qofka iyo bulshada.',
    message:
      'On behalf of Garbaharey Public Library, I warmly welcome everyone who values reading, learning, and the pursuit of knowledge.\n\nA library is more than a place where books are kept. It is a place where ideas are explored, understanding grows, and people discover new opportunities through learning. Whether you are a student seeking knowledge, an educator supporting learning, or a reader exploring new perspectives, the library represents a shared commitment to education and community development.\n\nWe encourage everyone to make reading a regular part of life, participate in educational activities, and help build a community where knowledge is valued and shared',
    directorName: 'Library Director',
    directorTitle: 'Garbaharey Public Library',
    photo: '/images/director-portrait.webp',
  }

  // Services offered
  const servicesList = [
    {
      icon: BookOpen,
      title: 'Book Lending and Borrowing',
      desc: 'Access books and educational reading materials to support personal learning, academic study, and the discovery of new ideas. Borrowing arrangements are managed according to the library’s membership and lending policies.',
    },
    {
      icon: Search,
      title: 'Library Catalog',
      desc: 'Explore the library’s collection through its catalog to discover books and other available reading materials. Readers can search by title, author, category, or availability where supported by the library system.',
    },
    {
      icon: Building2,
      title: 'Reading and Study Facilities',
      desc: 'A library environment dedicated to reading, concentration, and learning. The library aims to encourage visitors to use their time productively and develop consistent reading habits.',
    },
    {
      icon: GraduationCap,
      title: 'Research and Information Assistance',
      desc: 'Support for readers seeking educational information, reference materials, and resources for study. The availability and scope of research assistance depend on the library’s current resources and staffing.',
    },
    {
      icon: BookmarkCheck,
      title: 'Reservations and Borrowing Support',
      desc: 'Where reservation functionality is available, members can request books according to the library’s borrowing policies. Staff can assist readers with questions about book availability, borrowing periods, and returns.',
    },
    {
      icon: Calendar,
      title: 'Educational Programs and Events',
      desc: 'Activities that promote literacy, reading, and community learning, including reading clubs, Bun iyo Buug, academic discussions, and book exhibitions, in line with the library’s program schedule.',
    },
  ]

  // Who we serve
  const audiences = [
    {
      icon: GraduationCap,
      title: 'Students and Youth',
      desc: 'Supporting young readers and students as they develop reading habits, expand their knowledge, and pursue their educational goals.',
    },
    {
      icon: BookOpen,
      title: 'Educators and Researchers',
      desc: 'Encouraging teachers, researchers, and knowledge seekers to explore educational materials and exchange ideas that support learning.',
    },
    {
      icon: Users,
      title: 'Families and General Readers',
      desc: 'Welcoming community members who want to discover books, develop new interests, and make reading part of everyday life.',
    },
    {
      icon: Compass,
      title: 'Regional and Diaspora Inquirers',
      desc: 'Providing opportunities for people interested in the knowledge, literature, and cultural heritage associated with Garbaharey and the wider region to engage with learning initiatives.',
    },
  ]

  // Core values
  const coreValues = [
    {
      icon: Sparkles,
      title: 'Lifelong Learning',
      desc: 'Encouraging curiosity and supporting personal development and learning throughout life.',
    },
    {
      icon: BookMarked,
      title: 'Cultivating Reading',
      desc: 'Building an enduring appreciation for books, critical thinking, and the sharing of ideas across generations.',
    },
    {
      icon: Award,
      title: 'Access to Knowledge',
      desc: 'Promoting access to learning resources and encouraging the development of knowledge within the community.',
    },
    {
      icon: HeartHandshake,
      title: 'Community Service',
      desc: 'Treating library users with respect and working toward the educational and intellectual development of the community.',
    },
  ]

  return (
    <div className="about-page">
      {/* ── 1. Hero: About Us ── */}
      <header className="about-hero" id="introduction">
        <div className="container about-hero-grid">
          <div className="about-hero-text">
            <p className="about-hero-eyebrow">ABOUT US</p>
            <h1>
              A Shared Sanctuary.{' '}
              <span>A World of Knowledge &amp; Heritage.</span>
            </h1>
            <p className="about-hero-intro">
              Garbaharey Public Library (GPL) is a community-centered institution dedicated to
              reading, literacy, education, and knowledge sharing in Garbaharey, Gedo, Somalia.
            </p>
            <p className="about-hero-intro" style={{ marginTop: '12px' }}>
              Established to encourage a stronger reading culture and support lifelong learning, the
              library aims to provide a welcoming space where people can explore books, broaden
              their understanding, develop new skills, and engage with new ideas.
            </p>
            <p className="about-hero-intro" style={{ marginTop: '12px' }}>
              We believe that reading opens minds, strengthens understanding, and creates
              opportunities for individuals and communities to grow.
            </p>

            <div className="about-hero-quote">
              <BookOpen size={30} aria-hidden="true" />
              <div>
                <strong>Reading increases personal understanding.</strong>
                <span lang="so" style={{ fontStyle: 'italic' }}>
                  Wax akhrisku wuxuu kordhiyaa heerka fahamka qofka.
                </span>
              </div>
            </div>
          </div>

          <figure className="about-hero-photo">
            <img
              src="/images/about-library.webp"
              alt="Garbaharey Public Library banner above bookshelves"
              width="715"
              height="536"
              fetchPriority="high"
            />
          </figure>
        </div>
      </header>

      <div className="container page">
        {/* ── 2. Our History ── */}
        <section className="about-section" id="our-history" aria-labelledby="history-heading">
          <div className="about-section-header">
            <span className="section-eyebrow">
              <Compass size={14} aria-hidden="true" />
              OUR HISTORY
            </span>
            <h2 id="history-heading">Our History</h2>
          </div>

          <div className="about-story-grid">
            <div className="about-story-text">
              <p>
                Garbaharey Public Library was established and launched on{' '}
                <strong>9 August 2018</strong> with the purpose of promoting knowledge, encouraging
                reading and writing, and strengthening the culture of education within the
                community. From its beginning, the library has aimed to provide a shared space
                where people can explore books, develop their understanding, and appreciate the
                importance of lifelong learning.
              </p>
              <p>
                Its establishment marked an important step in supporting a stronger reading culture
                in Garbaharey and creating opportunities for community members to engage with
                knowledge and education. Over the years, the library's initiatives have included
                reading clubs, literacy campaigns, the <strong>Bun iyo Buug</strong> program, and
                academic discussions designed to encourage reading and the exchange of ideas.
              </p>
              <p>
                Looking ahead, the library continues to pursue opportunities to promote book
                exhibitions and develop services that make knowledge more accessible through
                appropriate technology. Through these efforts, Garbaharey Public Library seeks to
                remain a welcoming center for reading, learning, and community development.
              </p>
            </div>

            <div className="about-story-milestones">
              <h3 className="text-lg font-semibold mb-2">Key Milestones</h3>

              <div className="about-milestone-item">
                <div className="about-milestone-year">2018</div>
                <div className="about-milestone-content">
                  <h4>Founding &amp; Official Launch</h4>
                  <p>
                    The library was established and launched to promote reading, education, and
                    knowledge sharing in the community.
                  </p>
                </div>
              </div>

              <div className="about-milestone-item">
                <div className="about-milestone-year">2020</div>
                <div className="about-milestone-content">
                  <h4>Reading Clubs &amp; Literacy Campaigns</h4>
                  <p>
                    Reading clubs and literacy campaigns encouraged community participation and
                    helped promote a stronger culture of reading.
                  </p>
                </div>
              </div>

              <div className="about-milestone-item">
                <div className="about-milestone-year">2024</div>
                <div className="about-milestone-content">
                  <h4>Bun iyo Buug &amp; Academic Discussions</h4>
                  <p>
                    The <strong>Bun iyo Buug</strong> program and academic discussions created
                    opportunities for reading, exchanging ideas, and engaging in educational
                    conversations.
                  </p>
                </div>
              </div>

              <div className="about-milestone-item">
                <div className="about-milestone-year">2026</div>
                <div className="about-milestone-content">
                  <h4>Book Exhibitions &amp; Library Technology</h4>
                  <p>
                    The library's development priorities include promoting book exhibitions and
                    advancing services in line with modern technology.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Our Founders ── */}
        <section className="about-section" id="our-founders" aria-labelledby="founders-heading">
          <div className="about-section-header">
            <span className="section-eyebrow">
              <Sparkle size={14} aria-hidden="true" />
              OUR FOUNDERS
            </span>
            <h2 id="founders-heading">The People Behind Our Beginning</h2>
            <p className="lead">
              Every institution has a story, and every story has people whose commitment helps bring
              a vision to life. Garbaharey Public Library recognizes its eight founders for their
              contributions to establishing the library and supporting its original purpose of
              promoting reading, education, and knowledge within the community.
            </p>
          </div>

          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
              Meet Our Founders
            </h3>
            <p className="muted" style={{ marginBottom: '20px' }}>
              The following profiles introduce the eight founders of Garbaharey Public Library. Each
              profile highlights an individual’s identity, role, and contribution to the
              establishment or early development of the library.
            </p>

            <div className="about-people-grid">
              {displayFounders.length > 0 ? (
                displayFounders.map((founder) => (
                  <article key={founder.id} className="person-card">
                    <PersonAvatar photo={founder.photo} name={founder.name} icon={UserCheck} />
                    <h4>{founder.name}</h4>
                    <span className="person-card-role">{founder.role}</span>
                    <p className="person-card-bio">{founder.bio}</p>
                  </article>
                ))
              ) : (
                <p className="muted" style={{ gridColumn: '1 / -1', padding: '16px 0' }}>
                  Founding profiles will appear here once published.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── 4. Leadership & Governance: Board of Directors ── */}
        <section className="about-section" id="board-of-directors" aria-labelledby="board-heading">
          <div className="about-section-header">
            <span className="section-eyebrow">
              <ShieldCheck size={14} aria-hidden="true" />
              LEADERSHIP & GOVERNANCE
            </span>
            <h2 id="board-heading">Board of Directors</h2>
            <p className="lead">
              The Board of Directors represents the library’s official governing body and supports
              its institutional direction, accountability, and long-term development. Garbaharey
              Public Library recognizes the twelve individuals currently serving on its official
              board. Their leadership and service contribute to the library’s continued commitment
              to reading, education, knowledge sharing, and community development.
            </p>
          </div>

          <div style={{ marginTop: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
              Meet Our Board of Directors
            </h3>
            <div className="about-people-grid">
              {displayBoard.length > 0 ? (
                displayBoard.map((member) => (
                  <article key={member.id} className="person-card">
                    <PersonAvatar photo={member.photo} name={member.name} icon={Users} />
                    <h4>{member.name}</h4>
                    <span className="person-card-role">{member.position}</span>
                    {member.term && (
                      <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>
                        Term: {member.term}
                      </span>
                    )}
                    {!member.isCurrent && (
                      <span
                        style={{
                          fontSize: '11px',
                          background: 'var(--soft)',
                          color: 'var(--muted)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          display: 'inline-block',
                          marginBottom: '8px',
                        }}
                      >
                        Former Member
                      </span>
                    )}
                    <p className="person-card-bio">{member.bio}</p>
                  </article>
                ))
              ) : (
                <p className="muted" style={{ gridColumn: '1 / -1', padding: '16px 0' }}>
                  Board of Directors profiles will appear here once published.
                </p>
              )}
            </div>
          </div>

          {/* Our Shared Commitment */}
          <div className="about-shared-commitment">
            <h3>Our Shared Commitment</h3>
            <p>
              The founders helped establish the foundation of Garbaharey Public Library, while the
              current Board of Directors supports its governance and continued development.
            </p>
            <p>
              Together with the Director, library staff, and community, their contributions help
              advance the library’s mission of promoting reading, supporting education, and making
              knowledge an important part of community life.
            </p>
          </div>
        </section>

        {/* ── 5. Leadership: Director's Message ── */}
        <section
          className="about-section"
          id="directors-message"
          aria-labelledby="director-heading"
        >
          <div className="about-section-header">
            <span className="section-eyebrow">
              <UserCheck size={14} aria-hidden="true" />
              LEADERSHIP
            </span>
            <h2 id="director-heading">Director’s Message</h2>
          </div>

          <div className="about-director-card">
            <div className="director-portrait-container">
              <div className="director-portrait-card">
                <div className="director-portrait-wrap">
                  <img
                    src={directorMessageData.photo || '/images/director-portrait.webp'}
                    alt={directorMessageData.directorName || 'Library Director'}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = '/images/director-portrait.webp'
                    }}
                  />
                </div>
                <div className="director-portrait-meta">
                  <h4 className="director-portrait-name">
                    {directorMessageData.directorName || 'Library Director'}
                  </h4>
                  <p className="director-portrait-role">
                    {directorMessageData.directorTitle || 'Garbaharey Public Library'}
                  </p>
                </div>
              </div>
            </div>

            <div className="director-message-content">
              <span className="director-badge" style={{ marginBottom: '14px', display: 'inline-flex' }}>
                <CheckCircle2 size={12} aria-hidden="true" />
                {directorMessageData.title || 'Official Welcome'}
              </span>
              <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '14px' }}>
                {directorMessageData.title || 'Official Welcome'}
              </h3>
              {directorMessageData.quoteSomali && (
                <blockquote style={{ fontStyle: 'italic', color: 'var(--text)' }}>
                  “{directorMessageData.quoteSomali}”
                </blockquote>
              )}
              <p style={{ whiteSpace: 'pre-line' }}>{directorMessageData.message}</p>
              <div className="director-signature">
                <div className="director-name">{directorMessageData.directorName || 'Library Director'}</div>
                <div className="director-title">{directorMessageData.directorTitle || 'Garbaharey Public Library'}</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 6 & 7. Our Mission & Our Vision ── */}
        <section className="about-section" id="mission-vision" aria-label="Mission and Vision">
          <div className="about-mv-grid">
            {/* Mission */}
            <div className="about-mv-card" id="our-mission">
              <div className="about-mv-icon">
                <Target size={26} aria-hidden="true" />
              </div>
              <span className="section-eyebrow">OUR PURPOSE</span>
              <h3>Our Mission</h3>
              <p className="about-mv-statement">
                <strong>
                  To promote reading, expand community knowledge, and provide educational resources
                  that support intellectual growth and community development.
                </strong>
              </p>
              <p className="muted" style={{ fontSize: '14px', marginBottom: '12px' }}>
                Our mission is guided by the following priorities:
              </p>
              <ul className="about-mv-list">
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>Encourage reading and writing and strengthen lifelong learning.</span>
                </li>
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>Promote access to books and educational resources.</span>
                </li>
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>
                    Support reading initiatives, educational discussions, and knowledge sharing.
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>
                    Encourage intellectual development and community participation.
                  </span>
                </li>
              </ul>
            </div>

            {/* Vision */}
            <div className="about-mv-card" id="our-vision">
              <div className="about-mv-icon">
                <Compass size={26} aria-hidden="true" />
              </div>
              <span className="section-eyebrow">OUR ASPIRATION</span>
              <h3>Our Vision</h3>
              <p className="about-mv-statement">
                <strong>
                  To become the leading center for knowledge and reading in southern Somalia,
                  inspiring an educated, informed, and progressive society.
                </strong>
              </p>
              <p className="muted" style={{ fontSize: '14px', marginBottom: '12px' }}>
                To advance this vision, we aspire to:
              </p>
              <ul className="about-mv-list">
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>Strengthen the culture of reading throughout the community.</span>
                </li>
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>
                    Encourage reading clubs, literacy campaigns, and educational discussions.
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>Expand opportunities for people to discover books and share knowledge.</span>
                </li>
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>Develop library services that respond to the changing needs of readers.</span>
                </li>
                <li>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  <span>
                    Embrace appropriate technology to improve access to information and learning.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── 8. What We Offer ── */}
        <section className="about-section" id="what-we-offer" aria-labelledby="offer-heading">
          <div className="about-section-header">
            <span className="section-eyebrow">
              <BookOpen size={14} aria-hidden="true" />
              WHAT WE OFFER
            </span>
            <h2 id="offer-heading">Library Services</h2>
            <p className="lead">
              Garbaharey Public Library promotes reading, learning, and knowledge sharing through its
              library resources and community initiatives.
            </p>
          </div>

          <div className="about-offerings-grid">
            {servicesList.map((item, index) => {
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
              Explore Library Services
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* ── 9. Community Reach: Who We Serve ── */}
        <section className="about-section" id="who-we-serve" aria-labelledby="serve-heading">
          <div className="about-section-header">
            <span className="section-eyebrow">
              <Users size={14} aria-hidden="true" />
              COMMUNITY REACH
            </span>
            <h2 id="serve-heading">Who We Serve</h2>
            <p className="lead">
              Garbaharey Public Library welcomes people with different educational needs and
              interests, bringing the community together through reading and learning.
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

        {/* ── 10. Our Core Values ── */}
        <section className="about-section" id="our-core-values" aria-labelledby="values-heading">
          <div className="about-section-header">
            <span className="section-eyebrow">
              <ShieldCheck size={14} aria-hidden="true" />
              OUR CORE VALUES
            </span>
            <h2 id="values-heading">Our Commitment</h2>
          </div>

          <div className="about-commit-grid">
            {coreValues.map((value, idx) => {
              return (
                <div key={idx} className="commit-card">
                  <h3>{value.title}</h3>
                  <p>{value.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── 11. Get Involved: Visit or Join the Library ── */}
        <section className="about-section" id="visit-or-join" aria-labelledby="visit-heading">
          <div className="about-section-header">
            <span className="section-eyebrow">
              <MapPin size={14} aria-hidden="true" />
              GET INVOLVED
            </span>
            <h2 id="visit-heading">Visit or Join the Library</h2>
          </div>

          <div className="about-visit-card">
            <div className="about-visit-details">
              <h3>Garbaharey Public Library</h3>
              <p className="visit-intro">
                Garbaharey Public Library is open to everyone — students, families, educators, and
                community members who want to read, learn, and explore knowledge. Visit us during
                opening hours and discover what your library has to offer.
              </p>

              <div className="visit-info-list">
                <div className="visit-info-row">
                  <MapPin size={20} aria-hidden="true" />
                  <div>
                    <strong>Location</strong>
                    <span>Garbaharey, Gedo, Somalia</span>
                    <small className="muted" style={{ display: 'block', fontSize: '12px' }}>
                      Insert the confirmed street address when available.
                    </small>
                  </div>
                </div>

                <div className="visit-info-row">
                  <Clock size={20} aria-hidden="true" />
                  <div>
                    <strong>Opening Hours</strong>
                    <span>4:00 PM – 6:00 PM</span>
                    <small className="muted" style={{ display: 'block', fontSize: '12px' }}>
                      Please confirm official opening days with library staff.
                    </small>
                  </div>
                </div>

                <div className="visit-info-row">
                  <Phone size={20} aria-hidden="true" />
                  <div>
                    <strong>Telephone</strong>
                    <a href="tel:+252611317333" style={{ color: 'inherit', textDecoration: 'none' }}>
                      +252 61 1317333
                    </a>
                  </div>
                </div>

                <div className="visit-info-row">
                  <Mail size={20} aria-hidden="true" />
                  <div>
                    <strong>Email</strong>
                    <a
                      href="mailto:garbohaarreypubliclibrary@gmail.com"
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      garbohaarreypubliclibrary@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-visit-actions">
              <h4>Become a Member</h4>
              <p>
                Membership at Garbaharey Public Library gives you access to borrowing books,
                participating in library programs, and becoming part of a reading community. Register
                today and start your reading journey.
              </p>
              <Link className="button" to="/join">
                <UserPlus size={18} aria-hidden="true" />
                Join the Library
              </Link>
              <Link className="button secondary" to="/catalog">
                <Search size={18} aria-hidden="true" />
                Browse the Online Catalog
              </Link>
              <Link className="text-link" to="/contact">
                Contact Us
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── 12. Explore Your Library Links ── */}
        <section
          className="about-section"
          style={{
            background: 'var(--soft)',
            padding: '36px 32px',
            borderRadius: 'var(--radius, 12px)',
            border: '1px solid var(--line)',
          }}
        >
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '26px', marginBottom: '8px' }}>
              Explore Your Library
            </h2>
            <p className="muted" style={{ fontSize: '15px', marginBottom: '24px' }}>
              Garbaharey Public Library — A place for good stories, new perspectives, and your next
              chapter.
            </p>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '28px',
              }}
            >
              {[
                { label: 'Browse the Collection', to: '/catalog' },
                { label: 'About the Library', to: '/about' },
                { label: 'Library Services', to: '/services' },
                { label: 'Join the Library', to: '/join' },
                { label: 'Contact the Library', to: '/contact' },
                { label: 'Borrowing Guide and FAQs', to: '/faq' },
                { label: 'My Library Account', to: '/account' },
                { label: 'Membership and Sign In', to: '/login' },
              ].map((lnk) => (
                <Link
                  key={lnk.to + lnk.label}
                  to={lnk.to}
                  className="button secondary small"
                  style={{ fontSize: '13px' }}
                >
                  {lnk.label}
                </Link>
              ))}
            </div>

            <p style={{ fontStyle: 'italic', color: 'var(--accent)', fontWeight: 600 }}>
              “Read something that makes you curious.”
            </p>
            <small className="muted" style={{ display: 'block', marginTop: '6px' }}>
              Developed by <strong>IftiinHub.</strong> &middot; &copy; 2026 Garbaharey Public Library. All rights reserved.
            </small>
          </div>
        </section>

        {/* Dynamic CMS additions (if staff adds additional custom content) */}
        {customAbout.data?.length > 0 && (
          <div className="content-sections about-editable" style={{ marginTop: '40px' }}>
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
