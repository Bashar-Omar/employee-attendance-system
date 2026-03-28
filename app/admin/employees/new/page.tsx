import CreateEmployeeForm from "@/components/admin/CreateEmployeeForm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function NewEmployeePage() {
  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Link href="/admin/employees">
                <Button variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Add New Employee</h1>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <CreateEmployeeForm />
        </div>
    </div>
  )
}
