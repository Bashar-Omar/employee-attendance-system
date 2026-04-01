import { auth } from '@/lib/auth';
import prisma from '@/lib/db/prisma';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    let year = parseInt(searchParams.get('year') || new Date().getFullYear().toString(), 10);
    // Month in JS parameters is 1-12
    let month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString(), 10);

    const [summary, attendances, user] = await Promise.all([
      prisma.monthlySummary.findUnique({
        where: { userId_month_year: { userId, month, year } }
      }),
      prisma.attendance.findMany({
        where: {
          userId,
          date: {
            gte: new Date(year, month - 1, 1),
            lte: new Date(year, month, 0, 23, 59, 59),
          },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        include: { shift: true }
      })
    ]);

    return Response.json({ summary, attendances, user });
  } catch (error) {
    console.error('Error in Employee Payroll API:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
