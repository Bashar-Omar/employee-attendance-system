import LoginForm from "./LoginForm"
import { Building2 } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
      <div className="w-full max-w-md space-y-8 px-4">
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-blue-500/20 mb-6">
                <Building2 className="h-6 w-6 text-white" />
            </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Employee Attendance Portal
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in securely to manage or track attendance
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-8 shadow-sm ring-1 ring-border rounded-xl">
           <LoginForm />
        </div>
        
        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
             &copy; {new Date().getFullYear()} Corporate Systems Inc. All rights reserved.
        </p>
      </div>
    </div>
  )
}
