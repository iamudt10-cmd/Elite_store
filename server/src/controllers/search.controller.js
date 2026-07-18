const prisma = require('../config/db');

const searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.json({ success: true, products: [] });
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { category: { name: { contains: q, mode: 'insensitive' } } },
        ],
      },
      include: {
        category: { select: { name: true, slug: true } },
      },
      take: 20,
    });

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchProducts,
};
