const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = 'verify@test.com'
  const password = await bcrypt.hash('password123', 10)

  console.log(`Creating/Updating user: ${email}`)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password,
      isActive: true,
      role: 'EMPLOYEE'
    },
    create: {
      email,
      name: 'Verify User',
      password,
      role: 'EMPLOYEE',
      employeeId: 'VERIFY001',
      isActive: true
    },
  })

  console.log('User created/updated:', user)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
