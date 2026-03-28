import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/employee") || nextUrl.pathname.startsWith("/admin")
      const isOnLogin = nextUrl.pathname.startsWith("/login")

      if (isOnDashboard) {
        if (isLoggedIn) {
             // Role based redirect check
             if(nextUrl.pathname.startsWith("/admin") && auth.user.role !== "ADMIN") {
                 return Response.redirect(new URL("/employee/dashboard", nextUrl)) // Redirect employee trying to access admin
             }
             if(nextUrl.pathname.startsWith("/employee") && auth.user.role === "ADMIN") {
                // Admin shouldn't be in employee area? Task says "NO attendance records... Excluded from all attendance logic".
                // "Can view ONLY their own attendance" - Admin has NO attendance.
                // "Admin Dashboard (DEFAULT AFTER LOGIN)"
                return Response.redirect(new URL("/admin/dashboard", nextUrl))
             }
             return true
        }
        return false // Redirect unauthenticated users to login page
      } else if (isLoggedIn && isOnLogin) {
        if (auth.user.role === "ADMIN") {
             return Response.redirect(new URL("/admin/dashboard", nextUrl))
        }
        return Response.redirect(new URL("/employee/dashboard", nextUrl))
      }
      return true
    },
    async jwt({ token, user }) {
        if (user) {
          token.id = user.id
          token.role = user.role || "EMPLOYEE"
          token.employeeId = user.employeeId || ""
        }
        return token
      },
    async session({ session, token }) {
        if (token) {
          session.user.id = (token.id as string) || (token.sub as string)
          session.user.role = token.role as string
          session.user.employeeId = token.employeeId as string
        }
        return session
      },
  },
  providers: [], // Configured in auth.ts
} satisfies NextAuthConfig
