"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Building2, User, LogOut } from "lucide-react"
import { usePathname } from "next/navigation"

interface HeaderProps {
    user: {
        name: string
        email?: string
        role: string
    }
}

export function AppHeader({ user }: HeaderProps) {
    const pathname = usePathname()
    const isEmployee = user.role === "EMPLOYEE"

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
                {/* Logo & Brand */}
                <div className="flex items-center gap-2 font-bold text-lg md:text-xl tracking-tight text-primary">
                    <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <span className="hidden sm:inline-block">Attendance System</span>
                </div>

                {/* Navigation (Admin Only) */}
                {!isEmployee && (
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                        <Link 
                            href="/admin/dashboard" 
                            className={`transition-colors hover:text-foreground ${pathname === '/admin/dashboard' ? 'text-foreground' : 'text-muted-foreground'}`}
                        >
                            Dashboard
                        </Link>
                        <Link 
                            href="/admin/employees" 
                            className={`transition-colors hover:text-foreground ${pathname.startsWith('/admin/employees') ? 'text-foreground' : 'text-muted-foreground'}`}
                        >
                            Employees
                        </Link>
                    </nav>
                )}

                {/* User Profile & Sign Out */}
                <div className="flex items-center gap-4">
                     <div className="flex flex-col items-end mr-2">
                        <span className="text-sm font-medium leading-none">{user.name}</span>
                        <span className="text-xs text-muted-foreground hidden sm:inline-block">{user.role}</span>
                     </div>
                     <Link href="/api/auth/signout">
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Sign Out</span>
                        </Button>
                     </Link>
                </div>
            </div>
        </header>
    )
}
