import { auth } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const month = parseInt(searchParams.get('month') ?? '1', 10);
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()), 10);

  const summaries = await prisma.monthlySummary.findMany({
    where: { 
      month, 
      year, 
      user: { role: 'EMPLOYEE' } 
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          employeeId: true,
          jobTitle: true,
          department: { select: { name: true } },
        },
      },
    },
    orderBy: [{ user: { name: 'asc' } }],
  });

  return NextResponse.json(summaries);
}
