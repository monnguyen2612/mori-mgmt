import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with multiple packages support...');

  // Create default admin and staff users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      name: 'Admin Mori',
      role: 'admin',
    },
  });

  const staff = await prisma.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      username: 'staff',
      password: staffPassword,
      name: 'Staff Pilates',
      role: 'staff',
    },
  });

  console.log('Created users:', admin.username, staff.username);

  // Clear existing data (order is important due to foreign key constraints)
  await prisma.attendanceLog.deleteMany({});
  await prisma.revenue.deleteMany({});
  await prisma.customerPackage.deleteMany({});
  await prisma.customer.deleteMany({});

  const now = new Date();
  
  // Helper for relative dates
  const daysAgo = (num: number) => {
    const d = new Date();
    d.setDate(d.getDate() - num);
    return d;
  };
  
  const daysFromNow = (num: number) => {
    const d = new Date();
    d.setDate(d.getDate() + num);
    return d;
  };

  // --- CUSTOMER 1: Nguyễn Văn A (Has 2 packages: 1 Active, 1 Out of sessions) ---
  const cust1 = await prisma.customer.create({
    data: {
      code: 'KH0001',
      name: 'Nguyễn Văn A',
      phone: '0901234567',
      dob: new Date('1990-05-15'),
      status: 'ACTIVE',
      notes: 'Thích tập gậy gỗ và bóng hơi.',
    },
  });

  // Package 1.1: Gói VIP 30 buổi (Active)
  const pkg1_1 = await prisma.customerPackage.create({
    data: {
      customerId: cust1.id,
      packageName: 'Gói VIP 30 buổi',
      totalSessions: 30,
      usedSessions: 10,
      remainingSessions: 20,
      purchaseDate: daysAgo(30),
      activationDate: daysAgo(28),
      expirationDate: daysFromNow(60),
      status: 'ACTIVE',
      notes: 'Gói tập chính.',
    },
  });

  // Package 1.2: Gói Trải nghiệm 5 buổi (Out of sessions)
  const pkg1_2 = await prisma.customerPackage.create({
    data: {
      customerId: cust1.id,
      packageName: 'Gói Trải nghiệm 5 buổi',
      totalSessions: 5,
      usedSessions: 5,
      remainingSessions: 0,
      purchaseDate: daysAgo(60),
      activationDate: daysAgo(60),
      expirationDate: daysAgo(30),
      status: 'OUT_OF_SESSIONS',
      notes: 'Gói trải nghiệm trước khi mua gói lớn.',
    },
  });


  // --- CUSTOMER 2: Trần Thị B (1 Package: Near out of sessions) ---
  const cust2 = await prisma.customer.create({
    data: {
      code: 'KH0002',
      name: 'Trần Thị B',
      phone: '0987654321',
      dob: new Date('1995-10-20'),
      status: 'ACTIVE',
      notes: 'Lưng mỏi, cần tập kéo giãn cột sống.',
    },
  });

  const pkg2 = await prisma.customerPackage.create({
    data: {
      customerId: cust2.id,
      packageName: 'Gói Cơ bản 10 buổi',
      totalSessions: 10,
      usedSessions: 9,
      remainingSessions: 1,
      purchaseDate: daysAgo(15),
      activationDate: daysAgo(14),
      expirationDate: daysFromNow(15),
      status: 'ACTIVE',
    },
  });


  // --- CUSTOMER 3: Lê Hoàng C (1 Package: Out of sessions) ---
  const cust3 = await prisma.customer.create({
    data: {
      code: 'KH0003',
      name: 'Lê Hoàng C',
      phone: '0912345678',
      dob: new Date('1988-12-01'),
      status: 'ACTIVE',
      notes: 'Khách tập tốt, chuẩn bị tư vấn tái ký.',
    },
  });

  const pkg3 = await prisma.customerPackage.create({
    data: {
      customerId: cust3.id,
      packageName: 'Gói Nâng cao 20 buổi',
      totalSessions: 20,
      usedSessions: 20,
      remainingSessions: 0,
      purchaseDate: daysAgo(60),
      activationDate: daysAgo(58),
      expirationDate: daysAgo(5),
      status: 'OUT_OF_SESSIONS',
    },
  });


  // --- CUSTOMER 4: Phạm Minh D (1 Package: Near expiration) ---
  const cust4 = await prisma.customer.create({
    data: {
      code: 'KH0004',
      name: 'Phạm Minh D',
      phone: '0933445566',
      dob: new Date('1992-02-28'),
      status: 'ACTIVE',
    },
  });

  const pkg4 = await prisma.customerPackage.create({
    data: {
      customerId: cust4.id,
      packageName: 'Gói Trải nghiệm 5 buổi',
      totalSessions: 5,
      usedSessions: 2,
      remainingSessions: 3,
      purchaseDate: daysAgo(27),
      activationDate: daysAgo(27),
      expirationDate: daysFromNow(3),
      status: 'ACTIVE',
    },
  });


  // --- CUSTOMER 5: Vũ Thị E (1 Package: Expired) ---
  const cust5 = await prisma.customer.create({
    data: {
      code: 'KH0005',
      name: 'Vũ Thị E',
      phone: '0977889900',
      dob: new Date('1985-07-07'),
      status: 'ACTIVE',
      notes: 'Bận việc gia đình tạm nghỉ.',
    },
  });

  const pkg5 = await prisma.customerPackage.create({
    data: {
      customerId: cust5.id,
      packageName: 'Gói 50 buổi',
      totalSessions: 50,
      usedSessions: 42,
      remainingSessions: 8,
      purchaseDate: daysAgo(120),
      activationDate: daysAgo(115),
      expirationDate: daysAgo(10),
      status: 'EXPIRED',
    },
  });

  console.log('Created customers and their packages');

  // --- CREATE REVENUE RECORDS ---
  await prisma.revenue.create({
    data: {
      date: daysAgo(30),
      customerId: cust1.id,
      packageId: pkg1_1.id,
      packageName: 'Gói VIP 30 buổi',
      totalSessions: 30,
      amount: 15000000,
      pricePerSession: 15000000 / 30,
      paymentMethod: 'BANK_TRANSFER',
      salesperson: 'Admin Mori',
      notes: 'Thanh toán gói chính.',
    },
  });

  await prisma.revenue.create({
    data: {
      date: daysAgo(60),
      customerId: cust1.id,
      packageId: pkg1_2.id,
      packageName: 'Gói Trải nghiệm 5 buổi',
      totalSessions: 5,
      amount: 2500000,
      pricePerSession: 2500000 / 5,
      paymentMethod: 'BANK_TRANSFER',
      salesperson: 'Admin Mori',
      notes: 'Thanh toán gói trải nghiệm.',
    },
  });

  await prisma.revenue.create({
    data: {
      date: daysAgo(15),
      customerId: cust2.id,
      packageId: pkg2.id,
      packageName: 'Gói Cơ bản 10 buổi',
      totalSessions: 10,
      amount: 6000000,
      pricePerSession: 6000000 / 10,
      paymentMethod: 'BANK_TRANSFER',
      salesperson: 'Staff Pilates',
    },
  });

  await prisma.revenue.create({
    data: {
      date: daysAgo(60),
      customerId: cust3.id,
      packageId: pkg3.id,
      packageName: 'Gói Nâng cao 20 buổi',
      totalSessions: 20,
      amount: 11000000,
      pricePerSession: 11000000 / 20,
      paymentMethod: 'CASH',
      salesperson: 'Admin Mori',
    },
  });

  await prisma.revenue.create({
    data: {
      date: daysAgo(27),
      customerId: cust4.id,
      packageId: pkg4.id,
      packageName: 'Gói Trải nghiệm 5 buổi',
      totalSessions: 5,
      amount: 3500000,
      pricePerSession: 3500000 / 5,
      paymentMethod: 'CARD',
      salesperson: 'Staff Pilates',
    },
  });

  await prisma.revenue.create({
    data: {
      date: daysAgo(120),
      customerId: cust5.id,
      packageId: pkg5.id,
      packageName: 'Gói 50 buổi',
      totalSessions: 50,
      amount: 22000000,
      pricePerSession: 22000000 / 50,
      paymentMethod: 'BANK_TRANSFER',
      salesperson: 'Admin Mori',
    },
  });

  console.log('Created revenue records linked to packages');

  // --- CREATE ATTENDANCE LOGS (CHECK-INS) ---
  const trainers = ['HLV Hana', 'HLV Ryan', 'HLV Chloe'];

  // For Nguyễn Văn A (pkg1_1: VIP 30 buổi - used 10)
  for (let i = 0; i < 10; i++) {
    await prisma.attendanceLog.create({
      data: {
        date: daysAgo(28 - i * 2),
        customerId: cust1.id,
        packageId: pkg1_1.id,
        packageName: 'Gói VIP 30 buổi',
        trainer: trainers[i % 3],
        costPerSession: 500000,
        notes: `Tập luyện gói VIP buổi thứ ${i + 1}`,
      },
    });
  }

  // For Nguyễn Văn A (pkg1_2: Trải nghiệm 5 buổi - used 5)
  for (let i = 0; i < 5; i++) {
    await prisma.attendanceLog.create({
      data: {
        date: daysAgo(60 - i * 2),
        customerId: cust1.id,
        packageId: pkg1_2.id,
        packageName: 'Gói Trải nghiệm 5 buổi',
        trainer: trainers[0],
        costPerSession: 500000,
        notes: `Trải nghiệm buổi thứ ${i + 1}`,
      },
    });
  }

  // For Trần Thị B (pkg2: used 9)
  for (let i = 0; i < 9; i++) {
    await prisma.attendanceLog.create({
      data: {
        date: daysAgo(14 - i),
        customerId: cust2.id,
        packageId: pkg2.id,
        packageName: 'Gói Cơ bản 10 buổi',
        trainer: trainers[i % 2],
        costPerSession: 600000,
      },
    });
  }

  // For Lê Hoàng C (pkg3: used 20)
  for (let i = 0; i < 20; i++) {
    await prisma.attendanceLog.create({
      data: {
        date: daysAgo(58 - i * 2.5),
        customerId: cust3.id,
        packageId: pkg3.id,
        packageName: 'Gói Nâng cao 20 buổi',
        trainer: trainers[i % 3],
        costPerSession: 550000,
      },
    });
  }

  // For Phạm Minh D (pkg4: used 2)
  for (let i = 0; i < 2; i++) {
    await prisma.attendanceLog.create({
      data: {
        date: daysAgo(20 - i * 5),
        customerId: cust4.id,
        packageId: pkg4.id,
        packageName: 'Gói Trải nghiệm 5 buổi',
        trainer: trainers[1],
        costPerSession: 700000,
      },
    });
  }

  // For Vũ Thị E (pkg5: used 42)
  for (let i = 0; i < 42; i++) {
    await prisma.attendanceLog.create({
      data: {
        date: daysAgo(115 - i * 2),
        customerId: cust5.id,
        packageId: pkg5.id,
        packageName: 'Gói 50 buổi',
        trainer: trainers[i % 3],
        costPerSession: 440000,
      },
    });
  }

  console.log('Created attendance logs linked to packages');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
