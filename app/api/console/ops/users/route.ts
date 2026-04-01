import prisma from '@/lib/db/prisma';
import { guardSuperAdminApi } from '@/lib/auth/superAdmin';

// GET — list all users (for the employee dropdown in the ops console)
export async function GET() {
  const denied = await guardSuperAdminApi();
  if (denied) return denied;

  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      employeeId: true,
      role: true,
    },
    orderBy: { name: 'asc' },
  });

  return Response.json(users);
}
