import * as Dialog from '@radix-ui/react-dialog'
import { LogIn, Menu, UserPlus, UserRound, X } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSelector from '../components/common/LanguageSelector'
import Brand from '../components/common/Brand'
import { useAuth } from '../context/AuthProvider'
// Menu panel for phones, tablets and small laptops. It ends with the same Sign in and
// Join the Library buttons as the large-screen header.
export default function MobileNavigation() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1101px)')
    const closeOnDesktop = () => {
      if (query.matches) setOpen(false)
    }
    query.addEventListener('change', closeOnDesktop)
    return () => query.removeEventListener('change', closeOnDesktop)
  }, [])
  const links = [
    ['/', t('nav.home')],
    ['/about', t('nav.about')],
    ['/catalog', t('nav.catalog')],
    ['/services', t('nav.services')],
    ['/events', t('nav.events')],
    ['/rules', t('nav.rules')],
    ['/contact', t('nav.contactUs')],
    ['/faq', t('nav.faq')],
  ]
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="icon-button mobile-menu" aria-label={t('nav.toggle')}>
          <Menu size={22} aria-hidden="true" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="navigation-overlay" />
        <Dialog.Content className="navigation-sidebar" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">{t('nav.libraryNavigation')}</Dialog.Title>
          <div className="navigation-sidebar-heading">
            <Brand />
            <Dialog.Close className="icon-button" aria-label={t('nav.close')}>
              <X size={22} aria-hidden="true" />
            </Dialog.Close>
          </div>
          <nav aria-label={t('nav.mobile')}>
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="navigation-actions">
            <Link
              className="button secondary"
              to={!user ? '/login' : user.role === 'member' ? '/account' : '/staff'}
              onClick={() => setOpen(false)}
            >
              {user ? (
                <UserRound size={18} aria-hidden="true" />
              ) : (
                <LogIn size={18} aria-hidden="true" />
              )}
              {!user
                ? t('nav.signIn')
                : user.role === 'member'
                  ? t('nav.myLibrary')
                  : t('nav.staffWorkspace')}
            </Link>
            <Link className="button" to="/join" onClick={() => setOpen(false)}>
              <UserPlus size={18} aria-hidden="true" />
              {t('nav.join', 'Join the Library')}
            </Link>
          </div>
          <div className="sidebar-preferences">
            <LanguageSelector />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
