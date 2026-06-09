import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';

const prisma = new PrismaClient();

function parseDate(v?: string): Date | undefined {
  if (!v) return undefined;
  const s = String(v).trim();
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

async function main() {
  console.log('Seeding database from Mori Flow Pilates exported data...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      name: 'Admin Mori',
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { username: 'staff' },
    update: {},
    create: {
      username: 'staff',
      password: staffPassword,
      name: 'Staff Pilates',
      role: 'staff',
    },
  });

  await prisma.attendanceLog.deleteMany({});
  await prisma.revenue.deleteMany({});
  await prisma.customerPackage.deleteMany({});
  await prisma.customer.deleteMany({});

  const raw = JSON.parse(fs.readFileSync('/tmp/seed-data.json', 'utf-8'));

  const codeToId: Record<string, string> = {};
  const pkgKeyToId: Record<string, string> = {};

  for (const c of raw.customers) {
    if (!c.code) continue;
    const created = await prisma.customer.create({
      data: {
        code: c.code,
        name: c.name || 'Khách không tên',
        phone: c.phone || '',
        dob: parseDate(c.dob),
        status: c.status || 'ACTIVE',
        notes: c.notes || null,
      },
    });
    codeToId[c.code] = created.id;
  }
  console.log('Inserted customers:', Object.keys(codeToId).length);

  const norm = (s: string) => (s || '').trim().toLowerCase();

  for (const p of raw.packages) {
    const customerId = codeToId[p.customerCode];
    if (!customerId) continue;
    const created = await prisma.customerPackage.create({
      data: {
        customerId,
        packageName: p.packageName || 'Gói không tên',
        totalSessions: p.totalSessions || 0,
        usedSessions: p.usedSessions || 0,
        remainingSessions: p.remainingSessions || 0,
        purchaseDate: parseDate(p.purchaseDate) || new Date(),
        activationDate: parseDate(p.activationDate) || undefined,
        expirationDate: parseDate(p.expirationDate) || undefined,
        status: p.status || 'ACTIVE',
        notes: p.notes || null,
      },
    });
    const key = `${p.customerCode}|${norm(p.packageName)}`;
    if (!(key in pkgKeyToId)) {
      pkgKeyToId[key] = created.id;
    }
  }
  console.log('Inserted packages:', Object.keys(pkgKeyToId).length);

  const firstPackageByCustomer: Record<string, string> = {};
  for (const p of raw.packages) {
    const existing = firstPackageByCustomer[p.customerCode];
    if (!existing) {
      const key = `${p.customerCode}|${norm(p.packageName)}`;
      if (pkgKeyToId[key]) {
        firstPackageByCustomer[p.customerCode] = pkgKeyToId[key];
      }
    }
  }

  let revInserted = 0;
  let revSkipped = 0;
  for (const r of raw.revenues) {
    const customerId = codeToId[r.customerCode || ''];
    if (!customerId) { revSkipped++; continue; }
    const pkgKey = `${r.customerCode || ''}|${norm(r.packageName)}`;
    const packageId = pkgKeyToId[pkgKey] || undefined;
    await prisma.revenue.create({
      data: {
        date: parseDate(r.date) || new Date(),
        customerId,
        packageId,
        packageName: r.packageName,
        totalSessions: r.totalSessions || 0,
        amount: r.amount || 0,
        pricePerSession: r.pricePerSession || 0,
        paymentMethod: r.paymentMethod || 'Chuyển khoản',
        salesperson: r.salesperson || '',
        notes: r.notes || null,
      },
    });
    revInserted++;
  }
  console.log('Inserted revenues:', revInserted, '| skipped:', revSkipped);

  let attInserted = 0;
  let attSkippedNoCust = 0;
  let attUsedFirstPkg = 0;
  for (const a of raw.attendances) {
    const customerId = codeToId[a.customerCode || ''];
    if (!customerId) { attSkippedNoCust++; continue; }
    const pkgKey = `${a.customerCode || ''}|${norm(a.packageName)}`;
    let packageId = pkgKeyToId[pkgKey];
    if (!packageId) {
      const fallback = firstPackageByCustomer[a.customerCode || ''];
      if (fallback) {
        packageId = fallback;
        attUsedFirstPkg++;
      }
    }
    if (!packageId) continue;
    await prisma.attendanceLog.create({
      data: {
        date: parseDate(a.date) || new Date(),
        customerId,
        packageId,
        packageName: a.packageName || '',
        trainer: a.trainer || '',
        checkInStatus: a.checkInStatus || 'CHECKED_IN',
        costPerSession: a.costPerSession || 0,
        notes: a.notes || null,
      },
    });
    attInserted++;
  }
  console.log('Inserted attendances:', attInserted, '| skipped no customer:', attSkippedNoCust, '| fallback to first package:', attUsedFirstPkg);

  console.log('Seeding completed successfully!');
  console.log('- customers:', Object.keys(codeToId).length);
  console.log('- packages:', Object.keys(pkgKeyToId).length);
  console.log('- revenues:', raw.revenues.length);
  console.log('- attendances:', raw.attendances.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
