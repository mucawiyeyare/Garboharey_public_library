import Brand from '../components/common/Brand'
import ThemeButton from '../components/common/ThemeButton'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { withDirector } from '../utils/roles'
import {
  LayoutDashboard,
  Library,
  Users,
  ArrowRightLeft,
  ClipboardList,
  BarChart3,
  Settings2,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  Bell,
  Boxes,
  HeartHandshake,
  ChevronDown,
  PackagePlus,
  CalendarPlus,
  CalendarDays,
  Wallet,
  LineChart,
  Receipt,
  TrendingDown,
  PiggyBank,
  Gift,
  ListOrdered,
  BookText,
  FileBarChart,
  SlidersHorizontal,
  Landmark,
  Award,
  BookOpen,
} from 'lucide-react'
import { useAuth } from '../context/AuthProvider'
import ProfileMenu from './ProfileMenu'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../components/common/LanguageSelector'
const staffLinks = [
  // 01 · DAILY OVERVIEW
  { to: '/staff', label: 'overview', title: 'Overview', access: 'all', icon: LayoutDashboard },
  { to: '/staff/notifications', label: 'notifications', title: 'Notifications', access: 'ops', icon: Bell, badge: true },

  // 02 · COLLECTION MANAGEMENT
  { to: '/staff/stock', label: 'inventory', title: 'Inventory', access: 'all', icon: Boxes },
  { to: '/staff/inventory', label: 'booksAndCopies', title: 'Books & Copies', access: 'ops', icon: Library },
  { to: '/staff/categories', label: 'categories', title: 'Categories', access: 'ops', icon: Library },
  { to: '/staff/authors', label: 'authors', title: 'Authors', access: 'ops', icon: Library },
  { to: '/staff/publishers', label: 'publishers', title: 'Publishers', access: 'ops', icon: Library },
  { to: '/staff/acquisitions', label: 'acquisition', title: 'Acquisition', access: 'ops', icon: PackagePlus },

  // 03 · MEMBERSHIP
  { to: '/staff/applications', label: 'applications', title: 'Applications', access: 'mgmt', icon: ClipboardList },
  { to: '/staff/members', label: 'members', title: 'Members', access: 'ops', icon: Users },

  // 04 · CIRCULATION & SERVICES
  { to: '/staff/circulation', label: 'circulation', title: 'Circulation', access: 'ops', icon: ArrowRightLeft },
  { to: '/staff/reservations', label: 'reservations', title: 'Reservations', access: 'ops', icon: ClipboardList },
  { to: '/staff/services', label: 'services', title: 'Services', access: 'ops', icon: HeartHandshake },

  // 05 · FINANCE
  {
    to: '/staff/finance',
    label: 'finance',
    title: 'Finance',
    access: 'admin',
    icon: Wallet,
    isGroup: true,
    children: [
      { to: '/staff/finance/income', label: 'incomeReceipts', title: 'Income / Receipts', access: 'admin', icon: Receipt },
      { to: '/staff/finance/expenses', label: 'expenses', title: 'Expenses', access: 'admin', icon: TrendingDown },
      { to: '/staff/finance/budgets', label: 'budgets', title: 'Budgets', access: 'admin', icon: PiggyBank },
      { to: '/staff/finance/donations', label: 'donationsFunding', title: 'Donations & Funding', access: 'admin', icon: Gift },
      { to: '/staff/finance/transactions', label: 'financialTransactions', title: 'Financial Transactions', access: 'admin', icon: ListOrdered },
      { to: '/staff/finance/reports', label: 'financialReports', title: 'Financial Reports', access: 'admin', icon: FileBarChart },
      { to: '/staff/finance/settings', label: 'financeSettings', title: 'Finance Settings', access: 'admin', icon: SlidersHorizontal },
    ],
  },
  { to: '/staff/fines', label: 'fines', title: 'Fines', access: 'mgmt', icon: Receipt },

  // 06 · WEBSITE MANAGEMENT
  { to: '/staff/content', label: 'siteContent', title: 'Site Content', access: 'ops', icon: ClipboardList },
  { to: '/staff/events', label: 'manageEvents', title: 'Manage Events', access: 'ops', icon: CalendarDays },
  { to: '/staff/contact', label: 'contact', title: 'Contact Messages', access: 'ops', icon: ClipboardList },
  { to: '/staff/governance', label: 'leadershipGovernance', title: 'Leadership & Governance', access: 'admin', icon: Landmark },

  // 07 · REPORTS & ADMINISTRATION
  { to: '/staff/reports', label: 'reports', title: 'Reports', access: 'mgmt', icon: BarChart3 },
  { to: '/staff/users', label: 'users', title: 'Users', access: 'admin', icon: ShieldCheck },
  { to: '/staff/policies', label: 'policies', title: 'Loan Policies', access: 'admin', icon: Settings2 },
]

// Which roles see each group of links (the API enforces the same limits).
// Directors see everything administrators see.
const accessRoles = Object.fromEntries(
  Object.entries({
    all: ['admin', 'librarian'],
    ops: ['admin', 'librarian'],
    mgmt: ['admin', 'librarian'],
    audit: ['admin'],
    admin: ['admin'],
  }).map(([group, roles]) => [group, withDirector(roles)]),
)

export default function StaffLayout() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [financeOpen, setFinanceOpen] = useState(true)
  const location = useLocation()

  useEffect(() => {
    if (location.pathname.startsWith('/staff/finance')) {
      setFinanceOpen(true)
    }
  }, [location.pathname])

  // Unread staff notifications (e.g. borrowing time ended), refreshed every minute.
  const unread = useQuery({
    queryKey: ['staff-notifications-unread'],
    queryFn: () => api('/staff/notifications/unread'),
    refetchInterval: 60_000,
    enabled: !!user && user.role !== 'member',
  })

  const allLinks = staffLinks.flatMap((l) => (l.isGroup ? [l, ...l.children] : [l]))
  const current = allLinks.find(
    (link) =>
      link.to === location.pathname ||
      (link.to === '/staff/stock' && location.pathname.startsWith('/staff/book/')) ||
      (link.to === '/staff/governance' && location.pathname.startsWith('/staff/governance')) ||
      (link.to === '/staff/finance' && location.pathname === '/staff/finance') ||
      (link.to === '/staff/users' && (location.pathname === '/staff/users' || location.pathname === '/staff/team')),
  )

  const visibleLinks = staffLinks.filter((link) => accessRoles[link.access]?.includes(user?.role))

  const renderLink = ({ to, label, title, icon: Icon, badge }) => {
    const isCurrent =
      location.pathname === to ||
      (to === '/staff' && location.pathname === '/staff') ||
      (to === '/staff/stock' && (location.pathname === '/staff/stock' || location.pathname.startsWith('/staff/book/'))) ||
      (to === '/staff/governance' && location.pathname.startsWith('/staff/governance')) ||
      (to === '/staff/users' && (location.pathname === '/staff/users' || location.pathname === '/staff/team'))

    return (
      <NavLink
        key={to}
        to={to}
        end={to === '/staff' || to === '/staff/events'}
        className={({ isActive }) => (isActive || isCurrent ? 'active' : '')}
        onClick={() => setOpen(false)}
      >
        <Icon size={18} aria-hidden="true" />
        <span>{t(`nav.${label}`, title)}</span>
        {badge && unread.data?.count > 0 && <span className="nav-badge">{unread.data.count}</span>}
      </NavLink>
    )
  }

  return (
    <div className="workspace">
      <a className="skip-link" href="#main">
        {t('nav.skipToContent')}
      </a>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand-header">
          <Brand />
        </div>
        <p className="sidebar-label">{t('nav.workspace')}</p>
        <nav aria-label={t('nav.staff')}>
          {visibleLinks.map((link) => {
            if (link.isGroup) {
              return (
                <div key={link.to} className={`nav-group${financeOpen ? ' open' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <NavLink
                      to={link.to}
                      end
                      className={({ isActive }) => (isActive ? 'active' : '')}
                      style={{ flex: 1 }}
                      onClick={() => {
                        setFinanceOpen(true)
                        setOpen(false)
                      }}
                    >
                      <link.icon size={18} aria-hidden="true" />
                      <span>{t(`nav.${link.label}`, link.title)}</span>
                    </NavLink>
                    <button
                      type="button"
                      className="icon-button"
                      style={{
                        padding: '6px 8px',
                        border: 0,
                        background: 'transparent',
                        color: 'var(--muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label="Toggle finance submenu"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setFinanceOpen((prev) => !prev)
                      }}
                    >
                      <ChevronDown
                        size={15}
                        style={{
                          transform: financeOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s ease',
                        }}
                      />
                    </button>
                  </div>
                  {financeOpen && (
                    <div className="nav-group-items">
                      {link.children
                        .filter((child) => accessRoles[child.access]?.includes(user?.role))
                        .map(renderLink)}
                    </div>
                  )}
                </div>
              )
            }
            return renderLink(link)
          })}
        </nav>
        <div className="sidebar-preferences">
          <LanguageSelector />
        </div>
        <div className="sidebar-footer">
          <button
            type="button"
            onClick={() => {
              void signOut().catch((error) => toast.error(error.message))
            }}
          >
            <LogOut size={18} aria-hidden="true" />
            {t('nav.signOut')}
          </button>
        </div>
      </aside>
      {open && (
        <div
          className="sidebar-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className="workspace-content">
        <header className="workspace-header">
          <div className="flex items-center gap-3">
            <button
              className="icon-button mobile-menu"
              onClick={() => setOpen(!open)}
              aria-label={t('nav.toggleStaff')}
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span>
              {t('nav.workspaceCrumb')} <span className="muted">/</span>{' '}
              <strong>
                {current
                  ? t(`nav.${current.label}`, current.title)
                  : location.pathname === '/staff/profile'
                    ? t('nav.myProfile')
                    : t('nav.overview')}
              </strong>
            </span>
          </div>
          <div className="nav-actions">
            <LanguageSelector />
            <ThemeButton />
            <ProfileMenu />
          </div>
        </header>
        <main id="main" className="staff-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
