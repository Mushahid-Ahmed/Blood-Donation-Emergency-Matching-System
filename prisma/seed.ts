import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding system...');

  // 1. Create default Admin user
  const adminEmail = 'admin@bloodmatch.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  let adminId = '';

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.create({
      data: {
        name: 'System Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: Role.ADMIN,
        isActive: true,
      },
    });
    adminId = admin.id;
    console.log('Admin user created (admin@bloodmatch.com / admin123)');
  } else {
    adminId = existingAdmin.id;
    console.log('Admin user already exists');
  }

  // 2. Create default system configs
  const configs = [
    {
      key: 'COOLDOWN_DAYS',
      value: '56',
      description: 'Minimum cooldown period in days since last donation before a donor is eligible again.',
    },
    {
      key: 'REQUEST_EXPIRY_HOURS',
      value: '48',
      description: 'Default time window in hours after which active blood requests expire automatically.',
    },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: {
        key: config.key,
        value: config.value,
        description: config.description,
        updatedById: adminId,
      },
    });
  }

  console.log('System configuration settings seeded.');
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
