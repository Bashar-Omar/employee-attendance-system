import { auth } from "@/lib/auth"
import { AttendanceService } from "@/lib/services/AttendanceService"
import CheckInCard from "@/components/attendance/CheckInCard"
import prisma from "@/lib/db/prisma"
import { cn } from "@/lib/utils"
import { LogOut, History, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const session = await auth()
  console.log("Employee Dashboard Session:", JSON.stringify(session?.user, null, 2))
  if (!session?.user) return null

  // Fetch today's status
  // 3. Check-In UI Fix: Ensure ID exists or handle error
  if (!session.user.id) {
    console.error("Missing User ID context in dashboard")
    return <div>Error: User context missing. Please relogin.</div>
  }
  const todayRecord = await AttendanceService.getTodayStatus(session.user.id)

  const history = await prisma.attendance.findMany({
      where: {
          userId: session.user.id,
      },
      orderBy: {
          date: 'desc'
      },
      take: 30
  })

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 max-w-5xl">
        <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, {session.user.name?.split(' ')[0]}</h1>
                <p className="text-muted-foreground">Manage your daily attendance and view history.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5 items-start">
                
                {/* Visual Check In/Out Section */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 shadow-sm">
                    <CheckInCard todayRecord={todayRecord} />
                </div>

                {/* History Table */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3">
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm bg-white overflow-hidden">
                        <div className="p-6 border-b bg-muted/30">
                            <h3 className="font-semibold flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" />
                                Recent Activity
                            </h3>
                        </div>
                        <div className="relative w-full overflow-auto max-h-[500px]">
                            <table className="w-full caption-bottom text-sm text-left">
                                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                    <tr className="border-b transition-colors hover:bg-muted/50">
                                        <th className="h-10 px-6 align-middle font-medium text-muted-foreground">Date</th>
                                        <th className="h-10 px-6 align-middle font-medium text-muted-foreground">Time</th>
                                        <th className="h-10 px-6 align-middle font-medium text-muted-foreground text-center">Hours</th>
                                        <th className="h-10 px-6 align-middle font-medium text-muted-foreground text-right hidden sm:table-cell">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {history.map((record: any) => (
                                        <tr key={record.id} className="transition-colors hover:bg-muted/50">
                                            <td className="p-4 px-6 align-middle font-medium text-foreground">
                                                {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </td>
                                            <td className="p-4 px-6 align-middle">
                                                <div className="flex flex-col text-xs">
                                                    <span className="font-medium text-green-700">IN: {new Date(record.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    {record.checkOut && (
                                                        <span className="text-muted-foreground">OUT: {new Date(record.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 px-6 align-middle text-center font-semibold">
                                                {record.totalHours ? record.totalHours : '-'}
                                            </td>
                                            <td className="p-4 px-6 align-middle text-right hidden sm:table-cell">
                                                <span className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset", record.inStatus === "INSIDE" ? "bg-green-50 text-green-700 ring-green-600/20" : "bg-amber-50 text-amber-700 ring-amber-600/20")}>
                                                    {record.inStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-muted-foreground italic">No attendance history yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
    </div>
  )
}
