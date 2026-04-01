import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth/adminGuard';
import prisma from '@/lib/db/prisma';
import { calculateMonthlySummary } from '@/lib/payroll/calculateMonthlySummary';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await auth();
  if (!hasAdminAccess(session?.user?.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { userId, month, year } = await req.json();

  // Calculate for a single employee
  if (userId) {
    const summary = await calculateMonthlySummary(userId, month, year, prisma);
    return NextResponse.json(summary);
  }

  // Calculate for ALL active employees
  const employees = await prisma.user.findMany({
    where: { isActive: true, role: 'EMPLOYEE' },
    select: { id: true },
  });

  const results = await Promise.allSettled(
    employees.map((e) => calculateMonthlySummary(e.id, month, year, prisma))
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return NextResponse.json({ succeeded, failed, total: employees.length });
}
