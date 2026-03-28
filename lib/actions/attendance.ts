"use server"

import { auth } from "@/lib/auth"
import { AttendanceService } from "@/lib/services/AttendanceService"
import { revalidatePath } from "next/cache"

export async function checkIn(latitude: number, longitude: number) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    await AttendanceService.checkIn(session.user.id, latitude, longitude)
    revalidatePath("/employee/dashboard")
    return { success: true }
  } catch (error: any) {
    return { error: (error as Error).message || "Failed to check in" }
  }
}

export async function checkOut(latitude: number, longitude: number) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  try {
    await AttendanceService.checkOut(session.user.id, latitude, longitude)
    revalidatePath("/employee/dashboard")
    return { success: true }
  } catch (error: any) {
    return { error: (error as Error).message || "Failed to check out" }
  }
}
