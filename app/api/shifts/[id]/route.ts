import prisma from '@/lib/db/prisma';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth/adminGuard';
import { NextResponse } from 'next/server';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!hasAdminAccess(session?.user?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const body = await req.json();
    const shift = await prisma.shift.update({ where: { id }, data: body });
    return NextResponse.json(shift);
  } catch (error) {
    console.error('Error updating shift:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!hasAdminAccess(session?.user?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    await prisma.shift.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting shift:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
