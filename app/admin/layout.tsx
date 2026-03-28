import { auth } from "@/lib/auth"
import Link from "next/link"
import { Building2, LayoutDashboard, Users, Settings, LogOut, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar - Hidden on mobile, typically controlled by state but for simplicity static hidden md:block */}
      <aside className="hidden w-64 flex-col border-r bg-card md:flex">
         <div className="flex h-16 items-center border-b px-6">
             <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
                <Building2 className="h-6 w-6 text-primary" />
                <span>Admin Portal</span>
             </Link>
         </div>
         <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
             <Link href="/admin/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
             </Link>
             <Link href="/admin/employees" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground">
                <Users className="h-4 w-4" />
                Employees
             </Link>
              <div className="pt-4 mt-4 border-t px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">System</div>
              <a href={`https://docs.google.com/spreadsheets/d/${process.env.MAIN_SPREADSHEET_ID}`} target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground">
                  <FileSpreadsheet className="h-4 w-4" />
                  View Spreadsheet
              </a>
         </nav>
         <div className="border-t p-4">
             <div className="flex items-center gap-3 px-3 py-2">
                 <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">A</div>
                 <div className="text-sm">
                     <p className="font-medium">{session?.user?.name}</p>
                     <p className="text-xs text-muted-foreground">Administrator</p>
                 </div>
             </div>
             <Link href="/api/auth/signout">
                 <Button variant="ghost" className="w-full justify-start mt-2 text-muted-foreground hover:text-destructive">
                     <LogOut className="mr-2 h-4 w-4" />
                     Sign Out
                 </Button>
             </Link>
         </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile Header */}
          <header className="flex h-16 items-center justify-between border-b bg-background px-6 md:hidden">
              <div className="flex items-center gap-2 font-bold text-lg text-primary">
                  <Building2 className="h-5 w-5" />
                  <span>Attendance System</span>
              </div>
              <div className="flex items-center gap-2">
                 {/* Mobile menu trigger could go here if we implemented a drawer */}
                 <span className="text-xs text-muted-foreground font-semibold px-2 py-1 bg-muted rounded">Admin</span>
              </div>
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-auto">
            {children}
          </main>
      </div>
    </div>
  )
}
