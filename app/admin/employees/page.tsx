import prisma from "@/lib/db/prisma"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, User, Search, MoreHorizontal } from "lucide-react"
import { ClickableRow } from "@/components/ui/ClickableRow"

export default async function EmployeesPage() {
  const employees = await prisma.user.findMany({
      where: { role: "EMPLOYEE" },
      orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Employees</h1>
                <p className="text-muted-foreground">Manage your team members and view their attendance.</p>
            </div>
            <Link href="/admin/employees/new">
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Employee
                </Button>
            </Link>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
             <div className="p-4 border-b bg-muted/40 flex items-center gap-2">
                 <div className="relative flex-1 max-w-sm">
                     <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                     <input 
                        type="text" 
                        placeholder="Search employees..." 
                        className="w-full rounded-md border border-input bg-background pl-9 h-9 text-sm outline-none focus:ring-2 focus:ring-ring"
                     />
                 </div>
                 {/* Filter buttons could go here */}
             </div>

             <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm text-left">
                    <thead>
                        <tr className="border-b bg-gray-50/50">
                            <th className="h-10 px-6 align-middle font-semibold text-muted-foreground">Employee</th>
                            <th className="h-10 px-6 align-middle font-semibold text-muted-foreground">Contact</th>
                            <th className="h-10 px-6 align-middle font-semibold text-muted-foreground">Role</th>
                            <th className="h-10 px-6 align-middle font-semibold text-muted-foreground">Status</th>
                            <th className="h-10 px-6 align-middle font-bold text-right text-muted-foreground">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {employees.map((employee: any) => (
                            <ClickableRow 
                                key={employee.id} 
                                href={`/admin/employees/${employee.id}`}
                                className="transition-colors hover:bg-muted/50"
                            >
                                <td className="p-6 align-middle">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {employee.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-medium text-foreground">{employee.name}</div>
                                            <div className="text-xs text-muted-foreground">ID: {employee.employeeId}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6 align-middle text-muted-foreground">{employee.email}</td>
                                <td className="p-6 align-middle">
                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                        Employee
                                    </span>
                                </td>
                                <td className="p-6 align-middle">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${employee.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {employee.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="p-6 align-middle text-right">
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </td>
                            </ClickableRow>
                        ))}
                         {employees.length === 0 && (
                            <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">No employees found. Add one to get started.</td></tr>
                        )}
                    </tbody>
                </table>
             </div>
        </div>
    </div>
  )
}
