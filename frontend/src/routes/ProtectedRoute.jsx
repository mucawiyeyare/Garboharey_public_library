import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { Loading } from '../components/common/ui'
import { isAdmin, withDirector } from '../utils/roles'
// `staff` admits every non-member; `roles` limits a group of routes to specific roles.
// The API enforces the same rules; this only keeps people out of pages they cannot use.
export default function Protected({ staff = false, member = false, admin = false, roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (staff && user.role === 'member') return <Navigate to="/account" replace />
  if (member && user.role !== 'member') return <Navigate to="/staff" replace />
  if (admin && !isAdmin(user)) return <Navigate to="/staff" replace />
  if (roles && !withDirector(roles).includes(user.role)) return <Navigate to="/staff" replace />
  return <Outlet />
}
