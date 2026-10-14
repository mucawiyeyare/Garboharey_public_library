import { useAuth } from '../context/AuthProvider'
import { isAdmin } from '../utils/roles'
import AdminDashboard from '../pages/administrator/Dashboard'
import LibrarianDashboard from '../pages/librarian/Dashboard'

// Each staff role lands on its own dashboard; members use /account.
export default function RoleDashboard() {
  const { user } = useAuth()
  if (isAdmin(user)) return <AdminDashboard />
  return <LibrarianDashboard />
}
