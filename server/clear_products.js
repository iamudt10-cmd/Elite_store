const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reviews = await prisma.review.deleteMany({});
  console.log(`Deleted ${reviews.count} reviews`);

  const cartItems = await prisma.cartItem.deleteMany({});
  console.log(`Deleted ${cartItems.count} cart items`);

  const wishlist = await prisma.wishlist.deleteMany({});
  console.log(`Deleted ${wishlist.count} wishlist items`);

  const orderItems = await prisma.orderItem.deleteMany({});
  console.log(`Deleted ${orderItems.count} order items`);

  const products = await prisma.product.deleteMany({});
  console.log(`Deleted ${products.count} products`);

  console.log('\n✅ All sample products and related data cleared!');
}

main()
  .catch(e => console.error('Error:', e.message))
  .finally(() => prisma.$disconnect());
