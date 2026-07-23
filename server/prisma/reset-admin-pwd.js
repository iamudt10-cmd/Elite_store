const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@elitestyle.com';
  const plainPassword = 'Admin123!';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const updated = await prisma.user.update({
    where: { email },
    data: {
      password: hashedPassword,
      role: 'ADMIN' // ensure role is ADMIN
    }
  });

  console.log(`Successfully reset password for ${email}. New password is: ${plainPassword}`);
  await prisma.$disconnect();
}

main().catch(console.error);
