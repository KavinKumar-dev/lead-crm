import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

export const CLIENT_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export const LEAD_SOURCES = ['INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'OTHER'] as const;
export const LEAD_STATUSES = [
  'NEW_LEAD',
  'CONTACTED',
  'INTERESTED',
  'NOT_RESPONDING',
  'FOLLOW_UP_REQUIRED',
  'CONVERTED',
  'LOST',
] as const;
export const FOLLOW_UP_STAGES = [
  'INITIAL_CONTACT',
  'FOLLOW_UP_1',
  'FOLLOW_UP_2',
  'FOLLOW_UP_3',
] as const;

/** The admin password must be at least this long. */
const MIN_PASSWORD_LENGTH = 12;

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be defined in .env');
  }

  if (adminPassword.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters (got ${adminPassword.length}).`
    );
  }

  console.log('Seeding initial Admin user...');
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: hashedPassword,
    },
    create: {
      name: 'System Admin',
      email: adminEmail,
      passwordHash: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log(`Admin user ready: ${admin.email}`);

  // The demo client is opt-in: set SEED_DEMO=true to create it.
  if (process.env.SEED_DEMO === 'true') {
    const sampleClientCode = '10245';
    const sampleClientPassword = await bcrypt.hash('ClientPass123!', 10);

    const client = await prisma.client.upsert({
      where: { clientCode: sampleClientCode },
      update: {},
      create: {
        clientCode: sampleClientCode,
        clientName: 'Demo Client',
        businessName: 'Acme Corp',
        passwordHash: sampleClientPassword,
        status: 'ACTIVE',
      },
    });

    console.log(`Sample client ready: ${client.clientCode} (${client.clientName})`);
  } else {
    console.log('SEED_DEMO is not "true" — skipping the demo client.');
  }
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
