"use client"

import { useState } from "react"
import { createEmployee } from "@/lib/actions/employees"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function CreateEmployeeForm() {
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
