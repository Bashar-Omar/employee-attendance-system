import { guardSuperAdminApi } from '@/lib/auth/superAdmin';
import prisma from '@/lib/db/prisma';
import { calculateLateMinutes, calculateOvertimeMinutes } from '@/lib/payroll/calculateLate';
import { findApplicableRule } from '@/lib/payroll/calculateDeduction';

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await guardSuperAdminApi();
  if (denied) return denied;
  const { id } = await context.params;

  const record = await prisma.attendance.findUnique({
    where: { id },
    include: {
      user: {
        include: {
          shift: { include: { deductionRules: true } },
        },
      },
    },
  });

  if (!record) return Response.json({ error: 'Not found' }, { status: 404 });

  const shift = record.user.shift;
  
  const expectedLate = shift && record.checkIn
    ? calculateLateMinutes(record.checkIn, shift.startTime, shift.gracePeriodMins)
    : null;
    
  const expectedOvertime = shift && record.checkOut
    ? calculateOvertimeMinutes(record.checkOut, shift.endTime, shift.overtimeAfterMins)
    : null;
    
  const matchedRule = shift && expectedLate !== null
    ? findApplicableRule(expectedLate, false, shift.deductionRules)
    : null;

  return Response.json({
    record,
    debug: {
      shiftStart: shift?.startTime,
      shiftEnd: shift?.endTime,
      gracePeriod: shift?.gracePeriodMins,
      expectedLateMinutes: expectedLate,
      storedLateMinutes: record.lateMinutes,
      lateMinutesMismatch: expectedLate !== record.lateMinutes,
      expectedOvertimeMinutes: expectedOvertime,
      storedOvertimeMinutes: record.overtimeMinutes,
      overtimeMismatch: expectedOvertime !== record.overtimeMinutes,
      matchedRule: matchedRule ?? 'none',
      storedDeductionValue: record.deductionValue,
    },
  });
}
