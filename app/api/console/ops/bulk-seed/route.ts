import prisma from '@/lib/db/prisma';
import { guardSuperAdminApi } from '@/lib/auth/superAdmin';
import { calculateLateMinutes, calculateOvertimeMinutes } from '@/lib/payroll/calculateLate';
import { findApplicableRule, calculateDailyDeductionAmount } from '@/lib/payroll/calculateDeduction';
import { countWorkingDays } from '@/lib/payroll/calculateMonthlySummary';

function randomTimeBetween(from: string, to: string): string {
  const [fH, fM] = from.split(':').map(Number);
  const [tH, tM] = to.split(':').map(Number);
  const fromMins = fH * 60 + fM;
  const toMins = tH * 60 + tM;
  const randomMins = fromMins + Math.floor(Math.random() * (Math.max(toMins - fromMins, 0) + 1));
  return `${String(Math.floor(randomMins / 60)).padStart(2, '0')}:${String(randomMins % 60).padStart(2, '0')}`;
}

export async function POST(req: Request) {
  const denied = await guardSuperAdminApi();
  if (denied) return denied;

  const {
    userId,
    fromDate,
    toDate,
    checkInFrom,
    checkInTo,
    checkOutFrom,
    checkOutTo,
    skipExisting,
    skipNonWorkingDays,
  } = await req.json();

  if (!userId || !fromDate || !toDate || !checkInFrom || !checkInTo || !checkOutFrom || !checkOutTo) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const employee = await prisma.user.findUnique({
    where: { id: userId },
    include: { shift: { include: { deductionRules: true } } },
  });
  if (!employee) return Response.json({ error: 'Employee not found' }, { status: 404 });

  const workDays = employee.shift?.workDays?.split(',').map(Number) ?? [0, 1, 2, 3, 4]; // Sunday=0
  const start = new Date(fromDate);
  const end = new Date(toDate);

  let created = 0;
  let skippedExisting = 0;
  let skippedNonWorking = 0;

  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' }); 
    const dayOfWeek = d.getDay();

    if (skipNonWorkingDays && !workDays.includes(dayOfWeek)) {
      skippedNonWorking++;
      continue;
    }

    if (skipExisting) {
      const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
      const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);
    
      const existing = await prisma.attendance.findFirst({
        where: { userId, date: { gte: dayStart, lte: dayEnd } },
      });
      if (existing) {
        skippedExisting++;
        continue;
      }
    }

    const finalIn = randomTimeBetween(checkInFrom, checkInTo);
    const finalOut = randomTimeBetween(checkOutFrom, checkOutTo);

    const checkIn = new Date(`${dateStr}T${finalIn}:00+02:00`);
    const checkOut = new Date(`${dateStr}T${finalOut}:00+02:00`);
    const totalHours = (checkOut.getTime() - checkIn.getTime()) / 3600000;

    let lateMinutes = 0;
    let overtimeMinutes = 0;
    let deductionRuleId: string | null = null;
    let deductionValue: number | null = null;

    if (employee.shift) {
      lateMinutes = calculateLateMinutes(checkIn, employee.shift.startTime, employee.shift.gracePeriodMins);
      overtimeMinutes = calculateOvertimeMinutes(checkOut, employee.shift.endTime, employee.shift.overtimeAfterMins);

      if (lateMinutes > 0 && employee.salary && employee.shift.deductionRules.length > 0) {
        const workingDaysCount = countWorkingDays(d.getFullYear(), d.getMonth() + 1, employee.shift.workDays);
        const rule = findApplicableRule(lateMinutes, false, employee.shift.deductionRules);
        if (rule) {
          deductionRuleId = rule.id;
          deductionValue = calculateDailyDeductionAmount(rule, employee.salary, workingDaysCount);
        }
      }
    }

    const payload = {
      checkIn,
      checkOut,
      totalHours,
      lateMinutes,
      overtimeMinutes,
      deductionRuleId,
      deductionValue,
      status: lateMinutes > 0 ? 'LATE' : 'PRESENT',
    };

    await prisma.attendance.upsert({
      where: { userId_date: { userId, date: new Date(dateStr) } },
      create: {
        userId,
        date: new Date(dateStr),
        ...payload,
      },
      update: payload,
    });

    created++;
  }

  return Response.json({ created, skippedExisting, skippedNonWorking });
}
