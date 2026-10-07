import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'carlosbal@gmail.com';
  const password = 'pachi1912';

  // 1. Get a Plan
  const plan = await prisma.plan.findFirst({ where: { isActive: true } });
  if (!plan) {
    console.error('No active plan found. Please create a plan first.');
    return;
  }

  // 2. Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // 3. Create Local and User
  const local = await prisma.local.create({
    data: {
      name: 'Local de Carlos',
      ownerEmail: email,
      planId: plan.id,
      dueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from now
      status: 'ACTIVE',
      users: {
        create: {
          name: 'Carlos Bal',
          email: email,
          passwordHash: passwordHash,
          role: 'ADMIN',
        },
      },
      businessSettings: {
        create: {
          businessName: 'Local de Carlos',
        }
      },
      cashRegisters: {
        create: {
          currentBalance: 0
        }
      }
    },
    include: {
      users: true,
    },
  });

  console.log(`Created Local: ${local.name} (ID: ${local.id})`);
  console.log(`Created User: ${local.users[0].email} with role ${local.users[0].role}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
