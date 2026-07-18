const prisma = require('../config/db');

const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '12', 10);
    const skip = (page - 1) * limit;

    const { category, minPrice, maxPrice, rating, sort, featured, search } = req.query;

    const where = {};

    if (category) {
      where.category = { slug: category };
    }

    if (featured === 'true') {
      where.featured = true;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (rating) {
      where.rating = { gte: parseFloat(rating) };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy = { createdAt: 'desc' }; // default: newest

    if (sort) {
      if (sort === 'price-low') {
        orderBy = { price: 'asc' };
      } else if (sort === 'price-high') {
        orderBy = { price: 'desc' };
      } else if (sort === 'rating') {
        orderBy = { rating: 'desc' };
      }
    }

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { category: { select: { name: true, slug: true } } },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

const getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        reviews: {
          include: {
            user: { select: { name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      comparePrice,
      images,
      sizes,
      colors,
      stock,
      featured,
      categoryId,
    } = req.body;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    const finalSlug = existingSlug
      ? `${slug}-${Math.floor(1000 + Math.random() * 9000)}`
      : slug;

    const product = await prisma.product.create({
      data: {
        name,
        slug: finalSlug,
        description,
        price,
        comparePrice,
        images,
        sizes: sizes || [],
        colors: colors || [],
        stock,
        featured: featured || false,
        categoryId,
      },
      include: { category: true },
    });

    res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.name) {
      const slug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      const existingSlug = await prisma.product.findFirst({
        where: { slug, NOT: { id } },
      });
      updateData.slug = existingSlug
        ? `${slug}-${Math.floor(1000 + Math.random() * 9000)}`
        : slug;
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
};
