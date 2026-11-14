import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { demoLeads, priceBook } from '@nordhaus/domain';
const db = new PrismaClient();
async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password || password.length < 12)
    throw new Error('Ustaw SEED_ADMIN_PASSWORD (minimum 12 znaków)');
  await db.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com' },
    update: {},
    create: {
      email: process.env.SEED_ADMIN_EMAIL || 'admin@example.com',
      password: await hash(password, 12),
      role: 'admin',
    },
  });
  await db.setting.upsert({
    where: { key: 'priceBook' },
    update: {},
    create: { key: 'priceBook', value: priceBook },
  });
  for (const lead of demoLeads)
    await db.lead.upsert({
      where: { id: lead.id },
      update: {},
      create: {
        ...lead,
        message: 'Przykładowy lead demonstracyjny',
        createdAt: new Date(lead.createdAt),
      },
    });
}
main().finally(() => db.$disconnect());
