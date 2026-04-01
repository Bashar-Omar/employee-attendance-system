import { guardSuperAdminApi } from '@/lib/auth/superAdmin';
import prisma from '@/lib/db/prisma';

export async function GET() {
  const denied = await guardSuperAdminApi();
  if (denied) return denied;

  const employees = await prisma.user.findMany({
    where: { role: 'EMPLOYEE', isActive: true },
    select: { 
      id: true, 
      name: true, 
      employeeId: true,
      shift: {
        select: {
          startTime: true,
          endTime: true,
          gracePeriodMins: true,
          overtimeAfterMins: true,
        }
      }
    },
    orderBy: { name: 'asc' },
  });

  return Response.json(employees);
}
