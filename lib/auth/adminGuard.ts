/**
 * Returns true if the role has admin-level access (ADMIN or SUPER_ADMIN).
 */
export function hasAdminAccess(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}
