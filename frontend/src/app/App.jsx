import { useTranslation } from 'react-i18next'
import { Link, Navigate, Route, Routes } from 'react-router-dom'

// Layouts
import PublicLayout from '../layouts/PublicLayout'
import MemberLayout from '../layouts/MemberLayout'
import LibrarianLayout from '../layouts/LibrarianLayout'

// Auth / Route guards
import Protected from '../routes/ProtectedRoute'
import RoleDashboard from '../routes/RoleDashboard'
import ScrollToTop from '../routes/ScrollToTop'
import { useAuth } from '../context/AuthProvider'
import { getDashboardPath } from '../utils/roles'
import { Loading } from '../components/common/ui'

// Auth pages (live in features/auth/)
import Recovery from '../features/auth/RecoveryPage'

// Public pages
import Home from '../pages/public/Home'
import About from '../pages/public/About'
import Services from '../pages/public/Services'
import HowToJoin from '../pages/public/HowToJoin'
import News, { NewsDetailPage } from '../pages/public/NewsEvents'
import Events from '../pages/public/Events'
import EventDetails from '../pages/public/EventDetails'
import Catalog from '../pages/public/Catalog'
import SignIn from '../pages/public/SignIn'
import Contact from '../pages/public/Contact'

// Member pages
import MemberDashboard from '../pages/member/Dashboard'
import MyBooks from '../pages/member/MyBooks'
import MemberReservations from '../pages/member/Reservations'
import BorrowingHistory from '../pages/member/BorrowingHistory'
import MemberProfile from '../pages/member/Profile'
import { BookDetails } from '../pages/member/BrowseBooks'
import { MemberFines, MemberNotifications, ReadingList } from '../pages/member/MyBooks'
import InventoryPage from '../features/catalog/InventoryPage'
import AcquisitionPage from '../features/catalog/AcquisitionPage'
import {
  BudgetsPage,
  CashbookPage,
  DonationsPage,
  ExpensesPage,
  FinanceDashboard,
  FinanceSettingsPage,
  IncomePage,
  ReportsPage as FinanceReportsPage,
  TransactionsPage,
} from '../features/finance/FinancePages'
import StaffNotificationsPage from '../features/circulation/StaffNotificationsPage'

// Librarian / Staff pages
import Books from '../pages/librarian/Books'
import Members from '../pages/librarian/Members'
import Borrowing from '../pages/librarian/Borrowing'
import StaffReservations from '../pages/librarian/Reservations'
import Reports from '../pages/librarian/Reports'
import Fines from '../pages/librarian/Fines'
import Categories from '../pages/librarian/Categories'
import Authors from '../pages/librarian/Authors'
import Publishers from '../pages/librarian/Publishers'

// Admin pages
import AuditLog from '../pages/administrator/AuditLogs'
import LibrarySettings from '../pages/administrator/Settings'
import AdminDashboard from '../pages/administrator/Dashboard'

// Features used as pages (no dedicated page file yet)
import ContentManager from '../features/catalog/ContentManagerPage'
import Taxonomy from '../features/catalog/TaxonomyPage'
import Applications from '../features/members/ApplicationsPage'
import ContactMessages from '../features/members/ContactMessagesPage'
import Join from '../features/members/JoinPage'
import EventsPage from '../features/catalog/EventsPage'
import Policies from '../features/auth/PoliciesPage'
import Faq from '../features/catalog/FaqPage'
import LeadershipGovernancePage from '../features/governance/LeadershipGovernancePage'

function DashboardRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" state={{ from: '/dashboard' }} replace />
  return <Navigate to={getDashboardPath(user)} replace />
}

function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="container page">
      <h1>{t('ui.notFound.title', '404 – Page not found')}</h1>
      <p className="muted">
        {t('ui.notFound.text', 'The page you are looking for does not exist.')}
      </p>
      <Link className="button" to="/">
        {t('ui.notFound.home', 'Go home')}
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ── Direct dashboard navigation: completely outside PublicLayout so public navbar is never rendered ── */}
        <Route path="dashboard" element={<DashboardRedirect />} />
        <Route path="dashboard/*" element={<DashboardRedirect />} />

        {/* ── Member routes (any signed-in user) ── */}
        <Route element={<Protected member />}>
          <Route path="account" element={<MemberLayout />}>
            <Route index element={<MemberDashboard />} />
            <Route path="browse" element={<Catalog />} />
            <Route path="book/:bookId" element={<BookDetails />} />
            <Route path="books" element={<MyBooks />} />
            <Route path="reservations" element={<MemberReservations />} />
            <Route path="history" element={<BorrowingHistory />} />
            <Route path="fines" element={<MemberFines />} />
            <Route path="reading-list" element={<ReadingList />} />
            <Route path="notifications" element={<MemberNotifications />} />
            <Route path="profile" element={<MemberProfile />} />
            <Route path="settings" element={<MemberProfile />} />
            <Route path="*" element={<Navigate to="/account" replace />} />
          </Route>
        </Route>

        {/* ── Staff routes (librarian / director / admin) ── */}
        <Route element={<Protected staff />}>
          <Route path="staff" element={<LibrarianLayout />}>
            <Route index element={<RoleDashboard />} />
            <Route path="profile" element={<MemberProfile />} />
            <Route path="stock" element={<InventoryPage />} />
            <Route path="book/:bookId" element={<BookDetails />} />

            {/* Librarian + Admin */}
            <Route element={<Protected roles={['admin', 'librarian']} />}>
              <Route path="inventory" element={<Books />} />
              <Route path="members" element={<Members />} />
              <Route path="circulation" element={<Borrowing />} />
              <Route path="reservations" element={<StaffReservations />} />
              <Route path="content" element={<ContentManager />} />
              <Route path="services" element={<ContentManager only="service" key="services" />} />
              <Route path="notifications" element={<StaffNotificationsPage />} />
              <Route path="acquisitions" element={<AcquisitionPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="events/new" element={<EventsPage create />} />
              <Route path="categories" element={<Taxonomy kind="categories" />} />
              <Route path="authors" element={<Taxonomy kind="authors" />} />
              <Route path="publishers" element={<Taxonomy kind="publishers" />} />
              <Route path="contact" element={<ContactMessages />} />
            </Route>

            {/* Librarian + Director + Admin */}
            <Route element={<Protected roles={['admin', 'librarian', 'director']} />}>
              <Route path="reports" element={<Reports />} />
              <Route path="fines" element={<Fines />} />
              <Route path="applications" element={<Applications />} />
            </Route>

            {/* Admin + Director */}
            <Route element={<Protected roles={['admin', 'director']} />}>
              <Route path="audit" element={<AuditLog />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="governance" element={<LeadershipGovernancePage />} />
              <Route path="governance/:tab" element={<LeadershipGovernancePage />} />
            </Route>

            {/* Admin only */}
            <Route element={<Protected admin />}>
              <Route path="team" element={<Members team />} />
              <Route path="users" element={<Members team />} />
              <Route path="finance" element={<FinanceDashboard />} />
              <Route path="finance/income" element={<IncomePage />} />
              <Route path="finance/expenses" element={<ExpensesPage />} />
              <Route path="finance/budgets" element={<BudgetsPage />} />
              <Route path="finance/donations" element={<DonationsPage />} />
              <Route path="finance/transactions" element={<TransactionsPage />} />
              <Route path="finance/cashbook" element={<CashbookPage />} />
              <Route path="finance/reports" element={<FinanceReportsPage />} />
              <Route path="finance/settings" element={<FinanceSettingsPage />} />
              <Route path="policies" element={<Policies />} />
              <Route path="settings" element={<LibrarySettings />} />
            </Route>
            <Route path="*" element={<Navigate to="/staff" replace />} />
          </Route>
        </Route>

        {/* ── Public routes ── */}
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="help" element={<Contact />} />
          <Route path="contact" element={<Contact />} />
          <Route path="services" element={<Services />} />
          <Route path="how-to-join" element={<HowToJoin />} />
          <Route path="join" element={<Join />} />
          <Route path="news" element={<News />} />
          <Route path="news/:id" element={<NewsDetailPage />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:id" element={<EventDetails />} />
          <Route path="faq" element={<Faq />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="book/:bookId" element={<BookDetails />} />
          <Route path="login" element={<SignIn />} />
          <Route path="register" element={<Navigate to="/join" replace />} />
          <Route path="forgot-password" element={<Recovery />} />
          <Route path="reset-password" element={<Recovery />} />
          <Route path="verify-email" element={<Recovery />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}
