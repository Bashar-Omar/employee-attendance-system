import prisma from '@/lib/db/prisma';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth/adminGuard';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const shifts = await prisma.shift.findMany({
      include: { deductionRules: { orderBy: { lateMinutesFrom: 'asc' } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(shifts);
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!hasAdminAccess(session?.user?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const body = await req.json();
    const shift = await prisma.shift.create({ data: body });
    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    console.error('Error creating shift:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
