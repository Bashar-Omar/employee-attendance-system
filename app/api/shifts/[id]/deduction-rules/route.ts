import prisma from '@/lib/db/prisma';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const body = await req.json();
    const rule = await prisma.deductionRule.create({ data: { ...body, shiftId: id } });
    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Error creating deduction rule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
