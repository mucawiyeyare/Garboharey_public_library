import i18n from '../i18n'
// Dates follow the selected language; the library runs on East Africa Time.
export function formatDate(value) {
  try {
    if (!value) return ''
    const d = new Date(value)
    if (isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-GB' : i18n.language, {
      dateStyle: 'medium',
      timeZone: 'Africa/Mogadishu',
    }).format(d)
  } catch {
    return ''
  }
}
