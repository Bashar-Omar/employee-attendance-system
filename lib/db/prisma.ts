import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  console.log('========================================')
  console.log('🔌 PRISMA CLIENT INITIALIZING')
  console.log(`📅 Time: ${new Date().toISOString()}`)
  console.log(`🔗 DATABASE_URL set: ${!!process.env.DATABASE_URL}`)
  console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV}`)
  console.log('========================================')

  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['warn', 'error'],
  })

  // Test connection on first use
  client.$connect()
    .then(() => {
      console.log('✅ Prisma: Database connection established successfully')
    })
    .catch((err: Error) => {
      console.error('❌ Prisma: Database connection FAILED:', err.message)
    })

  return client
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
