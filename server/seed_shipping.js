const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Upsert shipping_cost setting if it doesn't exist
  await prisma.siteSettings.upsert({
    where: { key: 'shipping_cost' },
    update: {},
    create: {
      key: 'shipping_cost',
      value: '150',
      type: 'number',
      category: 'general',
      label: 'Flat Shipping Cost (₹)',
    },
  });

  // Update free_shipping_threshold to category general so it shows in admin
  await prisma.siteSettings.upsert({
    where: { key: 'free_shipping_threshold' },
    update: { category: 'general', type: 'number', label: 'Free Shipping Threshold (₹)' },
    create: {
      key: 'free_shipping_threshold',
      value: '5000',
      type: 'number',
      category: 'general',
      label: 'Free Shipping Threshold (₹)',
    },
  });

  console.log('✅ Shipping settings seeded into SiteSettings!');

  const all = await prisma.siteSettings.findMany({ where: { category: 'general' } });
  console.log('General settings now:', all.map(s => `${s.key}=${s.value}`).join(', '));
}

main()
  .catch(e => console.error(e.message))
  .finally(() => prisma.$disconnect());
