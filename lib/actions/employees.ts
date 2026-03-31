"use server"

import { auth } from "@/lib/auth"
import prisma from "@/lib/db/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { GoogleSheetsService } from "@/lib/services/GoogleSheetsService"

export async function createEmployee(data: FormData) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" }

  const name = (data.get("name") as string).trim()
  const email = (data.get("email") as string).trim().toLowerCase()
  const employeeId = (data.get("employeeId") as string).trim()
  const password = data.get("password") as string
  const role = data.get("role") as string || "EMPLOYEE"

  const jobTitle = (data.get("jobTitle") as string) || null
  const phone = (data.get("phone") as string) || null
  const shiftId = (data.get("shiftId") as string) || null
  const departmentId = (data.get("departmentId") as string) || null
  
  const salaryStr = data.get("salary") as string
  const salary = salaryStr ? parseFloat(salaryStr) : null

  const hireDateStr = data.get("hireDate") as string
  const hireDate = hireDateStr ? new Date(hireDateStr) : null

  if (!name || !email || !employeeId || !password) {
      return { error: "Missing fields" }
  }

  try {
      // 1. Create in DB
      const hashedPassword = await bcrypt.hash(password, 10)
      
      // 2. Create Sheet
      // "Each EMPLOYEE gets their own sheet (tab)"
      // "Sheet auto-created on employee creation"
      const sheetName = await GoogleSheetsService.createEmployeeSheet(name)
      if (!sheetName) console.warn("Failed to create Google Sheet for employee")

      await prisma.user.create({
          data: {
              name,
              email,
              employeeId,
              password: hashedPassword,
              role: role,
              spreadsheetId: sheetName || name, // Store sheet name/ID
              jobTitle,
              phone,
              salary,
              hireDate,
              shiftId,
              departmentId
          }
      })

      revalidatePath("/admin/employees")
      return { success: true }
  } catch (error: any) {
      return { error: error.message }
  }
}

export async function updateEmployee(id: string, data: FormData) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" }

  const name = (data.get("name") as string).trim()
  const email = (data.get("email") as string).trim().toLowerCase()
  const employeeId = (data.get("employeeId") as string).trim()
  const role = data.get("role") as string || "EMPLOYEE"
  const isActive = data.get("isActive") === "on"

  const jobTitle = (data.get("jobTitle") as string) || null
  const phone = (data.get("phone") as string) || null
  const shiftId = (data.get("shiftId") as string) || null
  const departmentId = (data.get("departmentId") as string) || null
  
  const salaryStr = data.get("salary") as string
  const salary = salaryStr ? parseFloat(salaryStr) : null

  const hireDateStr = data.get("hireDate") as string
  const hireDate = hireDateStr ? new Date(hireDateStr) : null

  try {
      await prisma.user.update({
          where: { id },
          data: {
              name,
              email,
              employeeId,
              role: role,
              isActive,
              jobTitle,
              phone,
              salary,
              hireDate,
              shiftId,
              departmentId
          }
      })
      revalidatePath("/admin/employees")
      revalidatePath(`/admin/employees/${id}`)
      return { success: true }
  } catch (error: any) {
      return { error: error.message }
  }
}

export async function deleteEmployee(id: string) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" }

  try {
    await prisma.$transaction(async (tx) => {
        // Delete related attendance records first
        await tx.attendance.deleteMany({
            where: { userId: id }
        })

        // Delete the user
        await tx.user.delete({
            where: { id },
        })
    })

    revalidatePath("/admin/employees")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete employee:", error)
    return { error: "Failed to delete employee. Please try again." }
  }
}
