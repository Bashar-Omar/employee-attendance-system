"use client"

import { useState } from "react"
import { updateEmployee, deleteEmployee } from "@/lib/actions/employees"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { Loader2, Trash2, Save, User, Mail, Hash } from "lucide-react"

export default function EditEmployeeForm({ employee }: { employee: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(event.currentTarget)
    
    const result = await updateEmployee(employee.id, formData)

    if (result?.error) {
        setError(result.error)
        setLoading(false)
    } else {
        router.push(`/admin/employees/${employee.id}`)
        router.refresh()
    }
  }

  async function onDelete() {
      if(!confirm("Are you sure you want to delete this employee? This cannot be undone.")) return
      setLoading(true)
      const result = await deleteEmployee(employee.id)
      if (result?.error) {
          setError(result.error)
          setLoading(false)
      } else {
          router.push("/admin/employees")
          router.refresh()
      }
  }

  return (
      <div className="space-y-8">
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" /> Full Name
                    </label>
                    <Input id="name" name="name" required defaultValue={employee.name} className="bg-muted/30" />
                </div>
                <div className="space-y-2">
                    <label htmlFor="employeeId" className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                         <Hash className="h-4 w-4" /> Employee ID
                    </label>
                    <Input id="employeeId" name="employeeId" required defaultValue={employee.employeeId} className="bg-muted/30" />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label htmlFor="email" className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" /> Email Address
                    </label>
                    <Input id="email" name="email" type="email" required defaultValue={employee.email} className="bg-muted/30" />
                </div>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/20">
                 <input 
                    type="checkbox" 
                    id="isActive" 
                    name="isActive" 
                    defaultChecked={employee.isActive} 
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary" 
                 />
                <label htmlFor="isActive" className="text-sm font-medium cursor-pointer flex-1">
                    Active Account
                    <p className="text-xs text-muted-foreground font-normal">Allow this user to log in and record attendance.</p>
                </label>
            </div>
            
            {error && <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md font-medium">{error}</div>}

            <div className="flex items-center gap-4 pt-4 border-t">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">Cancel</Button>
            </div>
        </form>
        
        <div className="pt-6 border-t mt-8">
            <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50/50 rounded-lg">
                <div>
                     <h4 className="text-sm font-semibold text-red-900">Delete Account</h4>
                     <p className="text-xs text-red-700 mt-1">Permanently remove this employee and their history.</p>
                </div>
                 <Button variant="destructive" size="sm" onClick={onDelete} disabled={loading}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </Button>
            </div>
        </div>
    </div>
  )
}
