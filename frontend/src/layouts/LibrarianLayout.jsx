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
} from 'lucide-react'
import { useAuth } from '../context/AuthProvider'
import ProfileMenu from './ProfileMenu'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../components/common/LanguageSelector'
const staffLinks = [
  { to: '/staff', label: 'overview', access: 'all', icon: LayoutDashboard },
  { to: '/staff/notifications', label: 'notifications', access: 'ops', icon: Bell, badge: true },
  { to: '/staff/stock', label: 'inventory', access: 'all', icon: Boxes },
  { to: '/staff/inventory', label: 'books', access: 'ops', icon: Library },
  { to: '/staff/categories', label: 'categories', access: 'ops', icon: Library },
  { to: '/staff/authors', label: 'authors', access: 'ops', icon: Library },
  { to: '/staff/publishers', label: 'publishers', access: 'ops', icon: Library },
  // Collection: its own section in the sidebar, for acquisition records only
  {
    to: '/staff/acquisitions',
    label: 'acquisition',
    access: 'ops',
    icon: PackagePlus,
    group: 'collection',
  },
  { to: '/staff/members', label: 'members', access: 'ops', icon: Users },
  { to: '/staff/circulation', label: 'circulation', access: 'ops', icon: ArrowRightLeft },
  { to: '/staff/reservations', label: 'reservations', access: 'ops', icon: ClipboardList },
  { to: '/staff/fines', label: 'fines', access: 'mgmt', icon: ClipboardList },
  { to: '/staff/applications', label: 'applications', access: 'mgmt', icon: ClipboardList },
  { to: '/staff/services', label: 'services', access: 'ops', icon: HeartHandshake },
  { to: '/staff/content', label: 'siteContent', access: 'ops', icon: ClipboardList },
  { to: '/staff/events/new', label: 'createEvent', access: 'ops', icon: CalendarPlus },
  { to: '/staff/events', label: 'manageEvents', access: 'ops', icon: CalendarDays },
  { to: '/staff/contact', label: 'contact', access: 'ops', icon: ClipboardList },
  { to: '/staff/reports', label: 'reports', access: 'mgmt', icon: BarChart3 },
  { to: '/staff/team', label: 'team', access: 'admin', icon: ShieldCheck },
  { to: '/staff/audit', label: 'audit', access: 'audit', icon: ShieldCheck },
  { to: '/staff/policies', label: 'policies', access: 'admin', icon: Settings2 },
  // Finance (administrators and directors)
  {
    to: '/staff/finance',
    label: 'financeDashboard',
    access: 'admin',
    icon: LineChart,
    group: 'finance',
  },
  {
    to: '/staff/finance/income',
    label: 'income',
    access: 'admin',
    icon: Receipt,
    group: 'finance',
  },
  {
    to: '/staff/finance/expenses',
    label: 'expenses',
    access: 'admin',
    icon: TrendingDown,
    group: 'finance',
  },
  {
    to: '/staff/finance/budgets',
    label: 'budgets',
    access: 'admin',
    icon: PiggyBank,
    group: 'finance',
  },
  {
    to: '/staff/finance/donations',
    label: 'donations',
    access: 'admin',
    icon: Gift,
    group: 'finance',
  },
  {
    to: '/staff/finance/transactions',
    label: 'transactions',
    access: 'admin',
    icon: ListOrdered,
    group: 'finance',
  },
  {
    to: '/staff/finance/cashbook',
    label: 'cashbook',
    access: 'admin',
    icon: BookText,
    group: 'finance',
  },
  {
    to: '/staff/finance/reports',
    label: 'financeReports',
    access: 'admin',
    icon: FileBarChart,
    group: 'finance',
  },
  {
    to: '/staff/finance/settings',
    label: 'financeSettings',
    access: 'admin',
    icon: SlidersHorizontal,
    group: 'finance',
  },
]
// Collapsible sidebar groups
const groups = {
  collection: { label: 'collection', fallback: 'Collection', icon: Library },
  finance: { label: 'finance', fallback: 'Finance', icon: Wallet },
}
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
  const location = useLocation()
  const path = location.pathname.startsWith('/staff/book/') ? '/staff/stock' : location.pathname
  const current = staffLinks.find((link) => link.to === path)
  // A group starts open when one of its pages is showing.
  const currentGroup = current?.group
  const [openGroups, setOpenGroups] = useState(() => (currentGroup ? { [currentGroup]: true } : {}))
  useEffect(() => {
    if (currentGroup) setOpenGroups((state) => ({ ...state, [currentGroup]: true }))
  }, [currentGroup])
  const visible = staffLinks.filter((link) => accessRoles[link.access].includes(user?.role))
  const renderLink = ({ to, label, icon: Icon, badge }) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/staff' || to === '/staff/events' || to === '/staff/finance'}
      onClick={() => setOpen(false)}
    >
      <Icon size={19} />
      {t(`nav.${label}`)}
      {badge && unread.data?.count > 0 && <span className="nav-badge">{unread.data.count}</span>}
    </NavLink>
  )
  // Unread staff notifications (e.g. borrowing time ended), refreshed every minute.
  const unread = useQuery({
    queryKey: ['staff-notifications-unread'],
    queryFn: () => api('/staff/notifications/unread'),
    refetchInterval: 60_000,
    enabled: !!user && user.role !== 'member',
  })
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
          {visible.map((link) => {
            if (!link.group) return renderLink(link)
            // Render a whole group once, where its first link would be.
            const members = visible.filter((item) => item.group === link.group)
            if (link !== members[0]) return null
            const { label, fallback, icon: GroupIcon } = groups[link.group]
            const isOpen = !!openGroups[link.group]
            return (
              <div key={link.group} className={`nav-group${isOpen ? ' open' : ''}`}>
                <button
                  type="button"
                  className={`nav-group-toggle${currentGroup === link.group ? ' active' : ''}`}
                  aria-expanded={isOpen}
                  onClick={() => setOpenGroups((state) => ({ ...state, [link.group]: !isOpen }))}
                >
                  <GroupIcon size={19} />
                  {t(`nav.${label}`, fallback)}
                  <ChevronDown size={16} className="nav-group-chevron" aria-hidden="true" />
                </button>
                {isOpen && <div className="nav-group-items">{members.map(renderLink)}</div>}
              </div>
            )
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
                  ? t(`nav.${current.label}`)
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
