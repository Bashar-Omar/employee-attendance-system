import prisma from '@/lib/db/prisma';
import { auth } from '@/lib/auth';
import { hasAdminAccess } from '@/lib/auth/adminGuard';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
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
    const dept = await prisma.department.create({ data: body });
    return NextResponse.json(dept, { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
