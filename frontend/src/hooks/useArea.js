import { useLocation } from 'react-router-dom'

// Which part of the site a page is shown in, so links keep people inside their dashboard.
// Returns '/account' (member portal), '/staff' (staff workspace) or '' (public website).
export function useArea() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/account')) return '/account'
  if (pathname.startsWith('/staff')) return '/staff'
  return ''
}

export const bookPath = (area, id) => `${area}/book/${id}`
export const browsePath = (area) => (area ? `${area}/browse` : '/catalog')
