const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:elitestyle30082006@db.ljplsodklkfaqynxjbbz.supabase.co:6543/postgres?pgbouncer=true'
    }
  }
});

async function main() {
  console.log('Testing Prisma connection to db.[project-ref].supabase.co:6543...');
  const userCount = await prisma.user.count();
  console.log('SUCCESS! Database query succeeded. User count:', userCount);
}

main()
  .catch((e) => {
    console.error('ERROR connecting to Supabase pooler:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
