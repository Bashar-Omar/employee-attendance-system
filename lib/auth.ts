import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import prisma from "@/lib/db/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "./auth.config"

async function getUser(email: string) {
  try {
    console.log(`🔍 AUTH: Looking up user with email: ${email}`)
    const user = await prisma.user.findUnique({
      where: { email },
    })
    if (user) {
      console.log(`✅ AUTH: User found — ID: ${user.id}, Role: ${user.role}, Active: ${user.isActive}`)
    } else {
      console.log(`⚠️  AUTH: No user found with email: ${email}`)
    }
    return user
  } catch (error) {
    console.error("❌ AUTH: Database error while fetching user:", error)
    throw new Error("Failed to fetch user.")
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        console.log('========================================')
        console.log('🔐 AUTH: Login attempt received')
        console.log(`📅 Time: ${new Date().toISOString()}`)
        console.log('========================================')

        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials)

        if (!parsedCredentials.success) {
          console.log('❌ AUTH: Credential validation failed — invalid email format or password too short')
          console.log('   Validation errors:', parsedCredentials.error.flatten())
          return null
        }

        const { email, password } = parsedCredentials.data
        const normalizedEmail = email.trim().toLowerCase()
        console.log(`📧 AUTH: Attempting login for: ${normalizedEmail}`)

        const user = await getUser(normalizedEmail)
        if (!user) {
          console.log(`❌ AUTH: Login FAILED — user not found: ${email}`)
          return null
        }

        const passwordsMatch = await bcrypt.compare(password, user.password)
        if (!passwordsMatch) {
          console.log(`❌ AUTH: Login FAILED — incorrect password for: ${email}`)
          return null
        }

        console.log(`✅ AUTH: Login SUCCESS for: ${email} (Role: ${user.role})`)
        return user
      },
    }),
  ],
})
