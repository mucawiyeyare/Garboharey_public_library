import { useEffect, useState } from 'react'
import { Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { applyTheme, storedTheme } from '../../utils/theme'
import { useAuth } from '../../context/AuthProvider'
import { savePreferences } from '../../utils/preferences'

// Single toggle icon for Dark / Light mode (the other icons are removed).
export default function ThemeButton() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [theme, setTheme] = useState(storedTheme)
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.dataset.theme === 'dark'
    }
    return storedTheme() === 'dark'
  })

  useEffect(() => {
    applyTheme(theme)
    const dark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    setIsDark(dark)
    window.dispatchEvent(new Event('biblioteca-preferences'))

    if (theme !== 'system') return
    const query = matchMedia('(prefers-color-scheme: dark)')
    const follow = () => {
      applyTheme('system')
      setIsDark(query.matches)
    }
    query.addEventListener('change', follow)
    return () => query.removeEventListener('change', follow)
  }, [theme])

  useEffect(() => {
    const sync = () => {
      const current = storedTheme()
      setTheme(current)
      setIsDark(document.documentElement.dataset.theme === 'dark')
    }
    window.addEventListener('biblioteca-preferences', sync)
    return () => window.removeEventListener('biblioteca-preferences', sync)
  }, [])

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
    setIsDark(next === 'dark')
    if (user) void savePreferences({ theme: next })
    window.dispatchEvent(new Event('biblioteca-preferences'))
  }

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      aria-label={t(isDark ? 'theme.light' : 'theme.dark', isDark ? 'Switch to light mode' : 'Switch to dark mode')}
      title={t(isDark ? 'theme.light' : 'theme.dark', isDark ? 'Switch to light mode' : 'Switch to dark mode')}
      aria-pressed={isDark}
      onClick={toggleTheme}
    >
      <Sun size={18} aria-hidden="true" className={isDark ? 'theme-sun-active' : ''} />
    </button>
  )
}
