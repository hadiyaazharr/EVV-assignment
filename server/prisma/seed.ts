import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create roles if they don't exist
  await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrator with full access',
    },
  });

  await prisma.role.upsert({
    where: { name: 'CAREGIVER' },
    update: {},
    create: {
      name: 'CAREGIVER',
      description: 'Caregiver with limited access',
    },
  });

  // Fetch roles for user creation
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  const caregiverRole = await prisma.role.findUnique({ where: { name: 'CAREGIVER' } });

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      roleId: adminRole!.id
    }
  });

  // Create caregiver user
  const caregiverPassword = await bcrypt.hash('caregiver123', 10);
  const caregiver = await prisma.user.upsert({
    where: { email: 'caregiver@example.com' },
    update: {},
    create: {
      email: 'caregiver@example.com',
      password: caregiverPassword,
      firstName: 'John',
      lastName: 'Doe',
      roleId: caregiverRole!.id
    }
  });

  // Create clients
  const client1 = await prisma.client.create({
    data: {
      name: 'John Smith',
      address: '123 Main St, City, State'
    }
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'Jane Doe',
      address: '456 Oak Ave, City, State'
    }
  });

  // Create some shifts for the caregiver
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const shift1 = await prisma.shift.create({
    data: {
      date: today,
      clientId: client1.id,
      caregiverId: caregiver.id,
      status: 'pending'
    },
  });

  const shift2 = await prisma.shift.create({
    data: {
      date: tomorrow,
      clientId: client2.id,
      caregiverId: caregiver.id,
      status: 'pending'
    },
  });

  console.log('Database has been seeded. 🌱');
  console.log({ admin, caregiver, client1, client2, shift1, shift2 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 