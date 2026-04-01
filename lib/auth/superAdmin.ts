import { auth } from '@/lib/auth';
import { notFound } from 'next/navigation';

/**
 * Use in super admin SERVER COMPONENTS (pages).
 * Calls notFound() for anyone who is not SUPER_ADMIN -> renders the standard 404 page.
 * The caller never sees a 401 or 403 — the route appears to not exist.
 */
export async function requireSuperAdmin() {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    notFound();
  }
  return session;
}

/**
 * Use in super admin API ROUTES.
 * Returns a 404 Response for anyone who is not SUPER_ADMIN.
 * Returns null if the user is authorized (meaning: proceed normally).
 *
 * Usage:
 *   const denied = await guardSuperAdminApi();
 *   if (denied) return denied;
 */
export async function guardSuperAdminApi(): Promise<Response | null> {
  const session = await auth();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return new Response('Not Found', { status: 404 });
  }
  return null;
}
