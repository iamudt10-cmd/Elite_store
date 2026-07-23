const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.siteSettings.findMany();
  console.log('Current Settings:');
  settings.forEach(s => console.log(`  ${s.key} = ${s.value}`));
}

main()
  .catch(e => console.error(e.message))
  .finally(() => prisma.$disconnect());
