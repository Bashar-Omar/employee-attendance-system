import Prisma from "@/lib/db/prisma"
import { Users, Clock, LogOut, AlertTriangle, CheckCircle2 } from "lucide-react"
import { ClickableRow } from "@/components/ui/ClickableRow"

export default async function AdminDashboard() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfDay = new Date(today)
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    const workStartTime = new Date(today)
    workStartTime.setHours(11, 0, 0, 0)

    const workEndTime = new Date(today)
    workEndTime.setHours(20, 0, 0, 0)

    const [
        totalEmployees,
        todayRecords
    ] = await Promise.all([
        Prisma.user.count({ where: { role: 'EMPLOYEE', isActive: true } }),
        Prisma.attendance.findMany({
            where: {
                date: { gte: startOfDay, lte: endOfDay },
            },
            include: { user: true },
            orderBy: { date: 'desc' }
        })
    ])

    const insideNow = todayRecords.filter((r: any) => !r.checkOut && r.inStatus === 'INSIDE').length
    const outsideNow = todayRecords.filter((r: any) => !r.checkOut && r.inStatus === 'OUTSIDE').length
    const notCheckedOut = todayRecords.filter((r: any) => !r.checkOut).length
    const late = todayRecords.filter((r: any) => r.checkIn > workStartTime).length
    const leftEarly = todayRecords.filter((r: any) => r.checkOut && r.checkOut < workEndTime).length

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
                <p className="text-muted-foreground">Overview of today&apos;s attendance and employee status.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Employees"
                    value={totalEmployees}
                    icon={<Users className="h-5 w-5 text-blue-600" />}
                    className="border-t-4 border-t-blue-600"
                />
                <StatCard
                    title="Present (Inside)"
                    value={insideNow}
                    icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
                    className="border-t-4 border-t-green-600"
                />
                <StatCard
                    title="Present (Outside)"
                    value={outsideNow}
                    icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
                    className="border-t-4 border-t-amber-500"
                />
                <StatCard
                    title="Review Needed"
                    value={late + leftEarly}
                    icon={<Clock className="h-5 w-5 text-red-500" />}
                    subtext={`${late} Late, ${leftEarly} Early`}
                    className="border-t-4 border-t-red-500"
                />
            </div>

            {/* Today's Attendance Table */}
            <div className="rounded-xl border bg-card shadow-sm">
                <div className="p-6 border-b flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Live Attendance</h3>
                    <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded-full">{today.toLocaleDateString()}</span>
                </div>

                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm text-left">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b bg-gray-50/50 transition-colors">
                                <th className="h-10 px-6 align-middle font-semibold text-muted-foreground w-[250px]">Employee</th>
                                <th className="h-10 px-6 align-middle font-semibold text-muted-foreground">Check-In</th>
                                <th className="h-10 px-6 align-middle font-semibold text-muted-foreground">Check-Out</th>
                                <th className="h-10 px-6 align-middle font-semibold text-muted-foreground">Status</th>
                                <th className="h-10 px-6 align-middle font-semibold text-muted-foreground text-right">Distance</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {todayRecords.map((record: any) => (
                                <ClickableRow
                                    key={record.id}
                                    href={`/admin/employees/${record.user.id}`}
                                    className="border-b transition-colors hover:bg-muted/50"
                                >
                                    <td className="p-6 align-middle">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">{record.user.name}</span>
                                            <span className="text-xs text-muted-foreground">{record.user.employeeId}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 align-middle font-medium tabular-nums">{record.checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td className="p-6 align-middle font-medium tabular-nums text-muted-foreground">
                                        {record.checkOut ? record.checkOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span className="text-green-600 font-semibold px-2 py-0.5 bg-green-50 rounded-md text-xs">Active</span>}
                                    </td>
                                    <td className="p-6 align-middle">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${record.inStatus === 'INSIDE' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                            {record.inStatus}
                                        </span>
                                    </td>
                                    <td className="p-6 align-middle text-right font-mono text-xs text-muted-foreground">
                                        {record.inStatus === 'OUTSIDE' ? `${Math.round(record.inDistance)}m` : '-'}
                                    </td>
                                </ClickableRow>
                            ))}
                            {todayRecords.length === 0 && (
                                <tr><td colSpan={5} className="p-12 text-center text-muted-foreground italic">No attendance records found for today.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon, subtext, className = "" }: { title: string, value: number, icon?: React.ReactNode, subtext?: string, className?: string }) {
    return (
        <div className={`rounded-xl border bg-card text-card-foreground shadow-sm p-6 ${className}`}>
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="tracking-tight text-sm font-medium text-muted-foreground">{title}</div>
                {icon}
            </div>
            <div className="mt-2">
                <div className="text-3xl font-bold text-foreground">{value}</div>
                {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
            </div>
        </div>
    )
}
