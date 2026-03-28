import { auth } from "@/lib/auth"
import { AppHeader } from "@/components/ui/AppHeader"

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  // Guard clause usually handled by middleware, but good for TS safety
  if (!session?.user) return null

  const safeUser = {
    ...session.user,
    name: session.user.name || "Employee",
    role: session.user.role || "EMPLOYEE",
    email: session.user.email || undefined // Convert null/empty to undefined for TS
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <AppHeader user={safeUser} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
