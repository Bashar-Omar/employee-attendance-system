import { PrismaClient } from '@prisma/client';

export function countWorkingDays(year: number, month: number, workDaysCsv: string): number {
  const workDays = workDaysCsv.split(',').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    // month - 1 because JS Date month is 0-indexed
    if (workDays.includes(new Date(year, month - 1, d).getDay())) count++;
  }
  return count;
}

export async function calculateMonthlySummary(
  userId: string,
  month: number, // 1-12
  year: number,
  prisma: PrismaClient
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { shift: true },
  });
  if (!user) throw new Error('User not found');

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const attendances = await prisma.attendance.findMany({
    where: { 
      userId, 
      date: { gte: startDate, lte: endDate } 
    },
  });

  const workDays = user.shift?.workDays ?? '0,1,2,3,4';
  const workingDaysCount = countWorkingDays(year, month, workDays);
  
  const presentDays = attendances.filter((a) => a.status !== 'ABSENT').length;
  const absentDays = Math.max(0, workingDaysCount - presentDays);
  const lateDays = attendances.filter((a) => (a.lateMinutes ?? 0) > 0).length;
  
  const totalLateMinutes = attendances.reduce((s, a) => s + (a.lateMinutes ?? 0), 0);
  const totalOvertimeMins = attendances.reduce((s, a) => s + (a.overtimeMinutes ?? 0), 0);

  const baseSalary = user.salary ?? 0;
  const dailySalary = workingDaysCount > 0 ? baseSalary / workingDaysCount : 0;

  // Deductions already computed per-day and stored on each attendance record
  const deductionsFromAttendance = attendances.reduce((s, a) => s + (a.deductionValue ?? 0), 0);
  
  // Add absent day deductions on top
  const totalDeductions = deductionsFromAttendance + absentDays * dailySalary;

  // Overtime pay: 1.5x hourly rate (8-hour workday assumed)
  const hourlyRate = dailySalary / 8;
  const overtimePay = ((totalOvertimeMins / 60) * hourlyRate) * 1.5;
  
  const finalSalary = Math.max(0, baseSalary - totalDeductions + overtimePay);

  return prisma.monthlySummary.upsert({
    where: { 
        userId_month_year: { userId, month, year } 
    },
    create: {
      userId, 
      month, 
      year, 
      workingDays: workingDaysCount, 
      presentDays, 
      absentDays, 
      lateDays,
      totalLateMinutes, 
      totalOvertimeHours: totalOvertimeMins / 60,
      baseSalary, 
      totalDeductions, 
      overtimePay, 
      finalSalary,
    },
    update: {
      workingDays: workingDaysCount, 
      presentDays, 
      absentDays, 
      lateDays, 
      totalLateMinutes,
      totalOvertimeHours: totalOvertimeMins / 60,
      baseSalary, 
      totalDeductions, 
      overtimePay, 
      finalSalary,
    },
  });
}
