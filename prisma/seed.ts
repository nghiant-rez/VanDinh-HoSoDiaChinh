import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Cán bộ quản trị hệ thống có toàn quyền',
    },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: 'STAFF' },
    update: {},
    create: {
      name: 'STAFF',
      description: 'Cán bộ tra cứu, xuất và in tài liệu',
    },
  });

  // Create Users
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      full_name: 'Quản trị viên',
      password_hash: adminPasswordHash,
      role_id: adminRole.id,
      is_active: true,
    },
  });

  const staffPasswordHash = await bcrypt.hash('staff123', 10);
  await prisma.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      username: 'staff',
      full_name: 'Cán bộ xã',
      password_hash: staffPasswordHash,
      role_id: staffRole.id,
      is_active: true,
    },
  });

  // Create Storage Locations
  const location1 = await prisma.storageLocation.create({
    data: {
      kho: 'Kho A',
      ke: 'Kệ 1',
      tang: 'Tầng 1',
      hop_so: 'Hộp 01',
    },
  });

  const location2 = await prisma.storageLocation.create({
    data: {
      kho: 'Kho A',
      ke: 'Kệ 1',
      tang: 'Tầng 2',
      hop_so: 'Hộp 02',
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
