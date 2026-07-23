const prisma = require('../config/db');
const { generateOrderNumber } = require('../utils/tokens');
const razorpayService = require('../services/razorpay.service');
const shiprocketService = require('../services/shiprocket.service');
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
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Missing payment signature details' });
    }

    // 1. Verify Razorpay Payment Signature
    const isPaymentVerified = razorpayService.verifyPayment(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isPaymentVerified) {
      return res.status(400).json({ success: false, message: 'Payment verification failed. Security mismatch.' });
    }

    // 2. Find pre-saved PENDING order
    const order = await prisma.order.findFirst({
      where: { razorpayOrderId },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order reference not found' });
    }

    // 3. Idempotency Check: if webhook already completed the checkout
    if (order.isPaid) {
      return res.status(200).json({
        success: true,
        order,
      });
    }

    // 4. Update order, adjust stock, and increment coupon usage inside transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Double check stock levels for all items inside transaction before committing
      for (const item of order.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product || product.stock < item.quantity) {
          throw new Error(`Oversold Alert: ${item.name} has insufficient stock. available: ${product?.stock || 0}`);
        }

        // Reduce stock
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Update order status to paid
      const dbOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          isPaid: true,
          status: 'ACCEPTED',
          razorpayPaymentId,
        },
        include: { items: true },
      });

      // Update coupon uses if applied
      if (dbOrder.promoCode) {
        await tx.promoCode.updateMany({
          where: { code: dbOrder.promoCode },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Clear User Cart
      await tx.cartItem.deleteMany({ where: { userId } });

      return dbOrder;
    });

    // Trigger email send asynchronously (non-blocking)
    emailService.sendOrderConfirmation(updatedOrder, req.user).catch((err) => {
      console.error('Asynchronous order email failed:', err);
    });

    res.status(201).json({
      success: true,
      order: updatedOrder,
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

    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const terminalStatuses = ['DELIVERED', 'REJECTED', 'CANCELLED'];
    if (terminalStatuses.includes(existingOrder.status)) {
      return res.status(400).json({
        success: false,
        message: `Order status cannot be modified. The order has already reached a final status: ${existingOrder.status}`,
      });
    }

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
      include: { user: true, items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Call Shiprocket Order Creation API (will validate data & throw on failure)
    const parsedWeight = parseFloat(weight) || 0.5;
    const bookingResult = await shiprocketService.createOrder(order, parsedWeight);

    // Call Shiprocket AWB Assignment API to allocate a real tracking waybill
    const awbResult = await shiprocketService.assignAWB(bookingResult.shipment_id, carrier);

    const trackingNumber = awbResult.awb_code;
    const deliveryPartnerOrderId = String(bookingResult.order_id);
    const shippingLabelUrl = `/admin/delivery/label/${order.id}`;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: 'SHIPPED',
        deliveryStatus: 'DISPATCHED',
        shippingCarrier: awbResult.courier_name || carrier,
        trackingNumber,
        deliveryPartnerOrderId,
        shippingLabelUrl,
        adminNote: `Package handed over to ${awbResult.courier_name || carrier} (${serviceType || 'Standard'}). Waybill generated: ${trackingNumber}.`,
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

const refundOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!order.isPaid) {
      return res.status(400).json({ success: false, message: 'Unpaid orders cannot be refunded' });
    }

    if (order.status === 'REFUNDED') {
      return res.status(400).json({ success: false, message: 'Order has already been refunded' });
    }

    // Process payment refund via Razorpay API (supports demo/sandbox mocks)
    await razorpayService.refundPayment(order.razorpayPaymentId, order.total);

    // Update database and restore stock in transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Restore stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return await tx.order.update({
        where: { id },
        data: {
          status: 'REFUNDED',
        },
        include: { items: true },
      });
    });

    res.json({
      success: true,
      message: 'Order refunded successfully and stock levels restored',
      order: updated,
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
  refundOrder,
};
