import { useAuth } from '../context/AuthProvider'
import DirectorDashboard from '../features/catalog/DirectorDashboard'
import AdminDashboard from '../pages/administrator/Dashboard'
import LibrarianDashboard from '../pages/librarian/Dashboard'

// Each staff role lands on its own dashboard; members use /account.
export default function RoleDashboard() {
  const { user } = useAuth()
  if (user?.role === 'director') return <DirectorDashboard />
  if (user?.role === 'admin') return <AdminDashboard />
  return <LibrarianDashboard />
}
