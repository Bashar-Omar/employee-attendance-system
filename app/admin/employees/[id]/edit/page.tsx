import EditEmployeeForm from "@/components/admin/EditEmployeeForm"
import prisma from "@/lib/db/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const employee = await prisma.user.findUnique({
      where: { id }
  })

  if (!employee) {
      return <div>Employee not found</div>
  }

  const shifts = await prisma.shift.findMany({ orderBy: { name: 'asc' } })
  const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
            <Link href={`/admin/employees/${id}`}>
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </Link>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Edit Profiles</h1>
                <p className="text-muted-foreground text-sm">Update details for {employee.name}</p>
            </div>
        </div>
        
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-8 bg-white">
            <EditEmployeeForm employee={employee} shifts={shifts} departments={departments} />
        </div>
    </div>
  )
}
