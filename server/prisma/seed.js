const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Database...');

  // 1. Clear existing data
  await prisma.siteSettings.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.review.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared database tables.');

  // 2. Create Users
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const userPassword = await bcrypt.hash('Test123!', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Elite Admin',
      email: 'admin@elitestyle.com',
      password: adminPassword,
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const testUser = await prisma.user.create({
    data: {
      name: 'Jane Doe',
      email: 'user@test.com',
      password: userPassword,
      role: 'USER',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  console.log('Created Users:', { admin: adminUser.email, user: testUser.email });

  // 3. Create Default Site Settings
  const defaultSettings = [
    // Branding
    { key: 'site_name', value: 'Elite Style', type: 'text', category: 'branding', label: 'Site Name' },
    { key: 'site_tagline', value: 'Premium Fashion & Lifestyle', type: 'text', category: 'branding', label: 'Tagline' },
    { key: 'site_logo', value: '', type: 'image', category: 'branding', label: 'Logo Image URL' },
    // Hero
    { key: 'hero_title', value: 'Elevate Your Everyday Style', type: 'text', category: 'hero', label: 'Hero Title' },
    { key: 'hero_subtitle', value: 'Discover premium clothing, shoes, bags, and luxury accessories curated for the modern lifestyle.', type: 'text', category: 'hero', label: 'Hero Subtitle' },
    { key: 'hero_cta_text', value: 'Explore Collection', type: 'text', category: 'hero', label: 'CTA Button Text' },
    { key: 'hero_image', value: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600', type: 'image', category: 'hero', label: 'Hero Image URL' },
    // Footer
    { key: 'footer_about', value: 'Elite Style is your premium boutique destination. We offer hand-picked apparel and accessories combining modern designs with lasting quality.', type: 'text', category: 'footer', label: 'About Us Footer Text' },
    { key: 'contact_email', value: 'support@elitestyle.com', type: 'text', category: 'footer', label: 'Support Email Address' },
    { key: 'contact_phone', value: '+91 98765 43210', type: 'text', category: 'footer', label: 'Support Phone Number' },
    // SEO
    { key: 'meta_title', value: 'Elite Style | Premium E-Commerce Boutique', type: 'text', category: 'seo', label: 'Homepage Title Tag' },
    { key: 'meta_description', value: 'Shop premium fashion, bespoke blazers, designer bags, shoes and accessories with free shipping options.', type: 'text', category: 'seo', label: 'Meta Description' },
    // General
    { key: 'free_shipping_threshold', value: '5000', type: 'text', category: 'general', label: 'Free Shipping Min Purchase (₹)' },
    { key: 'currency', value: 'INR', type: 'text', category: 'general', label: 'Currency Code' },
    { key: 'currency_symbol', value: '₹', type: 'text', category: 'general', label: 'Currency Symbol' },
    { key: 'announcement_bar', value: 'Grand Opening! Apply code STYLE20 for 20% off on all items!', type: 'text', category: 'general', label: 'Announcement Bar Text' },
    { key: 'show_announcement', value: 'true', type: 'boolean', category: 'general', label: 'Show Announcement Bar' },
  ];

  for (const setting of defaultSettings) {
    await prisma.siteSettings.create({ data: setting });
  }
  console.log('Seeded Default Site Settings.');

  // 4. Create Categories
  const categories = [
    { name: 'Clothing', slug: 'clothing', description: 'Curated premium dresses, outer coats, and knitwear.', image: 'https://images.unsplash.com/photo-1434389677669-e08b4cda3a20?w=600' },
    { name: 'Shoes', slug: 'shoes', description: 'Handcrafted luxury sneakers, heels, and leather boots.', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600' },
    { name: 'Accessories', slug: 'accessories', description: 'Premium sunglasses, designer belts, and fine jewelry.', image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600' },
    { name: 'Bags', slug: 'bags', description: 'Exquisite leather handbags, clutches, and travel backpacks.', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600' }
  ];

  const categoryDb = {};
  for (const cat of categories) {
    const dbCat = await prisma.category.create({ data: cat });
    categoryDb[cat.slug] = dbCat.id;
  }
  console.log('Created Categories.');

  // 5. Create Products
  const products = [
    // Clothing
    {
      name: 'Cashmere Trench Coat',
      slug: 'cashmere-trench-coat',
      description: 'An elegant cashmere-wool blend trench coat featuring double-breasted closure and adjustable waist belt for structural styling.',
      price: 18999,
      comparePrice: 24999,
      images: [
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600',
        'https://images.unsplash.com/photo-1434389677669-e08b4cda3a20?w=600'
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Beige', 'Camel', 'Navy'],
      stock: 12,
      featured: true,
      categoryId: categoryDb['clothing']
    },
    {
      name: 'Silk Blend Tailored Blazer',
      slug: 'silk-blend-blazer',
      description: 'Bespoke silk-accented fitted blazer featuring peak lapels, flap pockets, and signature gold buttons.',
      price: 12499,
      comparePrice: 15999,
      images: [
        'https://images.unsplash.com/photo-1548142813-c348350df52b?w=600'
      ],
      sizes: ['XS', 'S', 'M', 'L'],
      colors: ['Black', 'Cream'],
      stock: 25,
      featured: true,
      categoryId: categoryDb['clothing']
    },
    {
      name: 'Knitted Merino Wool Sweater',
      slug: 'knitted-merino-wool-sweater',
      description: 'Extra fine merino wool sweater with ribbed crew neck, offering insulation and supreme next-to-skin softness.',
      price: 6499,
      comparePrice: 7999,
      images: [
        'https://images.unsplash.com/photo-1434389677669-e08b4cda3a20?w=600'
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Grey', 'Navy', 'Olive'],
      stock: 30,
      featured: false,
      categoryId: categoryDb['clothing']
    },
    {
      name: 'Linen Button-Down Shirt',
      slug: 'linen-button-down-shirt',
      description: 'Lightweight Italian linen shirt tailored for a relaxed fit, complete with mother-of-pearl buttons.',
      price: 3499,
      comparePrice: 4499,
      images: [
        'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600'
      ],
      sizes: ['S', 'M', 'L'],
      colors: ['White', 'Sky Blue'],
      stock: 40,
      featured: false,
      categoryId: categoryDb['clothing']
    },
    {
      name: 'Pleated A-Line Midi Dress',
      slug: 'pleated-a-line-midi-dress',
      description: 'Flowy pleated midi dress featuring halter neckline and structured sash belt for cocktail settings.',
      price: 8999,
      comparePrice: 10999,
      images: [
        'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600'
      ],
      sizes: ['XS', 'S', 'M', 'L'],
      colors: ['Blush Pink', 'Emerald'],
      stock: 15,
      featured: true,
      categoryId: categoryDb['clothing']
    },
    {
      name: 'Pleated Tailored Trousers',
      slug: 'pleated-tailored-trousers',
      description: 'High-waisted pleated wool trousers featuring straight leg silhouette and concealed hook-and-bar closure.',
      price: 4999,
      comparePrice: 5999,
      images: [
        'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600'
      ],
      sizes: ['S', 'M', 'L'],
      colors: ['Off-White', 'Black'],
      stock: 22,
      featured: false,
      categoryId: categoryDb['clothing']
    },

    // Shoes
    {
      name: 'Handcrafted Derby Leather Shoes',
      slug: 'handcrafted-derby-leather-shoes',
      description: 'Premium full-grain Italian leather derby shoes with calfskin lining and Goodyear welted sole.',
      price: 14999,
      comparePrice: 18999,
      images: [
        'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600'
      ],
      sizes: ['7', '8', '9', '10', '11'],
      colors: ['Tan', 'Black'],
      stock: 18,
      featured: true,
      categoryId: categoryDb['shoes']
    },
    {
      name: 'Platform Leather Chelsea Boots',
      slug: 'platform-leather-chelsea-boots',
      description: 'Sleek calf leather Chelsea boots featuring elasticated side panels and pull-tabs, elevated by a lightweight platform sole.',
      price: 11999,
      comparePrice: 14999,
      images: [
        'https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600'
      ],
      sizes: ['6', '7', '8', '9', '10'],
      colors: ['Nude', 'Black'],
      stock: 14,
      featured: true,
      categoryId: categoryDb['shoes']
    },
    {
      name: 'Retro Calfskin Sneakers',
      slug: 'retro-calfskin-sneakers',
      description: 'Casual luxury trainers featuring hand-stitched detailing, orthopedic insoles and flexible gum outsoles.',
      price: 7999,
      comparePrice: 9999,
      images: [
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'
      ],
      sizes: ['7', '8', '9', '10'],
      colors: ['White', 'Navy-White'],
      stock: 50,
      featured: false,
      categoryId: categoryDb['shoes']
    },
    {
      name: 'Suede Pointed-Toe Stilettos',
      slug: 'suede-pointed-toe-stilettos',
      description: 'Delicate Italian goat suede pumps with 85mm stiletto heels and memory foam cushioned footbed.',
      price: 9499,
      comparePrice: 11999,
      images: [
        'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600'
      ],
      sizes: ['6', '7', '8', '9'],
      colors: ['Red', 'Midnight Blue'],
      stock: 10,
      featured: false,
      categoryId: categoryDb['shoes']
    },
    {
      name: 'Leather Penny Loafers',
      slug: 'leather-penny-loafers',
      description: 'Classic penny loafers crafted from pull-up leather, featuring hand-sewn moc toe and stacked leather heels.',
      price: 8999,
      comparePrice: 10999,
      images: [
        'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600'
      ],
      sizes: ['8', '9', '10', '11'],
      colors: ['Burgundy', 'Brown'],
      stock: 20,
      featured: false,
      categoryId: categoryDb['shoes']
    },
    {
      name: 'Strappy Block Heel Sandals',
      slug: 'strappy-block-heel-sandals',
      description: 'Elegant strappy nappa leather sandals with robust 50mm block heel and buckle ankle closure.',
      price: 5499,
      comparePrice: 6999,
      images: [
        'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=600'
      ],
      sizes: ['6', '7', '8', '9'],
      colors: ['Gold', 'White'],
      stock: 15,
      featured: false,
      categoryId: categoryDb['shoes']
    },

    // Accessories
    {
      name: 'Acetate Cat-Eye Sunglasses',
      slug: 'acetate-cat-eye-sunglasses',
      description: 'Bold retro cat-eye frames handcrafted from glossy bio-acetate, equipped with UV400 protective polarized Carl Zeiss lenses.',
      price: 4999,
      comparePrice: 5999,
      images: [
        'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600'
      ],
      sizes: ['One Size'],
      colors: ['Tortoise', 'Black'],
      stock: 45,
      featured: true,
      categoryId: categoryDb['accessories']
    },
    {
      name: 'Gilded Hoop Earrings',
      slug: 'gilded-hoop-earrings',
      description: '18k gold plated sterling silver ribbed hoops, engineered with secure hypoallergenic latch back.',
      price: 2999,
      comparePrice: 3999,
      images: [
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600'
      ],
      sizes: ['One Size'],
      colors: ['Gold', 'Silver'],
      stock: 35,
      featured: true,
      categoryId: categoryDb['accessories']
    },
    {
      name: 'Bespoke Crocodile Leather Belt',
      slug: 'bespoke-crocodile-leather-belt',
      description: 'Embossed leather belt completed with a hand-polished solid brass gold-finish buckle.',
      price: 3999,
      comparePrice: 4999,
      images: [
        'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=600'
      ],
      sizes: ['32', '34', '36', '38'],
      colors: ['Black', 'Dark Brown'],
      stock: 24,
      featured: false,
      categoryId: categoryDb['accessories']
    },
    {
      name: 'Minimalist Chronograph Watch',
      slug: 'minimalist-chronograph-watch',
      description: '40mm sandblasted dial watch with Swiss quartz movement, calendar window, and interchangeable quick-release leather strap.',
      price: 15999,
      comparePrice: 19999,
      images: [
        'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600'
      ],
      sizes: ['One Size'],
      colors: ['Rose Gold-White', 'Black-Black'],
      stock: 15,
      featured: true,
      categoryId: categoryDb['accessories']
    },
    {
      name: 'Cashmere Fringe Scarf',
      slug: 'cashmere-fringe-scarf',
      description: 'Woven cashmere scarf measuring 180cm x 30cm, featuring delicate fringed edges.',
      price: 4499,
      comparePrice: 5499,
      images: [
        'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?w=600'
      ],
      sizes: ['One Size'],
      colors: ['Charcoal', 'Oatmeal'],
      stock: 30,
      featured: false,
      categoryId: categoryDb['accessories']
    },
    {
      name: 'Silk Square Neck Scarf',
      slug: 'silk-square-neck-scarf',
      description: '100% pure Mulberry silk twill scarf with hand-rolled edges, adorned with retro botanical print.',
      price: 2499,
      comparePrice: 2999,
      images: [
        'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=600'
      ],
      sizes: ['One Size'],
      colors: ['Floral Multi'],
      stock: 40,
      featured: false,
      categoryId: categoryDb['accessories']
    },

    // Bags
    {
      name: 'Structured Leather Handbag',
      slug: 'structured-leather-handbag',
      description: 'Rigid box silhouette handbag crafted from scratch-resistant saffiano leather, detailed with protective metal feet and internal zipped compartments.',
      price: 18499,
      comparePrice: 22999,
      images: [
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600'
      ],
      sizes: ['Medium'],
      colors: ['Black', 'Burgundy', 'Forest Green'],
      stock: 8,
      featured: true,
      categoryId: categoryDb['bags']
    },
    {
      name: 'Quilted Chain Shoulder Bag',
      slug: 'quilted-chain-shoulder-bag',
      description: 'Iconic quilted lambskin shoulder bag featuring interlaced gold chain shoulder strap and interlocking turn-lock clasp.',
      price: 24999,
      comparePrice: 29999,
      images: [
        'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600'
      ],
      sizes: ['Small'],
      colors: ['Black', 'Blush Pink'],
      stock: 6,
      featured: true,
      categoryId: categoryDb['bags']
    },
    {
      name: 'Leather Crossbody Bag',
      slug: 'leather-crossbody-bag',
      description: 'Compact semi-structured saddle bag crafted from pebbled leather, equipped with comfortable adjustable cross-body strap.',
      price: 9999,
      comparePrice: 12999,
      images: [
        'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=600'
      ],
      sizes: ['Small'],
      colors: ['Tan', 'Sage Green'],
      stock: 15,
      featured: false,
      categoryId: categoryDb['bags']
    },
    {
      name: 'Canvas Holiday Tote Bag',
      slug: 'canvas-holiday-tote-bag',
      description: 'Heavyweight organic cotton canvas tote bag trimmed with calf leather handles, complete with internal pocket.',
      price: 5999,
      comparePrice: 7499,
      images: [
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600'
      ],
      sizes: ['Large'],
      colors: ['Natural-Brown'],
      stock: 25,
      featured: false,
      categoryId: categoryDb['bags']
    },
    {
      name: 'Sleek Leather Evening Clutch',
      slug: 'sleek-leather-evening-clutch',
      description: 'Slim envelope clutch with magnetic closure and detachable fine chain strap, lined in plush faux suede.',
      price: 7499,
      comparePrice: 8999,
      images: [
        'https://images.unsplash.com/photo-1566150905458-1bf1fc15a4a0?w=600'
      ],
      sizes: ['One Size'],
      colors: ['Silver', 'Gold', 'Black'],
      stock: 12,
      featured: false,
      categoryId: categoryDb['bags']
    },
    {
      name: 'Luxury Travel Duffle Bag',
      slug: 'luxury-travel-duffle-bag',
      description: 'Spacious weekender duffle bag in water-resistant canvas with full-grain leather details and padded shoulder strap.',
      price: 19999,
      comparePrice: 24999,
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'
      ],
      sizes: ['Large'],
      colors: ['Olive Drab', 'Classic Black'],
      stock: 10,
      featured: false,
      categoryId: categoryDb['bags']
    }
  ];

  for (const prod of products) {
    const createdProd = await prisma.product.create({ data: prod });
    
    // Add default reviews for featured products
    if (prod.featured) {
      await prisma.review.create({
        data: {
          rating: 5,
          title: 'Uncompromising Quality',
          comment: `Absolutely loved this product. The craftsmanship is superb and the fit/feel is extremely premium. Fully worth it!`,
          userId: testUser.id,
          productId: createdProd.id
        }
      });

      // Update rating metrics
      await prisma.product.update({
        where: { id: createdProd.id },
        data: {
          rating: 5.0,
          reviewCount: 1
        }
      });
    }
  }
  console.log('Created Products and Reviews.');

  // 6. Create Promo Codes
  await prisma.promoCode.create({
    data: {
      code: 'ELITE10',
      discountPercent: 10.0,
      maxUses: 100,
      active: true
    }
  });

  await prisma.promoCode.create({
    data: {
      code: 'STYLE20',
      discountPercent: 20.0,
      maxUses: 50,
      active: true
    }
  });

  console.log('Created Promo Codes.');
  console.log('Database Seeding Completed Successfully! 🚀');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
