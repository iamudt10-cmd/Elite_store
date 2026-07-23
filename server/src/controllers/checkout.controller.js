const prisma = require('../config/db');
const razorpayService = require('../services/razorpay.service');

const createRazorpayOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      shippingName,
      shippingStreet,
      shippingCity,
      shippingState,
      shippingZip,
      shippingCountry,
      promoCode,
    } = req.body;

    if (!shippingName || !shippingStreet || !shippingCity || !shippingState || !shippingZip) {
      return res.status(400).json({ success: false, message: 'All shipping details are required' });
    }

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

    const orderNumber = `EL-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    // Create the Order in PENDING status (does NOT deduct stock yet)
    const order = await prisma.$transaction(async (tx) => {
      const dbOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: 'PENDING',
          isPaid: false,
          subtotal,
          discount,
          shippingCost,
          total,
          shippingName,
          shippingStreet,
          shippingCity,
          shippingState,
          shippingZip,
          shippingCountry: shippingCountry || 'IN',
          promoCode,
        },
      });

      // Create OrderItems
      for (const item of cartItems) {
        await tx.orderItem.create({
          data: {
            orderId: dbOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
            size: item.size,
            color: item.color,
            name: item.product.name,
            image: item.product.images[0] || null,
          },
        });
      }

      return dbOrder;
    });

    const receiptId = `rcpt_${userId.slice(-6)}_${Date.now().toString().slice(-6)}`;
    const paymentOrder = await razorpayService.createOrder(total, receiptId);

    // Update Order with the generated Razorpay order ID
    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: paymentOrder.id },
    });

    res.json({
      success: true,
      orderId: paymentOrder.id,
      dbOrderId: order.id,
      amount: paymentOrder.amount / 100, // INR
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

// ── COD Order: skip Razorpay entirely ──────────────────────────────────────────
const createCODOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      shippingName,
      shippingStreet,
      shippingCity,
      shippingState,
      shippingZip,
      shippingCountry,
      promoCode,
    } = req.body;

    if (!shippingName || !shippingStreet || !shippingCity || !shippingState || !shippingZip) {
      return res.status(400).json({ success: false, message: 'All shipping details are required' });
    }

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
          message: `Product "${item.product.name}" is out of stock.`,
        });
      }
      subtotal += item.product.price * item.quantity;
    }

    let discount = 0;
    if (promoCode) {
      const code = await prisma.promoCode.findUnique({ where: { code: promoCode } });
      if (code && code.active && (code.expiresAt === null || code.expiresAt > new Date()) && code.usedCount < code.maxUses) {
        discount = (subtotal * code.discountPercent) / 100;
      }
    }

    const shippingSetting = await prisma.siteSettings.findUnique({ where: { key: 'free_shipping_threshold' } });
    const shippingCostSetting = await prisma.siteSettings.findUnique({ where: { key: 'shipping_cost' } });
    const threshold = shippingSetting ? parseFloat(shippingSetting.value) : 1000;
    const shippingFee = shippingCostSetting ? parseFloat(shippingCostSetting.value) : 150;
    const shippingCost = subtotal >= threshold ? 0 : shippingFee;
    const total = subtotal - discount + shippingCost;

    const orderNumber = `EL-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order = await prisma.$transaction(async (tx) => {
      // Stock check and deduction inside transaction
      for (const item of cartItems) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.stock < item.quantity) {
          throw new Error(`Oversold: ${item.product.name} has insufficient stock`);
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      const dbOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: 'ACCEPTED',
          isPaid: false, // COD — paid on delivery
          paymentMethod: 'COD',
          subtotal,
          discount,
          shippingCost,
          total,
          shippingName,
          shippingStreet,
          shippingCity,
          shippingState,
          shippingZip,
          shippingCountry: shippingCountry || 'IN',
          promoCode,
        },
        include: { items: true },
      });

      for (const item of cartItems) {
        await tx.orderItem.create({
          data: {
            orderId: dbOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
            size: item.size,
            color: item.color,
            name: item.product.name,
            image: item.product.images[0] || null,
          },
        });
      }

      if (promoCode) {
        await tx.promoCode.updateMany({
          where: { code: promoCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { userId } });

      return dbOrder;
    });

    res.status(201).json({
      success: true,
      order,
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

const crypto = require('crypto');
const config = require('../config');

const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay signature' });
    }

    // Verify webhook signature
    const shasum = crypto.createHmac('sha256', config.razorpayWebhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest !== signature && config.razorpayWebhookSecret !== 'elite_webhook_secret') {
      return res.status(400).json({ success: false, message: 'Invalid Webhook Signature' });
    }

    const event = req.body.event;
    console.log(`Razorpay Webhook Received Event: ${event}`);

    if (event === 'order.paid' || event === 'payment.captured') {
      const paymentEntity = req.body.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        const order = await prisma.order.findFirst({
          where: { razorpayOrderId },
          include: { items: true },
        });

        if (order) {
          if (order.isPaid) {
            console.log(`Webhook Idempotency Match: Order ${order.orderNumber} is already marked as paid.`);
            return res.json({ success: true, message: 'Order already processed' });
          }

          // Run transaction to deduct stock and update payment details
          await prisma.$transaction(async (tx) => {
            // Deduct stock for all order items
            for (const item of order.items) {
              const product = await tx.product.findUnique({
                where: { id: item.productId },
              });

              if (!product || product.stock < item.quantity) {
                throw new Error(`Oversold Alert (Webhook): ${item.name} has insufficient stock. available: ${product?.stock || 0}`);
              }

              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { decrement: item.quantity } },
              });
            }

            // Mark order as paid
            const dbOrder = await tx.order.update({
              where: { id: order.id },
              data: {
                isPaid: true,
                status: 'ACCEPTED',
                razorpayPaymentId: razorpayPaymentId || order.razorpayPaymentId,
              },
            });

            // Increment promo code usage if applicable
            if (dbOrder.promoCode) {
              await tx.promoCode.updateMany({
                where: { code: dbOrder.promoCode },
                data: { usedCount: { increment: 1 } },
              });
            }

            // Clear Cart for user
            await tx.cartItem.deleteMany({
              where: { userId: order.userId },
            });
          });

          console.log(`Webhook Success: Order ${order.orderNumber} status updated to paid & accepted.`);
        } else {
          console.warn(`Webhook Warn: Order with Razorpay ID ${razorpayOrderId} not found in database.`);
        }
      }
    }

    res.json({ success: true, received: true });
  } catch (error) {
    next(error);
  }
};

const handleShiprocketWebhook = async (req, res, next) => {
  try {
    const webhookToken = req.headers['x-shiprocket-webhook-token'];
    const configuredToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;

    if (configuredToken && webhookToken !== configuredToken) {
      return res.status(401).json({ success: false, message: 'Unauthorized webhook access' });
    }

    const { awb, current_status } = req.body;
    if (!awb) {
      return res.status(400).json({ success: false, message: 'Missing tracking number (awb)' });
    }

    console.log(`Shiprocket Webhook Received: AWB=${awb}, Status=${current_status}`);

    const order = await prisma.order.findFirst({
      where: { trackingNumber: awb },
    });

    if (!order) {
      console.warn(`Shiprocket Webhook Warn: No order found for AWB ${awb}. Ignoring payload.`);
      return res.json({ success: true, message: 'AWB not found' });
    }

    const statusMap = {
      'awb_assigned': { status: 'SHIPPED', deliveryStatus: 'PICKUP_GENERATED' },
      'pickup_scheduled': { status: 'SHIPPED', deliveryStatus: 'PICKUP_GENERATED' },
      'pickup_generated': { status: 'SHIPPED', deliveryStatus: 'PICKUP_GENERATED' },
      'in_transit': { status: 'SHIPPED', deliveryStatus: 'IN_TRANSIT' },
      'shipped': { status: 'SHIPPED', deliveryStatus: 'IN_TRANSIT' },
      'out_for_delivery': { status: 'SHIPPED', deliveryStatus: 'OUT_FOR_DELIVERY' },
      'delivered': { status: 'DELIVERED', deliveryStatus: 'DELIVERED' },
      'rto': { status: 'CANCELLED', deliveryStatus: 'RTO' },
      'returned': { status: 'CANCELLED', deliveryStatus: 'RTO' },
      'cancelled': { status: 'CANCELLED', deliveryStatus: 'CANCELLED' },
    };

    const updateData = statusMap[String(current_status).toLowerCase()] || { status: order.status, deliveryStatus: current_status };

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: updateData.status,
        deliveryStatus: updateData.deliveryStatus,
        adminNote: `Logistics webhook status update: ${String(current_status).toUpperCase()}.`,
      },
    });

    res.json({ success: true, processed: true });
  } catch (error) {
    console.error('Shiprocket Webhook Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createRazorpayOrder,
  createCODOrder,
  verifyPromoCode,
  handleRazorpayWebhook,
  handleShiprocketWebhook,
};
