const prisma = require('../config/db');

const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

const createReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, rating, title, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Check if user has already reviewed the product
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }

    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating: parseInt(rating, 10),
        title: title || '',
        comment: comment || '',
      },
      include: {
        user: { select: { name: true, avatar: true } },
      },
    });

    // Update product rating average & count
    const aggregations = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: aggregations._avg.rating || 0,
        reviewCount: aggregations._count.id || 0,
      },
    });

    res.status(201).json({
      success: true,
      review,
    });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { id } = req.params;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.userId !== userId && role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const productId = review.productId;

    await prisma.review.delete({ where: { id } });

    // Recalculate product rating average & count
    const aggregations = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { id: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: aggregations._avg.rating || 0,
        reviewCount: aggregations._count.id || 0,
      },
    });

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProductReviews,
  createReview,
  deleteReview,
};
