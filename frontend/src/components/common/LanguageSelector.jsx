import { useTranslation } from 'react-i18next'
import { languages, setLanguage } from '../../i18n'
import { useAuth } from '../../context/AuthProvider'
import { savePreferences } from '../../utils/preferences'
const short = { en: 'EN', so: 'SO', ar: 'AR' }
// Language dropdown selector
export default function LanguageSelector() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  return (
    <select
      aria-label={t('language.label')}
      value={i18n.language}
      onChange={(e) => {
        const lng = e.target.value
        void setLanguage(lng)
        if (user) void savePreferences({ lang: lng })
      }}
      style={{
        border: '1px solid var(--color-border, #d1d5db)',
        borderRadius: '6px',
        padding: '4px 8px',
        fontSize: '0.875rem',
        fontWeight: '600',
        background: 'var(--color-surface, #fff)',
        color: 'var(--color-text, #111)',
        cursor: 'pointer',
      }}
    >
      {languages.map((lng) => (
        <option key={lng} value={lng} lang={lng}>
          {short[lng]}
        </option>
      ))}
    </select>
  )
}
