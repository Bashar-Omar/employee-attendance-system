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
      console.log(`   Employee ID: ${existingAdmin.employeeId}`);
    } else {
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
    }
  } catch (error) {
    // If it's a unique constraint error, admin already exists
    if (error.code === 'P2002') {
      console.log('✅ Admin user already exists (unique constraint). Skipping.');
    } else {
      console.error('❌ Error during admin creation:', error.message);
      console.error('   Full error:', error);
    }
  }

  // Default department
  await prisma.department.upsert({
    where: { name: 'General' },
    update: {},
    create: { name: 'General', description: 'Default department' },
  });
  console.log('Default department ready');

  // Default shift
  const defaultShift = await prisma.shift.upsert({
    where: { name: 'Default Shift' },
    update: {},
    create: {
      name: 'Default Shift',
      startTime: '09:00',
      endTime: '17:00',
      gracePeriodMins: 15,
      overtimeAfterMins: 30,
      workDays: '0,1,2,3,4', // Sun-Thu (Egyptian work week)
    },
  });
  console.log('Default shift ready');

  // Starter deduction rules — admin can edit/delete/add any of these from the UI
  const defaultRules = [
    { type: 'LATE', lateMinutesFrom: 1, lateMinutesTo: 30, deductionType: 'PERCENTAGE', deductionValue: 5, label: 'Minor late (1-30 min)' },
    { type: 'LATE', lateMinutesFrom: 31, lateMinutesTo: 60, deductionType: 'PERCENTAGE', deductionValue: 10, label: 'Late (31-60 min)' },
    { type: 'LATE', lateMinutesFrom: 61, lateMinutesTo: 120, deductionType: 'PERCENTAGE', deductionValue: 15, label: 'Very late (1-2 hrs)' },
    { type: 'LATE', lateMinutesFrom: 121, lateMinutesTo: null, deductionType: 'PERCENTAGE', deductionValue: 25, label: 'Severely late (2+ hrs)' },
    { type: 'ABSENT', lateMinutesFrom: 0, lateMinutesTo: null, deductionType: 'PERCENTAGE', deductionValue: 100, label: 'Full day absent' },
  ];

  const existingRulesCount = await prisma.deductionRule.count({ where: { shiftId: defaultShift.id } });
  if (existingRulesCount === 0) {
    for (const rule of defaultRules) {
      await prisma.deductionRule.create({ data: { shiftId: defaultShift.id, ...rule } });
    }
    console.log('Default deduction rules ready (admin can modify these from the UI)');
  } else {
    console.log('Default deduction rules already exist.');
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
