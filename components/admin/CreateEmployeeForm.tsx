"use client"

import { useState } from "react"
import { createEmployee } from "@/lib/actions/employees"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function CreateEmployeeForm({
  shifts,
  departments
}: {
  shifts: any[];
  departments: any[];
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(event.currentTarget)

    const result = await createEmployee(formData)

    if (result?.error) {
        setError(result.error)
        setLoading(false)
    } else {
        router.push("/admin/employees")
        router.refresh()
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-md">
       <div className="grid gap-2">
           <label htmlFor="name" className="text-sm font-medium">Full Name</label>
           <Input id="name" name="name" required placeholder="John Doe" />
       </div>
       <div className="grid gap-2">
           <label htmlFor="email" className="text-sm font-medium">Email</label>
           <Input id="email" name="email" type="email" required placeholder="john@example.com" />
       </div>
       <div className="grid gap-2">
           <label htmlFor="employeeId" className="text-sm font-medium">Employee ID</label>
           <Input id="employeeId" name="employeeId" required placeholder="EMP-001" />
       </div>
       <div className="grid gap-2">
           <label htmlFor="password" className="text-sm font-medium">Password</label>
           <Input id="password" name="password" type="password" required placeholder="Initial Password" />
       </div>
       
       <div className="grid gap-2">
           <label htmlFor="jobTitle" className="text-sm font-medium">Job Title</label>
           <Input id="jobTitle" name="jobTitle" placeholder="e.g. Software Engineer" />
       </div>
       <div className="grid gap-2">
           <label htmlFor="phone" className="text-sm font-medium">Phone</label>
           <Input id="phone" name="phone" placeholder="+20 100 000 0000" />
       </div>
       <div className="grid gap-2">
           <label htmlFor="salary" className="text-sm font-medium">Monthly Salary (EGP)</label>
           <Input id="salary" name="salary" type="number" step="0.01" placeholder="e.g. 10000" />
       </div>
       <div className="grid gap-2">
           <label htmlFor="hireDate" className="text-sm font-medium">Hire Date</label>
           <Input id="hireDate" name="hireDate" type="date" />
       </div>

       <div className="grid gap-2">
           <label htmlFor="departmentId" className="text-sm font-medium">Department</label>
           <select name="departmentId" id="departmentId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
               <option value="">None (General)</option>
               {departments.map((dept) => (
                   <option key={dept.id} value={dept.id}>{dept.name}</option>
               ))}
           </select>
       </div>
       <div className="grid gap-2">
           <label htmlFor="shiftId" className="text-sm font-medium">Shift</label>
           <select name="shiftId" id="shiftId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
               <option value="">Default Shift</option>
               {shifts.map((shift) => (
                   <option key={shift.id} value={shift.id}>{shift.name} ({shift.startTime} - {shift.endTime})</option>
               ))}
           </select>
       </div>
       <div className="grid gap-2">
           <label htmlFor="role" className="text-sm font-medium">System Role</label>
           <select name="role" id="role" defaultValue="EMPLOYEE" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
               <option value="EMPLOYEE">Employee</option>
               <option value="ADMIN">Admin</option>
           </select>
       </div>
       
       {error && <div className="text-sm text-red-600 font-medium">{error}</div>}

       <Button type="submit" disabled={loading}>
           {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
           Create Employee
       </Button>
    </form>
  )
}
