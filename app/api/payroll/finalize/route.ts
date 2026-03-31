import { auth } from '@/lib/auth';
import prisma from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { userId, month, year } = await req.json();

  const existing = await prisma.monthlySummary.findUnique({
    where: { userId_month_year: { userId, month, year } },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Summary not found. Run calculation first.' }, { status: 404 });
  }

  const updated = await prisma.monthlySummary.update({
    where: { userId_month_year: { userId, month, year } },
    data: {
      isFinalized: true,
      finalizedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
