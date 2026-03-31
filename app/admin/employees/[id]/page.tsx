import prisma from "@/lib/db/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Pencil, Mail } from "lucide-react"
import EmployeeProfileTabs from "@/components/admin/EmployeeProfileTabs"

export default async function EmployeeProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const employee = await prisma.user.findUnique({
        where: { id },
        include: {
            department: true,
            shift: true,
            monthlySummaries: {
                orderBy: [{ year: 'desc' }, { month: 'desc' }]
            },
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

            {/* Profile Tabs Component */}
            <EmployeeProfileTabs employee={employee} />
        </div>
    )
}
