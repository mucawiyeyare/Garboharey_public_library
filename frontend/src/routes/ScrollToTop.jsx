import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Opening another page starts at its top (browsers otherwise keep the previous scroll position).
// Links to a section (#id) scroll to that section instead.
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])
  return null
}
