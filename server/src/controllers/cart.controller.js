const prisma = require('../config/db');

const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            comparePrice: true,
            images: true,
            stock: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      cartItems,
    });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, quantity, size, color } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Requested quantity exceeds available stock' });
    }

    // Upsert behavior on compound key userId, productId, size, color
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        userId,
        productId,
        size: size || null,
        color: color || null,
      },
    });

    let cartItem;
    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (product.stock < newQty) {
        return res.status(400).json({ success: false, message: 'Cannot add more items. Total exceeds available stock.' });
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
        include: { product: true },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          userId,
          productId,
          quantity,
          size: size || null,
          color: color || null,
        },
        include: { product: true },
      });
    }

    res.status(200).json({
      success: true,
      cartItem,
    });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      await prisma.cartItem.delete({
        where: { id, userId },
      });
      return res.json({ success: true, message: 'Item removed from cart' });
    }

    const cartItem = await prisma.cartItem.findFirst({
      where: { id, userId },
      include: { product: true },
    });

    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    if (cartItem.product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Requested quantity exceeds available stock' });
    }

    const updated = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: { product: true },
    });

    res.json({
      success: true,
      cartItem: updated,
    });
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const cartItem = await prisma.cartItem.findFirst({ where: { id, userId } });
    if (!cartItem) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    await prisma.cartItem.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await prisma.cartItem.deleteMany({ where: { userId } });

    res.json({
      success: true,
      message: 'Cart cleared successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
