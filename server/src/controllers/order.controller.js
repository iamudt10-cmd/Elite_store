const prisma = require('../config/db');
const { generateOrderNumber } = require('../utils/tokens');
const razorpayService = require('../services/razorpay.service');
const emailService = require('../services/email.service');

const getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Must be owner or admin
    if (order.userId !== userId && role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      shippingName,
      shippingStreet,
      shippingCity,
      shippingState,
      shippingZip,
      shippingCountry,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      promoCode,
    } = req.body;

    // 1. Verify Razorpay Payment Signature
    const isPaymentVerified = razorpayService.verifyPayment(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isPaymentVerified) {
      return res.status(400).json({ success: false, message: 'Payment verification failed. Security mismatch.' });
    }

    // 2. Fetch User's Cart
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Cannot place order with an empty cart' });
    }

    // 3. Verify Stock and Calculate Totals
    let subtotal = 0;
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.product.name} does not have enough stock.`,
        });
      }
      subtotal += item.product.price * item.quantity;
    }

    // 4. Handle Promo Code
    let discount = 0;
    if (promoCode) {
      const code = await prisma.promoCode.findUnique({
        where: { code: promoCode },
      });

      if (code && code.active && (code.expiresAt === null || code.expiresAt > new Date()) && code.usedCount < code.maxUses) {
        discount = (subtotal * code.discountPercent) / 100;
        
        // Increment promo code use count
        await prisma.promoCode.update({
          where: { id: code.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    // Fetch site shipping threshold
    const shippingSetting = await prisma.siteSettings.findUnique({ where: { key: 'free_shipping_threshold' } });
    const threshold = shippingSetting ? parseFloat(shippingSetting.value) : 1000;
    const shippingCost = subtotal >= threshold ? 0 : 150; // default shipping fee in INR is 150
    const total = subtotal - discount + shippingCost;

    const orderNumber = generateOrderNumber();

    // 5. Create Order and OrderItems in Transaction, Update Stock
    const result = await prisma.$transaction(async (tx) => {
      // Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: 'PENDING',
          subtotal,
          discount,
          shippingCost,
          total,
          shippingName,
          shippingStreet,
          shippingCity,
          shippingState,
          shippingZip,
          shippingCountry,
          razorpayOrderId,
          razorpayPaymentId,
          promoCode,
        },
      });

      // Create OrderItems & Update Stock
      for (const item of cartItems) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
            size: item.size,
            color: item.color,
            name: item.product.name,
            image: item.product.images[0] || null,
          },
        });

        // Reduce stock
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Clear User Cart
      await tx.cartItem.deleteMany({ where: { userId } });

      return order;
    });

    // Fetch the created order with items to send email
    const fullOrder = await prisma.order.findUnique({
      where: { id: result.id },
      include: { items: true },
    });

    // Trigger email send asynchronously (non-blocking)
    emailService.sendOrderConfirmation(fullOrder, req.user).catch((err) => {
      console.error('Asynchronous order email failed:', err);
    });

    res.status(201).json({
      success: true,
      order: fullOrder,
    });
  } catch (error) {
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const skip = (page - 1) * limit;

    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        skip,
        take: limit,
        include: {
          user: { select: { name: true, email: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count(),
    ]);

    res.json({
      success: true,
      orders,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: {
        status,
        adminNote,
      },
      include: {
        items: true,
      },
    });

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

const acceptOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNote } = req.body || {};

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        adminNote: adminNote || 'Order accepted by admin',
      },
      include: { items: true },
    });

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

const rejectOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectedReason, adminNote } = req.body;

    if (!rejectedReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    // Refund stock to inventory when order is rejected
    const orderItems = await prisma.orderItem.findMany({ where: { orderId: id } });

    const order = await prisma.$transaction(async (tx) => {
      // Update order status
      const updated = await tx.order.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectedReason,
          adminNote: adminNote || `Order rejected: ${rejectedReason}`,
        },
      });

      // Restore stock
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return updated;
    });

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

const shipOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { carrier, serviceType, weight } = req.body;

    if (!carrier) {
      return res.status(400).json({ success: false, message: 'Shipping carrier selection is required' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Generate simulated tracking number and partner order reference
    const prefix = carrier === 'Delhivery' ? 'DEL' : carrier === 'Shiprocket' ? 'SR' : 'TRK';
    const randomSuffix = Math.floor(1000000000 + Math.random() * 9000000000);
    const trackingNumber = `${prefix}${randomSuffix}`;
    const deliveryPartnerOrderId = `SHP-${order.orderNumber}-${Math.floor(100 + Math.random() * 900)}`;

    // Create a mock shipping label URL that links to our beautiful CSS printable page representation
    const shippingLabelUrl = `/admin/delivery/label/${order.id}`;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'SHIPPED',
        deliveryStatus: 'DISPATCHED',
        shippingCarrier: carrier,
        trackingNumber,
        deliveryPartnerOrderId,
        shippingLabelUrl,
        adminNote: `Package handed over to ${carrier} (${serviceType || 'Standard'}). Waybill generated: ${trackingNumber}.`,
      },
    });

    // Send shipment notification email
    try {
      await emailService.sendMail({
        to: order.user.email,
        subject: `Your Elite Style Order #${order.orderNumber} is Shipped!`,
        text: `Great news! Your luxury items have been dispatched via ${carrier}. Tracking Waybill: ${trackingNumber}. View details at ${process.env.FRONTEND_URL}/dashboard/orders`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #6366f1;">Your Order Has Shipped! 🚀</h2>
            <p>Dear ${order.shippingName},</p>
            <p>We are delighted to inform you that your Elite Style package is on its way!</p>
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
              <p style="margin: 5px 0;"><strong>Shipping Carrier:</strong> ${carrier}</p>
              <p style="margin: 5px 0;"><strong>Tracking Number (Waybill):</strong> ${trackingNumber}</p>
              <p style="margin: 5px 0;"><strong>Service Tier:</strong> ${serviceType || 'Standard'}</p>
            </div>
            <p>You can track your parcel live on our website in your Account Dashboard.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 11px; color: #9ca3af;">Elite Style Luxury Collections Inc.</p>
          </div>
        `,
      });
    } catch (mailError) {
      console.warn('Shipment notification email failed:', mailError.message);
    }

    res.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { deliveryStatus, checkpointNote } = req.body;

    if (!deliveryStatus) {
      return res.status(400).json({ success: false, message: 'Delivery status is required' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isDelivered = deliveryStatus === 'DELIVERED';
    const isPaid = isDelivered ? true : order.isPaid; // Mark as paid if successfully delivered COD or standard

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        deliveryStatus,
        isPaid,
        status: isDelivered ? 'DELIVERED' : order.status,
        adminNote: checkpointNote || `Delivery status changed to ${deliveryStatus}.`,
      },
    });

    // Send delivery completed mail
    if (isDelivered) {
      try {
        await emailService.sendMail({
          to: order.user.email,
          subject: `Your Elite Style Package has been Delivered!`,
          text: `Your package with tracking ID ${order.trackingNumber} has been delivered successfully. Thank you for shopping with Elite Style!`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #10b981;">Delivered Successfully! 🎉</h2>
              <p>Dear ${order.shippingName},</p>
              <p>Your package has been successfully delivered. We hope you love your new premium items!</p>
              <p>Let us know how your experience was by leaving a review on the product pages.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 11px; color: #9ca3af;">Elite Style Premium Fashion</p>
            </div>
          `,
        });
      } catch (mailError) {
        console.warn('Delivery notification email failed:', mailError.message);
      }
    }

    res.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

const togglePaymentPaid = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isPaid } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: { isPaid },
    });

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserOrders,
  getOrderById,
  createOrder,
  getAllOrders,
  updateOrderStatus,
  acceptOrder,
  rejectOrder,
  shipOrder,
  updateDeliveryStatus,
  togglePaymentPaid,
};
