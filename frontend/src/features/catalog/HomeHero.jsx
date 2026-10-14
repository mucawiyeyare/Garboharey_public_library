import { useLibrarySettings, defaultLibrary } from '../../hooks/useLibrarySettings'
import { ArrowRight, ArrowUpRight, Search } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '../../components/common/primitives/input'
import { Button } from '../../components/common/primitives/button'
import './hero.css'

// Background photos, shown one after another.
const slides = [
  '/images/hero-reading-hall.webp',
  '/images/hero-bookshelves.webp',
  '/images/hero-library.webp',
]
const SLIDE_MS = 5000

export default function HomeHero({ categories }) {
  const { t } = useTranslation()
  const library = useLibrarySettings()
  const navigate = useNavigate()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const name = library.data?.name ?? defaultLibrary.name
  // The first photo uses the original hero text; the others have their own.
  const text = (key) =>
    active === 0 ? t(`hero.${key}`, { name }) : t(`hero.slideText.${active - 1}.${key}`, { name })
  useEffect(() => {
    if (paused) return
    const timer = setTimeout(() => setActive((index) => (index + 1) % slides.length), SLIDE_MS)
    return () => clearTimeout(timer)
  }, [active, paused])
  return (
    <section
      className="library-hero"
      aria-labelledby="home-title"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="library-hero-slides" aria-hidden="true">
        {slides.map((src, index) => (
          <img
            key={src}
            className={`library-hero-image${index === active ? ' active' : ''}`}
            src={src}
            alt=""
            fetchPriority={index === 0 ? 'high' : 'low'}
            loading={index === 0 ? 'eager' : 'lazy'}
          />
        ))}
      </div>
      <div className="library-hero-dots" role="group" aria-label={t('hero.slides', 'Photos')}>
        {slides.map((src, index) => (
          <button
            key={src}
            type="button"
            aria-label={t('hero.slide', { number: index + 1, defaultValue: `Photo ${index + 1}` })}
            aria-pressed={index === active}
            onClick={() => setActive(index)}
          />
        ))}
      </div>
      <div className="library-hero-content">
        {/* Re-keyed per photo so the words fade in with each new image. */}
        <div className="library-hero-text" key={active} aria-live="polite">
          <p className="eyebrow">{text('eyebrow')}</p>
          <h1 id="home-title">
            {text('titleStart')} <span>{text('titleAccent')}</span>
          </h1>
          <p className="library-hero-intro">{text('intro')}</p>
        </div>
        <form
          className="library-hero-search"
          onSubmit={(event) => {
            event.preventDefault()
            const query = new FormData(event.currentTarget).get('query')
            navigate(`/catalog?q=${encodeURIComponent(String(query ?? '').trim())}`)
          }}
        >
          <label className="sr-only" htmlFor="home-search">
            {t('hero.searchLabel')}
          </label>
          <Search size={21} aria-hidden="true" />
          <Input id="home-search" name="query" placeholder={t('hero.searchPlaceholder')} />
          <Button type="submit">
            {t('hero.find')} <ArrowRight size={18} aria-hidden="true" />
          </Button>
        </form>
        <div className="library-hero-topics">
          <span>{t('hero.follow')}</span>
          <div>
            {categories.slice(0, 4).map((category) => (
              <Link key={category._id} to={`/catalog?category=${category._id}`}>
                {category.name}
                <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
        <Link to="/about" className="library-hero-about">
          {t('hero.about')} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
