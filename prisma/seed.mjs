import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed script...');
  
  // Check if an admin user already exists
  const adminCount = await prisma.user.count({
    where: { role: 'ADMIN' },
  });

  if (adminCount === 0) {
    console.log('No ADMIN user found. Creating default admin...');
    const hashedPassword = await bcryptjs.hash('admin123', 10);
    
    await prisma.user.create({
      data: {
        email: 'admin@company.com',
        password: hashedPassword,
        name: 'System Admin',
        role: 'ADMIN',
        employeeId: 'ADMIN-001', // Important since this field is required in your DB
      },
    });
    console.log('✅ Default admin created successfully.');
  } else {
    console.log('✅ Admin user already exists. Skipping creation.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Seed script finished.');
  });
