import prisma from '@/lib/db/prisma';
import { guardSuperAdminApi } from '@/lib/auth/superAdmin';
import { calculateLateMinutes, calculateOvertimeMinutes } from '@/lib/payroll/calculateLate';

// GET — look up an existing attendance record by userId + date
export async function GET(req: Request) {
  const denied = await guardSuperAdminApi();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const date = searchParams.get('date'); // "YYYY-MM-DD"

  if (!userId || !date) {
    return Response.json({ error: 'userId and date are required' }, { status: 400 });
  }

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const record = await prisma.attendance.findFirst({
    where: {
      userId,
      date: { gte: dayStart, lte: dayEnd },
    },
  });

  return Response.json(record ?? null);
}

// POST — upsert a single attendance record
export async function POST(req: Request) {
  const denied = await guardSuperAdminApi();
  if (denied) return denied;

  const body = await req.json();
  const {
    userId,
    date,
    checkInTime,
    checkOutTime,
    status,
    inLatitude,
    inLongitude,
    inStatus,
    inDistance,
    outLatitude,
    outLongitude,
    outStatus,
    outDistance,
    notes,
    autoCalculate,
  } = body;
  
  let { lateMinutes, overtimeMinutes } = body;

  if (!userId || !date) {
    return Response.json({ error: 'userId and date are required' }, { status: 400 });
  }

  // Convert Egypt local time strings ("09:15") to UTC Date objects
  const checkIn = checkInTime
    ? new Date(`${date}T${checkInTime}:00+02:00`)
    : null;
  const checkOut = checkOutTime
    ? new Date(`${date}T${checkOutTime}:00+02:00`)
    : null;

  const totalHours =
    checkIn && checkOut
      ? (checkOut.getTime() - checkIn.getTime()) / 3600000
      : null;

  if (autoCalculate) {
    const employee = await prisma.user.findUnique({
      where: { id: userId },
      include: { shift: true }
    });
    
    if (employee?.shift && checkIn) {
      lateMinutes = calculateLateMinutes(checkIn, employee.shift.startTime, employee.shift.gracePeriodMins);

      if (checkOut) {
        overtimeMinutes = calculateOvertimeMinutes(checkOut, employee.shift.endTime, employee.shift.overtimeAfterMins);
      }
    }
  }

  const data = {
    status: status ?? 'PRESENT',
    checkIn,
    checkOut,
    totalHours,
    inLatitude: inLatitude !== '' && inLatitude != null ? Number(inLatitude) : null,
    inLongitude: inLongitude !== '' && inLongitude != null ? Number(inLongitude) : null,
    inStatus: inStatus || null,
    inDistance: inDistance !== '' && inDistance != null ? Number(inDistance) : null,
    outLatitude: outLatitude !== '' && outLatitude != null ? Number(outLatitude) : null,
    outLongitude: outLongitude !== '' && outLongitude != null ? Number(outLongitude) : null,
    outStatus: outStatus || null,
    outDistance: outDistance !== '' && outDistance != null ? Number(outDistance) : null,
    lateMinutes: lateMinutes !== '' && lateMinutes != null ? Number(lateMinutes) : null,
    overtimeMinutes: overtimeMinutes !== '' && overtimeMinutes != null ? Number(overtimeMinutes) : null,
    notes: notes || null,
  };

  const record = await prisma.attendance.upsert({
    where: { userId_date: { userId, date: new Date(date) } },
    create: { userId, date: new Date(date), ...data },
    update: data,
  });

  return Response.json(record);
}

// DELETE — remove a single attendance record by ID
export async function DELETE(req: Request) {
  const denied = await guardSuperAdminApi();
  if (denied) return denied;

  const { id } = await req.json();
  if (!id) {
    return Response.json({ error: 'id is required' }, { status: 400 });
  }

  await prisma.attendance.delete({ where: { id } });
  return Response.json({ ok: true });
}
