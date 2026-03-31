import prisma from "@/lib/db/prisma"
import { getLocationStatus } from "./LocationService"
import { GoogleSheetsService } from "./GoogleSheetsService"
import { getEgyptDateString } from "@/lib/utils/date"
import { calculateLateMinutes, calculateOvertimeMinutes } from "@/lib/payroll/calculateLate"
import { findApplicableRule, calculateDailyDeductionAmount } from "@/lib/payroll/calculateDeduction"
import { countWorkingDays } from "@/lib/payroll/calculateMonthlySummary"


export class AttendanceService {
  /**
   * Records a Check-In for a user.
   */
  static async checkIn(userId: string, latitude: number, longitude: number) {
    if (!userId) throw new Error("User ID is required for check-in")
    // 1. Check for active session (Checked In but not Checked Out)
    // Use Egypt local date to avoid UTC midnight drift (UTC+2 timezone)
    const egyptDateStr = getEgyptDateString() // e.g. "2024-03-15"
    const startOfDay = new Date(`${egyptDateStr}T00:00:00+02:00`)
    const endOfDay = new Date(`${egyptDateStr}T23:59:59+02:00`)

    // Find the LATEST record for today
    const latestRecord = await prisma.attendance.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        checkIn: 'desc'
      }
    })

    // If there is a record AND it has NO checkOut time, user is currently checked in.
    if (latestRecord && !latestRecord.checkOut) {
      throw new Error("Already checked in. Please check out first.")
    }

    // Otherwise (No record OR Last record has checkOut), create NEW record.

    // 2. Fetch User & Shift
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { shift: true }
    })
    
    if (!user) throw new Error("User not found")

    // 3. Calculate Location
    const locationData = getLocationStatus(latitude, longitude)

    // 4. Calculate Lateness and Deductions
    const checkInTime = new Date()
    const shift = user.shift
    
    const lateMinutes = shift 
      ? calculateLateMinutes(checkInTime, shift.startTime, shift.gracePeriodMins) 
      : 0
    
    let deductionRuleId: string | null = null;
    let deductionValue: number | null = null;

    if (shift && lateMinutes > 0 && user.salary) {
      const rules = await prisma.deductionRule.findMany({ where: { shiftId: shift.id } });
      const now = new Date();
      const workingDays = countWorkingDays(now.getFullYear(), now.getMonth() + 1, shift.workDays);
      const matchedRule = findApplicableRule(lateMinutes, false, rules);
      if (matchedRule) {
        deductionRuleId = matchedRule.id;
        deductionValue = calculateDailyDeductionAmount(matchedRule, user.salary, workingDays);
      }
    }

    // 5. Create Record
    const record = await prisma.attendance.create({
      data: {
        userId,
        date: startOfDay, // Normalize date part
        checkIn: checkInTime,
        status: lateMinutes > 0 ? 'LATE' : 'PRESENT',
        lateMinutes,
        deductionRuleId,
        deductionValue,
        inLatitude: latitude,
        inLongitude: longitude,
        inStatus: locationData.status,
        inDistance: locationData.distance,
      },
    })

    // 6. Sync to Google Sheets
    if (user.spreadsheetId) {
      await GoogleSheetsService.logAttendance(user.spreadsheetId, [
        record.date.toISOString().split('T')[0],
        record.checkIn?.toLocaleTimeString() || "",
        "", // Check-Out empty
        locationData.status,
        "" // Hours empty
      ])
    }

    return record
  }

  /**
   * Records a Check-Out for a user.
   */
  static async checkOut(userId: string, latitude: number, longitude: number) {
    if (!userId) throw new Error("User ID is required for check-out")
    // 1. Find today's LATEST record — use Egypt local date to avoid UTC midnight drift
    const egyptDateStr = getEgyptDateString()
    const startOfDay = new Date(`${egyptDateStr}T00:00:00+02:00`)
    const endOfDay = new Date(`${egyptDateStr}T23:59:59+02:00`)

    const record = await prisma.attendance.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        checkIn: 'desc'
      }
    })

    if (!record) {
      throw new Error("No check-in record found for today.")
    }

    if (record.checkOut) {
      throw new Error("Already checked out. Please check in again to start a new session.")
    }

    // 2. Calculate Location
    const locationData = getLocationStatus(latitude, longitude)

    // 3. Calculate Hours and Overtime
    const checkOutTime = new Date()
    const checkInTime = new Date(record.checkIn || Date.now())
    const durationMs = checkOutTime.getTime() - checkInTime.getTime()
    const totalHours = durationMs / (1000 * 60 * 60)
    
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { shift: true } })
    let overtimeMinutes = 0
    if (user?.shift) {
       overtimeMinutes = calculateOvertimeMinutes(checkOutTime, user.shift.endTime, user.shift.overtimeAfterMins)
    }

    // 4. Update Record
    const updated = await prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOut: checkOutTime,
        outLatitude: latitude,
        outLongitude: longitude,
        outStatus: locationData.status,
        outDistance: locationData.distance,
        totalHours: parseFloat(totalHours.toFixed(2)),
        overtimeMinutes
      },
    })

    // 5. Sync to Sheets
    if (user?.spreadsheetId) {
      await GoogleSheetsService.logAttendance(user.spreadsheetId, [
        updated.date.toISOString().split('T')[0],
        record.checkIn?.toLocaleTimeString() || "", // Repeat Check-In
        checkOutTime.toLocaleTimeString(),
        updated.outStatus || "",
        totalHours.toFixed(2)
      ])
    }

    return updated
  }

  static async getTodayStatus(userId: string) {
    if (!userId) return null;
    // Use Egypt local date to avoid UTC midnight drift
    const egyptDateStr = getEgyptDateString()
    const startOfDay = new Date(`${egyptDateStr}T00:00:00+02:00`)
    const endOfDay = new Date(`${egyptDateStr}T23:59:59+02:00`)

    const record = await prisma.attendance.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        checkIn: 'desc'
      }
    })

    return record
  }
}
