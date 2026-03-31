import prisma from '@/lib/db/prisma';
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; ruleId: string }> }) {
  try {
    const { ruleId } = await params;
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const body = await req.json();
    const rule = await prisma.deductionRule.update({ where: { id: ruleId }, data: body });
    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error updating deduction rule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; ruleId: string }> }) {
  try {
    const { ruleId } = await params;
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    await prisma.deductionRule.delete({ where: { id: ruleId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting deduction rule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
