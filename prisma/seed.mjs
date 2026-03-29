import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('========================================');
  console.log('🌱 SEED SCRIPT STARTED');
  console.log('========================================');
  console.log(`📅 Time: ${new Date().toISOString()}`);
  console.log(`🔗 DATABASE_URL set: ${!!process.env.DATABASE_URL}`);

  // Test database connection first
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
  } catch (connError) {
    console.error('❌ Database connection FAILED:', connError.message);
    console.error('⚠️  Seed cannot proceed without database connection');
    return; // Exit gracefully, don't crash the app
  }

  // Check if admin user already exists
  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@company.com' },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists (admin@company.com). Skipping creation.');
      console.log(`   ID: ${existingAdmin.id}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Employee ID: ${existingAdmin.employeeId}`);
      return;
    }

    console.log('📝 No admin user found. Creating default admin...');
    const hashedPassword = await bcryptjs.hash('admin123', 10);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@company.com',
        password: hashedPassword,
        name: 'System Admin',
        role: 'ADMIN',
        employeeId: 'ADMIN-001',
      },
    });

    console.log('✅ Default admin created successfully!');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Employee ID: ${admin.employeeId}`);
  } catch (error) {
    // If it's a unique constraint error, admin already exists
    if (error.code === 'P2002') {
      console.log('✅ Admin user already exists (unique constraint). Skipping.');
    } else {
      console.error('❌ Error during admin creation:', error.message);
      console.error('   Full error:', error);
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Unexpected error in seed script:', e);
    // Do NOT process.exit(1) — let the app start even if seed fails
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('========================================');
    console.log('🌱 SEED SCRIPT FINISHED');
    console.log('========================================');
  });
