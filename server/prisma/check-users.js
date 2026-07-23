const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('Current Users in Database:');
  users.forEach(u => {
    console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, HasPassword: ${!!u.password}`);
  });
  await prisma.$disconnect();
}

main().catch(console.error);
