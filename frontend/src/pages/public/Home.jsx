import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../../services/api'
import { ErrorState, Loading } from '../../components/common/ui'
import HomeHero from './components/HomeHero'
import LibraryGuide from './components/LibraryGuide'
import MembershipBanner from './components/MembershipBanner'
import {
  Announcements,
  BookShelf,
  HoursAndContact,
  PopularCategories,
  ServicesPreview,
  StatsBand,
} from './components/HomeSections'
import '../../features/catalog/content.css'
import '../../features/catalog/home.css'

// The home page shows a short preview of each section; "view all" links open the full pages.
const PREVIEW = 3

export default function HomePage() {
  const { t, i18n } = useTranslation()
  const home = useQuery({
    queryKey: ['home', i18n.language],
    queryFn: () => api(`/books/home?lang=${i18n.language}`),
  })
  const data = home.data
  return (
    <div className="home-page">
      <HomeHero categories={data?.categories ?? []} />
      <div className="container">
        {home.isPending ? (
          <Loading />
        ) : home.error ? (
          <ErrorState error={home.error} retry={() => void home.refetch()} />
        ) : (
          <>
            <StatsBand stats={data.stats} />
            <BookShelf
              id="featured-title"
              eyebrow={t('home.featuredEyebrow')}
              title={t('home.featuredTitle')}
              books={data.featured.slice(0, PREVIEW)}
            />
            <BookShelf
              id="recent-title"
              eyebrow={t('home.recentEyebrow')}
              title={t('home.recentTitle')}
              intro={t('home.recentIntro')}
              books={data.recent.slice(0, PREVIEW)}
            />
            <PopularCategories categories={data.categories} />
            <ServicesPreview services={data.services.slice(0, PREVIEW)} />
            <Announcements items={data.announcements.slice(0, PREVIEW)} />
            <HoursAndContact />
          </>
        )}
        <LibraryGuide />
        <MembershipBanner />
      </div>
    </div>
  )
}
