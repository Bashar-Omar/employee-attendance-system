import prisma from "@/lib/db/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Pencil, Mail, Hash, User, FileSpreadsheet, Activity } from "lucide-react"
import { toEgyptDate, toEgyptTimeOnly } from "@/lib/utils/date"

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const employee = await prisma.user.findUnique({
        where: { id },
        include: {
            attendances: {
                orderBy: { date: 'desc' },
                take: 60 // Last 60 days
            }
        }
    })

    if (!employee) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
                <h2 className="text-2xl font-bold">Employee Not Found</h2>
                <p className="text-muted-foreground">The employee you are looking for does not exist or has been removed.</p>
                <Link href="/admin/employees">
                    <Button>Go Back to List</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/employees">
                        <Button variant="ghost" size="icon" className="h-10 w-10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">{employee.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" /> {employee.email}
                        </div>
                    </div>
                </div>
                <Link href={`/admin/employees/${id}/edit`}>
                    <Button variant="outline" className="gap-2 bg-white hover:bg-gray-50">
                        <Pencil className="h-4 w-4" />
                        Edit Profile
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Details Card */}
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm h-fit overflow-hidden">
                    <div className="bg-muted/30 p-4 border-b">
                        <h3 className="font-semibold flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            Employee Details
                        </h3>
                    </div>
                    <div className="p-6 space-y-4 text-sm">
                        <div className="grid grid-cols-3 gap-2 py-2 border-b border-dashed sm:grid-cols-1 md:grid-cols-3">
                            <span className="font-medium text-muted-foreground col-span-1">ID</span>
                            <div className="col-span-2 font-mono">{employee.employeeId}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 py-2 border-b border-dashed sm:grid-cols-1 md:grid-cols-3">
                            <span className="font-medium text-muted-foreground col-span-1">Status</span>
                            <div className="col-span-2">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {employee.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 py-2 border-b border-dashed sm:grid-cols-1 md:grid-cols-3">
                            <span className="font-medium text-muted-foreground col-span-1">Sheet ID</span>
                            <div className="col-span-2 truncate text-xs text-muted-foreground" title={employee.spreadsheetId || ''}>
                                {employee.spreadsheetId || <span className="italic">Not Linked</span>}
                            </div>
                        </div>
                        <div className="pt-2">
                            <a
                                href={`https://docs.google.com/spreadsheets/d/${process.env.MAIN_SPREADSHEET_ID}`}
                                target="_blank"
                                className="text-primary hover:underline flex items-center gap-1 text-xs"
                            >
                                <FileSpreadsheet className="h-3 w-3" />
                                Open Attendance Sheet
                            </a>
                        </div>
                    </div>
                </div>

                {/* Attendance History */}
                <div className="col-span-2 rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="bg-muted/30 p-4 border-b flex items-center justify-between">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            Attendance History (Last 60 Days)
                        </h3>
                    </div>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-left">
                            <thead>
                                <tr className="border-b bg-gray-50/50">
                                    <th className="h-10 px-6 align-middle font-medium text-muted-foreground">Date</th>
                                    <th className="h-10 px-6 align-middle font-medium text-muted-foreground">Check-In</th>
                                    <th className="h-10 px-6 align-middle font-medium text-muted-foreground">Check-Out</th>
                                    <th className="h-10 px-6 align-middle font-medium text-muted-foreground">Total Hours</th>
                                    <th className="h-10 px-6 align-middle font-medium text-muted-foreground">Location</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {employee.attendances.map((record: any) => (
                                    <tr key={record.id} className="transition-colors hover:bg-muted/50">
                                        <td className="p-4 px-6 align-middle font-medium">{record.date ? toEgyptDate(record.date) : '-'}</td>
                                        <td className="p-4 px-6 align-middle tabular-nums">{record.checkIn ? toEgyptTimeOnly(record.checkIn) : '-'}</td>
                                        <td className="p-4 px-6 align-middle tabular-nums">{record.checkOut ? toEgyptTimeOnly(record.checkOut) : '-'}</td>
                                        <td className="p-4 px-6 align-middle font-semibold">{record.totalHours ? `${record.totalHours} hrs` : '-'}</td>
                                        <td className="p-4 px-6 align-middle">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${record.inStatus === 'INSIDE' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-amber-50 text-amber-700 ring-amber-600/20'}`}>
                                                {record.inStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {employee.attendances.length === 0 && (
                                    <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No attendance records found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
