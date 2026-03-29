import { NextResponse } from 'next/server'
import prisma from '@/lib/db/prisma'

export async function GET() {
  const health: Record<string, unknown> = {
    status: 'checking',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    databaseUrlSet: !!process.env.DATABASE_URL,
  }

  try {
    // Test database connection
    await prisma.$connect()
    health.database = 'connected'

    // Check if tables exist by trying to count users
    try {
      const userCount = await prisma.user.count()
      health.tables = 'exist'
      health.userCount = userCount

      // Check for admin user specifically
      const adminUser = await prisma.user.findUnique({
        where: { email: 'admin@company.com' },
        select: { id: true, email: true, role: true, employeeId: true, createdAt: true },
      })
      health.adminExists = !!adminUser
      if (adminUser) {
        health.adminDetails = adminUser
      }
    } catch (tableError: unknown) {
      health.tables = 'missing or error'
      health.tableError = tableError instanceof Error ? tableError.message : String(tableError)
    }

    health.status = 'ok'
  } catch (dbError: unknown) {
    health.database = 'disconnected'
    health.status = 'error'
    health.error = dbError instanceof Error ? dbError.message : String(dbError)
  }

  const statusCode = health.status === 'ok' ? 200 : 500
  return NextResponse.json(health, { status: statusCode })
}
