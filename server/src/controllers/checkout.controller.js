const prisma = require('../config/db');
const razorpayService = require('../services/razorpay.service');

const createRazorpayOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { promoCode } = req.body;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    let subtotal = 0;
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.product.name} is out of stock.`,
        });
      }
      subtotal += item.product.price * item.quantity;
    }

    let discount = 0;
    if (promoCode) {
      const code = await prisma.promoCode.findUnique({
        where: { code: promoCode },
      });

      if (code && code.active && (code.expiresAt === null || code.expiresAt > new Date()) && code.usedCount < code.maxUses) {
        discount = (subtotal * code.discountPercent) / 100;
      }
    }

    // Fetch site shipping threshold
    const shippingSetting = await prisma.siteSettings.findUnique({ where: { key: 'free_shipping_threshold' } });
    const threshold = shippingSetting ? parseFloat(shippingSetting.value) : 1000;
    const shippingCost = subtotal >= threshold ? 0 : 150; // INR 150 shipping fee
    const total = subtotal - discount + shippingCost;

    const receiptId = `rcpt_${userId.slice(-6)}_${Date.now().toString().slice(-6)}`;
    const paymentOrder = await razorpayService.createOrder(total, receiptId);

    res.json({
      success: true,
      orderId: paymentOrder.id,
      amount: paymentOrder.amount / 100, // INR (converted from paise)
      currency: paymentOrder.currency,
      key_id: paymentOrder.key_id,
      subtotal,
      discount,
      shippingCost,
      total,
      demoMode: !!paymentOrder.demoMode,
    });
  } catch (error) {
    next(error);
  }
};

const verifyPromoCode = async (req, res, next) => {
  try {
    const { code } = req.body;

    const promo = await prisma.promoCode.findUnique({
      where: { code },
    });

    if (!promo) {
      return res.status(404).json({ success: false, message: 'Invalid promo code' });
    }

    if (!promo.active) {
      return res.status(400).json({ success: false, message: 'Promo code is inactive' });
    }

    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Promo code has expired' });
    }

    if (promo.usedCount >= promo.maxUses) {
      return res.status(400).json({ success: false, message: 'Promo code usage limit reached' });
    }

    res.json({
      success: true,
      code: promo.code,
      discountPercent: promo.discountPercent,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPromoCode,
};
