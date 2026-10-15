// Directors have the same powers as administrators (the API enforces the same rule).
export const adminRoles = ['admin', 'director']
export const isAdmin = (user) => adminRoles.includes(user?.role)
// Any role list that allows administrators also allows directors.
export const withDirector = (roles) => (roles.includes('admin') ? [...new Set([...roles, 'director'])] : roles)

/**
 * Centrally maps user role to their specific dashboard route.
 * - Member: /account
 * - Librarian / Director / Admin: /staff
 * - Guest: /login
 */
export const getDashboardPath = (userOrRole) => {
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.role
  if (role === 'member') return '/account'
  if (['librarian', 'director', 'admin'].includes(role)) return '/staff'
  return '/login'
}
