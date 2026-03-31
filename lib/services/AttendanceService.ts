import prisma from "@/lib/db/prisma"
import { getLocationStatus } from "./LocationService"
import { GoogleSheetsService } from "./GoogleSheetsService"
import { getEgyptDateString } from "@/lib/utils/date"


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

    // 2. Calculate Location
    const locationData = getLocationStatus(latitude, longitude)

    // 3. Create Record
    const record = await prisma.attendance.create({
      data: {
        userId,
        date: startOfDay, // Normalize date part
        checkIn: new Date(),
        inLatitude: latitude,
        inLongitude: longitude,
        inStatus: locationData.status,
        inDistance: locationData.distance,
      },
    })

    // 4. Sync to Google Sheets
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.spreadsheetId) {
       await GoogleSheetsService.logAttendance(user.spreadsheetId, [
          record.date.toISOString().split('T')[0],
          record.checkIn.toLocaleTimeString(),
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

    // 3. Calculate Hours
    const checkOutTime = new Date()
    const checkInTime = new Date(record.checkIn)
    const durationMs = checkOutTime.getTime() - checkInTime.getTime()
    const totalHours = durationMs / (1000 * 60 * 60)

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
      },
    })

    // 5. Sync to Sheets
    // For Check-Out, we ideally update the existing row. 
    // Implementing a simple append for now to ensure data is captured, 
    // as finding the exact row requiring update is complex without row ID storage.
    // Alternative: We append a new row with just Check-Out info, or try to update.
    // Given functionality mandates "Google Sheets Integration", I will append a "Check-Out" specific log 
    // OR try to implement an 'Update' in the service if requested.
    // For simplicity and robustness (avoiding overwrite of wrong rows), I will append the completed record as a new confirmation line 
    // or (Better) re-write the last row if possible. 
    // Let's rely on the service to handle "logAttendance".
    // I'll append a line for Check-Out to be safe: [Date, "SAME", Check-Out, Status, TotalHours]
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.spreadsheetId) {
        await GoogleSheetsService.logAttendance(user.spreadsheetId, [
          updated.date.toISOString().split('T')[0],
          record.checkIn.toLocaleTimeString(), // Repeat Check-In
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
