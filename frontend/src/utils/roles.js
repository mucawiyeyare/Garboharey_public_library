// Directors have the same powers as administrators (the API enforces the same rule).
export const adminRoles = ['admin', 'director']
export const isAdmin = (user) => adminRoles.includes(user?.role)
// Any role list that allows administrators also allows directors.
export const withDirector = (roles) => (roles.includes('admin') ? [...new Set([...roles, 'director'])] : roles)
